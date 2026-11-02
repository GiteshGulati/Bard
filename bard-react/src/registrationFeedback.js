export function registrationEmailFeedback(result, email) {
  if (result?.verificationEmailSent === true) {
    return {
      accepted: true,
      message: `Bard’s mail server accepted a verification email for ${email.trim()}. Check your inbox and spam folder. SMTP acceptance does not guarantee inbox delivery.`,
    }
  }
  return {
    accepted: false,
    message: 'Your account was created, but the verification email could not be sent. You can request another verification email below.',
  }
}
