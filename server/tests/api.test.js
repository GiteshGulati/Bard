import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startApp, stopApp, agent, csrf, register, PNG } from './helpers.js';
import { User, Blog, Comment, CloudAsset, Notification, Report, BlogDeletion, Like, Bookmark } from '../src/models/index.js';
import { renderArticle } from '../src/utils/delta.js';
import { setCloudinaryAdapterForTests } from '../src/config/cloudinary.js';
import { processPendingNotifications } from '../src/services/notificationService.js';
import { processPendingModerationReviews } from '../src/services/moderationService.js';
import { processPendingBlogDeletions } from '../src/services/blogService.js';

let app;
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bard-react/dist');

async function suppressExpectedErrorLog(callback) {
  const original = console.error;
  console.error = () => {};
  try { return await callback(); }
  finally { console.error = original; }
}

before(async () => {
  app = await startApp();
});

after(async () => {
  await stopApp();
});

describe('production frontend serving', () => {
  it('requires the canonical frontend build before the backend suite runs', () => {
    assert.ok(fs.existsSync(path.join(frontendDist, 'index.html')), 'Run npm run build before the backend test suite.');
  });

  it('serves the canonical React build, supports direct SPA routes, and keeps API 404s JSON', async () => {
    const home = await agent().get('/');
    assert.equal(home.status, 200);
    assert.match(home.text, /id="root"/);
    const assetPath = home.text.match(/src="([^\"]+\.js)"/)?.[1];
    assert.ok(assetPath);
    assert.equal((await agent().get(assetPath)).status, 200);
    const refreshedRoute = await agent().get('/article/a-story-after-refresh');
    assert.equal(refreshedRoute.status, 200);
    assert.match(refreshedRoute.text, /id="root"/);
    const missingApi = await agent().get('/api/v1/no-such-route');
    assert.equal(missingApi.status, 404);
    assert.match(missingApi.headers['content-type'], /application\/json/);
    assert.doesNotMatch(missingApi.text, /id="root"/);
  });
});

