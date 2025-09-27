# Smart Research Assistant

A modern, full‑stack research assistant built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and OpenAI via the AI SDK. It lets users start a research session, upload supporting files, and receive careful, non‑speculative AI insights that are stored in a Postgres database.

## Features
- **Research sessions**: Kick off a session with a query; results are generated asynchronously by OpenAI and saved to the DB.
- **File uploads**: Upload user documents (PDF/DOC/DOCX/TXT) to Supabase Storage and track records in Postgres.
- **Safe prompting**: System prompt enforces conservative, non-hallucinatory responses and explicit uncertainty.
- **Modern UI stack**: React 18, Radix UI, Shadcn-style utilities, Tailwind CSS 4, and composable components.
- **Supabase integration**: Auth-ready SSR client, storage bucket, and schema migration scripts.
- **Production-ready**: Next.js App Router, TypeScript strict mode, and CI-friendly build settings.

## Tech Stack
- **Framework**: Next.js 14.2.16 (App Router) with TypeScript
- **UI/Styling**: Tailwind CSS 4, Radix UI, class-variance-authority, lucide-react, cmdk
- **AI**: AI SDK with `@ai-sdk/openai` (model usage: `gpt-4o-mini` in server routes)
- **Backend**: Next.js Route Handlers under `app/api/`
- **Database & Storage**: Supabase (Postgres + Storage)
- **Analytics**: `@vercel/analytics`

## Project Structure
```
app/
  api/
    research/
      [sessionId]/route.ts    # GET a research session by id
      route.ts                # POST to start a research session
    upload/route.ts           # POST to upload files to Supabase Storage
  layout.tsx
  page.tsx
  globals.css
components/
lib/
  supabase/
    client.ts
    server.ts                 # SSR client with cookie management
scripts/
  001_create_research_tables.sql
  002_setup_storage_bucket.sql
  003_refresh_schema.sql
next.config.mjs
postcss.config.mjs
tailwind + config (via @tailwindcss/postcss)
tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js 18+ (recommended LTS)
- A Supabase project (URL + anon key)
- An OpenAI API key (for `@ai-sdk/openai`)

### 1) Install dependencies
```bash
pnpm install
# or
npm install
```

### 2) Configure environment
Create a `.env.local` in the project root:
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Notes:
- `lib/supabase/server.ts` requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and will throw if they are missing.
- API routes log whether these vars are set to aid debugging.

### 3) Initialize the database and storage
Run the SQL scripts against your Supabase project (use the Supabase SQL editor or CLI):
- `scripts/001_create_research_tables.sql`
- `scripts/002_setup_storage_bucket.sql`
- `scripts/003_refresh_schema.sql`

These create tables like `research_sessions` and `uploaded_files`, and configure a public storage bucket named `user-uploads`.

### 4) Start the dev server
```bash
npm run dev
# or
pnpm dev
```
Then open http://localhost:3000

## Environment Variables
- `OPENAI_API_KEY` — OpenAI API key used by the AI SDK.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key.

Keep secrets out of version control. `.env.local` is gitignored by default.

## Configuration Highlights
- `next.config.mjs`:
  - `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` for uninterrupted builds.
  - `images.unoptimized: true` for simpler static deployments.
- `tsconfig.json`:
  - Strict mode, `moduleResolution: bundler`, and Next.js TS plugin enabled.

## API Reference

All endpoints are under the Next.js App Router (`app/api/...`).

### POST `/api/research`
Start a research session. Triggers async AI processing and persists results.

Request body (JSON):
```json
{
  "query": "string (required)",
  "liveSearch": false,
  "files": []
}
```

Response (JSON):
```json
{
  "success": true,
  "sessionId": "<uuid>",
  "message": "Research started successfully"
}
```

Behavior:
- Inserts a row into `research_sessions` with `status = processing`.
- Generates results using OpenAI `gpt-4o-mini` via the AI SDK with a strict system prompt.
- On success: updates the session with `status = completed` and a `results` payload:
  ```json
  {
    "keyTakeaways": ["..."],
    "sources": [],
    "detailedInsights": "..."
  }
  ```
- Graceful fallback on JSON parse errors or quota/billing issues.

Example curl:
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"Explain transformers for vision."}'
```

### GET `/api/research/[sessionId]`
Fetch a specific research session by ID.

Response:
- `200 OK` with the session row
- `404` if not found

Example curl:
```bash
curl http://localhost:3000/api/research/<sessionId>
```

### POST `/api/upload`
Upload one or more files to Supabase Storage and record metadata in `uploaded_files`.

Form-data fields:
- `files`: One or many files (PDF, DOC, DOCX, TXT)
- `sessionId`: Optional session ID to associate uploads

Validations:
- Mime types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`
- Max size: 10 MB per file

Notes:
- Uploads to the `user-uploads` bucket. Public file URL is constructed using your Supabase URL.
- Current implementation uses a temporary dummy user id (`test-user-<timestamp>`). Replace with real auth.

Example curl:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@/path/to/file.pdf" \
  -F "sessionId=<sessionId>"
```

## Database & Storage
- `research_sessions` — stores the query, status, results, and timestamps for each session.
- `uploaded_files` — stores metadata for uploaded files, including `storage_path` and public `file_url`.
- Storage bucket: `user-uploads` — created by `002_setup_storage_bucket.sql`.

Review and run SQL under `scripts/` to provision these resources in Supabase.

## Development Scripts
- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Lint

## Implementation Notes
- The AI prompt enforces cautious answers. If the model is unsure, it responds with: "I don't have enough information to answer reliably." See `app/api/research/route.ts`.
- File handling in `app/api/upload/route.ts` converts `File` to `ArrayBuffer` before uploading with Supabase client.
- The Supabase SSR client in `lib/supabase/server.ts` reads/writes cookies safely within App Router constraints.

## Security & Privacy
- Do not log or commit secrets. Keep `.env.local` private.
- Validate and sanitize file uploads. Current filters are minimal; enhance as needed.
- Replace the dummy user id with real authentication (Supabase Auth or your preferred provider).

## Deployment
- Vercel is recommended for Next.js. Set environment variables in your project settings.
- Ensure the storage bucket is public if you rely on public file URLs, or sign URLs on demand.

## License
MIT © Vasant Jevengekar
