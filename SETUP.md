# Connect to LearnFlow

1. Open the existing LearnFlow project in Supabase.
2. Run supabase/schema.sql once in SQL Editor. It creates dating_ tables and functions without modifying existing tables. If any dating_ objects already exist, stop and inspect them first.
3. Copy .env.example to .env.local. Set the LearnFlow project URL and publishable key. Never use a secret or service-role key.
4. Keep the existing Authentication Site URL and redirects. Add http://127.0.0.1:5173 to the redirect allowlist. Later add the dating website HTTPS origin.
5. Restart npm run dev. Create two confirmed accounts and dating profiles, like each other, and test messaging. Verify a third account cannot access the conversation and blocking prevents messaging.

Both websites share authentication and quotas. Inspect existing Auth triggers before enabling dating signup because those triggers may also create LearnFlow records. Compatibility and database security require live integration testing; only the frontend build has been verified.

Build with npm run build and publish dist on a static host with both VITE environment variables set. Production email delivery must be configured without disrupting LearnFlow. Reports are stored for owner review in the Supabase dashboard. Photos, verified age assurance, moderation UI and account deletion remain launch work. There are no sample profiles; members appear when they sign up.

## Missing confirmation emails

The app now offers Resend confirmation email, keeps delivery errors visible,
and waits 60 seconds after an accepted resend. Accepted requests do not prove
inbox delivery. The website does not bypass email confirmation.

In the Supabase project dashboard:
1. Check Authentication > Users for the attempted signup. A repeated signup can
   return a generic response; an existing confirmed account should sign in.
2. Inspect Authentication logs for that signup/resend time. Check for unauthorized
   recipient, SMTP failure or email rate-limit errors.
3. Configure custom SMTP under Authentication email settings for public signups.
   The default provider is for testing, limits recipients to organization members,
   and has a low project-wide send limit. This project shares LearnFlow auth;
   coordinate sender settings so both apps continue to receive auth emails.
4. Add http://127.0.0.1:5180 and the eventual HTTPS dating-site origin to the
   redirect allowlist. Do not replace the shared LearnFlow Site URL casually.
5. Confirm the template uses the Supabase confirmation URL. Request one resend
   and check the provider delivery log as well as Spam/All Mail.

References:
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/auth/rate-limits
https://supabase.com/docs/reference/javascript/auth-resend

Never put SMTP passwords or a Supabase service-role key in VITE variables or
frontend code. This local change does not configure hosted email delivery.
