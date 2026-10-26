import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';
import { env, isProd, isTest } from './config/env.js';
import { loadUser } from './middleware/auth.js';
import { generalLimiter } from './middleware/rateLimits.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import api from './routes/index.js';
import { uploadRoot } from './services/uploadService.js';

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: isProd
      ? {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
        },
      }
      : false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use(generalLimiter);

  const sessionConfig = {
    name: 'bard.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
    },
  };

  if (!isTest) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      dbName: 'bard',
      collectionName: 'sessions',
      ttl: env.SESSION_DAYS * 24 * 60 * 60,
    });
  }

  app.use(session(sessionConfig));
  app.use(loadUser);

  app.use('/uploads', express.static(uploadRoot(), {
    fallthrough: false,
    index: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  app.use('/api/v1', api);
  app.use(notFoundHandler);

  const clientDist = path.resolve(process.cwd(), '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
