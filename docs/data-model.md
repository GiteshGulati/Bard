# Data model

Bard uses Mongoose models in `server/src/models/`. MongoDB database name is `bard`; session records are kept in the `sessions` collection by `connect-mongo`. Mongoose manages application collections and indexes from the model definitions.

| Model | Important fields, types and validation | Relationships and notable indexes |
| --- | --- | --- |
| `User` | `username`, `emailNormalized` (unique lowercase strings); `passwordHash` (bcrypt string, select-false); `emailVerified` (Boolean); token hashes and expiry dates (select-false); `sessionVersion` (Number); profile strings; `role` and `moderationStatus` enums. Username is 3–20 chars; display name max 60; bio max 280. | Owns authored blogs and media. Unique username/email; indexes creation date and moderation status. |
| `Blog` | `title` (max 160), unique lowercase `slug`, `excerpt` (max 400), `contentDelta` (Mixed), sanitized HTML/plain-text strings, string tag array (max 8 tags, each max 32), status enum (`draft/published/hidden`), visibility (`public/unlisted`), comments flag and publication date. | `author` references User; cover and inline assets reference CloudAsset. Text index on title/excerpt/plain text; compound indexes for public feeds, author dashboards, status and tags. |
| `Comment` | `body` string (max 2,000); status enum (`visible/hidden/deleted`); notification pending/delivered/attempted dates and attempt count. | References author User, Blog and optional parent Comment. Indexes blog/author chronology and notification work. |
| `Like` | Timestamped relationship plus notification retry fields. | References User and Blog; unique `(user, blog)` index prevents duplicate likes; blog and notification-work indexes. |
| `Bookmark` | Timestamped relationship. | References User and Blog; unique `(user, blog)` and per-user chronology indexes. |
| `Follow` | Timestamped relationship plus notification retry fields. | Follower and followed reference User; unique `(follower, followed)`; indexes support both directions and notification work. |
| `Notification` | Type enum (`follow/like/comment/reply`), optional read date, optional deduplication string. | Recipient and actor reference User; optional Blog/Comment. Recipient chronology/read indexes and unique sparse `dedupeKey`. |
| `Report` | Target type enum, reason enum, explanation and resolution note (max 1,000), status enum, reviewer and resolved date; `pendingReview` stores the idempotent review action. | Reporter/reviewer reference User; target uses type + ID. Indexes status/date and target. |
| `CloudAsset` | `publicId` and HTTPS `secureUrl` unique strings; provider asset ID; kind enum (`avatar/cover/inline`). | Owner references User; indexes owner/kind/date and provider asset ID. |
| `BlogDeletion` | Blog and owner IDs; array of asset IDs; status enum (`pending/complete`), attempts, next retry date and last safe error code. | Unique blog job; indexes status/retry time. |

Most schemas use Mongoose timestamps. Unique indexes enforce identities and relationship constraints; duplicate writes can therefore fail at MongoDB even if request validation passed. Blog text search indexes title, excerpt and plain text. Cursor-based collections use stable sort keys and bounded page sizes. Some sensitive User fields are `select: false`; callers that need them explicitly opt in. See the schema files for exact optional/default values and all indexes; this summary is not a substitute for the executable model definitions.

## Relationship and lifecycle notes

- A blog belongs to one author. Blog-owned media references `CloudAsset` documents; cleanup checks references before removing a provider asset.
- A comment belongs to a blog and author, and may reference a parent comment.
- Likes, bookmarks and follows are independent relationship documents with uniqueness enforced by MongoDB indexes.
- Verification and reset tokens are stored as SHA-256 hashes with expiry timestamps; raw tokens are sent only in the corresponding link and are consumed on use.
- Blog deletion is persisted as a retryable job. Database record removal is idempotent and precedes Cloudinary cleanup.
- Moderation review uses transactions when the MongoDB topology supports them and a persisted idempotent operation otherwise.
