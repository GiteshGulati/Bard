# Environment configuration

The server loads `server/.env` (the repository template is [.env.example](../.env.example)). Copy the template to `server/.env`; do not commit the populated file. Values below reflect `server/src/config/env.js`. Boolean values should be written as `true` or `false`.

The canonical React app currently reads no `import.meta.env` configuration. In development, Vite proxies `/api` and `/uploads` to `http://localhost:3000`; in production, the current frontend and API are expected to share an origin unless CSP and deployment routing are intentionally updated.

## Core settings

| Variable | Required/default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | One of `development`, `test`, or `production`. |
| `PORT` | `3000` | HTTP listen port. |
| `MONGODB_URI` | Required | MongoDB connection string. |
| `MONGODB_DB_NAME` | `bard` | Must be exactly `bard`; session storage also uses this database. |
| `SESSION_SECRET` | Required, 16+ characters | Signs session cookies. Use a long unique random secret. |
| `CSRF_SECRET` | Optional, 16+ characters if set | Accepted and length-validated by the environment schema. The current CSRF setup does not pass this value into `csrf-sync`; do not assume changing it rotates the active CSRF secret. |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Exact browser origin allowed by credentialed CORS. |
| `APP_BASE_URL` | `http://localhost:5173` | Origin used to build verification and password-reset links. Must be HTTPS in production. |
| `UPLOAD_DIR` | `uploads` | Legacy local upload/static path. New images are stored in Cloudinary. |
| `SESSION_DAYS` | `7` | Session cookie and MongoDB session lifetime in days. |

## Cloudinary

| Variable | Required/default | Purpose |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Required outside test mode | Cloud account name. |
| `CLOUDINARY_API_KEY` | Required outside test mode | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Required outside test mode | Cloudinary API secret. |

Configure all three together. Partial configuration is rejected. Keep the API secret server-side only.

## Email

The complete SMTP group is optional in development, but required in production. If one email setting is provided, all must be configured.

| Variable | Example/default | Purpose |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | `465` | SMTP port. |
| `SMTP_SECURE` | `true` | Use TLS from connection start (typical for port 465). |
| `SMTP_USER` | No default | SMTP login/account. |
| `SMTP_PASS` | No default | SMTP password or provider app password. |
| `EMAIL_FROM_NAME` | `Bard` | Sender display name. |
| `EMAIL_FROM_ADDRESS` | No default | Sender email address. |
| `EMAIL_SEND_WELCOME` | `false` | Send optional welcome message after verification. |

For Gmail, use SMTP with a Google app password where available. The app uses Nodemailer SMTP; it does not use OAuth or the Gmail API. Successful SMTP acceptance confirms the provider accepted a message for processing, not that it reached the inbox.

## Rate limits and optional seed values

| Variable | Default | Purpose |
| --- | --- | --- |
| `AUTH_RATE_MAX` | `20` | Auth request limit per IP per 15 minutes. |
| `COMMENT_RATE_MAX` | `40` | Comment request limit; 10-minute window. |
| `UPLOAD_RATE_MAX` | `30` | Upload request limit; 10-minute window. |
| `REPORT_RATE_MAX` | `15` | Report request limit; 15-minute window. |
| `EMAIL_RATE_MAX` | `5` | Verification and password-reset request limit per IP per 15 minutes. |
| `SEED_DEMO` | `false` | Must be set to `true` to enable the explicit seed command. |
| `ADMIN_SEED_USERNAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Empty | Optional seed identity fields; only use in isolated development data. |

The general API limiter is fixed at 300 requests per IP per 15 minutes. The seed variables are consumed by the seed script, not the server environment validator. Never reuse production credentials or secrets in local examples.
