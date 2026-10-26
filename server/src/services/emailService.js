import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let testAdapter = null;
let transporter = null;

export function setEmailAdapterForTests(adapter) { testAdapter = adapter; }
export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM_NAME && env.EMAIL_FROM_ADDRESS && env.SMTP_SECURE !== undefined);
}

function getTransporter() {
  if (!isEmailConfigured()) throw new Error('SMTP is not configured');
  if (!transporter) transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    dnsTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return transporter;
}

export async function verifyEmailTransport() {
  if (testAdapter) return testAdapter.verify();
  const current = getTransporter();
  let timer;
  try {
    return await Promise.race([
      current.verify(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          current.close();
          const error = new Error('SMTP verification timed out');
          error.code = 'ETIMEDOUT';
          reject(error);
        }, 15000);
      }),
    ]);
  } catch (error) {
    current.close();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function frame(title, message, link, action) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeLink = escapeHtml(link);
  const safeAction = escapeHtml(action);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${safeTitle}</title></head><body style="margin:0;background:#f6f3ee;color:#26221e;font:16px/1.6 Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-radius:12px"><p style="color:#876044;font-weight:bold;letter-spacing:.12em">BARD</p><h1 style="font-size:26px;line-height:1.25">${safeTitle}</h1><p>${safeMessage}</p><p><a href="${safeLink}" style="display:inline-block;padding:12px 20px;background:#332820;color:#fff;text-decoration:none;border-radius:6px">${safeAction}</a></p><p style="font-size:14px;color:#655d55">If the button does not work, copy this link into your browser:<br><a href="${safeLink}">${safeLink}</a></p><p style="font-size:14px;color:#655d55">If you did not request this, you can ignore this message.</p></main></body></html>`;
}

async function send({ to, subject, title, message, url, action, text }) {
  const mail = {
    from: { name: env.EMAIL_FROM_NAME || 'Bard', address: env.EMAIL_FROM_ADDRESS || 'no-reply@example.invalid' },
    to,
    subject,
    text: `${text}\n\n${url}\n\nIf you did not request this, you can ignore this message.`,
    html: frame(title, message, url, action),
  };
  if (testAdapter) return testAdapter.send(mail);
  return getTransporter().sendMail(mail);
}

function link(path, token) {
  const url = new URL(path, env.APP_BASE_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

export function sendVerificationEmail(user, token) {
  const url = link('/verify-email', token);
  return send({ to: user.emailNormalized, subject: 'Verify your Bard email', title: 'Verify your email', message: `Hello ${user.displayName}, confirm your email address to unlock writing and community features. This link expires in 24 hours.`, url, action: 'Verify email', text: `Hello ${user.displayName}, verify your email to unlock Bard writing and community features. This link expires in 24 hours.` });
}

export function sendPasswordResetEmail(user, token) {
  const url = link('/reset-password', token);
  return send({ to: user.emailNormalized, subject: 'Reset your Bard password', title: 'Reset your password', message: 'We received a request to reset your Bard password. This secure link expires in one hour.', url, action: 'Choose a new password', text: 'We received a request to reset your Bard password. This link expires in one hour.' });
}

export function sendWelcomeEmail(user) {
  const url = new URL('/', env.APP_BASE_URL).toString();
  return send({ to: user.emailNormalized, subject: 'Welcome to Bard', title: 'Welcome to Bard', message: `Your email is verified. Welcome, ${user.displayName}.`, url, action: 'Visit Bard', text: `Your email is verified. Welcome, ${user.displayName}.` });
}

export async function sendConfigurationTest() {
  const user = { emailNormalized: env.SMTP_USER, displayName: 'Bard email check' };
  return send({ to: user.emailNormalized, subject: 'Bard SMTP delivery check', title: 'SMTP delivery check', message: 'This message confirms Bard can send email through its configured SMTP server.', url: new URL('/', env.APP_BASE_URL).toString(), action: 'Open Bard', text: 'This message confirms Bard can send email through its configured SMTP server.' });
}
