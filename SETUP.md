# Connect to LearnFlow

1. Open the existing LearnFlow project in Supabase.
2. Run supabase/schema.sql once in SQL Editor. It creates dating_ tables and functions without modifying existing tables. If any dating_ objects already exist, stop and inspect them first.
3. Copy .env.example to .env.local. Set the LearnFlow project URL and publishable key. Never use a secret or service-role key.
4. Keep the existing Authentication Site URL and redirects. Add http://127.0.0.1:5173 to the redirect allowlist. Later add the dating website HTTPS origin.
5. Restart npm run dev. Create two confirmed accounts and dating profiles, like each other, and test messaging. Verify a third account cannot access the conversation and blocking prevents messaging.

Both websites share authentication and quotas. Inspect existing Auth triggers before enabling dating signup because those triggers may also create LearnFlow records. Compatibility and database security require live integration testing; only the frontend build has been verified.

Build with npm run build and publish dist on a static host with both VITE environment variables set. Production email delivery must be configured without disrupting LearnFlow. Reports are stored for owner review in the Supabase dashboard. Photos, verified age assurance, moderation UI and account deletion remain launch work. There are no sample profiles; members appear when they sign up.
