import multer from 'multer';
import { badRequest } from '../utils/errors.js';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    fieldSize: 1024 * 1024,
    parts: 11,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(badRequest('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});
