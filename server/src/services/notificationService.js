import { Notification } from '../models/Notification.js';

export async function notify({ recipient, actor, type, blog = null, comment = null }) {
  if (!recipient || !actor) return;
  if (String(recipient) === String(actor)) return;
  await Notification.create({ recipient, actor, type, blog, comment });
}

export async function listNotifications(userId, { cursor, limit }) {
  const query = { recipient: userId };
  if (cursor) query._id = { $lt: cursor };
  const items = await Notification.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('actor', 'username displayName avatarPath role createdAt bio websiteUrl')
    .populate('blog', 'title slug')
    .lean();
  const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });
  return { items, unreadCount };
}

export async function markRead(userId, id) {
  const doc = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  return doc;
}

export async function markAllRead(userId) {
  await Notification.updateMany({ recipient: userId, readAt: null }, { $set: { readAt: new Date() } });
}
