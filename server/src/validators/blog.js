import { z } from 'zod';
import { tagSchema } from './common.js';

const deltaSchema = z.object({
  ops: z.array(z.object({
    insert: z.union([z.string(), z.object({ image: z.string() }).passthrough()]),
    attributes: z.record(z.any()).optional(),
  })).max(4000),
}).passthrough();

export const blogCreateSchema = z.object({
  title: z.string().trim().min(1).max(160).default('Untitled'),
  excerpt: z.string().max(400).optional().default(''),
  content: deltaSchema.optional(),
  tags: z.array(tagSchema).max(8).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  visibility: z.enum(['public', 'unlisted']).optional().default('public'),
  commentsEnabled: z.boolean().optional().default(true),
});

export const blogUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  excerpt: z.string().max(400).optional(),
  content: deltaSchema.optional(),
  tags: z.array(tagSchema).max(8).optional(),
  status: z.enum(['draft', 'published']).optional(),
  visibility: z.enum(['public', 'unlisted']).optional(),
  commentsEnabled: z.boolean().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().optional().nullable(),
});

export const reportSchema = z.object({
  targetType: z.enum(['article', 'comment', 'user']),
  targetId: z.string().min(1),
  reason: z.enum(['spam', 'harassment', 'misinformation', 'copyright', 'other']),
  explanation: z.string().max(1000).optional().default(''),
});

export const reportReviewSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolutionNote: z.string().max(1000).optional().default(''),
  hideTarget: z.boolean().optional().default(false),
});
