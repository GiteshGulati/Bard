# Contributing

## Before changing code

- Read the [architecture](architecture.md), [API reference](api.md), and [testing guide](testing.md) for the area you are changing.
- Keep the canonical UI in `bard-react/`; `client/` is a legacy standalone frontend.
- Follow existing route/controller/service/model boundaries, validation conventions, response envelopes and DTO privacy rules.
- Keep credentials, session secrets, verification/reset tokens, and personal data out of logs and committed files.
- Use the established React page/component/context boundaries and keep HTTP parsing/response shaping in controllers while business rules stay in backend services. Parse untrusted request data with the existing Zod validators and use the shared error helpers/envelope.

## Change workflow

1. Install dependencies from the repository root with `npm ci`.
2. Implement a focused change and update relevant automated tests. External integrations should be mocked in tests; test runs must not send real email or upload real media.
3. Run `npm test` for build, frontend tests, and backend integration tests. Run `npm run lint -w bard-react` when changing frontend code.
4. Review `git diff` for generated artifacts, unrelated changes and secrets. Keep documentation and examples aligned with the actual code.

## Pull requests and change conventions

The repository does not enforce a branch naming or commit-message format. Use a short-lived branch describing the change and a focused pull request with a concise summary, user impact, test commands and results, and any migration or operational implications. Avoid bundling drive-by cleanup with behavior changes.

When changing a schema, preserve ownership/privacy checks and account for existing records, unique indexes and retry/idempotency behavior. Add or update tests for validation, permissions, expected failures and successful paths. For error handling, use the common error utilities rather than returning provider exceptions or secret-bearing diagnostics directly to clients. Keep loading, empty, success and error states visible in frontend pages, and prefer shared API helpers over hand-built fetch calls.

Update this documentation when routes, environment variables, schema fields, scripts, deployment behavior or user-visible workflows change. Never put SMTP, Cloudinary, MongoDB, session, or CSRF credentials in examples or pull request output.

## Pull request notes

Describe the user-visible behavior, important security or data lifecycle implications, and commands actually run. Call out any behavior that still needs verification against a real external service. Do not claim inbox delivery from a mocked test or SMTP acceptance.
