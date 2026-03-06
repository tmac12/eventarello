# Eventarello

Platform for discovering and organizing local events — concerts, exhibitions, parties, workshops, and more.

**Live:** [eventarello.pages.dev](https://eventarello.pages.dev)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (SSR) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth (email/password) |
| AI | Google Gemini 2.5 Flash |
| Validation | Zod |
| Deployment | Cloudflare Pages |

## Project Structure

```
src/
├── components/        # React components (Timeline, EventCard, UploadForm, etc.)
├── layouts/           # Astro layouts (Base, Public, Admin)
├── lib/               # Utilities, Supabase client, Zod schemas
├── pages/
│   ├── api/
│   │   ├── auth/      # POST /login, POST /logout
│   │   ├── events/    # CRUD: GET, POST, PUT /[id], DELETE /[id]
│   │   ├── upload.ts  # Image upload + Gemini AI extraction
│   │   └── views.ts   # Page view tracking
│   ├── admin/         # Protected dashboard & login
│   ├── contact.astro
│   └── index.astro
├── styles/            # Global CSS, theme variables
└── middleware.ts      # Auth guard, token refresh, security headers
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI](https://ai.google.dev) API key (for Gemini)

### Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key

PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Install & Run

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## API Routes

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | Fetch published events (`?all=true` for all) |
| `POST` | `/api/views` | Track page views |

### Protected (requires auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/events` | Create event |
| `PUT` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event + cleanup image |
| `POST` | `/api/upload` | Upload image, extract event data via Gemini |
| `POST` | `/api/auth/login` | Login (email/password) |
| `POST` | `/api/auth/logout` | Logout |

## Key Features

### AI-Powered Event Extraction

Upload an event poster or flyer and Gemini automatically extracts title, date, location, and description. The extracted data can be reviewed and edited before publishing.

- Accepts JPEG, PNG, WebP (max 5MB)
- Outputs structured data with ISO 8601 dates

### Theme System

Light/dark mode with CSS custom properties (`--th-*`). Persisted in `localStorage`, defaults to system preference.

### Security

- Auth tokens stored in secure HTTPOnly cookies with automatic refresh
- Protected routes enforced via middleware
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

## Database Schema

### `events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Event title |
| `event_date` | timestamptz | Event date/time |
| `location` | text | Venue or address |
| `description` | text | Optional description |
| `url` | text | Optional external link |
| `image_url` | text | Public image URL |
| `image_path` | text | Storage path (for cleanup) |
| `status` | text | `draft` or `published` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

### `page_views`

| Column | Type | Description |
|--------|------|-------------|
| `page` | text | Page path |
| `user_agent` | text | Browser user agent |
| `referrer` | text | Referrer URL |
| `created_at` | timestamptz | View timestamp |

## License

MIT
