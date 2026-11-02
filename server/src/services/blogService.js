import crypto from 'node:crypto';
import { Blog, Like, Bookmark, Follow, Comment, CloudAsset, BlogDeletion } from '../models/index.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { parse } from '../validators/common.js';
import { blogCreateSchema, blogUpdateSchema } from '../validators/blog.js';
import { renderArticle } from '../utils/delta.js';
import { publicBlog } from '../utils/dto.js';
import { applyCursor, nextCursorFrom } from '../utils/pagination.js';
import { slugify, withSuffix } from '../utils/slug.js';
import { processPendingNotificationsSafely } from './notificationService.js';
import { cleanupAssetIfUnreferenced, cleanupAssetIfUnreferencedStrict } from './uploadService.js';
import { isCloudinaryImageUrl } from '../config/cloudinary.js';

function canSee(blog, viewer) {
  if (!blog) return false;
  const isOwner = viewer && String(viewer._id) === String(blog.author._id || blog.author);
  const isAdmin = viewer?.role === 'admin';
  if (isOwner || isAdmin) return true;
  return blog.status === 'published' && blog.visibility !== 'unlisted' || (blog.status === 'published' && blog.visibility === 'unlisted');
}

function canSeeInFeed(blog) {
  return blog.status === 'published' && blog.visibility === 'public';
}

async function uniqueSlug(title, existingId) {
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 6; i += 1) {
    const found = await Blog.findOne({ slug, ...(existingId ? { _id: { $ne: existingId } } : {}) });
    if (!found) return slug;
    slug = withSuffix(base, crypto.randomBytes(3).toString('hex'));
  }
  return withSuffix(base, Date.now().toString(36));
}

async function annotate(blogs, viewerId) {
  if (!blogs.length) return [];
  const ids = blogs.map((b) => b._id);
  const [likes, bookmarks, likeCounts, commentCounts] = await Promise.all([
    viewerId ? Like.find({ user: viewerId, blog: { $in: ids } }).lean() : [],
    viewerId ? Bookmark.find({ user: viewerId, blog: { $in: ids } }).lean() : [],
    Like.aggregate([{ $match: { blog: { $in: ids } } }, { $group: { _id: '$blog', n: { $sum: 1 } } }]),
    Comment.aggregate([{ $match: { blog: { $in: ids }, status: { $ne: 'deleted' } } }, { $group: { _id: '$blog', n: { $sum: 1 } } }]),
  ]);
  const liked = new Set(likes.map((l) => String(l.blog)));
  const saved = new Set(bookmarks.map((b) => String(b.blog)));
  const lc = Object.fromEntries(likeCounts.map((x) => [String(x._id), x.n]));
  const cc = Object.fromEntries(commentCounts.map((x) => [String(x._id), x.n]));
  return blogs.map((blog) => publicBlog(blog, {
    liked: liked.has(String(blog._id)),
    bookmarked: saved.has(String(blog._id)),
    likeCount: lc[String(blog._id)] || 0,
    commentCount: cc[String(blog._id)] || 0,
  }));
}

async function resolveInlineAssets(ownerId, delta) {
  const urls = [...new Set((delta?.ops || [])
    .map((op) => op.insert?.image)
    .filter((url) => isCloudinaryImageUrl(url)))];
  if (!urls.length) return [];
  const assets = await CloudAsset.find({ owner: ownerId, secureUrl: { $in: urls }, kind: 'inline' }).select('_id secureUrl');
  if (assets.length !== urls.length) throw forbidden('Inline images must be uploaded by your account');
  return assets.map((asset) => asset._id);
}

export async function createBlog(authorId, payload, coverAsset = null) {
  const data = parse(blogCreateSchema, payload);
  const rendered = renderArticle(data.content || { ops: [{ insert: '\n' }] });
  const inlineAssets = await resolveInlineAssets(authorId, rendered.delta);
  const status = data.status;
  const slug = await uniqueSlug(data.title);
  const blog = await Blog.create({
    author: authorId,
    title: data.title,
    slug,
    excerpt: data.excerpt || rendered.plainText.slice(0, 240),
    contentDelta: rendered.delta,
    htmlSanitized: rendered.html,
    plainText: rendered.plainText,
    coverImagePath: coverAsset?.url || null,
    coverAsset: coverAsset?.assetId || null,
    inlineAssets,
    tags: data.tags,
    status,
    visibility: data.visibility,
    commentsEnabled: data.commentsEnabled,
    publishedAt: status === 'published' ? new Date() : null,
  });
  await blog.populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return publicBlog(blog, { delta: blog.contentDelta });
}

