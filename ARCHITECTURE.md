# Eventarello — Architecture

## Overview

Eventarello is an Italian event listing app. An admin uploads event flyers (images), Google Gemini extracts structured event data from them, the admin reviews and publishes, and visitors browse a public timeline of upcoming events.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 5 (SSR, output: server) |
| UI | React 19 (islands) |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (`event-images` bucket) |
| Auth | Supabase Auth (email/password) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Validation | Zod |
| Deployment | Cloudflare Pages + Workers |

## Directory Structure

```
src/
  components/       # React island components (EventCard, Timeline, etc.)
  layouts/          # Astro layouts
    BaseLayout.astro
    PublicLayout.astro
    AdminLayout.astro
  pages/
    index.astro     # Public event timeline
    contact.astro   # Contact page
    404.astro
    api/
      auth/
        login.ts    # POST — email/password login
        logout.ts   # POST — session invalidation
      events/
        index.ts    # GET list / POST create
        [id].ts     # GET one / PUT update / DELETE
      upload.ts     # POST — image upload + Gemini extraction
      views.ts      # POST — page view tracking
    admin/
      index.astro   # Protected admin dashboard
      login.astro   # Login form
  lib/
    supabase.ts         # Server-side Supabase client
    supabase-browser.ts # Client-side Supabase client
    auth.ts             # Session helpers (getSessionUser)
    gemini.ts           # Gemini image extraction
    types.ts            # Shared TypeScript types
  styles/           # Global CSS and theme variables
  middleware.ts     # Auth guards + security headers
supabase/
  migrations/
    001_initial_schema.sql  # events table, RLS, storage bucket
    002_add_event_url.sql   # Add url column to events
    003_page_views.sql      # page_views table, RLS
```

## Routing

All routing is file-based via Astro's pages directory.

| Route | File | Auth |
|---|---|---|
| `/` | `pages/index.astro` | Public |
| `/contact` | `pages/contact.astro` | Public |
| `/admin` | `pages/admin/index.astro` | Required |
| `/admin/login` | `pages/admin/login.astro` | Public |

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Email/password login, sets HTTPOnly session cookie |
| `POST` | `/api/auth/logout` | — | Invalidates session, clears cookie |
| `GET` | `/api/events` | — | Returns published events (public timeline) |
| `POST` | `/api/events` | Required | Creates a new event (draft or published) |
| `GET` | `/api/events/[id]` | — | Returns a single event |
| `PUT` | `/api/events/[id]` | Required | Updates an event (e.g., publish/edit) |
| `DELETE` | `/api/events/[id]` | Required | Deletes an event and its storage image |
| `POST` | `/api/upload` | Required | Uploads image to Supabase Storage, runs Gemini extraction, returns extracted fields |
| `POST` | `/api/views` | — | Records a page view (anonymous) |

## Data Flow

### Public timeline

```
Visitor → GET /
  → GET /api/events
    → Supabase: SELECT * FROM events WHERE status = 'published' ORDER BY event_date
  → Rendered timeline of event cards
```

### Admin — create event

```
Admin → /admin/login → POST /api/auth/login → session cookie set
Admin → /admin
  1. Selects image file
  2. POST /api/upload
       → Upload to Supabase Storage (event-images bucket)
       → Read image as base64 → send to Gemini 2.5 Flash
       → Returns { title, event_date, location, description, image_url, image_path }
  3. Admin reviews/edits extracted fields
  4. POST /api/events → INSERT into events table
  5. Event appears in admin list; admin can publish (PUT /api/events/[id])
```

## Database Schema

### `events`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `title` | `text` | Not null |
| `event_date` | `timestamptz` | Not null |
| `location` | `text` | Not null |
| `description` | `text` | Optional |
| `url` | `text` | Optional external link |
| `image_url` | `text` | Public Supabase Storage URL |
| `image_path` | `text` | Storage path (for deletion) |
| `status` | `text` | `'draft'` or `'published'` |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

### `page_views`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | PK |
| `page` | `text` | Route path |
| `visited_at` | `timestamptz` | Auto |
| `user_agent` | `text` | Optional |
| `referrer` | `text` | Optional |

### RLS Policies

| Table | Role | Permission |
|---|---|---|
| `events` | `anon` | SELECT where `status = 'published'` |
| `events` | `authenticated` | Full access (SELECT, INSERT, UPDATE, DELETE) |
| `page_views` | `anon` | INSERT only |
| `page_views` | `authenticated` | SELECT only |

## Authentication

- Login sets a Supabase session stored in an **HTTPOnly cookie**.
- `src/lib/auth.ts` → `getSessionUser(cookies, env)` reads and validates the session on every protected request.
- `src/middleware.ts` guards:
  - All `/admin/*` pages (except `/admin/login`) — redirects to login if unauthenticated.
  - All non-GET `/api/*` routes (except `/api/auth/*`) — returns `401` if unauthenticated.
- Session tokens are never exposed to client-side JavaScript.

## AI Integration

- **Model:** `gemini-2.5-flash` via `@google/genai`
- **Trigger:** `POST /api/upload` — server-side only, never runs in the browser
- **Input:** Image uploaded by admin, sent as base64 `inlineData`
- **Prompt:** Written in Italian; asks Gemini to extract `title`, `event_date` (ISO 8601), `location`, and optional `description` as raw JSON
- **Output:** Parsed JSON returned to the admin form for review before saving
- **Error handling:** Returns `null` on failure; admin can fill fields manually

## Deployment

- **Platform:** Cloudflare Pages with `@astrojs/cloudflare` adapter (SSR via Workers)
- **Config:** `wrangler.jsonc` defines the project name and Pages config
- **Environment variables** are set as Cloudflare secrets:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
- Runtime env is accessed via `context.locals.runtime.env` (Cloudflare Workers pattern)

## Security

| Concern | Mitigation |
|---|---|
| Admin access | Middleware enforces session check on all `/admin` routes and mutating API routes |
| API key exposure | All secrets accessed server-side only via `env`; never in client bundles |
| Clickjacking | `X-Frame-Options: DENY` on all responses |
| MIME sniffing | `X-Content-Type-Options: nosniff` on all responses |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` |
| Permissions | `Permissions-Policy` disables camera, microphone, geolocation |
| Database | RLS ensures public users can only read published events; anon key cannot modify data |
