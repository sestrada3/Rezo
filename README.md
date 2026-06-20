# Rezo

Finds your reservations (flights, hotels, dining, concerts, sports, theater, cars)
from Gmail and lays them out on one timeline. Live at rezo-rouge.vercel.app.

## Stack

- React 19 + Vite, Zustand for state (`src/store.js`)
- Supabase (Postgres + Auth + RLS) for storage and Google sign-in
- Claude (`claude-sonnet-4-6` via `@anthropic-ai/sdk`) parses confirmation emails into structured bookings, server-side only
- Gmail API for inbox scanning; Google Cloud Pub/Sub + Web Push for (partially built, see below) real-time detection
- Deployed on Vercel; `api/*.js` are Vercel serverless functions, `server/` is the local dev equivalent (Express)

## Local setup

```
npm install
npm run dev      # vite + local API server together
```

Required env vars (`.env`, never commit):

| Var | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + API | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | `api/parse-email.js` | server-side only, no `VITE_` prefix |

Needed only if you want real-time Pub/Sub push detection working (currently **not** configured anywhere, see Known gaps below): `SUPABASE_SERVICE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLOUD_PROJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VITE_VAPID_PUBLIC_KEY`.

## How a reservation gets saved

Two entry points, same save path:

1. **Scan Inbox** (`src/screens/ScanInbox.jsx`) — searches Gmail via `src/lib/gmail.js`, extracts MIME text per message, sends each to `api/parse-email.js`, shows a preview list, user taps "Add" to persist.
2. **Import Email** (`src/screens/ImportEmail.jsx`, the `+` button) — same parse endpoint, but saves immediately on parse; "Add to timeline" only syncs into local Zustand state.

