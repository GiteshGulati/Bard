import './setupEnv.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { startApp, stopApp, agent, csrf, register } from './helpers.js';
import { User } from '../src/models/User.js';
import { sendVerificationEmail, setEmailAdapterForTests } from '../src/services/emailService.js';
import { requestPasswordReset, resetPassword, setRegistrationEmailDeliveryForTests, verifyEmail } from '../src/services/authService.js';

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

  it('registers an account when the SMTP server accepts its verification recipient', async () => {
    const mails = [];
    setEmailAdapterForTests({ verify: async () => true, send: async (mail) => { mails.push(mail); return { accepted: [mail.to], rejected: [] }; } });
    setRegistrationEmailDeliveryForTests(true);
    try {
      const ag = agent();
      const token = await csrf(ag);
      const res = await ag.post('/api/v1/auth/register').set('x-csrf-token', token).send({
        username: 'acceptedmail', email: 'acceptedmail@example.com', password: 'Secret123', displayName: 'Accepted Mail',
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.verificationEmailSent, true);
      assert.equal(res.body.data.verificationEmailStatus, 'smtp_accepted');
      assert.match(res.body.data.message, /does not guarantee inbox delivery/);
      assert.equal(mails.length, 1);
      const rawToken = new URL(mails[0].text.split('\n').find((line) => line.startsWith('http'))).searchParams.get('token');
      const saved = await User.findOne({ username: 'acceptedmail' }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
      assert.equal(saved.emailVerified, false);
      assert.equal(saved.emailVerificationTokenHash, createHash('sha256').update(rawToken).digest('hex'));
      assert.ok(saved.emailVerificationExpiresAt > new Date());
    } finally {
      setRegistrationEmailDeliveryForTests(false);
      setEmailAdapterForTests(mockAdapter);
    }
  });

  it('captures only sanitized SMTP authentication diagnostics', async () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args);
    setEmailAdapterForTests({
      verify: async () => true,
      send: async () => { const error = new Error('auth failed for private@example.com'); error.code = 'EAUTH'; error.command = 'AUTH PLAIN'; error.responseCode = 535; error.response = 'private@example.com'; throw error; },
    });
    try {
      const result = await sendVerificationEmail({ emailNormalized: 'private@example.com', displayName: 'Private' }, 'sensitive-token');
      assert.equal(result.accepted, false);
      assert.deepEqual(result.diagnostic, { code: 'EAUTH', command: 'AUTH PLAIN', responseCode: 535 });
      assert.equal(JSON.stringify(warnings).includes('private@example.com'), false);
      assert.equal(JSON.stringify(warnings).includes('sensitive-token'), false);
    } finally {
      console.warn = originalWarn;
      setEmailAdapterForTests(mockAdapter);
    }
  });

  it('treats a rejected intended recipient as a failed send', async () => {
    setEmailAdapterForTests({ verify: async () => true, send: async () => ({ accepted: [], rejected: ['reject@example.com'] }) });
    try {
      const result = await sendVerificationEmail({ emailNormalized: 'reject@example.com', displayName: 'Reject' }, 'token');
      assert.deepEqual(result, { accepted: false, status: 'failed', reason: 'recipient_rejected' });
    } finally { setEmailAdapterForTests(mockAdapter); }
  });

  it('treats sendMail resolving without the intended accepted recipient as failure', async () => {
    setEmailAdapterForTests({ verify: async () => true, send: async () => ({ accepted: ['other@example.com'], rejected: [] }) });
    try {
      const result = await sendVerificationEmail({ emailNormalized: 'wanted@example.com', displayName: 'Wanted' }, 'token');
      assert.deepEqual(result, { accepted: false, status: 'failed', reason: 'recipient_not_accepted' });
    } finally { setEmailAdapterForTests(mockAdapter); }
  });

  it('keeps the account when registration email delivery fails and does not expose SMTP diagnostics', async () => {
    setEmailAdapterForTests({ verify: async () => true, send: async () => { const error = new Error('private transport detail'); error.code = 'EAUTH'; error.responseCode = 535; throw error; } });
    setRegistrationEmailDeliveryForTests(true);
    try {
      const ag = agent();
      const token = await csrf(ag);
      const res = await ag.post('/api/v1/auth/register').set('x-csrf-token', token).send({
        username: 'failedmail', email: 'failedmail@example.com', password: 'Secret123', displayName: 'Failed Mail',
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.verificationEmailSent, false);
      assert.equal(res.body.data.verificationEmailStatus, 'failed');
      assert.match(res.body.data.message, /account was created/i);
      assert.equal(JSON.stringify(res.body).includes('EAUTH'), false);
      assert.equal(JSON.stringify(res.body).includes('private transport detail'), false);
      assert.ok(await User.findOne({ username: 'failedmail' }));
    } finally {
      setRegistrationEmailDeliveryForTests(false);
      setEmailAdapterForTests(mockAdapter);
    }
  });

  it('resends verification with a fresh hashed token and a generic response', async () => {
    const mails = [];
    setEmailAdapterForTests({ verify: async () => true, send: async (mail) => { mails.push(mail); return { accepted: [mail.to], rejected: [] }; } });
    setRegistrationEmailDeliveryForTests(true);
    try {
      const ag = agent();
      const csrfToken = await csrf(ag);
      await ag.post('/api/v1/auth/register').set('x-csrf-token', csrfToken).send({ username: 'resendok', email: 'resendok@example.com', password: 'Secret123', displayName: 'Resend Ok' });
      const user = await User.findOne({ username: 'resendok' }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
      const originalHash = user.emailVerificationTokenHash;
      const resendCsrf = await csrf(ag);
      const response = await ag.post('/api/v1/auth/resend-verification').set('x-csrf-token', resendCsrf).send({ email: 'resendok@example.com' });
      assert.equal(response.status, 202);
      assert.match(response.body.data.message, /If the address is associated/);
      const updated = await User.findById(user._id).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
      assert.notEqual(updated.emailVerificationTokenHash, originalHash);
      const rawToken = new URL(mails.at(-1).text.split('\n').find((line) => line.startsWith('http'))).searchParams.get('token');
      assert.equal(updated.emailVerificationTokenHash, createHash('sha256').update(rawToken).digest('hex'));
      assert.ok(updated.emailVerificationExpiresAt > new Date());
    } finally {
      setRegistrationEmailDeliveryForTests(false);
      setEmailAdapterForTests(mockAdapter);
    }
  });

  it('keeps failed resend responses generic for known and unknown addresses', async () => {
    setEmailAdapterForTests({ verify: async () => true, send: async () => { const error = new Error('SMTP failure'); error.code = 'ECONNECTION'; throw error; } });
    try {
      const user = await User.create({ username: 'resendfail', emailNormalized: 'resendfail@example.com', passwordHash: 'unused', displayName: 'Resend Fail', emailVerified: false });
      const ag = agent();
      const results = [];
      for (const email of ['resendfail@example.com', 'missing-resend@example.com']) {
        const token = await csrf(ag);
        results.push(await ag.post('/api/v1/auth/resend-verification').set('x-csrf-token', token).send({ email }));
      }
      assert.equal(results[0].status, 202);
      assert.deepEqual(results[0].body.data, results[1].body.data);
      const updated = await User.findById(user._id).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
      assert.ok(updated.emailVerificationTokenHash);
      assert.ok(updated.emailVerificationExpiresAt > new Date());
    } finally { setEmailAdapterForTests(mockAdapter); }
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
