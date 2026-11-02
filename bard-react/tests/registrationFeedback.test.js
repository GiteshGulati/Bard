import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { registrationEmailFeedback } from '../src/registrationFeedback.js';

describe('registration verification feedback', () => {
  it('explains that an account exists when verificationEmailSent is false and keeps resend available', () => {
    const feedback = registrationEmailFeedback({ verificationEmailSent: false }, 'writer@example.com');
    assert.equal(feedback.accepted, false);
    assert.match(feedback.message, /account was created/i);
    assert.match(feedback.message, /request another verification email/i);
  });

  it('describes SMTP acceptance without claiming inbox delivery', () => {
    const feedback = registrationEmailFeedback({ verificationEmailSent: true }, 'writer@example.com');
    assert.equal(feedback.accepted, true);
    assert.match(feedback.message, /accepted a verification email/);
    assert.match(feedback.message, /does not guarantee inbox delivery/);
  });
});
