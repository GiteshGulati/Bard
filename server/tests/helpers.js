import './setupEnv.js';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { User, Blog, Comment, Like, Bookmark, Follow, Notification, Report, CloudAsset } from '../src/models/index.js';

let mongod;
let app;
let httpServer;

export async function startApp() {
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri());
  app = await createApp();
  httpServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    httpServer.once('listening', resolve);
    httpServer.once('error', reject);
  });
  return httpServer;
}

export async function stopApp() {
  await Promise.all([
    User.deleteMany({}),
    Blog.deleteMany({}),
    Comment.deleteMany({}),
    Like.deleteMany({}),
    Bookmark.deleteMany({}),
    Follow.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
    CloudAsset.deleteMany({}),
  ]);
  if (httpServer?.listening) await new Promise((resolve, reject) => httpServer.close((err) => err ? reject(err) : resolve()));
  await disconnectDb();
  if (mongod) await mongod.stop();
}

export function agent() {
  return request.agent(httpServer);
}

export async function csrf(ag) {
  const res = await ag.get('/api/v1/csrf-token');
  return res.body.data.csrfToken;
}

export async function register(ag, overrides = {}) {
  const token = await csrf(ag);
  const body = {
    username: 'reader',
    email: 'reader@example.com',
    password: 'Secret123',
    displayName: 'Reader',
    ...overrides,
  };
  const res = await ag.post('/api/v1/auth/register').set('x-csrf-token', token).send(body);
  return { res, token: await csrf(ag), user: res.body.data?.user };
}

export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
