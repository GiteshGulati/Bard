import { z } from 'zod';
import mongoose from 'mongoose';
import { unprocessable } from '../utils/errors.js';

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'Usernames may contain letters, numbers, and underscores only')
  .transform((v) => v.toLowerCase());

export const emailSchema = z.string().trim().email().max(254).transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');

export const objectIdSchema = z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid id');

export const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[a-zA-Z0-9-]+$/, 'Tags may contain letters, numbers, and hyphens')
  .transform((v) => v.toLowerCase());

export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw unprocessable(details[0]?.message || 'Invalid request', details);
  }
  return result.data;
}
