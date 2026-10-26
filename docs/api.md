# API

Base path: `/api/v1`. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "message", "code", "details?" } }`.

## Routes

- **Health and CSRF:** `GET /health`, `GET /csrf-token`
- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- **Users:** `GET /users/:username`, `PATCH /users/me`, `PATCH /users/me/password`, `GET /users/:username/blogs`, `GET /users/:username/followers`, `GET /users/:username/following`, `PUT|DELETE /users/:userId/follow`
- **Blogs:** `GET /blogs`, `POST /blogs`, `GET /blogs/:slug`, `GET /blogs/id/:id` (owner/admin draft lookup), `PATCH|DELETE /blogs/:id`, `GET /blogs/:id/related`, `GET /feed`, `GET /search`, `GET /tags/:tag/blogs`
- **Comments and likes:** `PUT|DELETE /blogs/:id/like`, `GET|POST /blogs/:id/comments`, `PATCH|DELETE /comments/:id`
- **Bookmarks:** `GET /me/bookmarks`, `PUT|DELETE /me/bookmarks/:blogId`
- **Notifications:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- **Uploads:** `POST /uploads/inline`, `POST /uploads/avatar`; profile `PATCH /users/me` accepts an `avatar` multipart field and article create/update accepts a `cover` multipart field. Upload responses include an HTTPS URL, Cloudinary public ID and provider asset ID, plus the database asset ID.
- **Reports and administration:** `POST /reports`, `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id`

Browser mutation requests send the session cookie and `X-CSRF-Token` received from `/csrf-token`. The frontend API module handles both automatically. Collection responses expose `items` and `nextCursor`; `limit` is capped at 50. Public article feeds exclude drafts and unlisted posts, while an unlisted article remains reachable by its share URL.

Verification and password-reset requests use one-time tokens stored as hashes. Forgot-password and resend-verification responses are generic for known and unknown accounts. Email flows are rate-limited. SMTP configuration is checked with the private CLI command `npm run email:verify`; no public SMTP test route exists.
