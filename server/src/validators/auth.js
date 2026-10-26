import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from './common.js';

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(60).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(72),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
});

export const emailRequestSchema = z.object({ email: emailSchema });
export const tokenSchema = z.object({ token: z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/) });
export const resetPasswordSchema = tokenSchema.extend({ password: passwordSchema });

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().max(280).optional(),
  websiteUrl: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Website must start with http:// or https://'),
});
