# Project structure

```text
.
├── bard-react/              Canonical React/Vite UI
│   ├── public/              Static public assets
│   ├── src/                 App entry, routes, contexts, API client, components and pages
│   └── tests/               Node test-runner frontend tests
├── client/                  Legacy standalone vanilla JavaScript/Vite UI
├── docs/                    Project and developer documentation
├── server/
│   ├── src/
│   │   ├── config/          Environment, MongoDB, CSRF and Cloudinary setup
│   │   ├── controllers/     HTTP request/response handlers
│   │   ├── middleware/      Authentication, rate limits, uploads and errors
│   │   ├── models/          Mongoose schemas and indexes
│   │   ├── routes/          Express API route registration
│   │   ├── scripts/         Development seed and SMTP diagnostics
│   │   ├── services/        Auth, email, content, social, moderation and media logic
│   │   ├── utils/           DTOs, errors, pagination and shared helpers
│   │   └── validators/      Zod request schemas
│   └── tests/               API integration and security tests
├── uploads/                 Legacy/local upload directory (ignored by Git)
├── .env.example             Safe configuration template
├── package.json             npm workspace scripts and shared tooling
└── package-lock.json        Root lockfile for all workspaces
```

Generated `bard-react/dist/` is created by the root build and served by Express if present; it is not the source of the frontend. Root scripts operate on `bard-react/` and `server/`. The legacy `client/` has its own package configuration and is not included in root dev/build/test commands. Backend test fixtures and helpers live under `server/tests/`; no separate production seed dataset is committed.

Server CLI scripts are `server/src/scripts/seed.js` and `server/src/scripts/verifyEmailTransport.js`, exposed through npm workspace scripts. See [testing](testing.md), [environment configuration](environment.md), and [operations](operations.md) for their use.
