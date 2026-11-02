# Bard

Bard is an editorial blog sharing platform: **a place for words, not clout.** The canonical frontend is the React/Vite application in `bard-react/`; the Express/Mongoose API serves its production build and stores sessions in MongoDB.

## Prerequisites

- Node.js 20 or newer and npm
- MongoDB 6+ locally or a MongoDB Atlas connection string

## Setup

1. Clone the repository using its Git URL and enter the checkout:

   ```sh
   git clone <repository-url>
   cd Bard
   ```

   Replace `<repository-url>` with the URL provided for your Bard checkout.

2. Install dependencies from the repository root:

   ```sh
   npm ci
   ```

3. Copy `.env.example` to `server/.env` (for example, `cp .env.example server/.env`), then set `MONGODB_URI`, `SESSION_SECRET` (at least 16 characters), and valid Cloudinary credentials. Cloudinary is required in development as well as production. SMTP can be omitted in development, but all SMTP variables are required in production. For production, use HTTPS for `APP_BASE_URL`. Use unique random values for secrets. See the [environment reference](docs/environment.md); the template's integration placeholders must be replaced before startup.

4. Start a local MongoDB service, or configure `MONGODB_URI` for an Atlas deployment. Then run the React client and API:

   ```sh
   npm run dev
   ```

   Vite serves the React app at http://localhost:5173 and proxies `/api` and `/uploads` to Express at http://localhost:3000. The older `client/` app remains a standalone legacy frontend and is not started or built by the root scripts.

To run either process separately from the repository root, use `npm run dev -w server` and `npm run dev -w bard-react` in separate terminals. Frontend lint is `npm run lint -w bard-react`.

Production build and server (run from the repository root):

```sh
npm run build
npm start
```

To run the quality checks, use `npm test` and `npm run lint -w bard-react` from the root. `npm test` builds the app and runs both automated suites. The frontend suite uses Node's test runner and mocked fetch/SSR tests rather than browser automation.

The root build creates `bard-react/dist`; Express serves that exact directory, including direct React routes and asset requests. Unknown `/api/v1` paths remain JSON API 404 responses. Set `NODE_ENV=production`, use HTTPS, set `CLIENT_ORIGIN` to the actual browser origin (including when the frontend is served by Express), and configure a durable MongoDB deployment plus all three Cloudinary variables. MongoDB application data and sessions use the `bard` database. New image uploads always go to Cloudinary; `/uploads` remains available only for existing local images.

## Features

- Registration/login/logout, persistent HttpOnly sessions, CSRF protection, profile and password settings.
- Email verification after registration, generic forgot-password responses, one-time expiring password-reset links, and optional post-verification welcome email. Set `EMAIL_SEND_WELCOME=true` to enable the welcome message.
- React story authoring with a live preview, cover uploads, and tagged publishing.
- Public home/explore/search/tag and author pages, article reading, related articles, and pagination.
- Likes, threaded comments, follows, followed-author feed, private bookmarks, and in-app notifications.
- Reporting and protected admin moderation queue. Admin role must be granted by a trusted database operator; no request field can grant it.
- Raster image validation by file contents, Cloudinary backed avatar/cover/inline uploads, request validation, rate limits, Helmet, and sanitized article rendering. Existing local images remain available through the legacy static route.

## Technology and product direction

- **Frontend:** React 19, React Router 7, Vite 8 (`bard-react/`).
- **API:** Node.js 20+, Express 4, Zod validation.
- **Data and sessions:** MongoDB with Mongoose 8; server-side sessions stored in MongoDB with `connect-mongo`.
- **Authentication:** bcrypt passwords, HttpOnly session cookies, CSRF synchronizer tokens, email verification and one-time password reset.
- **Media and email:** Cloudinary for new images; Nodemailer over SMTP for transactional mail.
- **Quality tooling:** Vite production builds, Oxlint, Node's built-in test runner, Supertest and MongoDB Memory Server.

Bard's stated product direction is a quieter place for long-form writing and mindful living, with community features available without making engagement counts the product's focus. The homepage calls its topic cards “Trending Topics”, but those cards are curated static frontend data; there is no trending-ranking API. No current application screenshots are maintained in the repository; [hero.png](bard-react/src/assets/hero.png) is an app asset, not a verified screenshot.

## Useful commands

- `npm run dev` — run client and API in development.
- `npm run build` — build the client.
- `npm test` — build the React app, run frontend tests, then run API integration tests against an isolated in-memory MongoDB.
- `npm run seed` — optional explicit development seed; requires `SEED_DEMO=true` and seed settings in `.env`.

## API

All API routes use `/api/v1`. `GET /health` checks the API process; auth, users, blogs, search, feed, social, notifications, uploads, reports, and admin report endpoints are implemented in `server/src/routes/index.js`. Browser writes require the CSRF token from `GET /api/v1/csrf-token`; the client handles this automatically. Session cookies are server managed and stored in MongoDB outside test mode.

## Project layout

- `bard-react/` — canonical React/Vite application used by root development and production scripts.
- `client/` — legacy standalone vanilla JavaScript/Vite application; not served by Express.
- `server/src/` — Express app, configuration, Mongoose models, controllers, services, validation, and middleware.
- `server/tests/` — API integration and security tests using `mongodb-memory-server`.
- `uploads/` — local development upload storage (ignored by Git).

More detail: [documentation index](docs/README.md), [architecture](docs/architecture.md), [API routes](docs/api.md), [environment reference](docs/environment.md), [data model](docs/data-model.md), [operations](docs/operations.md), [troubleshooting](docs/troubleshooting.md), [testing](docs/testing.md), and [contributing](docs/contributing.md).

## Email account policy

New accounts must verify their email before they can create, edit, or delete articles; upload inline images; comment; like; follow; bookmark; or submit reports. Registration starts a session, so an unverified user can read public content, edit their profile, change their password, and request another verification email in that session. Login rejects unverified accounts until verification is complete. Verification and password-reset tokens are random, expire after 24 hours and one hour respectively, are stored only as SHA-256 hashes, and are consumed on use. Resetting a password invalidates existing sessions. Forgot-password and resend-verification endpoints return the same generic response whether an account exists or not.

Run `npm run email:verify` to check SMTP connectivity without sending a message. `npm run email:send-test` also sends a test message to the configured SMTP account. Both commands report sanitized status only.

API and UI verification commands are `npm test` and `npm run build`. Tests use MongoDB Memory Server; its MongoDB binary may need network access the first time. SMTP can be checked with `npm run email:verify` and a real test message sent to the configured SMTP account with `npm run email:send-test`.
