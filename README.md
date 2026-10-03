# After Hours NYC

A React/Vite adult dating community backed by Supabase. Public introductions are
real member profiles shown only with the member's explicit opt-in. There are no
fictional listings, invented member counts, or messages sent automatically.

## Run locally

```sh
npm install
npm run dev -- --port 5180
```

Open http://127.0.0.1:5180/. Build with `npm run build` and check database privacy
and discovery with `npm test`. See SETUP.md and RELEASE.md for existing account
and deployment setup. Create a deployment ZIP with `npm run package`.

## Features

- Public borough-filtered directory of consenting member introductions.
- Signup required for full profiles and mutual-match conversations.
- Member photos, video introductions, bios, interests, and dating preferences.
- Optional contact sharing protected by mutual-match database policies.
- Visibility settings, blocking, reporting, and member data export.
- Invite links on the homepage and in member Settings.
- Responsive landing page and metadata for sharing links.

## Activate the database features

Apply these SQL files in the Supabase SQL editor in order. If the original schema
is already installed, do not rerun schema.sql (it creates existing tables).

1. `supabase/schema.sql`: original dating tables and access policies.
2. `supabase/upgrade.sql`: member photos and extended profile fields.
3. `supabase/media.sql`: private video bucket and contact privacy.
4. `supabase/growth.sql`: public introductions, off by default, and public RPC.

Hosted migrations have not been applied by this local update. Missing media
support disables video/contact editing. Missing public-directory support shows
an unavailable message, never made-up listings or membership numbers.

## Public introductions and privacy

Members opt in from Profile. Public visitors can see only name, age, borough,
dating intention, interests, and a record identifier. Hiding discovery also
removes that member's public introduction. Full bios, photos, videos, and contacts
are not returned by the public RPC. The displayed count is the number of returned
public introductions, not total users or online activity. Empty boroughs show an
honest invitation to help build the community. Refresh the page to update it.

## Invitations and launch

The copy buttons produce `/?ref=invite` on the current site domain. Signup keeps
this source and records `referral_source` (`invite` or `direct`) in auth user
metadata. This is basic source attribution, not a unique referral leaderboard or
visitor analytics dashboard. Share invitations yourself; no messages are sent.

Publish to your public domain before sharing links: localhost is accessible only
on your machine. Update Supabase Auth redirect settings for the deployed domain.
Create a real profile, opt into the introduction, and check the public directory.
Start with one borough and share through communities that permit promotion.
The website can improve signup and sharing; it cannot guarantee new members.

## Media limits and next improvements

Photos: up to four JPG/PNG/WebP files, 5 MB each. Video: one MP4/WebM under 25 MB
and 30 seconds. Duration is checked in the browser; server-side processing and
moderation should enforce the limit before a public launch. Buckets remain
private with expiring links. Age is self-declared.

Recommended next work: report-review dashboard, media moderation, stronger age
verification, and visitor-to-signup / signup-to-profile conversion measurement.

## Verification

`npm test` verifies profile validation, mutual chat, ownership, blocking, private
media, contact sharing, and public-directory opt-in/visibility/field limits.
The existing browser regression script starts at `/?auth=signin`.

## GitHub Pages

Repository: https://github.com/gim1203-hue/dating-app
Website: https://gim1203-hue.github.io/dating-app/

The Pages workflow runs tests, builds for `/dating-app/`, and publishes after a
push to main. GitHub repository variables `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` supply public frontend configuration. Never use a
service-role or secret key. The setup script validates this before storing them.

In Supabase Auth URL Configuration, add
`https://gim1203-hue.github.io/dating-app/` to allowed redirect URLs. Keep existing
LearnFlow settings intact. Configure custom SMTP for public signup delivery and
apply the dating migrations described above. GitHub Pages publishes the frontend;
it does not configure your Supabase database or email sender.

Run `npm run build:pages` to verify the production path locally. Invitations and
auth redirect links retain the repository path. Roll back by reverting the release
commit and allowing the workflow to deploy the previous app.

## Administrator dashboard and support

`supabase/admin.sql` adds database-enforced administrator roles, scoped member
search, private support conversations, report review, and dating suspensions.
Apply it after the other dating migrations. It grants no account admin access.
`supabase/activate-admin.sql` is the separate owner-role activation, requiring the
confirmed `gimrankhan1203@gmail.com` account. Apply only after owner approval.

Admins see a Dashboard tab, member emails/join dates, profile information/media,
contact details provided in the dating app, and support messages. They can request
password-reset emails and suspend/restore dating access. Passwords remain managed
by Supabase and cannot be viewed. Reset links let members choose their passwords.
Private member-to-member chats are not part of the support inbox.

Regular members have a Support tab and cannot read others' support conversations
or admin records. Suspensions stop dating discovery, new likes, and mutual chat;
support remains available. They do not disable the shared LearnFlow login.
Members appear if they have a dating profile, dating signup metadata, or a support
conversation; unrelated LearnFlow accounts are excluded.

Log out is visible in the top bar on desktop and mobile, in addition to the
sidebar action. Public visitors and signup screens have no active-session logout.

Verification: `npm run build:pages` and `npm test` (including admin authorization,
self-promotion prevention, support privacy, private-media moderation access and
suspension enforcement). Admin activation is a separate security-sensitive step.
