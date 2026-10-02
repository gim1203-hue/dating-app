# Connect real accounts and messaging

1. Create a Supabase project at https://supabase.com/dashboard.
2. Run `supabase/schema.sql` once in the new project's SQL Editor.
3. Copy `.env.example` to `.env.local`. Fill in your project URL and publishable key from the Connect dialog. Never use a secret or service-role key in frontend configuration.
4. Set Authentication Site URL and redirect allowlist to `http://127.0.0.1:5173` for local development. Add your public HTTPS origin when deployed.
5. Restart `npm run dev`.
6. Create and confirm two real accounts, complete profiles, like each other and send messages. Verify a third account cannot access their conversation, and blocking prevents messages. These integration checks still need a connected project.

For hosting: run `npm run build`, deploy `dist` on a static host, and set both VITE environment variables before building. Configure production SMTP in Supabase for public signup. Reports are stored for owner review in the Supabase dashboard.

This version uses actual database-backed accounts and conversations when connected. No live backend or public deployment is configured yet. Age is self-declared. Profile photos, stronger age assurance, moderation UI, deletion workflows and anti-abuse controls remain launch work. No people appear until real users register. Chat refreshes every three seconds.
