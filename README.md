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

## Known gaps

- **Real-time Gmail push detection is built but unverified in production.** `api/gmail-watch.js` / `api/gmail-push.js` implement `gmail.users.watch` + Pub/Sub push handling against the `user_tokens` table, but the required env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLOUD_PROJECT`, `SUPABASE_SERVICE_KEY`, VAPID keys) are not present in local `.env` — unconfirmed whether they're set in Vercel. Until confirmed working, **manual "Scan Inbox" re-runs are the reliable way to pick up new reservations.**
- Gmail `provider_token` (OAuth access token) is stashed in `sessionStorage` as a stopgap so scanning survives a page reload — it still expires (~1h) and isn't refreshed server-side. A proper fix would exchange the refresh token for a fresh access token on demand.
- No trip/itinerary grouping yet (e.g. bundling all reservations within one date range into a single "trip" view, TripIt-style) — requested but not built.

## Recent fixes (chronological, newest first)

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
