import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: { message: 'Not found', code: 'NOT_FOUND' } });
  }
  return next();
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === 'EBADCSRFTOKEN' || err.message === 'invalid csrf token') {
    return res.status(403).json({ success: false, error: { message: 'Invalid CSRF token', code: 'CSRF' } });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_FIELD_COUNT: 'Too many form fields',
      LIMIT_FIELD_VALUE: 'A form field is too large',
      LIMIT_PART_COUNT: 'Too many multipart parts',
    };
    const message = messages[err.code] || 'Invalid multipart upload';
    return res.status(400).json({ success: false, error: { message, code: 'UPLOAD' } });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, error: { message: err.message, code: 'UNPROCESSABLE' } });
  }

  console.error(err);
  const message = env.NODE_ENV === 'production' ? 'Something went wrong' : err.message;
  return res.status(500).json({ success: false, error: { message, code: 'INTERNAL' } });
}
