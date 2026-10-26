import { asyncHandler } from '../utils/asyncHandler.js';
import * as moderationService from '../services/moderationService.js';
import { parseCursor, parseLimit } from '../utils/pagination.js';
import { parse, objectIdSchema } from '../validators/common.js';

export const createReport = asyncHandler(async (req, res) => {
  const report = await moderationService.createReport(req.user._id, req.body);
  res.status(201).json({ success: true, data: { report } });
});

export const listReports = asyncHandler(async (req, res) => {
  const data = await moderationService.listReports({
    cursor: parseCursor(req.query.cursor),
    limit: parseLimit(req.query.limit, 20),
    status: req.query.status,
  });
  res.json({ success: true, data });
});

export const getReport = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const data = await moderationService.getReport(id);
  res.json({ success: true, data });
});

export const reviewReport = asyncHandler(async (req, res) => {
  const id = parse(objectIdSchema, req.params.id);
  const report = await moderationService.reviewReport(req.user._id, id, req.body);
  res.json({ success: true, data: { report } });
});
