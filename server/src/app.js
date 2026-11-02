import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const frontendDist = path.join(projectRoot, 'bard-react', 'dist');

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: isProd
      ? {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://res.cloudinary.com', 'https://i.pravatar.cc'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
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

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
