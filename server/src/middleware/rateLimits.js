import rateLimit from 'express-rate-limit';
import { env, isTest } from '../config/env.js';

function limiter(max, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max: isTest ? max : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Too many requests, please try again later', code: 'RATE_LIMIT' } },
  });
}

export const authLimiter = limiter(env.AUTH_RATE_MAX);
export const verificationLimiter = limiter(env.EMAIL_RATE_MAX);
export const verificationRequestLimiter = limiter(env.EMAIL_RATE_MAX);
export const passwordResetLimiter = limiter(env.EMAIL_RATE_MAX);
export const commentLimiter = limiter(env.COMMENT_RATE_MAX, 10 * 60 * 1000);
export const uploadLimiter = limiter(env.UPLOAD_RATE_MAX, 10 * 60 * 1000);
export const reportLimiter = limiter(env.REPORT_RATE_MAX, 15 * 60 * 1000);
export const generalLimiter = limiter(300, 15 * 60 * 1000);
