import mongoose from 'mongoose';
import { Blog, Comment, Report, User } from '../models/index.js';
import { badRequest, notFound } from '../utils/errors.js';
import { parse, objectIdSchema } from '../validators/common.js';
import { reportReviewSchema, reportSchema } from '../validators/blog.js';
import { applyCursor, nextCursorFrom } from '../utils/pagination.js';

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
  applyCursor(query, cursor, '_id');
  const rows = await Report.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('reporter', 'username displayName')
    .populate('reviewer', 'username displayName');
  return { items: rows, nextCursor: nextCursorFrom(rows, limit, '_id') };
}

export async function getReport(id) {
  const report = await Report.findById(id)
    .populate('reporter', 'username displayName')
    .populate('reviewer', 'username displayName');
  if (!report) throw notFound('Report not found');
  let target = null;
  if (report.targetType === 'article') target = await Blog.findById(report.targetId).select('title slug status author');
  if (report.targetType === 'comment') target = await Comment.findById(report.targetId).select('body status blog author');
  if (report.targetType === 'user') target = await User.findById(report.targetId).select('username displayName role moderationStatus moderationHistory');
  return { report, target };
}

export async function reviewReport(adminId, id, payload) {
  const data = parse(reportReviewSchema, payload);
  const report = await Report.findById(id).select('+pendingReview');
  if (!report) throw notFound('Report not found');
  if (!report.pendingReview && report.targetType === 'user' && data.status === 'resolved' && !data.userAction) {
    throw badRequest('Choose whether to suspend or restore the reported account before resolving this report.');
  }
  if (!report.pendingReview && transactionCapable()) {
    return reviewReportTransaction(adminId, id, data);
  }
  if (!report.pendingReview) {
    report.pendingReview = {
      status: data.status,
      reviewer: adminId,
      operationId: new mongoose.Types.ObjectId(),
      resolutionNote: data.resolutionNote || '',
      hideTarget: Boolean(data.hideTarget),
      userAction: data.userAction || null,
    };
    await report.save();
  }
  await applyPendingReview(report);
  return Report.findById(id);
}

function transactionCapable() {
  const topology = mongoose.connection.client?.topology?.description?.type;
  return ['ReplicaSetWithPrimary', 'Sharded', 'LoadBalanced'].includes(topology);
}

async function reviewReportTransaction(adminId, id, data) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const report = await Report.findById(id).select('+pendingReview').session(session);
      if (!report) throw notFound('Report not found');
      const action = report.pendingReview || {
        status: data.status,
        reviewer: adminId,
        operationId: new mongoose.Types.ObjectId(),
        resolutionNote: data.resolutionNote || '',
        hideTarget: Boolean(data.hideTarget),
        userAction: data.userAction || null,
      };
      await applyReviewAction(report, action, session);
      report.pendingReview = null;
      await report.save({ session });
      result = report;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function applyPendingReview(report) {
  const pending = report.pendingReview;
  if (!pending) return;
  await applyReviewAction(report, pending);
  report.pendingReview = null;
  await report.save();
}

async function applyReviewAction(report, action, session = null) {
  const options = session ? { session } : {};
  if (action.status === 'resolved' && action.hideTarget) {
    if (report.targetType === 'article') {
      const target = await Blog.findByIdAndUpdate(report.targetId, { $set: { status: 'hidden' } }, options);
      if (!target) throw notFound('Reported article no longer exists');
    } else if (report.targetType === 'comment') {
      const target = await Comment.findByIdAndUpdate(report.targetId, { $set: { status: 'hidden' } }, options);
      if (!target) throw notFound('Reported comment no longer exists');
    }
  }
  if (report.targetType === 'user' && action.status === 'resolved' && action.userAction) {
    const user = await User.findById(report.targetId).select('moderationStatus sessionVersion').session(session || null);
    if (!user) throw notFound('Reported account no longer exists');
    const nextStatus = action.userAction === 'suspend' ? 'suspended' : 'active';
    const update = {
      $set: { moderationStatus: nextStatus },
      $push: { moderationHistory: {
        action: action.userAction,
        moderator: action.reviewer,
        operationId: action.operationId,
        reason: action.resolutionNote || '',
      } },
    };
    if (action.userAction === 'suspend' && user.moderationStatus !== 'suspended') {
      update.$inc = { sessionVersion: 1 };
    }
    await User.updateOne({
      _id: user._id,
      'moderationHistory.operationId': { $ne: action.operationId },
    }, update, options);
  }
  report.status = action.status;
  report.resolutionNote = action.resolutionNote || '';
  report.reviewer = action.reviewer;
  report.resolvedAt = new Date();
}

export async function processPendingModerationReviews({ limit = 50 } = {}) {
  const pending = await Report.find({ pendingReview: { $ne: null } }).select('+pendingReview').limit(limit);
  for (const report of pending) {
    try {
      await applyPendingReview(report);
    } catch (error) {
      const code = /^[A-Z0-9_-]{1,32}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
      console.warn('Moderation review deferred for retry', { reportId: String(report._id), code });
    }
  }
}

export async function processPendingModerationReviewsSafely() {
  try {
    await processPendingModerationReviews();
  } catch (error) {
    const code = /^[A-Z0-9_-]{1,32}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    console.warn('Moderation review scan deferred', { code });
  }
}
