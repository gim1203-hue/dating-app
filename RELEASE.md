# After Hours NYC release

Implemented: real email accounts and password recovery, member profiles, up to four private photos, dating intentions and gender preferences, interests, borough/neighborhood and age filters, availability that expires after 12 hours, likes and mutual matches, persistent chat, unmatching, blocking/report submission, hidden profiles, data export, and dating-profile removal. LearnFlow login identities are preserved.

## Activate this release

1. Run `supabase/upgrade.sql` in LearnFlow SQL Editor after the original schema. This adds dating-only columns, photo storage policies and profile-removal functions. Do not rerun the original schema on an existing project.
2. Upload `release/after-hours-finished.zip` inside the existing `brilliant-dasik-b94fa0` Netlify project's Deploys page.
3. Keep LearnFlow's Authentication Site URL. Add `https://brilliant-dasik-b94fa0.netlify.app` to the redirect allowlist.

Build: `npm run build`. Package: `node scripts/package.mjs`. Tests: `node --test tests/dating.test.js tests/database.test.js`; browser flows: `node tests/browser.mjs` with a server on port 5180 and Microsoft Edge installed.

Verification includes local Postgres policy tests for three users, ownership, mutual chat, hidden profiles, photo access, blocking and profile removal. Browser tests use simulated API responses to verify authentication forms, profile editing, matching/chat, keyboard dialog behavior and mobile layout. Live member flows and the shared project's other policies require verification after migration.

Photos use a private Supabase bucket with five-minute signed links. Previously issued links may continue to work until expiration, even after blocking. Data downloads include only database rows accessible to the user. Messages poll every three seconds; the most recent 200 are displayed. Profile discovery currently loads up to the API's row limit. Reports require manual owner review through Supabase. Ages are self-declared. Anti-abuse automation and verified age checks are not included.
