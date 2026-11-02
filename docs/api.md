# API reference

Base path: `/api/v1`. Routes are registered in `server/src/routes/index.js`. Successful controller responses generally use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "message", "code", "details?" } }`. Exact fields vary by endpoint and DTO.

`Auth` means a session is required. `Verified` also requires a verified email. `Admin` requires a verified administrator account. Browser state-changing requests require the CSRF token unless specified otherwise.

## Health, CSRF, and authentication

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | API and MongoDB readiness; 503 if database is unavailable. |
| `GET /csrf-token` | Browser | Creates/returns a CSRF token for this cookie session. |
| `POST /auth/register` | Public + CSRF | Create an account and attempt verification email delivery. |
| `POST /auth/login` | Public + CSRF | Authenticate; unverified users receive `EMAIL_NOT_VERIFIED`. |
| `POST /auth/logout` | CSRF | Destroy the current session. |
| `GET /auth/me` | Auth | Current user/session state. |
| `POST /auth/verify-email` | Public + CSRF | Consume a valid email-verification token. |
| `POST /auth/resend-verification` | Public + CSRF | Request another verification email; response is generic for account privacy. |
| `POST /auth/forgot-password` | Public + CSRF | Request a password-reset email; response is generic. |
| `POST /auth/reset-password` | Public + CSRF | Consume a valid reset token and change password. |

Auth and email routes use rate limiters. Verification/reset links are one-time and expire; resend/reset requests do not reveal whether an arbitrary address belongs to an account.

### Authentication payloads and outcomes

JSON request bodies are used except where a route documents multipart upload. Registration accepts `username`, `email`, `password` and optional `displayName`; login accepts `identifier` (email or username) and `password`. Passwords must be 8–72 characters and contain a letter and number. Usernames are 3–20 letters/numbers/underscores. Verification accepts `{ "token": "…" }`; resend and forgot-password accept `{ "email": "…" }`; reset accepts `{ "token": "…", "password": "…" }`.

Registration returns HTTP 201 with `data.user`, `data.verificationEmailSent`, `data.verificationEmailStatus`, and a human-readable `data.message`. `verificationEmailSent` means the intended address was accepted by SMTP; it does not mean inbox delivery. Login returns the signed-in user on success; unverified accounts receive HTTP 403 and error code `EMAIL_NOT_VERIFIED` before a session is created. Resend/forgot-password return HTTP 202 with a generic message regardless of whether the account exists. Invalid payloads use HTTP 422 with validation details; CSRF failures use HTTP 403/code `CSRF`.

## Users and social relationships

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /users/:username` | Public | Public profile. |
| `GET /users/:username/blogs` | Public | Author's visible posts. |
| `GET /users/:username/followers` | Public | Paginated followers. |
| `GET /users/:username/following` | Public | Paginated followed accounts. |
| `PATCH /users/me` | Auth + CSRF | Update own profile; multipart `avatar` is optional. |
| `PATCH /users/me/password` | Auth + CSRF | Change own password. |
| `PUT /users/:userId/follow` | Verified + CSRF | Follow an account. |
| `DELETE /users/:userId/follow` | Verified + CSRF | Unfollow an account. |
| `GET /me/bookmarks` | Auth | List own saved posts. |
| `PUT /me/bookmarks/:blogId` | Verified + CSRF | Save a post. |
| `DELETE /me/bookmarks/:blogId` | Verified + CSRF | Remove a saved post. |
| `GET /notifications` | Auth | List own notifications and unread count. |
| `PATCH /notifications/:id/read` | Auth + CSRF | Mark one notification read. |
| `PATCH /notifications/read-all` | Auth + CSRF | Mark all notifications read. |

