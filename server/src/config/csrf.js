import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body?._csrf,
});

export { csrfSynchronisedProtection };
export const generateCsrfToken = generateToken;