describe('auth', () => {
  it('registers, logs in, and returns the current user', async () => {
    assert.equal(mongoose.connection.name, 'bard');
    const ag = agent();
    const { res } = await register(ag, { username: 'ada', email: 'ada@example.com', displayName: 'Ada' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.username, 'ada');
    assert.equal(res.body.data.user.email, 'ada@example.com');
    assert.equal(res.body.data.user.passwordHash, undefined);

    const me = await ag.get('/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.username, 'ada');

    const loginAgent = agent();
    const loginToken = await csrf(loginAgent);
    const login = await loginAgent.post('/api/v1/auth/login').set('x-csrf-token', loginToken).send({ identifier: 'ada@example.com', password: 'Secret123' });
    assert.equal(login.status, 200);
    assert.equal((await loginAgent.get('/api/v1/auth/me')).status, 200);
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    const ag = agent();
    const token = await csrf(ag);
    const res = await ag.post('/api/v1/auth/login').set('x-csrf-token', token).send({
      identifier: 'missing@example.com',
      password: 'WrongPass1',
    });
    assert.equal(res.status, 401);
    assert.match(res.body.error.message, /Invalid credentials/);
  });

  it('rejects valid credentials for an unverified account before creating an authenticated session', async () => {
    await User.create({
      username: 'awaitingverification',
      emailNormalized: 'awaiting@example.com',
      passwordHash: await bcrypt.hash('Secret123', 4),
      displayName: 'Awaiting Verification',
      emailVerified: false,
    });

    const ag = agent();
    let token = await csrf(ag);
    const wrongPassword = await ag.post('/api/v1/auth/login').set('x-csrf-token', token).send({ identifier: 'awaiting@example.com', password: 'WrongPass1' });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.body.error.code, 'UNAUTHORIZED');
    assert.match(wrongPassword.body.error.message, /Invalid credentials/);

    token = await csrf(ag);
    const login = await ag.post('/api/v1/auth/login').set('x-csrf-token', token).send({ identifier: 'awaiting@example.com', password: 'Secret123' });
    assert.equal(login.status, 403);
    assert.equal(login.body.error.code, 'EMAIL_NOT_VERIFIED');
    assert.match(login.body.error.message, /Verify your email/);
    assert.equal((await ag.get('/api/v1/auth/me')).status, 401);

    const stillThere = await User.findOne({ username: 'awaitingverification' });
    assert.ok(stillThere);
    assert.equal(stillThere.emailVerified, false);
  });

  it('invalidates the session on logout', async () => {
    const ag = agent();
    await register(ag, { username: 'logoutuser', email: 'logout@example.com' });
    const token = await csrf(ag);
    const out = await ag.post('/api/v1/auth/logout').set('x-csrf-token', token);
    assert.equal(out.status, 200);
    const me = await ag.get('/api/v1/auth/me');
    assert.equal(me.status, 401);
  });

  it('rejects duplicate accounts', async () => {
    const ag = agent();
    await register(ag, { username: 'dup', email: 'dup@example.com' });
    const ag2 = agent();
    const { res } = await register(ag2, { username: 'dup', email: 'other@example.com' });
    assert.equal(res.status, 409);
  });
});

describe('articles', () => {
  it('serves published story details by slug and keeps drafts owner/admin-only by id', async () => {
    const owner = agent();
    await register(owner, { username: 'storyowner', email: 'storyowner@example.com' });
    let token = await csrf(owner);
    const draft = await owner.post('/api/v1/blogs').set('x-csrf-token', token).send({
      title: 'Private manuscript',
      content: { ops: [{ insert: 'A private paragraph.\n' }] },
      status: 'draft',
    });
    assert.equal(draft.status, 201);
    const draftId = draft.body.data.blog.id;
    assert.equal((await owner.get(`/api/v1/blogs/id/${draftId}`)).status, 200);
    assert.equal((await agent().get(`/api/v1/blogs/${draft.body.data.blog.slug}`)).status, 404);

    const outsider = agent();
    await register(outsider, { username: 'storyoutsider', email: 'storyoutsider@example.com' });
    assert.equal((await outsider.get(`/api/v1/blogs/id/${draftId}`)).status, 403);
    assert.equal((await outsider.get('/api/v1/blogs/id/not-an-object-id')).status, 422);

    token = await csrf(owner);
    const published = await owner.patch(`/api/v1/blogs/${draftId}`).set('x-csrf-token', token).send({ status: 'published' });
    assert.equal(published.status, 200);
    const publicStory = await agent().get(`/api/v1/blogs/${published.body.data.blog.slug}`);
    assert.equal(publicStory.status, 200);
    assert.match(publicStory.body.data.blog.html, /A private paragraph/);
    const profilePosts = await owner.get('/api/v1/users/storyowner/blogs?limit=10');
    assert.ok(profilePosts.body.data.items.some(item => item.id === draftId));
  });

  it('paginates by published time and stable id tie-breaker rather than ObjectId order', async () => {
    const author = agent();
    const { user } = await register(author, { username: 'cursorwriter', email: 'cursorwriter@example.com' });
    const ids = [1, 4, 2, 3].map(value => new mongoose.Types.ObjectId(`00000000000000000000000${value}`));
    const times = [
      new Date('2026-01-04T00:00:00.000Z'),
      new Date('2026-01-03T00:00:00.000Z'),
      new Date('2026-01-02T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    ];
    for (let index = 0; index < ids.length; index += 1) {
      await Blog.create({
        _id: ids[index], author: user.id, title: `Cursor needle ${index}`, slug: `cursor-needle-${index}`,
        contentDelta: { ops: [{ insert: `Story ${index}.\n` }] }, htmlSanitized: `<p>Story ${index}.</p>`, plainText: `Story ${index}.`,
        tags: ['cursor'], status: 'published', visibility: 'public', publishedAt: times[index],
      });
    }
    const first = await agent().get('/api/v1/blogs?limit=2&tag=cursor');
    assert.equal(first.status, 200);
    const second = await agent().get(`/api/v1/blogs?limit=2&tag=cursor&cursor=${encodeURIComponent(first.body.data.nextCursor)}`);
    assert.equal(second.status, 200);
    const allIds = [...first.body.data.items, ...second.body.data.items].map(item => item.id);
    assert.deepEqual(allIds, ids.map(String));
    assert.equal(new Set(allIds).size, 4);
  });

  it('creates, publishes, edits, and deletes an owned article', async () => {
    const ag = agent();
    await register(ag, { username: 'writer', email: 'writer@example.com' });
    let token = await csrf(ag);
    const created = await ag.post('/api/v1/blogs').set('x-csrf-token', token).send({
      title: 'Paper hours',
      excerpt: 'A short note.',
      content: { ops: [{ insert: 'Hello from the desk.\n' }] },
      tags: ['essays'],
      status: 'draft',
    });
    assert.equal(created.status, 201);
    const id = created.body.data.blog.id;

    const draftPublic = await agent().get(`/api/v1/blogs/${created.body.data.blog.slug}`);
    assert.equal(draftPublic.status, 404);

    token = await csrf(ag);
    const published = await ag.patch(`/api/v1/blogs/${id}`).set('x-csrf-token', token).send({
      status: 'published',
      title: 'Paper hours',
    });
    assert.equal(published.status, 200);
    assert.equal(published.body.data.blog.status, 'published');

    const slug = published.body.data.blog.slug;
    const reading = await agent().get(`/api/v1/blogs/${slug}`);
    assert.equal(reading.status, 200);
    assert.equal(reading.body.data.blog.title, 'Paper hours');

    token = await csrf(ag);
    const edited = await ag.patch(`/api/v1/blogs/${id}`).set('x-csrf-token', token).send({
      title: 'Paper hours, revised',
      content: { ops: [{ insert: 'Revised paragraph.\n' }] },
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.data.blog.title, 'Paper hours, revised');

    token = await csrf(ag);
    const deleted = await ag.delete(`/api/v1/blogs/${id}`).set('x-csrf-token', token);
    assert.equal(deleted.status, 200);
    const gone = await agent().get(`/api/v1/blogs/${slug}`);
    assert.equal(gone.status, 404);
  });

  it('resumes blog record cleanup after partial failures and retries Cloudinary cleanup', async () => {
    const owner = agent();
    const { user } = await register(owner, { username: 'deleteoutboxowner', email: 'deleteoutboxowner@example.com' });
    const stages = [
      [Like, 'deleteMany'],
      [Bookmark, 'deleteMany'],
      [Comment, 'deleteMany'],
      [Blog, 'deleteOne'],
    ];

    for (let index = 0; index < stages.length; index += 1) {
      const blog = await Blog.create({
        author: user.id, title: `Deletion retry ${index}`, slug: `deletion-retry-${index}`,
        contentDelta: { ops: [{ insert: 'Retryable deletion.\n' }] }, status: 'published',
      });
      await Like.create({ user: user.id, blog: blog._id });
      await Bookmark.create({ user: user.id, blog: blog._id });
      await Comment.create({ author: user.id, blog: blog._id, body: 'Remove me.' });
      const [Model, method] = stages[index];
      const original = Model[method];
      let failOnce = true;
      Model[method] = async function (...args) {
        if (failOnce) { failOnce = false; const error = new Error('injected database cleanup failure'); error.code = 'EWRITE'; throw error; }
        return original.apply(this, args);
      };
      try {
        const failed = await suppressExpectedErrorLog(async () => owner.delete(`/api/v1/blogs/${blog._id}`).set('x-csrf-token', await csrf(owner)));
        assert.equal(failed.status, 500);
      } finally { Model[method] = original; }
      assert.ok(await Blog.findById(blog._id));
      assert.ok(await BlogDeletion.exists({ blog: blog._id, status: 'pending' }));
      await processPendingBlogDeletions({ force: true });
      assert.equal(await Blog.findById(blog._id), null);
      assert.equal(await Like.countDocuments({ blog: blog._id }), 0);
      assert.equal(await Bookmark.countDocuments({ blog: blog._id }), 0);
      assert.equal(await Comment.countDocuments({ blog: blog._id }), 0);
      assert.ok(await BlogDeletion.exists({ blog: blog._id, status: 'complete' }));
      const repeated = await owner.delete(`/api/v1/blogs/${blog._id}`).set('x-csrf-token', await csrf(owner));
      assert.equal(repeated.status, 200);
    }

    const assetId = new mongoose.Types.ObjectId();
    const assetBlog = await Blog.create({
      author: user.id, title: 'Asset retry', slug: 'asset-retry',
      contentDelta: { ops: [{ insert: 'Asset cleanup.\n' }] }, status: 'published', coverAsset: assetId,
      coverImagePath: 'https://res.cloudinary.com/bard-test-cloud/image/upload/test-asset',
    });
    await CloudAsset.create({
      _id: assetId, owner: user.id, publicId: 'bard/covers/retry-asset',
      secureUrl: assetBlog.coverImagePath, kind: 'cover',
    });
    let removeCalls = 0;
    setCloudinaryAdapterForTests({
      upload: async () => { throw new Error('not used'); },
      remove: async () => { removeCalls += 1; if (removeCalls === 1) { const error = new Error('provider unavailable'); error.code = 'ECONNECTION'; throw error; } return 'ok'; },
    });
    try {
      const deleted = await owner.delete(`/api/v1/blogs/${assetBlog._id}`).set('x-csrf-token', await csrf(owner));
      assert.equal(deleted.status, 200);
      assert.equal(await Blog.findById(assetBlog._id), null);
      assert.ok(await CloudAsset.findById(assetId));
      assert.ok(await BlogDeletion.exists({ blog: assetBlog._id, status: 'pending' }));
      await processPendingBlogDeletions({ force: true });
      assert.equal(await CloudAsset.findById(assetId), null);
      assert.ok(await BlogDeletion.exists({ blog: assetBlog._id, status: 'complete' }));
      assert.equal(removeCalls, 2);
    } finally { setCloudinaryAdapterForTests(null); }
  });

  it('rejects unauthorized edits', async () => {
    const owner = agent();
    await register(owner, { username: 'owner1', email: 'owner1@example.com' });
    let token = await csrf(owner);
    const created = await owner.post('/api/v1/blogs').set('x-csrf-token', token).send({
      title: 'Private lamp',
      content: { ops: [{ insert: 'Mine.\n' }] },
      status: 'published',
    });
    const id = created.body.data.blog.id;

    const other = agent();
    await register(other, { username: 'intruder', email: 'intruder@example.com' });
    token = await csrf(other);
    const res = await other.patch(`/api/v1/blogs/${id}`).set('x-csrf-token', token).send({ title: 'Stolen' });
    assert.equal(res.status, 403);
  });
});

describe('social', () => {
  it('prevents duplicate likes, bookmarks, and follows', async () => {
    const author = agent();
    await register(author, { username: 'poet', email: 'poet@example.com' });
    let token = await csrf(author);
    const article = await author.post('/api/v1/blogs').set('x-csrf-token', token).send({
      title: 'Two chairs',
      content: { ops: [{ insert: 'Sit.\n' }] },
      status: 'published',
      tags: ['rooms'],
    });
    const blogId = article.body.data.blog.id;
    const authorId = article.body.data.blog.author.id;

    const fan = agent();
    await register(fan, { username: 'fan', email: 'fan@example.com' });
    token = await csrf(fan);
    const like1 = await fan.put(`/api/v1/blogs/${blogId}/like`).set('x-csrf-token', token);
    const like2 = await fan.put(`/api/v1/blogs/${blogId}/like`).set('x-csrf-token', token);
    assert.equal(like1.status, 200);
    assert.equal(like2.status, 200);
    assert.equal(like2.body.data.likeCount, 1);
    assert.equal(await Notification.countDocuments({ recipient: authorId, type: 'like' }), 1);

    token = await csrf(fan);
    await fan.put(`/api/v1/me/bookmarks/${blogId}`).set('x-csrf-token', token);
    await fan.put(`/api/v1/me/bookmarks/${blogId}`).set('x-csrf-token', token);
    const saved = await fan.get('/api/v1/me/bookmarks');
    assert.equal(saved.body.data.items.length, 1);

    token = await csrf(fan);
    const f1 = await fan.put(`/api/v1/users/${authorId}/follow`).set('x-csrf-token', token);
    assert.equal(f1.status, 200);
    const f2 = await fan.put(`/api/v1/users/${authorId}/follow`).set('x-csrf-token', token);
    assert.equal(f2.status, 409);

    const me = await fan.get('/api/v1/auth/me');
    const selfRes = await fan.put(`/api/v1/users/${me.body.data.user.id}/follow`).set('x-csrf-token', token);
    assert.equal(selfRes.status, 403);
  });

  it('supports comments, replies, and ownership', async () => {
    const author = agent();
    await register(author, { username: 'host', email: 'host@example.com' });
    let authorToken = await csrf(author);
    const article = await author.post('/api/v1/blogs').set('x-csrf-token', authorToken).send({
      title: 'Open letter',
      content: { ops: [{ insert: 'Hello readers.\n' }] },
      status: 'published',
    });
    const blogId = article.body.data.blog.id;

    const guest = agent();
    await register(guest, { username: 'guest', email: 'guest@example.com' });
    let guestToken = await csrf(guest);
    const created = await guest.post(`/api/v1/blogs/${blogId}/comments`).set('x-csrf-token', guestToken).send({
      body: 'A thoughtful note.',
    });
    assert.equal(created.status, 201);
    const commentId = created.body.data.comment.id;

    const reply = await author.post(`/api/v1/blogs/${blogId}/comments`).set('x-csrf-token', authorToken).send({
      body: 'Thank you.',
      parentId: commentId,
    });
    assert.equal(reply.status, 201);
    assert.equal(reply.body.data.comment.parentId, commentId);

    const steal = await author.patch(`/api/v1/comments/${commentId}`).set('x-csrf-token', authorToken).send({
      body: 'hijack',
    });
    assert.equal(steal.status, 403);

    const edited = await guest.patch(`/api/v1/comments/${commentId}`).set('x-csrf-token', guestToken).send({
      body: 'A revised note.',
    });
    assert.equal(edited.status, 200);
  });

  it('paginates comments in order, excludes hidden rows for readers, and validates cursors', async () => {
    const author = agent();
    await register(author, { username: 'commentpageauthor', email: 'commentpageauthor@example.com' });
    const token = await csrf(author);
    const article = await author.post('/api/v1/blogs').set('x-csrf-token', token).send({
      title: 'Comment pagination', content: { ops: [{ insert: 'A paginated discussion.\n' }] }, status: 'published',
    });
    const blogId = article.body.data.blog.id;
    const reader = agent();
    await register(reader, { username: 'commentpagereader', email: 'commentpagereader@example.com' });
    const readerToken = await csrf(reader);
    const ids = [];
    for (let index = 0; index < 5; index += 1) {
      const created = await reader.post(`/api/v1/blogs/${blogId}/comments`).set('x-csrf-token', readerToken).send({ body: `Comment ${index}` });
      assert.equal(created.status, 201);
      ids.push(created.body.data.comment.id);
    }
    await Comment.updateOne({ _id: ids[1] }, { $set: { status: 'hidden' } });

    const first = await reader.get(`/api/v1/blogs/${blogId}/comments?limit=2`);
    assert.equal(first.status, 200);
    assert.deepEqual(first.body.data.items.map(item => item.id), [ids[0], ids[2]]);
    assert.ok(first.body.data.nextCursor);
    const second = await reader.get(`/api/v1/blogs/${blogId}/comments?limit=2&cursor=${encodeURIComponent(first.body.data.nextCursor)}`);
    assert.deepEqual(second.body.data.items.map(item => item.id), [ids[3], ids[4]]);
    assert.equal(second.body.data.nextCursor, null);

    const admin = agent();
    await register(admin, { username: 'commentpageadmin', email: 'commentpageadmin@example.com' });
    await User.updateOne({ username: 'commentpageadmin' }, { role: 'admin' });
    const adminPage = await admin.get(`/api/v1/blogs/${blogId}/comments?limit=10`);
    assert.ok(adminPage.body.data.items.some(item => item.id === ids[1] && item.status === 'hidden'));

    const invalid = await reader.get(`/api/v1/blogs/${blogId}/comments?cursor=invalid`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error.code, 'BAD_REQUEST');

    const emptyArticle = await author.post('/api/v1/blogs').set('x-csrf-token', await csrf(author)).send({
      title: 'Empty discussion', content: { ops: [{ insert: 'No replies yet.\n' }] }, status: 'published',
    });
    const empty = await reader.get(`/api/v1/blogs/${emptyArticle.body.data.blog.id}/comments`);
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.data.items, []);
    assert.equal(empty.body.data.nextCursor, null);
  });

  it('keeps comment success when notification writes fail, then retries idempotently', async () => {
    const author = agent();
    await register(author, { username: 'outboxauthor', email: 'outboxauthor@example.com' });
    const createdBlog = await author.post('/api/v1/blogs').set('x-csrf-token', await csrf(author)).send({
      title: 'Outbox article', content: { ops: [{ insert: 'Outbox body.\n' }] }, status: 'published',
    });
    const reader = agent();
    await register(reader, { username: 'outboxreader', email: 'outboxreader@example.com' });

    const originalUpdateOne = Notification.updateOne;
    Notification.updateOne = async () => { const error = new Error('private database diagnostic'); error.code = 'EWRITE'; throw error; };
    let response;
    try {
      response = await reader.post(`/api/v1/blogs/${createdBlog.body.data.blog.id}/comments`)
        .set('x-csrf-token', await csrf(reader)).send({ body: 'Saved even when the inbox is unavailable.' });
    } finally {
      Notification.updateOne = originalUpdateOne;
    }
    assert.equal(response.status, 201);
    const commentId = response.body.data.comment.id;
    assert.ok(await Comment.findById(commentId));
    assert.equal(await Notification.countDocuments({ type: 'comment', blog: createdBlog.body.data.blog.id }), 0);

    await processPendingNotifications({ retryDelayMs: 0 });
    await processPendingNotifications({ retryDelayMs: 0 });
    assert.equal(await Notification.countDocuments({ type: 'comment', blog: createdBlog.body.data.blog.id }), 1);
  });

  it('keeps bookmarks private and builds a follow feed', async () => {
    const author = agent();
    await register(author, { username: 'columnist', email: 'col@example.com' });
    const authorToken = await csrf(author);
    const article = await author.post('/api/v1/blogs').set('x-csrf-token', authorToken).send({
      title: 'Morning pages',
      content: { ops: [{ insert: 'Ink first.\n' }] },
      status: 'published',
    });
    const blogId = article.body.data.blog.id;
    const authorId = article.body.data.blog.author.id;

    const reader = agent();
    await register(reader, { username: 'saver', email: 'saver@example.com' });
    const readerToken = await csrf(reader);
    await reader.put(`/api/v1/me/bookmarks/${blogId}`).set('x-csrf-token', readerToken);
    const stranger = agent();
    const leaked = await stranger.get('/api/v1/me/bookmarks');
    assert.equal(leaked.status, 401);

    await reader.put(`/api/v1/users/${authorId}/follow`).set('x-csrf-token', readerToken);
    const feed = await reader.get('/api/v1/feed');
    assert.equal(feed.status, 200);
    assert.equal(feed.body.data.items[0].title, 'Morning pages');
  });

  it('scopes notifications to the recipient', async () => {
    const author = agent();
    await register(author, { username: 'noted', email: 'noted@example.com' });
    const authorToken = await csrf(author);
    const article = await author.post('/api/v1/blogs').set('x-csrf-token', authorToken).send({
      title: 'Notice me',
      content: { ops: [{ insert: 'Hi.\n' }] },
      status: 'published',
    });
    const fan = agent();
    await register(fan, { username: 'clapper', email: 'clap@example.com' });
    const fanToken = await csrf(fan);
    await fan.put(`/api/v1/blogs/${article.body.data.blog.id}/like`).set('x-csrf-token', fanToken);
    const notes = await author.get('/api/v1/notifications');
    assert.ok(notes.body.data.items.length >= 1);
    const id = notes.body.data.items[0].id;
    const thief = await fan.patch(`/api/v1/notifications/${id}/read`).set('x-csrf-token', fanToken);
    assert.equal(thief.status, 404);
  });
});

describe('end-to-end journey', () => {
  it('registers two people, publishes, and interacts', async () => {
    const a = agent();
    const b = agent();
    await register(a, { username: 'mira', email: 'mira@example.com', displayName: 'Mira' });
    await register(b, { username: 'noel', email: 'noel@example.com', displayName: 'Noel' });
    const authorToken = await csrf(a);
    const readerToken = await csrf(b);

    const published = await a.post('/api/v1/blogs').set('x-csrf-token', authorToken).send({
      title: 'A place for words',
      excerpt: 'Not clout.',
      tags: ['bard'],
      status: 'published',
      content: { ops: [{ insert: 'Write slowly.\n' }] },
    });
    assert.equal(published.status, 201);
    const blog = published.body.data.blog;
    const mira = (await a.get('/api/v1/auth/me')).body.data.user;

    await b.put(`/api/v1/users/${mira.id}/follow`).set('x-csrf-token', readerToken);
    await b.put(`/api/v1/blogs/${blog.id}/like`).set('x-csrf-token', readerToken);
    await b.put(`/api/v1/me/bookmarks/${blog.id}`).set('x-csrf-token', readerToken);
    await b.post(`/api/v1/blogs/${blog.id}/comments`).set('x-csrf-token', readerToken).send({ body: 'This is lovely.' });

    const feed = await b.get('/api/v1/feed');
    assert.equal(feed.body.data.items[0].slug, blog.slug);
    const search = await agent().get('/api/v1/search?q=words');
    assert.ok(search.body.data.items.some((item) => item.slug === blog.slug));
    const notes = await a.get('/api/v1/notifications');
    assert.ok(notes.body.data.items.length >= 2);

    const report = await b.post('/api/v1/reports').set('x-csrf-token', readerToken).send({
      targetType: 'article',
      targetId: blog.id,
      reason: 'other',
      explanation: 'demo report',
    });
    assert.equal(report.status, 201);
  });
});

describe('security', () => {
  it('bounds multipart field counts on authenticated uploads', async () => {
    const owner = agent();
    await register(owner, { username: 'multipartowner', email: 'multipartowner@example.com' });
    const request = owner.post('/api/v1/blogs').set('x-csrf-token', await csrf(owner)).attach('cover', PNG, 'cover.png');
    for (let index = 0; index < 11; index += 1) request.field(`extra${index}`, 'field');
    const response = await request;
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'UPLOAD');
    assert.match(response.body.error.message, /form fields|multipart/i);
  });

  it('suspends and restores reported users with an auditable moderator history', async () => {
    const reporter = agent();
    await register(reporter, { username: 'reporterperson', email: 'reporterperson@example.com' });
    const target = agent();
    const { user: targetUser } = await register(target, { username: 'reportedperson', email: 'reportedperson@example.com' });
    const admin = agent();
    await register(admin, { username: 'moderatorperson', email: 'moderatorperson@example.com' });
    await User.updateOne({ username: 'moderatorperson' }, { role: 'admin' });

    const reportResponse = await reporter.post('/api/v1/reports').set('x-csrf-token', await csrf(reporter)).send({
      targetType: 'user', targetId: targetUser.id, reason: 'other', explanation: 'Review this profile.',
    });
    assert.equal(reportResponse.status, 201);
    const reportId = reportResponse.body.data.report._id;

    let response = await admin.patch(`/api/v1/admin/reports/${reportId}`).set('x-csrf-token', await csrf(admin)).send({ status: 'resolved' });
    assert.equal(response.status, 400);
    assert.equal((await Report.findById(reportId)).status, 'open');

    response = await admin.patch(`/api/v1/admin/reports/${reportId}`).set('x-csrf-token', await csrf(admin)).send({ status: 'resolved', userAction: 'suspend', resolutionNote: 'Confirmed abuse.' });
    assert.equal(response.status, 200);
    const suspended = await User.findById(targetUser.id);
    assert.equal(suspended.moderationStatus, 'suspended');
    assert.equal(suspended.moderationHistory[0].action, 'suspend');
    assert.equal((await target.get('/api/v1/auth/me')).status, 401);
    const suspendedLogin = agent();
    const suspendedTokenResponse = await suspendedLogin.get('/api/v1/csrf-token');
    assert.equal(suspendedTokenResponse.status, 200, JSON.stringify(suspendedTokenResponse.body));
    response = await suspendedLogin.post('/api/v1/auth/login').set('x-csrf-token', suspendedTokenResponse.body.data.csrfToken).send({ identifier: targetUser.email, password: 'Secret123' });
    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'ACCOUNT_SUSPENDED');

    response = await admin.patch(`/api/v1/admin/reports/${reportId}`).set('x-csrf-token', await csrf(admin)).send({ status: 'resolved', userAction: 'restore', resolutionNote: 'Appeal accepted.' });
    assert.equal(response.status, 200);
    const restored = await User.findById(targetUser.id);
    assert.equal(restored.moderationStatus, 'active');
    assert.deepEqual(restored.moderationHistory.map(item => item.action), ['suspend', 'restore']);
    const restoredLogin = agent();
    const restoredTokenResponse = await restoredLogin.get('/api/v1/csrf-token');
    assert.equal(restoredTokenResponse.status, 200, JSON.stringify(restoredTokenResponse.body));
    response = await restoredLogin.post('/api/v1/auth/login').set('x-csrf-token', restoredTokenResponse.body.data.csrfToken).send({ identifier: targetUser.email, password: 'Secret123' });
    assert.equal(response.status, 200);
  });

  it('recovers moderation reviews after failures before, during, and after target persistence', async () => {
    const reporter = agent();
    await register(reporter, { username: 'recoveryreporter', email: 'recoveryreporter@example.com' });
    const author = agent();
    await register(author, { username: 'recoveryauthor', email: 'recoveryauthor@example.com' });
    const blogResponse = await author.post('/api/v1/blogs').set('x-csrf-token', await csrf(author)).send({
      title: 'Moderation recovery', content: { ops: [{ insert: 'Review target.\n' }] }, status: 'published',
    });
    const admin = agent();
    await register(admin, { username: 'recoveryadmin', email: 'recoveryadmin@example.com' });
    await User.updateOne({ username: 'recoveryadmin' }, { role: 'admin' });
    const makeReport = async (targetType, targetId) => {
      const response = await reporter.post('/api/v1/reports').set('x-csrf-token', await csrf(reporter)).send({ targetType, targetId, reason: 'other' });
      assert.equal(response.status, 201);
      return response.body.data.report._id;
    };
    const review = async (id, body = { status: 'resolved', hideTarget: true }) => admin.patch(`/api/v1/admin/reports/${id}`).set('x-csrf-token', await csrf(admin)).send(body);
    const hideReview = { status: 'resolved', hideTarget: true };

    const pendingSaveReport = await makeReport('article', blogResponse.body.data.blog.id);
    const originalReportSave = Report.prototype.save;
    let failJournalOnce = true;
    Report.prototype.save = async function (...args) {
      if (failJournalOnce && this.pendingReview?.operationId) {
        failJournalOnce = false;
        const error = new Error('injected report journal failure'); error.code = 'EWRITE'; throw error;
      }
      return originalReportSave.apply(this, args);
    };
    try {
      const failed = await suppressExpectedErrorLog(() => review(pendingSaveReport, hideReview));
      assert.equal(failed.status, 500);
    } finally { Report.prototype.save = originalReportSave; }
    assert.equal((await Blog.findById(blogResponse.body.data.blog.id)).status, 'published');
    assert.equal((await review(pendingSaveReport, hideReview)).status, 200);
    assert.equal((await Blog.findById(blogResponse.body.data.blog.id)).status, 'hidden');

    const targetFailureReport = await makeReport('article', blogResponse.body.data.blog.id);
    const originalFindByIdAndUpdate = Blog.findByIdAndUpdate;
    let failTargetOnce = true;
    Blog.findByIdAndUpdate = async function (...args) {
      if (failTargetOnce) { failTargetOnce = false; const error = new Error('injected target failure'); error.code = 'EWRITE'; throw error; }
      return originalFindByIdAndUpdate.apply(this, args);
    };
    try {
      const failed = await suppressExpectedErrorLog(() => review(targetFailureReport, hideReview));
      assert.equal(failed.status, 500);
    } finally { Blog.findByIdAndUpdate = originalFindByIdAndUpdate; }
    assert.equal((await Report.findById(targetFailureReport)).status, 'open');
    await processPendingModerationReviews();
    assert.equal((await Report.findById(targetFailureReport)).status, 'resolved');

    const userStageAgent = agent();
    const { user: userStageTarget } = await register(userStageAgent, { username: 'recoveryuserstage', email: 'recoveryuserstage@example.com' });
    const userStageReport = await makeReport('user', userStageTarget.id);
    const originalUserUpdateOne = User.updateOne;
    let failUserOnce = true;
    User.updateOne = async function (...args) {
      if (failUserOnce && String(args[0]?._id) === String(userStageTarget.id)) {
        failUserOnce = false;
        const error = new Error('injected user persistence failure'); error.code = 'EWRITE'; throw error;
      }
      return originalUserUpdateOne.apply(this, args);
    };
    try {
      const failed = await suppressExpectedErrorLog(() => review(userStageReport, { status: 'resolved', userAction: 'suspend' }));
      assert.equal(failed.status, 500);
    } finally { User.updateOne = originalUserUpdateOne; }
    assert.equal((await Report.findById(userStageReport)).status, 'open');
    await processPendingModerationReviews();
    assert.equal((await User.findById(userStageTarget.id)).moderationStatus, 'suspended');
    assert.equal((await Report.findById(userStageReport)).status, 'resolved');

    const commitAgent = agent();
    const { user: targetUser } = await register(commitAgent, { username: 'recoverycommittarget', email: 'recoverycommittarget@example.com' });
    const userReport = await makeReport('user', targetUser.id);
    let failCommitOnce = true;
    Report.prototype.save = async function (...args) {
      if (failCommitOnce && this.status === 'resolved' && !this.pendingReview) {
        failCommitOnce = false;
        const error = new Error('injected report completion failure'); error.code = 'EWRITE'; throw error;
      }
      return originalReportSave.apply(this, args);
    };
    try {
      const failed = await suppressExpectedErrorLog(() => review(userReport, { status: 'resolved', userAction: 'suspend' }));
      assert.equal(failed.status, 500);
    } finally { Report.prototype.save = originalReportSave; }
    const suspendedOnce = await User.findById(targetUser.id);
    const suspendedVersion = suspendedOnce.sessionVersion;
    assert.equal(suspendedOnce.moderationHistory.filter(item => item.action === 'suspend').length, 1);
    await processPendingModerationReviews();
    const recoveredUser = await User.findById(targetUser.id);
    assert.equal(recoveredUser.moderationStatus, 'suspended');
    assert.equal(recoveredUser.sessionVersion, suspendedVersion);
    assert.equal(recoveredUser.moderationHistory.filter(item => item.action === 'suspend').length, 1);
    assert.equal((await Report.findById(userReport)).status, 'resolved');
  });

  it('sanitizes rich-text XSS', () => {
    const rendered = renderArticle({
      ops: [{ insert: '<script>alert(1)</script><img src=x onerror=alert(1)>\n' }],
    });
    assert.doesNotMatch(rendered.html, /<script/i);
    assert.doesNotMatch(rendered.html, /<img[^>]*onerror/i);
    assert.match(rendered.html, /&lt;script&gt;/);
  });

  it('validates uploads and rejects bogus files', async () => {
    const anonymousUpload = await agent().post('/api/v1/uploads/inline')
      .attach('image', PNG, 'anonymous.png');
    assert.equal(anonymousUpload.status, 401);

    const ag = agent();
    await register(ag, { username: 'uploader', email: 'up@example.com' });
    const token = await csrf(ag);
    const bad = await ag.post('/api/v1/uploads/inline')
      .set('x-csrf-token', token)
      .attach('image', Buffer.from('MZ executable'), 'virus.exe');
    assert.ok(bad.status >= 400);

    let uploadCalls = 0;
    setCloudinaryAdapterForTests({
      upload: async (_buffer, folder) => {
        uploadCalls += 1;
        return {
          publicId: `${folder}/test-${uploadCalls}`,
          providerAssetId: `provider-test-${uploadCalls}`,
          secureUrl: `https://res.cloudinary.com/bard-test-cloud/image/upload/${folder}/test-${uploadCalls}.png`,
        };
      },
      remove: async () => 'ok',
    });
    try {
      const spoofed = await ag.post('/api/v1/uploads/inline')
        .set('x-csrf-token', token)
        .attach('image', Buffer.from('not an image'), { filename: 'spoof.jpg', contentType: 'image/jpeg' });
      assert.equal(spoofed.status, 400);
      assert.equal(uploadCalls, 0);

      const good = await ag.post('/api/v1/uploads/inline')
        .set('x-csrf-token', token)
        .attach('image', PNG, 'dot.png');
      assert.equal(good.status, 201);
      assert.match(good.body.data.url, /^https:\/\/res\.cloudinary\.com\//);
      assert.equal(good.body.data.providerAssetId, 'provider-test-1');

      const cover = await ag.post('/api/v1/blogs')
        .set('x-csrf-token', token)
        .field('title', 'A covered essay')
        .field('status', 'draft')
        .field('content', JSON.stringify({ ops: [{ insert: 'Cover test.\n' }] }))
        .field('tags', JSON.stringify(['images']))
        .attach('cover', PNG, 'cover.png');
      assert.equal(cover.status, 201);
      assert.match(cover.body.data.blog.coverImageUrl, /^https:\/\/res\.cloudinary\.com\//);

      const huge = await ag.post('/api/v1/uploads/inline')
        .set('x-csrf-token', token)
        .attach('image', Buffer.alloc(5 * 1024 * 1024 + 10, 1), 'big.png');
      assert.ok(huge.status === 400 || huge.status === 413);
    } finally {
      setCloudinaryAdapterForTests(null);
    }
  });

  it('requires authentication and a valid CSRF token for profile picture uploads', async () => {
    const owner = agent();
    await register(owner, { username: 'csrfavatar', email: 'csrfavatar@example.com' });

    const missingToken = await owner.patch('/api/v1/users/me').attach('avatar', PNG, 'avatar.png');
    assert.equal(missingToken.status, 403);
    assert.equal(missingToken.body.error.code, 'CSRF');

    const invalidToken = await owner.patch('/api/v1/users/me')
      .set('x-csrf-token', 'invalid-csrf-token')
      .attach('avatar', PNG, 'avatar.png');
    assert.equal(invalidToken.status, 403);
    assert.equal(invalidToken.body.error.code, 'CSRF');

    const guest = agent();
    const unauthenticated = await guest.patch('/api/v1/users/me').attach('avatar', PNG, 'avatar.png');
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.body.error.code, 'UNAUTHORIZED');
  });

  it('persists Cloudinary URLs and asset ids for avatars, covers, and inline images', async () => {
    let seq = 0;
    let uploadCalls = 0;
    const removed = [];
    setCloudinaryAdapterForTests({
      upload: async (_buffer, folder) => {
        uploadCalls += 1;
        seq += 1;
        const publicId = `${folder}/audit-${seq}`;
        return {
          publicId,
          providerAssetId: `provider-audit-${seq}`,
          secureUrl: `https://res.cloudinary.com/bard-test-cloud/image/upload/v1/${publicId}.png`,
        };
      },
      remove: async (publicId) => { removed.push(publicId); return 'ok'; },
    });
    try {
      const owner = agent();
      await register(owner, { username: 'cloudwriter', email: 'cloudwriter@example.com' });
      let token = await csrf(owner);
      const avatarRes = await owner.patch('/api/v1/users/me')
        .set('x-csrf-token', token)
        .attach('avatar', PNG, 'avatar.png');
      assert.equal(avatarRes.status, 200);
      assert.match(avatarRes.body.data.user.avatarUrl, /^https:\/\/res\.cloudinary\.com\//);
      const avatarDoc = await User.findById(avatarRes.body.data.user.id);
      const firstAvatarAsset = String(avatarDoc.avatarAsset);
      assert.ok(await CloudAsset.exists({ _id: avatarDoc.avatarAsset, owner: avatarDoc._id, kind: 'avatar' }));
      const avatarAssetDoc = await CloudAsset.findById(avatarDoc.avatarAsset);
      assert.equal(avatarAssetDoc.providerAssetId, 'provider-audit-1');
      assert.match(avatarAssetDoc.publicId, /^bard\/avatars\//);
      const profile = await agent().get('/api/v1/users/cloudwriter');
      assert.equal(profile.body.data.avatarUrl, avatarRes.body.data.user.avatarUrl);

      token = await csrf(owner);
      const firstAvatarPublicId = (await CloudAsset.findById(firstAvatarAsset)).publicId;
      const replaced = await owner.patch('/api/v1/users/me')
        .set('x-csrf-token', token)
        .attach('avatar', PNG, 'avatar-new.png');
      assert.equal(replaced.status, 200);
      assert.ok(removed.includes(firstAvatarPublicId));
      assert.equal(await CloudAsset.exists({ _id: firstAvatarAsset }), null);

      token = await csrf(owner);
      const cover = await owner.post('/api/v1/blogs')
        .set('x-csrf-token', token)
        .field('title', 'Cloud cover story')
        .field('status', 'published')
        .field('content', JSON.stringify({ ops: [{ insert: 'Cover stored.\n' }] }))
        .attach('cover', PNG, 'cover.png');
      assert.equal(cover.status, 201);
      assert.match(cover.body.data.blog.coverImageUrl, /^https:\/\/res\.cloudinary\.com\//);
      const opened = await agent().get(`/api/v1/blogs/${cover.body.data.blog.slug}`);
      assert.equal(opened.body.data.blog.coverImageUrl, cover.body.data.blog.coverImageUrl);
      const coverDoc = await Blog.findById(cover.body.data.blog.id);
      assert.ok(await CloudAsset.exists({ _id: coverDoc.coverAsset, owner: avatarDoc._id, kind: 'cover' }));
      assert.match((await CloudAsset.findById(coverDoc.coverAsset)).publicId, /^bard\/covers\//);

      token = await csrf(owner);
      const inline = await owner.post('/api/v1/uploads/inline').set('x-csrf-token', token).attach('image', PNG, 'inline.png');
      assert.equal(inline.status, 201);
      assert.match(inline.body.data.url, /^https:\/\/res\.cloudinary\.com\//);
      assert.ok(inline.body.data.publicId);
      const inlineBlog = await owner.post('/api/v1/blogs').set('x-csrf-token', token).send({
        title: 'Inline cloud image',
        status: 'published',
        content: { ops: [{ insert: { image: inline.body.data.url } }, { insert: '\n' }] },
      });
      assert.equal(inlineBlog.status, 201);
      const inlineBlogDoc = await Blog.findById(inlineBlog.body.data.blog.id);
      assert.equal(inlineBlogDoc.inlineAssets.length, 1);
      const secondInlineBlog = await owner.post('/api/v1/blogs').set('x-csrf-token', token).send({
        title: 'Second article sharing an image',
        status: 'published',
        content: { ops: [{ insert: { image: inline.body.data.url } }, { insert: '\n' }] },
      });
      assert.equal(secondInlineBlog.status, 201);
      const inlineAssetId = String(inlineBlogDoc.inlineAssets[0]);
      assert.match((await CloudAsset.findById(inlineAssetId)).publicId, /^bard\/article-images\//);
      const deletedOne = await owner.delete(`/api/v1/blogs/${inlineBlog.body.data.blog.id}`).set('x-csrf-token', token);
      assert.equal(deletedOne.status, 200);
      assert.ok(await CloudAsset.exists({ _id: inlineAssetId }));
      const deletedLast = await owner.delete(`/api/v1/blogs/${secondInlineBlog.body.data.blog.id}`).set('x-csrf-token', token);
      assert.equal(deletedLast.status, 200);
      assert.equal(await CloudAsset.exists({ _id: inlineAssetId }), null);

      const outsider = agent();
      await register(outsider, { username: 'cloudoutsider', email: 'cloudoutsider@example.com' });
      token = await csrf(outsider);
      const beforeDenied = uploadCalls;
      const denied = await outsider.patch(`/api/v1/blogs/${cover.body.data.blog.id}`)
        .set('x-csrf-token', token)
        .attach('cover', PNG, 'stolen-cover.png');
      assert.equal(denied.status, 403);
      assert.equal(uploadCalls, beforeDenied);

      const countBeforeFailure = await CloudAsset.countDocuments();
      setCloudinaryAdapterForTests({
        upload: async () => { throw new Error('private provider details'); },
        remove: async () => 'ok',
      });
      const failed = await owner.patch('/api/v1/users/me')
        .set('x-csrf-token', await csrf(owner))
        .attach('avatar', PNG, 'failed.png');
      assert.equal(failed.status, 502);
      assert.equal(await CloudAsset.countDocuments(), countBeforeFailure);
      assert.doesNotMatch(JSON.stringify(failed.body), /private provider details|api_secret/i);
    } finally {
      setCloudinaryAdapterForTests(null);
    }
  });

  it('restricts moderation endpoints to admins', async () => {
    const user = agent();
    await register(user, { username: 'citizen', email: 'citizen@example.com' });
    const denied = await user.get('/api/v1/admin/reports');
    assert.equal(denied.status, 403);

    await User.updateOne({ username: 'citizen' }, { role: 'admin' });
    const allowed = await user.get('/api/v1/admin/reports');
    assert.equal(allowed.status, 200);
  });

  it('rejects invalid payloads', async () => {
    const ag = agent();
    const token = await csrf(ag);
    const res = await ag.post('/api/v1/auth/register').set('x-csrf-token', token).send({
      username: 'x',
      email: 'not-an-email',
      password: 'short',
    });
    assert.equal(res.status, 422);
  });

  it('rate-limits repeated login attempts', async () => {
    const ag = agent();
    let last;
    const testIp = '203.0.113.77';
    for (let i = 0; i < 55; i += 1) {
      const tokenResponse = await ag.get('/api/v1/csrf-token').set('x-forwarded-for', testIp);
      const token = tokenResponse.body.data.csrfToken;
      last = await ag.post('/api/v1/auth/login').set('x-forwarded-for', testIp).set('x-csrf-token', token).send({
        identifier: 'nobody@example.com',
        password: 'WrongPass1',
      });
    }
    assert.equal(last.status, 429);
  });
});

