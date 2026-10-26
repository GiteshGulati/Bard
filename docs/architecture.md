# Architecture

Bard uses one Express application for the REST API and, after a client build, the static Vite output. During development, Vite proxies `/api` and `/uploads` to the API.

## Request path

1. Express applies Helmet, the configured CORS policy, request-size limits, and a general rate limit.
2. `express-session` uses MongoDB through `connect-mongo` outside test mode. The session cookie is HttpOnly and SameSite=Lax; it is Secure in production.
3. Mutating browser routes pass CSRF synchronisation middleware. Authentication and admin middleware load identity from the session and check ownership or role on the server.
4. Controllers validate and translate HTTP requests; service modules enforce business rules and work with Mongoose models.
5. DTO helpers define public and private API fields. Article content is normalized from Quill Delta and rendered through an allowlisted HTML sanitizer.

## Data and uploads

Users, blogs, comments, likes, bookmarks, follows, notifications, and reports are separate collections. Unique compound indexes prevent duplicate likes, bookmarks, and follow relationships. Feed-like endpoints are paginated and capped at 50 items.

Multer keeps bounded image uploads in memory only long enough to verify file signatures. The official Cloudinary SDK streams validated bytes to `bard/avatars`, `bard/covers`, or `bard/article-images`; a `CloudAsset` record stores owner, `public_id`, Cloudinary asset ID, and HTTPS `secure_url`. User and article records reference those asset documents. Replacement and deletion remove an asset only after checking that no user or article still references it and that the asset belongs to the owning account. Existing local images remain available from the legacy `/uploads` route; new uploads are never written to local disk.

## Trust boundaries

The browser never supplies trusted roles, passwords are bcrypt-hashed, sessions stay server-side, and public DTOs omit email and password data. Every owned resource mutation checks ownership in a service/controller, while moderation routes require an administrator session. Uploaded media is restricted to detected JPEG, PNG, WebP, and GIF files.
