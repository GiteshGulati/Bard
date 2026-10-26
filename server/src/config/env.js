import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

function parseEnvBoolean(value) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.literal('bard').default('bard'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  CSRF_SECRET: z.string().min(16).optional(),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  AUTH_RATE_MAX: z.coerce.number().int().positive().default(20),
  COMMENT_RATE_MAX: z.coerce.number().int().positive().default(40),
  UPLOAD_RATE_MAX: z.coerce.number().int().positive().default(30),
  REPORT_RATE_MAX: z.coerce.number().int().positive().default(15),
  EMAIL_RATE_MAX: z.coerce.number().int().positive().default(5),
  SESSION_DAYS: z.coerce.number().int().positive().default(7),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.preprocess(parseEnvBoolean, z.boolean().optional()),
  SMTP_USER: z.string().trim().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  EMAIL_FROM_NAME: z.string().trim().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  APP_BASE_URL: z.string().url().default('http://localhost:5173'),
  EMAIL_SEND_WELCOME: z.preprocess(parseEnvBoolean, z.boolean()).default(false),
}).superRefine((value, ctx) => {
  const names = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const configured = names.filter((name) => Boolean(value[name])).length;
  if (configured > 0 && configured < names.length) {
    for (const name of names) {
      if (!value[name]) ctx.addIssue({ code: 'custom', path: [name], message: 'Required when Cloudinary is configured' });
    }
  }
  if (value.NODE_ENV !== 'test' && configured !== names.length) {
    ctx.addIssue({ code: 'custom', path: ['CLOUDINARY_CLOUD_NAME'], message: 'Cloudinary configuration is required' });
  }
  const emailNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM_NAME', 'EMAIL_FROM_ADDRESS'];
  const emailConfigured = emailNames.filter((name) => value[name] !== undefined).length;
  if (emailConfigured > 0 && emailConfigured < emailNames.length) {
    for (const name of emailNames) if (value[name] === undefined) ctx.addIssue({ code: 'custom', path: [name], message: 'Required when SMTP is configured' });
  }
  if (value.NODE_ENV === 'production' && emailConfigured !== emailNames.length) {
    ctx.addIssue({ code: 'custom', path: ['SMTP_HOST'], message: 'SMTP configuration is required in production' });
  }
  if (value.NODE_ENV === 'production' && value.APP_BASE_URL && !/^https:\/\//i.test(value.APP_BASE_URL)) {
    ctx.addIssue({ code: 'custom', path: ['APP_BASE_URL'], message: 'APP_BASE_URL must use HTTPS in production' });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
