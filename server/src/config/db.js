import mongoose from 'mongoose';
import { env } from './env.js';

function nestedCodes(error) {
  const pending = [error];
  const visited = new Set();
  const codes = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    if (current.code !== undefined) codes.add(String(current.code));
    for (const key of ['cause', 'reason', 'error', 'servers']) {
      const nested = current[key];
      if (nested instanceof Map) pending.push(...[...nested.values()].map((entry) => entry?.error || entry));
      else if (nested && typeof nested === 'object') pending.push(nested);
    }
  }
  return codes;
}

function nestedSyscalls(error) {
  const pending = [error];
  const visited = new Set();
  const syscalls = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    if (current.syscall) syscalls.add(String(current.syscall));
    for (const key of ['cause', 'reason', 'error', 'servers']) {
      const nested = current[key];
      if (nested instanceof Map) pending.push(...[...nested.values()].map((entry) => entry?.error || entry));
      else if (nested && typeof nested === 'object') pending.push(nested);
    }
  }
  return syscalls;
}

function nestedErrors(error) {
  const pending = [{ error, depth: 0 }];
  const visited = new Set();
  const found = [];
  while (pending.length) {
    const { error: current, depth } = pending.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    found.push({ error: current, depth });
    for (const key of ['cause', 'reason', 'error', 'servers']) {
      const nested = current[key];
      if (nested instanceof Map) {
        for (const entry of nested.values()) pending.push({ error: entry?.error || entry, depth: depth + 1 });
      } else if (nested && typeof nested === 'object') {
        pending.push({ error: nested, depth: depth + 1 });
      }
    }
  }
  return found;
}

function safeDiagnosticMessage(message, uri) {
  let result = String(message || '').split('\n')[0];
  const secrets = [uri];
  try {
    const parsed = new URL(uri);
    secrets.push(decodeURIComponent(parsed.username), decodeURIComponent(parsed.password), parsed.hostname);
  } catch {
    // Keep the diagnostic useful even if the URI itself is malformed.
  }
  for (const secret of secrets.filter(Boolean)) result = result.replaceAll(secret, '[redacted]');
  return result;
}

export async function connectDb(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      dbName: 'bard',
      serverSelectionTimeoutMS: 10000,
    });
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  } catch (error) {
    const failures = nestedErrors(error);
    const codes = nestedCodes(error);
    const syscalls = nestedSyscalls(error);
    const code = [...codes][0] || '';
    const kind = codes.has('18') || codes.has('8000') || /authentication failed|bad auth/i.test(error?.message || '')
      ? 'authentication failed'
      : ['querySrv', 'queryTxt'].some((candidate) => syscalls.has(candidate)) || ['ENOTFOUND', 'EAI_AGAIN'].some((candidate) => codes.has(candidate))
        ? 'DNS SRV lookup failed'
        : [...codes].some((candidate) => candidate.startsWith('ERR_SSL_'))
          ? 'TLS negotiation failed'
          : error?.name === 'MongoParseError' || error?.name === 'MongoInvalidArgumentError'
            ? 'connection URI configuration is invalid'
            : ['ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH'].some((candidate) => codes.has(candidate)) || error?.name === 'MongoServerSelectionError' || error?.name === 'MongooseServerSelectionError'
              ? 'network connection failed or Atlas access is blocked'
              : 'database connection or index initialization failed';
    const safeError = new Error(`MongoDB ${kind}. Check MONGODB_URI, Atlas database access, and network access rules.`);
    safeError.name = 'MongoConnectionError';
    const underlying = failures
      .filter(({ error: item }) => item.code || item.syscall)
      .sort((a, b) => b.depth - a.depth)[0]?.error || error;
    safeError.code = underlying.code || code || 'MONGO_CONNECTION';
    safeError.diagnostic = {
      name: underlying.name || error.name || 'Error',
      code: underlying.code,
      syscall: underlying.syscall,
      message: safeDiagnosticMessage(underlying.message, uri),
    };
    throw safeError;
  }
}

export function activeDatabaseName() {
  return mongoose.connection.name;
}

mongoose.connection.on('error', (error) => {
  const codes = nestedCodes(error);
  const code = [...codes][0] || 'MONGO_CONNECTION';
  console.error(`MongoDB connection error (${code})`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection is unavailable');
});

export async function disconnectDb() {
  await mongoose.disconnect();
}
