import './setupEnv.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { startApp, stopApp, agent, csrf, register } from './helpers.js';
import { User } from '../src/models/User.js';
import { setEmailAdapterForTests } from '../src/services/emailService.js';
import { requestPasswordReset, resetPassword, verifyEmail } from '../src/services/authService.js';

let server;
const mockAdapter = { verify: async () => true, send: async () => ({ messageId: 'mock-only' }) };
before(async () => { setEmailAdapterForTests(mockAdapter); server = await startApp(); });
after(async () => { setEmailAdapterForTests(null); await stopApp(); });

describe('transactional email flows', () => {
  it('verifies SMTP using the configured test adapter', async () => {
    let checks = 0;
    setEmailAdapterForTests({ verify: async () => { checks += 1; return true; }, send: async () => ({ messageId: 'mock-only' }) });
    const { verifyEmailTransport } = await import('../src/services/emailService.js');
    assert.equal(await verifyEmailTransport(), true);
    assert.equal(checks, 1);
    setEmailAdapterForTests(mockAdapter);
  });

  it('returns the same generic forgot-password response for known and unknown addresses', async () => {
    const ag = agent();
    await register(ag, { username: 'mailuser', email: 'mailuser@example.com' });
    const results = [];
    for (const email of ['mailuser@example.com', 'absent@example.com']) {
      const token = await csrf(ag);
      results.push(await ag.post('/api/v1/auth/forgot-password').set('x-csrf-token', token).send({ email }));
    }
    assert.equal(results[0].status, 202);
    assert.equal(results[1].status, 202);
    assert.deepEqual(results[0].body.data, results[1].body.data);
    assert.match(results[0].body.data.message, /If the address is associated/);
  });

  it('allows unverified members to read and manage their profile but blocks community publishing', async () => {
    const ag = agent();
    const { user } = await register(ag, { username: 'unverified', email: 'unverified@example.com' });
    await User.updateOne({ _id: user.id }, { $set: { emailVerified: false } });
    assert.equal((await ag.get('/api/v1/auth/me')).status, 200);
    const token = await csrf(ag);
    const create = await ag.post('/api/v1/blogs').set('x-csrf-token', token).send({ title: 'Blocked', status: 'published', content: { ops: [{ insert: 'Nope.\n' }] } });
    assert.equal(create.status, 403);
  });

  it('rejects invalid, expired, and already-used verification tokens', async () => {
    const user = await User.create({ username: 'verifyuser', emailNormalized: 'verifyuser@example.com', passwordHash: 'unused', displayName: 'Verify User', emailVerified: false });
    await assert.rejects(verifyEmail({ token: 'A'.repeat(43) }), /invalid or has expired/);
    const expired = 'expired-token-value-that-is-long-enough-123456';
    user.emailVerificationTokenHash = createHash('sha256').update(expired).digest('hex');
    user.emailVerificationExpiresAt = new Date(Date.now() - 1000);
    await user.save();
    await assert.rejects(verifyEmail({ token: expired }), /invalid or has expired/);
    const valid = 'valid-token-value-that-is-long-enough-123456789';
    user.emailVerificationTokenHash = createHash('sha256').update(valid).digest('hex');
    user.emailVerificationExpiresAt = new Date(Date.now() + 60000);
    await user.save();
    await verifyEmail({ token: valid });
    await assert.rejects(verifyEmail({ token: valid }), /invalid or has expired/);
    const refreshed = await User.findById(user._id);
    assert.equal(refreshed.emailVerified, true);
    assert.equal(refreshed.emailVerificationTokenHash, undefined);
  });

  it('rejects expired and malformed reset tokens', async () => {
    const user = await User.create({ username: 'expiredreset', emailNormalized: 'expiredreset@example.com', passwordHash: 'unused', displayName: 'Expired Reset', emailVerified: true });
    const expired = 'expired-reset-token-value-that-is-long-12345';
    user.passwordResetTokenHash = createHash('sha256').update(expired).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() - 1000);
    await user.save();
    await assert.rejects(resetPassword({ token: expired, password: 'ChangedPass456' }), /invalid or has expired/);
    await assert.rejects(resetPassword({ token: 'bad', password: 'ChangedPass456' }));
  });

  it('rate-limits repeated verification token attempts', async () => {
    const ag = agent();
    let last;
    for (let i = 0; i < 7; i += 1) {
      const csrfToken = await csrf(ag);
      last = await ag.post('/api/v1/auth/verify-email').set('x-csrf-token', csrfToken).send({ token: `invalid-verification-token-${i}-12345678901234567890` });
    }
    assert.equal(last.status, 429);
  });

  it('sends reset mail through the adapter and consumes reset tokens only once, invalidating prior sessions', async () => {
    const mails = [];
    setEmailAdapterForTests({ verify: async () => true, send: async (mail) => { mails.push(mail); return { messageId: 'mock-only' }; } });
    const ag = agent();
    await register(ag, { username: 'resetuser', email: 'resetuser@example.com' });
    const token = await csrf(ag);
    const result = await ag.post('/api/v1/auth/forgot-password').set('x-csrf-token', token).send({ email: 'resetuser@example.com' });
    assert.equal(result.status, 202);
    assert.equal(mails.length, 1);
    assert.match(mails[0].html, /Reset your password/);
    assert.ok(mails[0].text);
    const rawToken = new URL(mails[0].text.split('\n').find((line) => line.startsWith('http'))).searchParams.get('token');
    assert.ok(rawToken);
    const before = await User.findOne({ username: 'resetuser' }).select('+passwordHash');
    const oldHash = before.passwordHash;
    await resetPassword({ token: rawToken, password: 'ChangedPass456' });
    await assert.rejects(resetPassword({ token: rawToken, password: 'ChangedPass789' }), /invalid or has expired/);
    const updated = await User.findById(before._id).select('+passwordHash');
    assert.notEqual(updated.passwordHash, oldHash);
    assert.equal(updated.sessionVersion, 2);
    assert.equal((await ag.get('/api/v1/auth/me')).status, 401);
    setEmailAdapterForTests(mockAdapter);
  });

  it('rate-limits repeated verification mail requests', async () => {
    const ag = agent();
    let last;
    for (let i = 0; i < 7; i += 1) {
      const token = await csrf(ag);
      last = await ag.post('/api/v1/auth/resend-verification').set('x-csrf-token', token).send({ email: 'nobody@example.com' });
    }
    assert.equal(last.status, 429);
  });
});
