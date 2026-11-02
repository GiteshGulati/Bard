import { User, Follow, Blog } from '../models/index.js';
import { notFound, forbidden, conflict } from '../utils/errors.js';
import { parse } from '../validators/common.js';
import { profileUpdateSchema } from '../validators/auth.js';
import { processPendingNotificationsSafely } from './notificationService.js';
import { publicBlog, publicUser } from '../utils/dto.js';
import { applyCursor, nextCursorFrom } from '../utils/pagination.js';
import { cleanupAssetIfUnreferenced } from './uploadService.js';

export async function getByUsername(username, viewerId) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw notFound('Author not found');
  const [followers, following, followingViewer] = await Promise.all([
    Follow.countDocuments({ followed: user._id }),
    Follow.countDocuments({ follower: user._id }),
    viewerId ? Follow.exists({ follower: viewerId, followed: user._id }) : null,
  ]);
  return publicUser(user, {
    followerCount: followers,
    followingCount: following,
    isFollowing: Boolean(followingViewer),
    isSelf: viewerId ? String(viewerId) === String(user._id) : false,
  });
}

export async function updateProfile(userId, payload, avatar) {
  const data = parse(profileUpdateSchema, payload);
  const user = await User.findById(userId);
  if (!user) throw notFound();
  if (data.displayName !== undefined) user.displayName = data.displayName;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.websiteUrl !== undefined) user.websiteUrl = data.websiteUrl;
  const oldAvatarAsset = user.avatarAsset;
  if (avatar) {
    user.avatarPath = avatar.url;
    user.avatarAsset = avatar.assetId || null;
  }
  await user.save();
  if (avatar && oldAvatarAsset && String(oldAvatarAsset) !== String(avatar.assetId)) {
    await cleanupAssetIfUnreferenced(oldAvatarAsset, userId);
  }
  return user;
}

export async function followUser(followerId, targetId) {
  if (String(followerId) === String(targetId)) throw forbidden('You cannot follow yourself');
  const target = await User.findById(targetId);
  if (!target) throw notFound('User not found');
  try {
    await Follow.create({ follower: followerId, followed: targetId, notificationPendingAt: new Date() });
  } catch (err) {
    if (err.code === 11000) throw conflict('Already following');
    throw err;
  }
  await processPendingNotificationsSafely();
}

export async function unfollowUser(followerId, targetId) {
  await Follow.deleteOne({ follower: followerId, followed: targetId });
}

export async function listFollowers(username, { cursor, limit }) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw notFound('Author not found');
  const query = { followed: user._id };
  applyCursor(query, cursor, 'createdAt');
  const rows = await Follow.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit).populate('follower', 'username displayName avatarPath bio websiteUrl role createdAt');
  return {
    items: rows.map((row) => publicUser(row.follower)),
    nextCursor: nextCursorFrom(rows, limit, 'createdAt'),
  };
}

export async function listFollowing(username, { cursor, limit }) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw notFound('Author not found');
  const query = { follower: user._id };
  applyCursor(query, cursor, 'createdAt');
  const rows = await Follow.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit).populate('followed', 'username displayName avatarPath bio websiteUrl role createdAt');
  return {
    items: rows.map((row) => publicUser(row.followed)),
    nextCursor: nextCursorFrom(rows, limit, 'createdAt'),
  };
}

export async function listUserBlogs(username, viewer, { cursor, limit }) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw notFound('Author not found');
  const isOwner = viewer && String(viewer._id) === String(user._id);
  const isAdmin = viewer?.role === 'admin';
  const query = { author: user._id };
  if (!isOwner && !isAdmin) {
    query.status = 'published';
    query.visibility = 'public';
  }
  applyCursor(query, cursor, 'updatedAt');
  const rows = await Blog.find(query).sort({ updatedAt: -1, _id: -1 }).limit(limit).populate('author', 'username displayName avatarPath bio websiteUrl role createdAt');
  return {
    items: rows.map((row) => publicBlog(row)),
    nextCursor: nextCursorFrom(rows, limit, 'updatedAt'),
  };
}
