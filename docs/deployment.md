# Production deployment gate

RelayOps remains paused before external deployment. Complete these steps in order after local CI passes.

## 1. Configure transactional email

1. Create a free account at [Resend](https://resend.com/signup).
2. Open [Domains](https://resend.com/domains) and add `mail.khalidoyeneye.dev`.
3. Open the [Netlify team dashboard](https://app.netlify.com/teams), choose **DNS**, then select `khalidoyeneye.dev`.
4. Add the DKIM, SPF, and MX records displayed by Resend exactly as provided. Do not delete existing `NETLIFY` records. Follow the [Netlify DNS guide](https://docs.netlify.com/manage/domains/manage-domains/manage-dns-records/).
5. Wait for Resend verification, then create a sending-only key at [API Keys](https://resend.com/api-keys).
6. Create a Resend webhook for `https://relayops-backend-sim7.onrender.com/api/v1/webhooks/resend`, subscribe to sent/delivered/bounced/failed events, and retain its signing secret.

The configured sender is `RelayOps <no-reply@mail.khalidoyeneye.dev>`. Codes and invitation tokens never appear in application logs or API responses.

## 2. Prepare MongoDB Atlas

1. Open the [Atlas console](https://cloud.mongodb.com/) and create or select an M0 cluster.
2. Create a dedicated RelayOps database user with a unique generated password.
3. Add Render's outbound ranges to Atlas Network Access. For a portfolio-only fallback, permit public access only with the dedicated strong credential.
4. Copy the `mongodb+srv` connection string using the [Atlas connection guide](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).

## 3. Deploy the Blueprint

1. Push `main` to [khalteck/RelayOps](https://github.com/khalteck/RelayOps) and wait for GitHub Actions.
2. Open the [Render Dashboard](https://dashboard.render.com/) and create a Blueprint from `render.yaml`.
3. Provide `MONGODB_URI`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, and `DEMO_PASSWORD`. Render generates the remaining secrets.
4. Confirm both services use **After CI Checks Pass** and allow the demo seed hook to complete.

## 4. User-level smoke test

1. Register a fresh owner, verify the emailed code, complete onboarding, and reload the Dashboard.
2. Invite a responder, open the emailed link privately, and complete invited onboarding.
3. Suspend and restore the responder, checking email and immediate authorization loss.
4. Confirm removal is blocked while they own an unresolved incident; reassign it, remove them, and check the email.
5. Test all demo roles, `/api` rewriting, Socket.IO, SPA deep links, secure logout, and both health endpoints.
6. Add verified live URLs and refreshed screenshots to the README.
