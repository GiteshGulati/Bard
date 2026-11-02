# Troubleshooting

## Server exits with invalid environment configuration

The server validates settings during import/startup. Check the named variables in `server/.env` against [environment configuration](environment.md). Production requires the full Cloudinary and SMTP groups, `SESSION_SECRET` of at least 16 characters, and HTTPS `APP_BASE_URL`. Do not paste secrets into diagnostic output.

## MongoDB connection or health check fails

Check that MongoDB is running and that `MONGODB_URI` has a valid host, credentials and network access. Atlas users must allow the app's outbound address. `GET /api/v1/health` is 503 while the database is unavailable. The database name is fixed to `bard`.

## Browser reports CORS, session, or CSRF errors

Use the exact browser origin in `CLIENT_ORIGIN`; scheme, host and port must match. Requests must include credentials, and browser mutations must use the current token from `GET /api/v1/csrf-token` in the `X-CSRF-Token` header. Keep the frontend/API deployment compatible with Secure and SameSite=Lax session cookies. Do not disable CSRF protection to work around a token problem.

For a profile-picture upload, use the shared React API helper and send the file as `FormData` in the `avatar` field. Do not set the multipart `Content-Type` manually; the browser supplies its boundary. Confirm that the upload middleware order and valid session/CSRF token are in place, then check Cloudinary configuration and sanitized server errors. A `CSRF` 403 means the token/session pair was rejected; refresh the token through the API client rather than retrying indefinitely with a stale token.

## Verification or password reset email is not visible

Confirm all SMTP settings and sender authorization. Run `npm run email:verify` to test connection/authentication without sending; `npm run email:send-test` sends a real message to the SMTP account. Inspect sanitized server diagnostic fields and provider-side bounce/spam information. An SMTP-accepted message may still be delayed, filtered, or rejected downstream; API acceptance is not inbox delivery. Resend and password-reset endpoints intentionally return generic responses to avoid revealing account existence.

## Email verification link is invalid or expired

Verification links expire after 24 hours and are single-use. Request a new link with the resend action and use the newest message. The resend response is intentionally generic for privacy, so it does not confirm whether an account exists or whether SMTP accepted a specific send.

## Images fail to upload or old images fail to load

New images require all Cloudinary settings. Uploads validate actual image bytes and are limited to supported raster formats and configured request limits. Existing legacy images may still use `/uploads`; new files are not written there. Check Cloudinary account limits and server logs for sanitized failure details.

## Frontend routes return 404 in production

Build with `npm run build` before starting the server. Express serves the SPA fallback only when `bard-react/dist/index.html` exists. Ensure the deployment includes the build output and routes `/api/*` to the API.

## Session unexpectedly expires

Sessions last for `SESSION_DAYS` (default seven days) and are stored in MongoDB. A password reset invalidates existing sessions; a deleted user, suspended account or changed `sessionVersion` also causes the server to destroy the session. Confirm browser cookie settings, HTTPS in production, MongoDB session availability, and synchronized frontend/API origins.

## Cloudinary image operation fails

Confirm all three Cloudinary values are correct and belong to the intended account, then check account limits and provider availability. Bard hides provider exceptions from API callers and returns a generic upload failure; inspect server-side operational logs without sharing credentials. Blog media cleanup is retryable, so a deleted blog may take longer to finish provider cleanup during an outage.

## Tests fail before reaching assertions

Run `npm ci` at the repository root. The backend test suite uses MongoDB Memory Server and may need to download a MongoDB binary on first use. The root `npm test` builds React before tests; this satisfies the API static-serving prerequisite. See [testing](testing.md) for test scope and limitations.

## Nodemailer version is reported as invalid

The declared server dependency and root lockfile specify Nodemailer `7.0.13`. The current installed `node_modules` tree was observed with `10.3.1`, which `npm ls nodemailer -w server --depth=0` marks invalid. Check the active Node/npm installation and lockfile install state; in a controlled environment, reinstall with `npm ci` and rerun the listing command. Automated tests mock SMTP and cannot validate this installed package's compatibility with a real mail provider.

## Article or profile direct-route refresh fails

The Express SPA fallback is enabled only if `bard-react/dist/index.html` exists. Build the canonical frontend and serve the build with the API, or configure the hosting layer to route client-side paths to the app entry point while preserving `/api/*` routing. Do not point the app at the legacy `client/` output.
