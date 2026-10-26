import { asyncHandler } from '../utils/asyncHandler.js';
import { persistImage } from '../services/uploadService.js';

export const uploadInline = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'UPLOAD' } });
  }
  const image = await persistImage(req.file, 'inline', req.user._id);
  res.status(201).json({ success: true, data: image });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'UPLOAD' } });
  }
  const image = await persistImage(req.file, 'avatar', req.user._id);
  res.status(201).json({ success: true, data: image });
});
