import { asyncHandler } from '../utils/asyncHandler.js';
import * as blogService from '../services/blogService.js';
import * as notificationService from '../services/notificationService.js';
import { parse, objectIdSchema } from '../validators/common.js';
import { parseCursor, parseLimit, nextCursorFrom } from '../utils/pagination.js';
import { notFound } from '../utils/errors.js';

export const addBookmark = asyncHandler(async (req, res) => {
  const blogId = parse(objectIdSchema, req.params.blogId);
  await blogService.bookmarkBlog(req.user._id, blogId);
  res.json({ success: true, data: { bookmarked: true } });
});

export const removeBookmark = asyncHandler(async (req, res) => {
  const blogId = parse(objectIdSchema, req.params.blogId);
  await blogService.unbookmarkBlog(req.user._id, blogId);
  res.json({ success: true, data: { bookmarked: false } });
});

export const listBookmarks = asyncHandler(async (req, res) => {
  const data = await blogService.listBookmarks(req.user._id, {
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const cursor = parseCursor(req.query.cursor);
  const { items, unreadCount } = await notificationService.listNotifications(req.user._id, { cursor, limit });
  const mapped = items.map((item) => ({
    id: String(item._id),
    type: item.type,
    createdAt: item.createdAt,
    readAt: item.readAt,
    actor: item.actor,
    blog: item.blog,
    comment: item.comment,
  }));
  res.json({
    success: true,
    data: {
      items: mapped,
      unreadCount,
      nextCursor: nextCursorFrom(items, limit),
    },
  });
});

export const readNotification = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const doc = await notificationService.markRead(req.user._id, id);
  if (!doc) throw notFound('Notification not found');
  res.json({ success: true, data: { ok: true } });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json({ success: true, data: { ok: true } });
});
