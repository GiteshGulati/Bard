# Testing

Run from the repository root:

```sh
npm install
npm run build
npm test
```

The API integration suite uses `mongodb-memory-server` and Supertest. It starts a temporary MongoDB instance and an ephemeral local HTTP server, then removes test documents and shuts both down. It does not connect to the configured development or production database.

Coverage includes account/session flows, article ownership and draft privacy, likes/bookmarks/follows, threaded comments, follow feeds, private notifications, upload rejection/size handling, rich-text sanitization, admin gating, validation, rate limiting, and a two-account publishing/social journey. The in-memory MongoDB binary may need to download on first test run.
