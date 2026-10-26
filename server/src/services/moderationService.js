import { Blog, Comment, Report, User } from '../models/index.js';
import { notFound } from '../utils/errors.js';
import { parse, objectIdSchema } from '../validators/common.js';
import { reportReviewSchema, reportSchema } from '../validators/blog.js';
import { nextCursorFrom } from '../utils/pagination.js';

export async function createReport(reporterId, payload) {
  const data = parse(reportSchema, payload);
  const targetId = parse(objectIdSchema, data.targetId);
  if (data.targetType === 'article') {
    const blog = await Blog.findById(targetId);
    if (!blog) throw notFound('Article not found');
  } else if (data.targetType === 'comment') {
    const comment = await Comment.findById(targetId);
    if (!comment) throw notFound('Comment not found');
  } else {
    const user = await User.findById(targetId);
    if (!user) throw notFound('User not found');
  }
  const report = await Report.create({
    reporter: reporterId,
    targetType: data.targetType,
    targetId,
    reason: data.reason,
    explanation: data.explanation || '',
  });
  return report;
}

export async function listReports({ cursor, limit, status }) {
  const query = {};
  if (status) query.status = status;
  if (cursor) query._id = { $lt: cursor };
  const rows = await Report.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('reporter', 'username displayName')
    .populate('reviewer', 'username displayName');
  return { items: rows, nextCursor: nextCursorFrom(rows, limit) };
}

export async function getReport(id) {
  const report = await Report.findById(id)
    .populate('reporter', 'username displayName')
    .populate('reviewer', 'username displayName');
  if (!report) throw notFound('Report not found');
  let target = null;
  if (report.targetType === 'article') target = await Blog.findById(report.targetId).select('title slug status author');
  if (report.targetType === 'comment') target = await Comment.findById(report.targetId).select('body status blog author');
  if (report.targetType === 'user') target = await User.findById(report.targetId).select('username displayName role');
  return { report, target };
}

export async function reviewReport(adminId, id, payload) {
  const data = parse(reportReviewSchema, payload);
  const report = await Report.findById(id);
  if (!report) throw notFound('Report not found');
  report.status = data.status;
  report.resolutionNote = data.resolutionNote || '';
  report.reviewer = adminId;
  report.resolvedAt = new Date();
  if (data.hideTarget && data.status === 'resolved') {
    if (report.targetType === 'article') {
      await Blog.findByIdAndUpdate(report.targetId, { status: 'hidden' });
    }
    if (report.targetType === 'comment') {
      await Comment.findByIdAndUpdate(report.targetId, { status: 'hidden' });
    }
  }
  await report.save();
  return report;
}