Both go through `src/lib/bookings.js`:
- `parseEmail()` calls `api/parse-email.js`, which prompts Claude to return **one JSON object per distinct reservation** — a single email (e.g. a round-trip itinerary) can yield an array of multiple bookings, not just one.
- `saveBookings()` upserts rows with a `conf` number on `(user_id, conf, date_iso)` — keyed by date as well as confirmation number, because multiple legs of one itinerary often share a single confirmation/order number but always have different dates. Rows without a `conf` are plain-inserted (can't be deduped).

Schema lives in `supabase/schema.sql` (bookings table + indexes/RLS) and `supabase/tokens-schema.sql` (`user_tokens`, for the Pub/Sub feature). **Neither file auto-applies** — run them manually in the Supabase Dashboard → SQL Editor whenever they change, and check the live DB matches before assuming a fix landed.

## API cost (2026-06-19)

A "Scan Inbox" run pulled up to 500 emails from the last 2 years and sent **every one** to Claude on every run, with no memory of what had already been scanned — so each re-scan re-paid for the entire backlog. Combined with the email-text cap being raised 4x (4000→16000 chars, see Recent fixes) and using Sonnet, this drove cost to $60+/month before the app was even live. Two fixes landed:

- **`scanned_emails` table** (new, in `supabase/schema.sql` — **must be run manually**, see above) records every Gmail message ID a scan has processed (booking or not). `ScanInbox.jsx` now filters them out before parsing, so re-scans only pay for genuinely new mail. `bookings.js` adds `getScannedEmailIds()` / `markEmailsScanned()`.
- **Parse model switched to `claude-haiku-4-5`** (`api/parse-email.js`) — this is structured extraction, not reasoning; Haiku is ~4x cheaper per token than Sonnet. Worth re-checking extraction accuracy on a few real emails after this lands.

Not done: rule-based regex parsers for high-volume senders (OpenTable, Ticketmaster, specific airlines) to skip the LLM call entirely for known templates (how TripIt does it). Deliberately not hand-written blind — getting a date/seat/time wrong and silently saving it is worse than the API cost. `raw_email` is already stored on every booking, so once there's real volume, mine those for actual sender templates before writing per-sender parsers.

## Open issue (as of 2026-06-19)

User still sees `Couldn't save reservations: null value in column "type" of relation "bookings" violates not-null constraint` on "Add to timeline" after two rounds of server- and client-side fixes (`c8fbde7`, `668132c` — see changelog). Both fixes are confirmed pushed and deployed but the user reports the **exact same error message**, even after being asked to retry.

**Root cause found and fixed** (commit `69e565e`): `vite.config.js` uses `strategies: 'injectManifest'` with `registerType: 'autoUpdate'`, but `src/sw.js` never called `self.skipWaiting()` / `clientsClaim()`. Unlike the `generateSW` strategy, `injectManifest` does **not** auto-add that behavior — so every new service worker installed but sat in the "waiting" state forever, meaning the browser kept serving the old cached bundle indefinitely regardless of redeploys, and even a normal Ctrl+Shift+R reload wouldn't fix it (only a full unregister/clear-site-data would). This fully explains why two rounds of confirmed-deployed fixes never reached the user.

**Next step:** confirm with the user that a normal reload (no manual cache-clearing needed) now picks up fixes going forward. If a save error still somehow occurs after this lands, the `[rezo save]` console.warn added in `668132c` will print the exact malformed booking object — pull that from the browser console.

## Known gaps

- **Real-time Gmail push detection is built but unverified in production.** `api/gmail-watch.js` / `api/gmail-push.js` implement `gmail.users.watch` + Pub/Sub push handling against the `user_tokens` table, but the required env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLOUD_PROJECT`, `SUPABASE_SERVICE_KEY`, VAPID keys) are not present in local `.env` — unconfirmed whether they're set in Vercel. Until confirmed working, **manual "Scan Inbox" re-runs are the reliable way to pick up new reservations.**
- Gmail `provider_token` (OAuth access token) is stashed in `sessionStorage` as a stopgap so scanning survives a page reload — it still expires (~1h) and isn't refreshed server-side. A proper fix would exchange the refresh token for a fresh access token on demand.
- No trip/itinerary grouping yet (e.g. bundling all reservations within one date range into a single "trip" view, TripIt-style) — requested but not built.

## Recent fixes (chronological, newest first)

- **Malformed-booking save guard** (`668132c`, `c8fbde7`) — the multi-leg change could produce a malformed booking (e.g. if Claude wrapped its array response in `{"bookings": [...]}` instead of returning a bare array) that had no `type`/`title`/`dateISO`, which crashed the entire save with a DB not-null violation. `api/parse-email.js` now unwraps common wrapper keys and filters invalid items before responding; `src/lib/bookings.js` `saveBookings()` filters again client-side (with a `[rezo save]` console.warn) as a backstop. **Not yet confirmed fixed by the user** — see Open issue above.
- **Multi-leg itineraries** (`e4f9b58`) — one confirmation email can describe multiple distinct reservations (e.g. outbound + return flight legs sharing one itinerary number). The parser previously only ever extracted one booking per email, and even when it found more, the old `(user_id, conf)` dedupe key collapsed same-itinerary legs into a single overwritten row. Fixed on both ends: `api/parse-email.js` can return an array of bookings, and the dedupe key is now `(user_id, conf, date_iso)`.
- **Scan diagnostics** (`bb51ed9`, `1987a67`) — `stripHtml()` was truncating extracted email text at 4000 chars, likely cutting off real itinerary details behind marketing/legal boilerplate in HTML-heavy confirmations; raised to 16000, plus deeper MIME recursion (6→12). Every skipped/failed email during a scan now logs its subject + failure reason to the console (`[rezo scan]`) for fast debugging instead of manual one-by-one testing.
- **Partial unique index bug** (`dba3471` + manual DB fix) — `bookings_user_conf` was created as a *partial* index (`where conf is not null`), which Postgres cannot use as an `ON CONFLICT` arbiter unless the same predicate is repeated in the `ON CONFLICT` clause — something Supabase's `.upsert()` has no way to express. Every scan-save silently failed with "no unique or exclusion constraint matching ON CONFLICT". Fixed by dropping the partial predicate (Postgres already excludes NULLs from uniqueness by default, so it wasn't needed).
- **"Scan failed" masking save errors** (`837b657`) — the error header was hardcoded regardless of whether the failure happened during the Gmail scan or the DB save step, hiding the real cause. Now distinguishes `errorStage`.
- **0-reservations flash on reload** (`988f7f3`) — Zustand only persists `isOnboarded` across reloads (`store.js` `partialize`), so `bookings` always reset to `[]` on load; the UI rendered immediately with that empty array before the async `loadBookings()` resolved. Fixed with a `bookingsReady` gate in `App.jsx` that blocks render until the initial load settles.

## Project structure

```
api/             Vercel serverless functions (parse-email, gmail-watch, gmail-push, push-subscribe)
server/          Local dev equivalent of api/ (Express)
src/lib/         gmail.js (search + MIME extraction), bookings.js (parse/save/load), supabase.js (client)
src/screens/     ScanInbox, ImportEmail, Timeline, Wallet, Search, Settings, BookingDetail, Auth
src/store.js     Zustand store — only isOnboarded persists across reloads
supabase/        schema.sql (bookings table), tokens-schema.sql (user_tokens, for Pub/Sub)
```
