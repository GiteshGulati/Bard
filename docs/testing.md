# Testing

Run from the repository root:

```sh
npm ci
npm test
```

The root test command builds the canonical React app, runs the React tests, then runs the API integration suite. The backend static-serving test requires `bard-react/dist/index.html`; running `npm test` from the repository root satisfies that prerequisite.

The API integration suite uses `mongodb-memory-server` and Supertest. It starts a temporary MongoDB instance and an ephemeral local HTTP server, then removes test documents and shuts both down. It does not connect to the configured development or production database. The React tests use Node's test runner, Vite SSR, and mocked fetch requests; they do not require an SMTP server or Cloudinary account.

Coverage includes account/session flows, article ownership and draft privacy, paginated comments, idempotent moderation and blog-deletion recovery, likes/bookmarks/follows, threaded comments, follow feeds, private notifications, upload rejection/size handling, rich-text sanitization, admin gating, validation, rate limiting, and a two-account publishing/social journey. React tests cover route rendering, registration feedback, and mocked request behavior. The in-memory MongoDB binary may need to download on first test run.

The frontend suite is not a browser DOM or end-to-end UI suite, and the repository does not define a live SMTP/Cloudinary integration test or manual browser verification script. SMTP tests use an adapter/mock; the email CLI can contact SMTP and `--send` sends a real message, so it must not be run as part of automated tests. Frontend lint is `npm run lint -w bard-react`.

## Known dependency state

The server manifest requests Nodemailer `^7.0.13` and the root lockfile pins `7.0.13`. In the current working tree, `npm ls nodemailer -w server --depth=0` reports the installed `node_modules` copy as `10.3.1` and invalid against that manifest. This is an installed-tree/manifest mismatch; dependencies were not changed as part of the documentation work. Run `npm ci` from the root in a controlled environment and rerun `npm ls nodemailer -w server --depth=0` to check the local installation. The automated email tests mock the transport and do not establish live compatibility with a configured SMTP account.
