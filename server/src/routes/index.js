import { Router } from 'express';
import { csrfSynchronisedProtection } from '../config/csrf.js';
import { requireAdmin, requireAuth, requireVerified } from '../middleware/auth.js';
import { authLimiter, commentLimiter, passwordResetLimiter, reportLimiter, uploadLimiter, verificationLimiter, verificationRequestLimiter } from '../middleware/rateLimits.js';
import { imageUpload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as blogs from '../controllers/blogController.js';
import * as comments from '../controllers/commentController.js';
import * as social from '../controllers/socialController.js';
import * as moderation from '../controllers/moderationController.js';
import * as uploads from '../controllers/uploadController.js';
import { generateCsrfToken } from '../config/csrf.js';
import mongoose from 'mongoose';

const api = Router();

api.get('/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({ success: databaseReady, data: { ok: databaseReady, database: databaseReady ? 'ready' : 'unavailable' } });
});

api.get('/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ success: true, data: { csrfToken } });
});

api.post('/auth/register', authLimiter, csrfSynchronisedProtection, auth.register);
api.post('/auth/login', authLimiter, csrfSynchronisedProtection, auth.login);
api.post('/auth/verify-email', verificationLimiter, csrfSynchronisedProtection, auth.verifyEmail);
api.post('/auth/resend-verification', verificationRequestLimiter, csrfSynchronisedProtection, auth.resendVerification);
api.post('/auth/forgot-password', passwordResetLimiter, csrfSynchronisedProtection, auth.forgotPassword);
api.post('/auth/reset-password', passwordResetLimiter, csrfSynchronisedProtection, auth.resetPassword);
api.post('/auth/logout', csrfSynchronisedProtection, auth.logout);
api.get('/auth/me', auth.me);

api.get('/users/:username', users.getUser);
api.get('/users/:username/blogs', users.userBlogs);
api.get('/users/:username/followers', users.followers);
api.get('/users/:username/following', users.following);
api.patch('/users/me', requireAuth, uploadLimiter, csrfSynchronisedProtection, imageUpload.single('avatar'), users.updateMe);
api.patch('/users/me/password', requireAuth, csrfSynchronisedProtection, users.changePassword);
api.put('/users/:userId/follow', requireAuth, requireVerified, csrfSynchronisedProtection, users.follow);
api.delete('/users/:userId/follow', requireAuth, requireVerified, csrfSynchronisedProtection, users.unfollow);

api.get('/blogs', blogs.listBlogs);
api.post('/blogs', requireAuth, requireVerified, uploadLimiter, csrfSynchronisedProtection, imageUpload.single('cover'), blogs.createBlog);
api.get('/blogs/id/:id', requireAuth, blogs.getBlogById);
api.get('/blogs/:slug', blogs.getBlog);
api.patch('/blogs/:id', requireAuth, requireVerified, csrfSynchronisedProtection, blogs.authorizeBlogMutation, uploadLimiter, imageUpload.single('cover'), blogs.updateBlog);
api.delete('/blogs/:id', requireAuth, requireVerified, csrfSynchronisedProtection, blogs.deleteBlog);
api.get('/blogs/:id/related', blogs.related);
api.put('/blogs/:id/like', requireAuth, requireVerified, csrfSynchronisedProtection, blogs.like);
api.delete('/blogs/:id/like', requireAuth, requireVerified, csrfSynchronisedProtection, blogs.unlike);
api.get('/blogs/:id/comments', comments.listComments);
api.post('/blogs/:id/comments', requireAuth, requireVerified, commentLimiter, csrfSynchronisedProtection, comments.createComment);

api.patch('/comments/:id', requireAuth, requireVerified, csrfSynchronisedProtection, comments.updateComment);
api.delete('/comments/:id', requireAuth, requireVerified, csrfSynchronisedProtection, comments.deleteComment);

api.get('/feed', requireAuth, blogs.feed);
api.get('/search', blogs.search);
api.get('/tags/:tag/blogs', blogs.tagBlogs);

api.put('/me/bookmarks/:blogId', requireAuth, requireVerified, csrfSynchronisedProtection, social.addBookmark);
api.delete('/me/bookmarks/:blogId', requireAuth, requireVerified, csrfSynchronisedProtection, social.removeBookmark);
api.get('/me/bookmarks', requireAuth, social.listBookmarks);

api.get('/notifications', requireAuth, social.listNotifications);
api.patch('/notifications/read-all', requireAuth, csrfSynchronisedProtection, social.readAllNotifications);
api.patch('/notifications/:id/read', requireAuth, csrfSynchronisedProtection, social.readNotification);

api.post('/uploads/inline', requireAuth, requireVerified, uploadLimiter, csrfSynchronisedProtection, imageUpload.single('image'), uploads.uploadInline);
api.post('/uploads/avatar', requireAuth, requireVerified, uploadLimiter, csrfSynchronisedProtection, imageUpload.single('avatar'), uploads.uploadAvatar);

api.post('/reports', requireAuth, requireVerified, reportLimiter, csrfSynchronisedProtection, moderation.createReport);
api.get('/admin/reports', requireAuth, requireVerified, requireAdmin, moderation.listReports);
api.get('/admin/reports/:id', requireAuth, requireVerified, requireAdmin, moderation.getReport);
api.patch('/admin/reports/:id', requireAuth, requireVerified, requireAdmin, csrfSynchronisedProtection, moderation.reviewReport);

export default api;
