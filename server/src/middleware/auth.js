import { User } from '../models/User.js';
import { unauthorized, forbidden } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function requireAuth(req, _res, next) {
  if (!req.user) throw unauthorized();
  next();
}

export const loadUser = asyncHandler(async (req, _res, next) => {
  if (!req.session?.userId) return next();
  const user = await User.findById(req.session.userId);
  if (!user) {
    req.session.userId = undefined;
    return next();
  }
  const currentVersion = user.sessionVersion || 1;
  if (req.session.sessionVersion === undefined && currentVersion === 1) req.session.sessionVersion = 1;
  if (req.session.sessionVersion !== currentVersion) {
    req.session.destroy(() => {});
    return next();
  }
  req.user = user;
  next();
});

export function requireAdmin(req, _res, next) {
  if (!req.user) throw unauthorized();
  if (req.user.role !== 'admin') throw forbidden('Administrator access required');
  next();
}

export function requireVerified(req, _res, next) {
  if (!req.user) throw unauthorized();
  if (!req.user.emailVerified) throw forbidden('Verify your email before using this feature');
  next();
}

export const optionalAuth = loadUser;
