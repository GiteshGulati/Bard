import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startApp, stopApp, agent, csrf, register, PNG } from './helpers.js';
import { User, Blog, CloudAsset } from '../src/models/index.js';
import { renderArticle } from '../src/utils/delta.js';
import { setCloudinaryAdapterForTests } from '../src/config/cloudinary.js';

let app;

before(async () => {
  app = await startApp();
});

after(async () => {
  await stopApp();
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
    for (let i = 0; i < 55; i += 1) {
      const token = await csrf(ag);
      last = await ag.post('/api/v1/auth/login').set('x-csrf-token', token).send({
        identifier: 'nobody@example.com',
        password: 'WrongPass1',
      });
    }
    assert.equal(last.status, 429);
  });
});

