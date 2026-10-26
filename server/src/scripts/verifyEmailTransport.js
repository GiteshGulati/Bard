import { isEmailConfigured, sendConfigurationTest, verifyEmailTransport } from '../services/emailService.js';

if (!isEmailConfigured()) {
  process.stderr.write('SMTP configuration is incomplete; no verification was attempted.\n');
  process.exitCode = 1;
} else try {
  await verifyEmailTransport();
  if (process.argv.includes('--send')) await sendConfigurationTest();
  process.stdout.write(process.argv.includes('--send') ? 'SMTP verified and test message accepted for delivery to the configured SMTP account.\n' : 'SMTP connection verified.\n');
} catch (error) {
  const message = `${error?.code || ''} ${error?.responseCode || ''}`;
  const category = /EAUTH|535|authentication/i.test(message) ? 'SMTP authentication failed.'
    : /ENOTFOUND|EAI_AGAIN|EDNS/i.test(message) ? 'SMTP host DNS lookup failed.'
      : /ECONNECTION|ECONNREFUSED|ETIMEDOUT|ESOCKET/i.test(message) ? 'SMTP server connection failed.'
        : 'SMTP verification failed.';
  process.stderr.write(`${category} Check the backend SMTP configuration.\n`);
  process.exit(1);
}