## Blogs, comments, and discovery

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /blogs` | Public | Paginated public posts; `tag` filters by tag. Authenticated `?mine=1` requests can read the current user's dashboard posts, with optional `status`. |
| `POST /blogs` | Verified + CSRF | Create a post; multipart `cover` is optional. |
| `GET /blogs/:slug` | Public | Read by slug, subject to visibility rules. |
| `GET /blogs/id/:id` | Auth | Read an ID-addressed post when allowed (owner/admin draft access). |
| `PATCH /blogs/:id` | Verified + owner + CSRF | Update own post; optional multipart `cover`. |
| `DELETE /blogs/:id` | Verified + owner + CSRF | Delete own post; cleanup is queued. |
| `GET /blogs/:id/related` | Public | Related public posts. |
| `GET /feed` | Auth | Feed from followed authors. |
| `GET /search` | Public | Search public posts. |
| `GET /tags/:tag/blogs` | Public | Posts with a tag. |
| `PUT /blogs/:id/like` | Verified + CSRF | Like a post. |
| `DELETE /blogs/:id/like` | Verified + CSRF | Remove a like. |
| `GET /blogs/:id/comments` | Public | Paginated comments; hidden comments are omitted for regular readers. |
| `POST /blogs/:id/comments` | Verified + CSRF | Add a comment or reply. |
| `PATCH /comments/:id` | Verified + owner + CSRF | Edit own comment. |
| `DELETE /comments/:id` | Verified + owner/admin + CSRF | Delete/hide a comment according to moderation rules. |

List endpoints use `limit` and opaque `cursor` where supported. The usual default is 12; comments default to 20 and moderation report pages to 20. Limits are capped at 50. Responses carry `data.items` and `data.nextCursor`; absent a next page, the cursor is null. Comments are ordered oldest first. Public listing endpoints exclude drafts and hidden/unlisted content unless a route explicitly grants access. The homepage topic cards link to curated frontend data and filter posts through the `/blogs?topic=` UI query; there is no separate trending-ranking API.

Search accepts `q`, `tag`, `cursor` and `limit`. Blog list accepts `tag`, `cursor`, `limit`; a signed-in `mine=1` request selects the caller's dashboard posts and may include a `status`. Tag values are normalized lowercase and are limited to letters, digits and hyphens. Cursor values are opaque, endpoint-order-specific values; clients should echo `nextCursor` unchanged rather than construct one.

### Other JSON request bodies

- Profile update: optional `displayName` (1–60 chars), `bio` (up to 280 chars), and `websiteUrl` (up to 200 chars, empty or beginning with HTTP/HTTPS). The profile-picture file is the `avatar` multipart field. Password update accepts `currentPassword` and `newPassword`.
- Blog create/update: `title`, `excerpt`, Quill `content` Delta, `tags` (up to 8, each up to 32 lowercase alphanumeric/hyphen characters), `status` (`draft` or `published`), `visibility` (`public` or `unlisted`), and `commentsEnabled`. Updates may include `expectedUpdatedAt`. Optional cover file field is `cover`.
- Comment create: `body` (1–2,000 chars) and optional nullable `parentId`. Comment edit accepts `body`.
- Report create: `targetType` (`article`, `comment`, `user`), `targetId`, `reason` (`spam`, `harassment`, `misinformation`, `copyright`, `other`), and optional `explanation` (up to 1,000 chars). Report review accepts `status` (`resolved`/`dismissed`), optional `resolutionNote`, `hideTarget`, and `userAction` (`suspend`/`restore`).
- Like, follow, bookmark and notification-read actions identify their target in the URL and do not require a JSON body.

## Uploads and moderation

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /uploads/inline` | Verified + CSRF | Upload multipart `image` for article content. |
| `POST /uploads/avatar` | Verified + CSRF | Upload multipart `avatar`. |
| `POST /reports` | Verified + CSRF | Submit a moderation report. |
| `GET /admin/reports` | Admin | List reports. |
| `GET /admin/reports/:id` | Admin | View a report. |
| `PATCH /admin/reports/:id` | Admin + CSRF | Review a report. |

Image uploads use multipart `FormData`; allow the browser to create the multipart boundary. New assets are stored in Cloudinary. Middleware validates authentication/verification, CSRF, upload limits and actual image type. Moderation and upload routes also have dedicated rate limits.

## Browser security

The React API layer includes session credentials, fetches the current token from `/csrf-token`, and sends `X-CSRF-Token` on writes. Session cookies are HttpOnly and server-managed. Do not call mutating routes from browser code without the shared API client unless the request reproduces these protections.
