import mongoose from 'mongoose';
import { badRequest } from './errors.js';

export const MAX_LIMIT = 50;

export function parseLimit(value, fallback = 12) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(n)));
}

export function parseCursor(value) {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw badRequest('Invalid cursor');
  }
  return value;
}

export function nextCursorFrom(docs, limit) {
  if (!docs.length || docs.length < limit) return null;
  return String(docs[docs.length - 1]._id);
}
