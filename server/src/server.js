import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';

const app = await createApp();
try {
  await connectDb();
} catch (error) {
  console.error(error.message);
  if (env.NODE_ENV === 'development' && error.diagnostic) {
    const { name, code, syscall, message } = error.diagnostic;
    console.error(`MongoDB underlying error: name=${name}; code=${code || 'none'}; syscall=${syscall || 'none'}; message=${message || 'none'}`);
  }
  process.exitCode = 1;
}

if (process.exitCode) process.exit(process.exitCode);

const server = app.listen(env.PORT, () => {
  console.log(`Bard API listening on http://127.0.0.1:${env.PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
