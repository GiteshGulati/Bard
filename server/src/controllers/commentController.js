import { asyncHandler } from '../utils/asyncHandler.js';
import * as commentService from '../services/commentService.js';
import { parse, objectIdSchema } from '../validators/common.js';

export const listComments = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const items = await commentService.listComments(id, req.user);
  res.json({ success: true, data: { items } });
});

export const createComment = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const comment = await commentService.addComment(req.user._id, id, req.body);
  res.status(201).json({ success: true, data: { comment } });
});

export const updateComment = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const comment = await commentService.updateComment(req.user._id, id, req.body, req.user.role === 'admin');
  res.json({ success: true, data: { comment } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  await commentService.deleteComment(req.user._id, id, req.user.role === 'admin');
  res.json({ success: true, data: { ok: true } });
});
