# Operations and deployment

This is a deployment checklist rather than a provider-specific hosting recipe. The app is an Express process plus a built Vite frontend, MongoDB, and Cloudinary-backed image storage.

## Production checklist

1. Use a supported Node.js version (20 or newer) and install from the repository root with the lockfile (`npm ci`).
2. Build the canonical React app with `npm run build`; start the API with `npm start`. Express serves `bard-react/dist` when the build exists. Direct SPA routes fall back to `index.html`.
3. Set `NODE_ENV=production`, an HTTPS `APP_BASE_URL`, `CLIENT_ORIGIN` equal to the actual browser origin (even when Express serves the frontend), unique `SESSION_SECRET`, MongoDB connection string, full Cloudinary credentials, and the complete SMTP group. See [environment configuration](environment.md).
4. Serve the application through HTTPS. Production session cookies are Secure, HttpOnly, and SameSite=Lax. Express trusts one proxy hop; configure the hosting proxy consistently and do not expose the app through an untrusted proxy chain.
5. Keep the browser and API same-site where practical. For separately hosted origins, configure the exact frontend origin and ensure the browser's cookie policy permits the deployment arrangement; credentialed CORS alone does not override browser third-party-cookie restrictions.
6. Use a durable MongoDB deployment with backups and network access restricted to the application. The application selects database `bard` and stores sessions in `sessions`.
7. Confirm `GET /api/v1/health` returns HTTP 200 with `database: ready`. The health route reports database readiness, not SMTP/Cloudinary health.
8. Monitor server logs, process restarts, MongoDB availability, Cloudinary cleanup retries, and notification/moderation/deletion retry behavior. The server runs these pending-work processors at startup and every 30 seconds.

No Docker, Kubernetes, or provider-specific deployment manifests are currently included in the repository. Configure build and start commands in the chosen hosting platform using the commands above.

## MongoDB Atlas

1. Create a production cluster and a database user with only the access needed by Bard.
2. Add the application's outbound network address to Atlas network access; avoid broad access rules where possible.
3. Copy the Atlas connection string into `MONGODB_URI`, URL-encoding credentials that contain reserved URI characters. Do not paste the string into source control, issues, or logs.
4. Set `MONGODB_DB_NAME=bard` (the validator requires this name). Atlas must support sessions and indexes; moderation uses transactions when the cluster topology supports them and has an idempotent fallback otherwise.
5. Start the application and check `/api/v1/health`. Back up production data and test restore procedures independently.

For common Atlas connection failures: DNS/SRV errors usually point to an incorrect cluster hostname or resolver; TLS errors can point to an outdated runtime/network interception; authentication errors commonly mean the database user/password or auth database is wrong; network timeouts commonly mean the app's outbound IP is missing from Atlas network access. Verify the connection string and network policy privately; never publish a credential-bearing URI.

## Cloudinary

Create an account and set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the server environment. Configure all three; production refuses to start without them. New avatars, covers and inline images use Cloudinary folders under `bard/`. Existing local upload paths remain readable for legacy media but are not the destination for new uploads.

Find the cloud name in the Cloudinary console account details and create/retrieve API credentials in the console. The API key and secret are server credentials; the secret must not be placed in Vite/client configuration. Bard stores the provider `public_id`, provider asset ID, secure URL, owner and kind in `CloudAsset`; cleanup checks references before deleting an asset. Account-side transformations or deletion can make an otherwise saved URL unavailable, so retain provider account access and monitor cleanup failures.

## Gmail SMTP

Configure the SMTP settings listed in [environment configuration](environment.md). For Gmail SMTP, enable Google's 2-Step Verification if required for app passwords, create an app password in Google Account security settings, and use it as `SMTP_PASS`; do not use the regular account password. Set `SMTP_USER` to the account used for SMTP and use the authorized sender in `EMAIL_FROM_ADDRESS`. Common Gmail failures include disabled SMTP access, an invalid/revoked app password, sender mismatch, or account security restrictions. Never store credentials in frontend variables.

`npm run email:verify` checks SMTP connectivity without sending a message. `npm run email:send-test` sends a real test message to the configured `SMTP_USER`; only run it deliberately outside automated tests. A successful SMTP response is provider acceptance, not confirmation of inbox delivery. Check spam, provider account restrictions, sender alignment and bounce logs when a recipient does not see a message.

## Deployment limitations to verify for your host

- The server expects one trusted proxy hop (`trust proxy = 1`). Align this with the actual ingress path before enabling production secure cookies and rate limits.
- Content Security Policy is enabled in production. The current policy permits same-origin API connections; a separately hosted API may need an intentional, reviewed CSP configuration change before the UI can call it.
- The code does not include a static asset CDN/proxy configuration or a deployment-specific secrets manager setup.