export async function updateBlog(blogId, viewer, payload, coverAsset = null) {
  const data = parse(blogUpdateSchema, payload);
  const blog = await Blog.findById(blogId);
  if (!blog) throw notFound('Article not found');
  const isOwner = String(blog.author) === String(viewer._id);
  if (!isOwner && viewer.role !== 'admin') throw forbidden();
  if (data.expectedUpdatedAt && new Date(data.expectedUpdatedAt) < blog.updatedAt) {
    throw badRequest('A newer version of this article exists. Refresh before saving.');
  }
  const oldCoverAsset = blog.coverAsset;
  const oldInlineAssets = [...(blog.inlineAssets || [])];
  if (data.title) blog.title = data.title;
  if (data.excerpt !== undefined) blog.excerpt = data.excerpt;
  if (data.content) {
    const rendered = renderArticle(data.content);
    blog.inlineAssets = await resolveInlineAssets(blog.author, rendered.delta);
    blog.contentDelta = rendered.delta;
    blog.htmlSanitized = rendered.html;
    blog.plainText = rendered.plainText;
    if (!blog.excerpt) blog.excerpt = rendered.plainText.slice(0, 240);
  }
  if (data.tags) blog.tags = data.tags;
  if (data.visibility) blog.visibility = data.visibility;
  if (data.commentsEnabled !== undefined) blog.commentsEnabled = data.commentsEnabled;
  if (coverAsset) {
    blog.coverImagePath = coverAsset.url;
    blog.coverAsset = coverAsset.assetId || null;
  }
  if (data.status === 'published') {
    blog.status = 'published';
    if (!blog.publishedAt) blog.publishedAt = new Date();
    if (data.title || !blog.slug) blog.slug = await uniqueSlug(blog.title, blog._id);
  } else if (data.status === 'draft') {
    blog.status = 'draft';
  }
  await blog.save();
  if (coverAsset && oldCoverAsset && String(oldCoverAsset) !== String(coverAsset.assetId)) {
    await cleanupAssetIfUnreferenced(oldCoverAsset, blog.author);
  }
  const nextInlineAssets = new Set((blog.inlineAssets || []).map(String));
  for (const oldAssetId of oldInlineAssets) {
    if (!nextInlineAssets.has(String(oldAssetId))) await cleanupAssetIfUnreferenced(oldAssetId, blog.author);
  }
  await blog.populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return publicBlog(blog, { delta: blog.contentDelta });
}

