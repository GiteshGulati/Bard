import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/userService.js';
import { discardAsset, persistImage } from '../services/uploadService.js';
import { parseLimit, parseCursor } from '../utils/pagination.js';
import { privateUser } from '../utils/dto.js';
import { parse, objectIdSchema } from '../validators/common.js';

export const getUser = asyncHandler(async (req, res) => {
  const data = await userService.getByUsername(req.params.username, req.user?._id);
  res.json({ success: true, data });
});

export const updateMe = asyncHandler(async (req, res) => {
  let avatar;
  const body = req.body || {};
  const payload = {
    displayName: body.displayName,
    bio: body.bio,
    websiteUrl: body.websiteUrl,
  };
  try {
    if (req.file) avatar = await persistImage(req.file, 'avatar', req.user._id);
    const user = await userService.updateProfile(req.user._id, payload, avatar);
    res.json({ success: true, data: { user: privateUser(user) } });
  } catch (error) {
    if (avatar?.assetId) await discardAsset(avatar.assetId, req.user._id).catch(() => {});
    throw error;
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { changePassword: change } = await import('../services/authService.js');
  await change(req.user._id, req.body);
  res.json({ success: true, data: { ok: true } });
});

export const userBlogs = asyncHandler(async (req, res) => {
  const data = await userService.listUserBlogs(req.params.username, req.user, {
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const followers = asyncHandler(async (req, res) => {
  const data = await userService.listFollowers(req.params.username, {
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const following = asyncHandler(async (req, res) => {
  const data = await userService.listFollowing(req.params.username, {
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit),
  });
  res.json({ success: true, data });
});

export const follow = asyncHandler(async (req, res) => {
  const userId = parse(objectIdSchema, req.params.userId);
  await userService.followUser(req.user._id, userId);
  res.json({ success: true, data: { following: true } });
});

export const unfollow = asyncHandler(async (req, res) => {
  const userId = parse(objectIdSchema, req.params.userId);
  await userService.unfollowUser(req.user._id, userId);
  res.json({ success: true, data: { following: false } });
});
