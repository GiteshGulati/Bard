import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { env, isTest } from '../config/env.js';
import { User } from '../models/User.js';
import { accountSuspended, badRequest, conflict, emailNotVerified, unauthorized } from '../utils/errors.js';
import { parse } from '../validators/common.js';
import { emailRequestSchema, loginSchema, passwordChangeSchema, registerSchema, resetPasswordSchema, tokenSchema } from '../validators/auth.js';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from './emailService.js';

const SALT_ROUNDS = 12;
let testRegistrationEmailDelivery = false;

// Lets API tests exercise the real registration delivery branch while keeping
// the existing fast, verified-account test fixture behavior by default.
export function setRegistrationEmailDeliveryForTests(enabled) {
  testRegistrationEmailDelivery = Boolean(enabled);
}

function looksLikeEmail(value) {
  return value.includes('@');
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const makeToken = () => randomBytes(32).toString('base64url');
const genericEmailResponse = 'If the address is associated with a Bard account, instructions will be sent shortly.';

async function deliver(send, user, token) {
  try {
    const result = await send(user, token);
    return result?.accepted === true
      ? { accepted: true, status: 'smtp_accepted' }
      : { accepted: false, status: 'failed', reason: result?.reason || 'recipient_not_accepted', diagnostic: result?.diagnostic };
  } catch {
    return { accepted: false, status: 'failed', reason: 'smtp_error' };
  }
}

export async function register(payload) {
  const data = parse(registerSchema, payload);
  const displayName = data.displayName || data.username;
  const existing = await User.findOne({
    $or: [{ username: data.username }, { emailNormalized: data.email }],
  });
  if (existing) throw conflict('An account cannot be created with those details');
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const skipVerification = isTest && !testRegistrationEmailDelivery;
  const token = makeToken();
  const user = await User.create({
    username: data.username,
    emailNormalized: data.email,
    passwordHash,
    displayName,
    emailVerified: skipVerification,
    emailVerificationTokenHash: skipVerification ? undefined : hashToken(token),
    emailVerificationExpiresAt: skipVerification ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const delivery = skipVerification
    ? { accepted: false, status: 'failed', reason: 'test_delivery_skipped' }
    : await deliver(sendVerificationEmail, user, token);
  return { user, verificationEmailSent: delivery.accepted, verificationEmailStatus: delivery.status, delivery };
}

export async function login(payload) {
  const data = parse(loginSchema, payload);
  const identifier = data.identifier.trim().toLowerCase();
  const query = looksLikeEmail(identifier) ? { emailNormalized: identifier } : { username: identifier };
  const user = await User.findOne(query).select('+passwordHash');
  if (!user) throw unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');
  if (user.moderationStatus === 'suspended') throw accountSuspended();
  if (!user.emailVerified) throw emailNotVerified();
  if (!user.sessionVersion) user.sessionVersion = 1;
  return user;
}

export async function verifyEmail(payload) {
  const { token } = parse(tokenSchema, payload);
  const user = await User.findOneAndUpdate({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
    emailVerified: false,
  }, { $set: { emailVerified: true }, $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 } }, { new: true });
  if (!user) throw badRequest('This verification link is invalid or has expired');
  if (env.EMAIL_SEND_WELCOME) await deliver(sendWelcomeEmail, user);
  return user;
}

export async function resendVerification(payload) {
  const { email } = parse(emailRequestSchema, payload);
  const user = await User.findOne({ emailNormalized: email, emailVerified: false });
  if (user) {
    const token = makeToken();
    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    await deliver(sendVerificationEmail, user, token);
  }
  return genericEmailResponse;
}

export async function requestPasswordReset(payload) {
  const { email } = parse(emailRequestSchema, payload);
  const user = await User.findOne({ emailNormalized: email });
  if (user) {
    const token = makeToken();
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await deliver(sendPasswordResetEmail, user, token);
  }
  return genericEmailResponse;
}

export async function resetPassword(payload) {
  const data = parse(resetPasswordSchema, payload);
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.findOneAndUpdate({
    passwordResetTokenHash: hashToken(data.token),
    passwordResetExpiresAt: { $gt: new Date() },
  }, { $set: { passwordHash }, $inc: { sessionVersion: 1 }, $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } }, { new: true });
  if (!user) throw badRequest('This password reset link is invalid or has expired');
  return true;
}

export async function changePassword(userId, payload) {
  const data = parse(passwordChangeSchema, payload);
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw unauthorized();
  const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!ok) throw badRequest('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await user.save();
}
