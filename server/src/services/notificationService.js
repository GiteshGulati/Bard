import { Notification } from '../models/Notification.js';
import { Comment, Follow, Like } from '../models/index.js';
import { applyCursor } from '../utils/pagination.js';

const RETRY_DELAY_MS = 30_000;

async function createNotificationOnce({ recipient, actor, type, blog = null, comment = null, dedupeKey }) {
  if (!recipient || !actor || String(recipient) === String(actor)) return;
  try {
    await Notification.updateOne({ dedupeKey }, { $setOnInsert: { recipient, actor, type, blog, comment, dedupeKey } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}

async function deliverSource(Model, record, details) {
  try {
    await createNotificationOnce({ ...details, dedupeKey: `${details.type}:${record._id}` });
    await Model.updateOne({ _id: record._id }, { $set: { notificationDeliveredAt: new Date() } });
  } catch (error) {
    await Model.updateOne({ _id: record._id }, {
      $set: { notificationAttemptedAt: new Date() },
      $inc: { notificationAttempts: 1 },
    }).catch(() => {});
    const code = /^[A-Z0-9_-]{1,32}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    console.warn('Notification delivery deferred for retry', { code });
  }
}

export async function processPendingNotifications({ limit = 100, retryDelayMs = RETRY_DELAY_MS } = {}) {
  const retryBefore = new Date(Date.now() - retryDelayMs);
  const pending = {
    notificationPendingAt: { $type: 'date' },
    notificationDeliveredAt: null,
    $or: [{ notificationAttemptedAt: null }, { notificationAttemptedAt: { $lt: retryBefore } }],
  };
  const [likes, comments, follows] = await Promise.all([
    Like.find(pending).sort({ notificationPendingAt: 1 }).limit(limit).populate('user', '_id').populate('blog', 'author').lean(),
    Comment.find(pending).sort({ notificationPendingAt: 1 }).limit(limit).populate('author', '_id').populate('blog', 'author').populate('parent', 'author').lean(),
    Follow.find(pending).sort({ notificationPendingAt: 1 }).limit(limit).populate('follower', '_id').populate('followed', '_id').lean(),
  ]);
  await Promise.all([
    ...likes.map(record => deliverSource(Like, record, { recipient: record.blog?.author, actor: record.user?._id, type: 'like', blog: record.blog?._id })),
    ...comments.map(record => deliverSource(Comment, record, { recipient: record.parent?.author || record.blog?.author, actor: record.author?._id, type: record.parent ? 'reply' : 'comment', blog: record.blog?._id, comment: record._id })),
    ...follows.map(record => deliverSource(Follow, record, { recipient: record.followed?._id, actor: record.follower?._id, type: 'follow' })),
  ]);
}

export async function processPendingNotificationsSafely() {
  try { await processPendingNotifications(); }
  catch (error) {
    const code = /^[A-Z0-9_-]{1,32}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    console.warn('Notification outbox scan deferred', { code });
  }
}

export async function listNotifications(userId, { cursor, limit }) {
  const query = { recipient: userId };
  applyCursor(query, cursor, '_id');
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