export async function deleteBlog(blogId, viewer) {
  const blog = await Blog.findById(blogId);
  let deletion;
  if (blog) {
    if (String(blog.author) !== String(viewer._id) && viewer.role !== 'admin') throw forbidden();
    deletion = await BlogDeletion.findOneAndUpdate(
      { blog: blog._id },
      { $setOnInsert: {
        blog: blog._id,
        owner: blog.author,
        assetIds: [...new Set([blog.coverAsset, ...(blog.inlineAssets || [])].filter(Boolean).map(String))],
        status: 'pending',
        nextAttemptAt: new Date(),
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } else {
    deletion = await BlogDeletion.findOne({ blog: blogId });
    if (!deletion || (String(deletion.owner) !== String(viewer._id) && viewer.role !== 'admin')) throw notFound('Article not found');
    if (deletion.status === 'complete') return;
  }
  if (deletion.status !== 'complete') await runBlogDeletion(deletion);
}

function safeErrorCode(error) {
  return /^[A-Z0-9_-]{1,32}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
}

async function deferBlogDeletion(deletion, error) {
  const code = safeErrorCode(error);
  await BlogDeletion.updateOne({ _id: deletion._id, status: 'pending' }, {
    $inc: { attempts: 1 },
    $set: { lastErrorCode: code, nextAttemptAt: new Date(Date.now() + 30_000) },
  }).catch(() => {});
  console.warn('Blog deletion deferred for retry', { blogId: String(deletion.blog), code });
}

async function runBlogDeletion(deletion) {
  if (deletion.status === 'complete') return;
  try {
    await Like.deleteMany({ blog: deletion.blog });
    await Bookmark.deleteMany({ blog: deletion.blog });
    await Comment.deleteMany({ blog: deletion.blog });
    await Blog.deleteOne({ _id: deletion.blog });
  } catch (error) {
    await deferBlogDeletion(deletion, error);
    throw error;
  }

  try {
    for (const assetId of deletion.assetIds) {
      await cleanupAssetIfUnreferencedStrict(assetId, deletion.owner);
    }
  } catch (error) {
    await deferBlogDeletion(deletion, error);
    return;
  }
  try {
    await BlogDeletion.updateOne({ _id: deletion._id }, {
      $set: { status: 'complete', lastErrorCode: null },
    });
  } catch (error) {
    await deferBlogDeletion(deletion, error);
    throw error;
  }
}

export async function processPendingBlogDeletions({ limit = 50, force = false } = {}) {
  const query = { status: 'pending' };
  if (!force) query.nextAttemptAt = { $lte: new Date() };
  const jobs = await BlogDeletion.find(query).sort({ nextAttemptAt: 1 }).limit(limit);
  for (const job of jobs) {
    try {
      await runBlogDeletion(job);
    } catch (error) {
      // runBlogDeletion already records and logs the retry state.
    }
  }
}

export async function processPendingBlogDeletionsSafely() {
  try {
    await processPendingBlogDeletions();
  } catch (error) {
    console.warn('Blog deletion scan deferred', { code: safeErrorCode(error) });
  }
}

export async function getBySlug(slug, viewer) {
  const blog = await Blog.findOne({ slug }).populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  if (!blog) throw notFound('Article not found');
  const owner = viewer && String(viewer._id) === String(blog.author._id);
  const admin = viewer?.role === 'admin';
  if (blog.status !== 'published' && !owner && !admin) throw notFound('Article not found');
  if (blog.status === 'hidden' && !owner && !admin) throw notFound('Article not found');
  const [item] = await annotate([blog], viewer?._id);
  if (owner || admin) item.content = blog.contentDelta;
  return item;
}

export async function getOwned(blogId, viewer) {
  const blog = await Blog.findById(blogId).populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  if (!blog) throw notFound('Article not found');
  if (String(blog.author._id) !== String(viewer._id) && viewer.role !== 'admin') throw forbidden();
  return publicBlog(blog, { delta: blog.contentDelta });
}

export async function listPublicBlogs({ cursor, limit, tag }) {
  const query = { status: 'published', visibility: 'public' };
  if (tag) query.tags = tag.toLowerCase();
  applyCursor(query, cursor, 'publishedAt');
  const rows = await Blog.find(query).sort({ publishedAt: -1, _id: -1 }).limit(limit)
    .populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  const items = await annotate(rows, null);
  return { items, nextCursor: nextCursorFrom(rows, limit, 'publishedAt') };
}

export async function listDashboard(userId, { cursor, limit, status }) {
  const query = { author: userId };
  if (status) query.status = status;
  applyCursor(query, cursor, 'updatedAt');
  const rows = await Blog.find(query).sort({ updatedAt: -1, _id: -1 }).limit(limit)
    .populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return { items: rows.map((row) => publicBlog(row, { delta: undefined })), nextCursor: nextCursorFrom(rows, limit, 'updatedAt') };
}

export async function followingFeed(userId, { cursor, limit }) {
  const follows = await Follow.find({ follower: userId }).select('followed');
  const ids = follows.map((f) => f.followed);
  const query = { author: { $in: ids }, status: 'published', visibility: 'public' };
  applyCursor(query, cursor, 'publishedAt');
  const rows = await Blog.find(query).sort({ publishedAt: -1, _id: -1 }).limit(limit)
    .populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  const items = await annotate(rows, userId);
  return { items, nextCursor: nextCursorFrom(rows, limit, 'publishedAt') };
}

export async function searchBlogs({ q, tag, cursor, limit }) {
  const query = { status: 'published', visibility: 'public' };
  if (tag) query.tags = tag.toLowerCase();
  if (q && q.trim()) {
    query.$text = { $search: q.trim() };
  }
  applyCursor(query, cursor, 'publishedAt');
  const find = Blog.find(query);
  find.sort({ publishedAt: -1, _id: -1 });
  const rows = await find.limit(limit).populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  const items = await annotate(rows, null);
  return { items, nextCursor: nextCursorFrom(rows, limit, 'publishedAt') };
}

export async function relatedBlogs(blogId, limit = 4) {
  const blog = await Blog.findById(blogId);
  if (!blog) throw notFound('Article not found');
  if (!canSeeInFeed(blog) && blog.status !== 'published') throw notFound();
  const rows = await Blog.find({
    _id: { $ne: blog._id },
    status: 'published',
    visibility: 'public',
    tags: { $in: blog.tags.length ? blog.tags : ['__none__'] },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return annotate(rows, null);
}

export async function likeBlog(userId, blogId) {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.status !== 'published') throw notFound('Article not found');
  let created = false;
  try {
    await Like.create({ user: userId, blog: blogId, notificationPendingAt: new Date() });
    created = true;
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
  if (created) await processPendingNotificationsSafely();
  return Like.countDocuments({ blog: blogId });
}

export async function unlikeBlog(userId, blogId) {
  await Like.deleteOne({ user: userId, blog: blogId });
  return Like.countDocuments({ blog: blogId });
}

export async function bookmarkBlog(userId, blogId) {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.status !== 'published') throw notFound('Article not found');
  try {
    await Bookmark.create({ user: userId, blog: blogId });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

export async function unbookmarkBlog(userId, blogId) {
  await Bookmark.deleteOne({ user: userId, blog: blogId });
}

export async function listBookmarks(userId, { cursor, limit }) {
  const query = { user: userId };
  applyCursor(query, cursor, '_id');
  const rows = await Bookmark.find(query).sort({ _id: -1 }).limit(limit).populate({
    path: 'blog',
    populate: { path: 'author', select: 'username displayName avatarPath bio websiteUrl role createdAt' },
  });
  const blogs = rows.map((r) => r.blog).filter((b) => b && b.status === 'published');
  const items = await annotate(blogs, userId);
  return { items, nextCursor: nextCursorFrom(rows, limit, '_id') };
}

export { canSee };
