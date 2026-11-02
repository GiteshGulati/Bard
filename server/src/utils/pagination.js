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
  // Keep ID-sorted endpoints compatible with cursors issued before v1 cursors.
  if (mongoose.Types.ObjectId.isValid(value)) return { version: 0, field: '_id', id: String(value) };
  try {
    const decoded = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    if (decoded?.version !== 1 || typeof decoded.field !== 'string' || !mongoose.Types.ObjectId.isValid(decoded.id)) throw new Error('invalid');
    if (decoded.field === '_id') return { version: 1, field: '_id', id: String(decoded.id) };
    if (!['publishedAt', 'updatedAt', 'createdAt'].includes(decoded.field) || typeof decoded.value !== 'string' || !Number.isFinite(Date.parse(decoded.value))) throw new Error('invalid');
    return { version: 1, field: decoded.field, id: String(decoded.id), value: new Date(decoded.value) };
  } catch {
    throw badRequest('Invalid cursor');
  }
}

export function applyCursor(query, cursor, field = '_id') {
  if (!cursor) return query;
  if (cursor.field !== field) throw badRequest('Cursor does not match this result ordering');
  if (field === '_id') {
    query._id = { $lt: cursor.id };
    return query;
  }
  query.$and = [
    ...(query.$and || []),
    { $or: [
      { [field]: { $lt: cursor.value } },
      { [field]: cursor.value, _id: { $lt: cursor.id } },
    ] },
  ];
  return query;
}

export function nextCursorFrom(docs, limit, field = '_id') {
  if (!docs.length || docs.length < limit) return null;
  const last = docs[docs.length - 1];
  const id = String(last._id);
  const value = field === '_id' ? undefined : last[field];
  if (field !== '_id' && !(value instanceof Date) && !Number.isFinite(Date.parse(value))) return null;
  return Buffer.from(JSON.stringify({ version: 1, field, id, ...(field === '_id' ? {} : { value: new Date(value).toISOString() }) })).toString('base64url');
}
