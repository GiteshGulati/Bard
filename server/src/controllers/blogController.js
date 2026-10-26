import { asyncHandler } from '../utils/asyncHandler.js';
import * as blogService from '../services/blogService.js';
import { discardAsset, persistImage } from '../services/uploadService.js';
import { parseCursor, parseLimit } from '../utils/pagination.js';
import { parse, objectIdSchema, tagSchema } from '../validators/common.js';
import { Blog } from '../models/Blog.js';
import { forbidden, notFound } from '../utils/errors.js';

export const listBlogs = asyncHandler(async (req, res) => {
  if (req.query.mine === '1' && req.user) {
    const data = await blogService.listDashboard(req.user._id, {
      cursor: parseCursor(req.query.cursor),
      limit: parseLimit(req.query.limit),
      status: req.query.status,
    });
    return res.json({ success: true, data });
  }
  const data = await blogService.listPublicBlogs({
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
    tag: req.query.tag,
  });
  res.json({ success: true, data });
});

export const createBlog = asyncHandler(async (req, res) => {
  const payload = coerceBlogBody(req.body);
  let cover;
  try {
    if (req.file) cover = await persistImage(req.file, 'cover', req.user._id);
    const blog = await blogService.createBlog(req.user._id, payload, cover);
    res.status(201).json({ success: true, data: { blog } });
  } catch (error) {
    if (cover?.assetId) await discardAsset(cover.assetId, req.user._id).catch(() => {});
    throw error;
  }
});

export const authorizeBlogMutation = asyncHandler(async (req, _res, next) => {
  const id = parse(objectIdSchema, req.params.id);
  const blog = await Blog.findById(id).select('author');
  if (!blog) throw notFound('Article not found');
  if (String(blog.author) !== String(req.user._id) && req.user.role !== 'admin') throw forbidden();
  next();
});

export const getBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.getBySlug(req.params.slug, req.user);
  res.json({ success: true, data: { blog } });
});

export const getBlogById = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const blog = await blogService.getOwned(id, req.user);
  res.json({ success: true, data: { blog } });
});

function coerceBlogBody(body) {
  const payload = { ...body };
  for (const key of ['content', 'tags']) {
    if (typeof payload[key] === 'string') {
      try { payload[key] = JSON.parse(payload[key]); } catch { /* keep string and let validation fail */ }
    }
  }
  if (payload.commentsEnabled === 'true') payload.commentsEnabled = true;
  if (payload.commentsEnabled === 'false') payload.commentsEnabled = false;
  return payload;
}

export const updateBlog = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const payload = coerceBlogBody(req.body);
  let cover;
  try {
    if (req.file) cover = await persistImage(req.file, 'cover', req.user._id);
    const blog = await blogService.updateBlog(id, req.user, payload, cover);
    res.json({ success: true, data: { blog } });
  } catch (error) {
    if (cover?.assetId) await discardAsset(cover.assetId, req.user._id).catch(() => {});
    throw error;
  }
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  await blogService.deleteBlog(id, req.user);
  res.json({ success: true, data: { ok: true } });
});

export const related = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const items = await blogService.relatedBlogs(id);
  res.json({ success: true, data: { items } });
});

export const feed = asyncHandler(async (req, res) => {
  const data = await blogService.followingFeed(req.user._id, {
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').slice(0, 120);
  const data = await blogService.searchBlogs({
    q,
    tag: req.query.tag,
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const tagBlogs = asyncHandler(async (req, res) => {
  const tag = parse(tagSchema, req.params.tag);
  const data = await blogService.listPublicBlogs({
    tag,
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const like = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const likeCount = await blogService.likeBlog(req.user._id, id);
  res.json({ success: true, data: { liked: true, likeCount } });
});

export const unlike = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const likeCount = await blogService.unlikeBlog(req.user._id, id);
  res.json({ success: true, data: { liked: false, likeCount } });
});

export const addCover = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'UPLOAD' } });
  }
  const cover = await persistImage(req.file, 'cover', req.user._id);
  const blog = await blogService.updateBlog(id, req.user, {}, cover);
  res.json({ success: true, data: { blog } });
});

export async function getBlogDocument(id) {
  return Blog.findById(id);
}
