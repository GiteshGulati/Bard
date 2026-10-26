import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { privateUser } from '../utils/dto.js';
import { User } from '../models/User.js';
import { unauthorized } from '../utils/errors.js';

function regenerate(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

export const register = asyncHandler(async (req, res) => {
  const { user, verificationEmailSent } = await authService.register(req.body);
  await regenerate(req);
  req.session.userId = String(user._id);
  req.session.sessionVersion = user.sessionVersion || 1;
  await saveSession(req);
  res.status(201).json({ success: true, data: { user: privateUser(user), verificationEmailSent, message: 'Account created. Verify your email to unlock writing and community features.' } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  await regenerate(req);
  req.session.userId = String(user._id);
  req.session.sessionVersion = user.sessionVersion || 1;
  await saveSession(req);
  const safe = await User.findById(user._id);
  res.json({ success: true, data: { user: privateUser(safe) } });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  res.json({ success: true, data: { user: privateUser(user), message: 'Email verified.' } });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const message = await authService.resendVerification(req.body);
  res.status(202).json({ success: true, data: { message } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const message = await authService.requestPasswordReset(req.body);
  res.status(202).json({ success: true, data: { message } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ success: true, data: { message: 'Password reset. Sign in with your new password.' } });
});

export const logout = asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  res.clearCookie('bard.sid');
  res.json({ success: true, data: { ok: true } });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.session?.userId) throw unauthorized();
  const user = await User.findById(req.session.userId);
  if (!user) throw unauthorized();
  res.json({ success: true, data: { user: privateUser(user) } });
});
