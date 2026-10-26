import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bard-test';
process.env.SESSION_SECRET = 'test-session-secret-12';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_MAX = '50';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `bard-uploads-${process.pid}`);
process.env.MONGOMS_DOWNLOAD_DIR = path.join(os.tmpdir(), 'bard-mongodb-binaries');
process.env.CLOUDINARY_CLOUD_NAME = 'bard-test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
