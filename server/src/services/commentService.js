import { Blog, Comment } from '../models/index.js';
import { forbidden, notFound } from '../utils/errors.js';
import { parse, objectIdSchema } from '../validators/common.js';
import { commentSchema } from '../validators/blog.js';
import { sanitizeComment } from '../utils/delta.js';
import { publicComment } from '../utils/dto.js';
import { notify } from './notificationService.js';

export async function listComments(blogId, viewer) {
  const blog = await Blog.findById(blogId);
  if (!blog) throw notFound('Article not found');
  const owner = viewer && String(viewer._id) === String(blog.author);
  const admin = viewer?.role === 'admin';
  if (blog.status !== 'published' && !owner && !admin) throw notFound('Article not found');
  const rows = await Comment.find({ blog: blogId })
    .sort({ createdAt: 1 })
    .populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return rows
    .filter((row) => row.status !== 'hidden' || admin)
    .map(publicComment);
}

export async function addComment(userId, blogId, payload) {
  const data = parse(commentSchema, payload);
  const blog = await Blog.findById(blogId);
  if (!blog || blog.status !== 'published') throw notFound('Article not found');
  if (!blog.commentsEnabled) throw forbidden('Comments are closed for this article');
  const body = sanitizeComment(data.body);
  if (!body) throw forbidden('Comment cannot be empty');
  let parent = null;
  if (data.parentId) {
    parent = await Comment.findById(parse(objectIdSchema, data.parentId));
    if (!parent || String(parent.blog) !== String(blogId) || parent.status === 'deleted') {
      throw notFound('Parent comment not found');
    }
  }
  const comment = await Comment.create({
    author: userId,
    blog: blogId,
    parent: parent?._id || null,
    body,
  });
  await comment.populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  await notify({
    recipient: parent ? parent.author : blog.author,
    actor: userId,
    type: parent ? 'reply' : 'comment',
    blog: blogId,
    comment: comment._id,
  });
  return publicComment(comment);
}

export async function updateComment(userId, commentId, payload, isAdmin) {
  const data = parse(commentSchema.pick({ body: true }), payload);
  const comment = await Comment.findById(commentId);
  if (!comment || comment.status === 'deleted') throw notFound('Comment not found');
  if (String(comment.author) !== String(userId) && !isAdmin) throw forbidden();
  comment.body = sanitizeComment(data.body);
  if (!comment.body) throw forbidden('Comment cannot be empty');
  await comment.save();
  await comment.populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return publicComment(comment);
}

export async function deleteComment(userId, commentId, isAdmin) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw notFound('Comment not found');
  if (String(comment.author) !== String(userId) && !isAdmin) throw forbidden();
  comment.status = 'deleted';
  comment.body = '';
  await comment.save();
}
