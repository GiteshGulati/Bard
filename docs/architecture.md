# Architecture

Bard uses one Express application for the REST API and, after a client build, the static Vite output. During development, Vite proxies `/api` and `/uploads` to the API.

## Request path

1. Express applies Helmet, the configured CORS policy, request-size limits, and a general rate limit.
2. `express-session` uses MongoDB through `connect-mongo` outside test mode. The session cookie is HttpOnly and SameSite=Lax; it is Secure in production.
3. Mutating browser routes pass CSRF synchronisation middleware. Authentication and admin middleware load identity from the session and check ownership or role on the server.
4. Controllers validate and translate HTTP requests; service modules enforce business rules and work with Mongoose models.
5. DTO helpers define public and private API fields. Article content is normalized from Quill Delta and rendered through an allowlisted HTML sanitizer.

The browser session is maintained by the `bard.sid` HttpOnly cookie. The React API client includes credentials and obtains a synchronizer token from `GET /api/v1/csrf-token`; state-changing browser requests send it as `X-CSRF-Token`. Login verifies credentials and email status before assigning the session identity. Email verification and password reset use expiring random tokens whose SHA-256 hashes are stored in the user record.

## Frontend architecture

`bard-react/src/main.jsx` mounts React Strict Mode, `BrowserRouter`, `AuthProvider`, and `App`. `App.jsx` declares routes and simple auth/admin/guest route guards. The auth context owns the current user, session refresh and login/register/logout actions. `src/api.js` is the shared fetch client: it uses same-origin `/api/v1` paths, includes cookies, obtains CSRF tokens for writes, and normalizes API errors. Pages own feature-specific loading/error state; reusable components provide navigation and post/profile interactions. Most server state is fetched by the page or feature component; the app does not use a separate global data-fetching/cache library. Direct article/profile links are React routes backed by the Express SPA fallback in production.

The canonical client reads no `import.meta.env` values in its source; local API proxy paths and port are in `bard-react/vite.config.js`. It expects the API to be reachable at the same browser origin in production under the current Content Security Policy.

## Backend architecture

`server/src/app.js` configures Helmet/CSP, credentialed CORS, body size limits, rate limiting, MongoDB-backed sessions, current-user loading, legacy static uploads, API routes, SPA static serving and centralized error handling. `routes/index.js` orders rate-limit, session auth/verified/admin checks, CSRF, Multer and controller middleware. Controllers parse requests and shape responses; services contain business rules and coordinate Mongoose models and external SMTP/Cloudinary providers. Zod schemas live under `validators/`. Shared error helpers produce the JSON error envelope; public/private DTO helpers keep sensitive fields out of responses.

## Important workflows

- **Registration and verification:** registration validates uniqueness and password policy, creates an unverified user with a hash of a random 24-hour token, attempts SMTP delivery, then creates a session and returns the delivery acceptance status. Email failure does not roll back the account. Resend responses are generic and refresh the token/expiry for an existing unverified account.
- **Login and sessions:** credentials are checked before verification status; unverified users receive `EMAIL_NOT_VERIFIED`. A verified user receives a regenerated session with user ID and session version. `loadUser` checks suspension and session version on later requests.
- **Create and publish:** an authenticated verified author submits validated content and optional cover. The service stores Quill Delta and normalized/sanitized rendering fields. Draft/published state and visibility govern public lookup and feeds.
- **Read article:** public lookup enforces status/visibility; owner/admin ID lookup may expose their draft. The frontend article route loads by slug or authenticated ID and provides loading/error state.
- **Social and notification work:** verified members can like, comment, follow and bookmark. Like/comment/follow changes mark notification work pending; the periodic processor creates deduplicated notification records and retries pending work.
- **Avatar/media upload:** route authentication and verification precede CSRF and image parsing. Multer holds bounded bytes in memory; detected image type is validated, then Cloudinary returns an HTTPS asset URL and IDs which Bard records. Ownership/reference checks protect replacement and cleanup.
- **Delete and moderate:** blog deletion stores a unique persisted job, removes related database records idempotently, then retries Cloudinary asset cleanup if needed. Moderation applies a transaction on supported MongoDB topologies or records a pending idempotent operation and retries it.
- **Password reset:** forgot-password is generic for known/unknown email addresses. A valid one-hour token is hashed in MongoDB; consuming it updates the bcrypt hash, removes token fields, and increments session version to invalidate existing sessions.

## Data and uploads

Users, blogs, comments, likes, bookmarks, follows, notifications, reports, and pending blog-deletion jobs are separate collections. Unique compound indexes prevent duplicate likes, bookmarks, and follow relationships. Feed-like endpoints and comment lists use bounded cursor pagination.

Multer keeps bounded image uploads in memory only long enough to verify file signatures. The official Cloudinary SDK streams validated bytes to `bard/avatars`, `bard/covers`, or `bard/article-images`; a `CloudAsset` record stores owner, `public_id`, Cloudinary asset ID, and HTTPS `secure_url`. User and article records reference those asset documents. Replacement and deletion remove an asset only after checking that no user or article still references it and that the asset belongs to the owning account. Blog deletion uses a persisted retry job: database record deletion is idempotent and precedes Cloudinary cleanup, while failed external cleanup remains observable and retryable. Moderation uses MongoDB transactions on replica-set/sharded deployments and a persisted idempotent review record when the active topology does not support transactions. Existing local images remain available from the legacy `/uploads` route; new uploads are never written to local disk.

## Trust boundaries

The browser never supplies trusted roles, passwords are bcrypt-hashed, sessions stay server-side, and public DTOs omit email and password data. Every owned resource mutation checks ownership in a service/controller, while moderation routes require an administrator session. Uploaded media is restricted to detected JPEG, PNG, WebP, and GIF files.

## Runtime and background work

`server/src/server.js` connects to MongoDB before listening. It processes pending notifications, moderation reviews and blog deletions on startup and every 30 seconds. These jobs persist retry state so transient external cleanup or database errors can be retried after restart. The `/api/v1/health` endpoint reports MongoDB readiness; it is not a check of SMTP or Cloudinary connectivity. In production the server serves `bard-react/dist` if a build is present; root `npm test` includes a build before API tests.
