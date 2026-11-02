import { isEmailConfigured, sendConfigurationTest, verifyEmailTransport } from '../services/emailService.js';

if (!isEmailConfigured()) {
  process.stderr.write('SMTP configuration is incomplete; no verification was attempted.\n');
  process.exitCode = 1;
} else try {
  await verifyEmailTransport();
  if (process.argv.includes('--send')) {
    const result = await sendConfigurationTest();
    if (!result.accepted) {
      const fields = [result.diagnostic?.code, result.diagnostic?.command, result.diagnostic?.responseCode].filter(Boolean).join(' ');
      process.stderr.write(`SMTP verified, but the test recipient was not accepted (${result.reason || 'send failed'}${fields ? `: ${fields}` : ''}).\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('SMTP verified and test message accepted by the SMTP server; inbox delivery is not confirmed.\n');
    }
  } else {
    process.stdout.write('SMTP connection verified.\n');
  }
} catch (error) {
  const message = `${error?.code || ''} ${error?.responseCode || ''}`;
  const category = /EAUTH|535|authentication/i.test(message) ? 'SMTP authentication failed.'
    : /ENOTFOUND|EAI_AGAIN|EDNS/i.test(message) ? 'SMTP host DNS lookup failed.'
      : /ECONNECTION|ECONNREFUSED|ETIMEDOUT|ESOCKET/i.test(message) ? 'SMTP server connection failed.'
        : 'SMTP verification failed.';
  process.stderr.write(`${category} Check the backend SMTP configuration.\n`);
  process.exit(1);
}
