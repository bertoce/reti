# reti

Construction site tracking powered by AI. A residente de obra messages a Claude agent via WhatsApp — tasks, photos, expenses, voice notes. The agent organizes everything into a clean platform for the residente and the developer.

## How It Works

```
WhatsApp message (text, photo, voice, receipt)
  → WASenderApi webhook
  → Claude agent processes (creates tasks, logs expenses, organizes photos)
  → WhatsApp confirmation back to residente
  → Two dashboards update in real time

/login                    → Magic link auth
/dashboard                → Project list + creation
/project/[id]             → Residente view (tasks, expenses, photos)
/project/[id]/overview    → Developer view (summary, activity, chat, client messaging)
```

## Tech Stack

- **Next.js 16** + TypeScript + Tailwind CSS v4
- **Supabase** — PostgreSQL + Storage + Auth (magic link)
- **WASenderApi** — WhatsApp bridge (QR code pairing)
- **Claude API** (Sonnet 4) — message processing with tool use
- **Groq Whisper** — Spanish voice transcription
- **Vercel** — deployment + cron

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
WASENDER_API_KEY=your-wasender-api-key
GROQ_API_KEY=your-groq-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Database

Run these migrations in order in the Supabase SQL Editor:

1. `supabase/schema.sql` — base tables (projects, site_tasks, site_photos, site_messages, storage bucket)
2. `supabase/migrations/002_album_and_clients.sql` — album grouping columns + clients table
3. `supabase/migrations/003_auth_setup.sql` — auth indexes

### 4. Supabase Auth

- Authentication > Providers: enable Email with magic link
- Authentication > User Signups: disable "Confirm email"
- Authentication > URL Configuration: set Site URL to your domain, add redirect URLs for `/auth/callback`

### 5. WASenderApi

Create a session at wasenderapi.com, scan QR with WhatsApp:

- **Webhook URL:** `https://your-domain.vercel.app/api/webhooks/whatsapp`
- **Subscriptions:** `messages.received` only
- **Filtering:** ignore groups, broadcasts, channels

### 6. Run

```bash
npm run dev
```

## Project Structure

```
src/
  app/
    api/
      auth/login/           — send magic link OTP
      auth/callback/        — exchange code for session
      webhooks/whatsapp/    — receive + process WhatsApp messages
      agent/chat/           — dashboard agent conversations
      agent/process/        — manual message reprocessing
      tasks/                — GET (list), POST (create)
      tasks/[id]/           — PATCH (update), DELETE
      clients/              — GET (list), POST (create)
      messages/             — GET (history)
      messages/draft/       — POST (agent generates client update)
      messages/send/        — POST (send to clients via WhatsApp)
      photos/               — GET (list)
      project/              — GET (summary + stats)
      projects/             — GET (user's projects), POST (create)
      cron/retry/           — GET (reprocess stale messages)
    login/                  — login page
    dashboard/              — project list + creation
    project/[id]/           — residente dashboard
    project/[id]/overview/  — developer dashboard
  components/
    LoginForm.tsx           — magic link email form
    ProjectSetup.tsx        — new project form
    TaskCard.tsx            — task card with completion toggle
    TaskDetail.tsx          — editable task detail with agent chat
    TaskList.tsx            — filterable list grouped by status
    TaskCreationForm.tsx    — FAB + creation form
    AgentChat.tsx           — chat with Claude from dashboard
    ExpenseTab.tsx          — expense summary + list
    PhotoGrid.tsx           — photo grid with lightbox
    SummaryCards.tsx        — developer summary stats
    ActivityFeed.tsx        — timeline activity feed
    ChatLog.tsx             — WhatsApp conversation view
    ClientList.tsx          — client selection list
    ClientForm.tsx          — add client form
    ClientUpdatesTab.tsx    — client messaging workflow
    DraftReviewModal.tsx    — review + send client message
  lib/
    agent.ts                — Claude agent (tools, processing, conversation memory, client drafts)
    wasender.ts             — WASenderApi client (send, decrypt, parse, retry on 429)
    media.ts                — media processing (upload to Supabase, voice transcription)
    supabase.ts             — Supabase client + TypeScript types
    auth.ts                 — browser auth client + role helper
    format.ts               — Spanish formatting (currency, dates, categories)
    phone.ts                — phone number normalization
    task-summary.ts         — task aggregation helper
  middleware.ts             — auth protection for all routes
```

## Tests

```bash
npm test            # run once
npm run test:watch  # watch mode
```

244 tests across 34 files. Vitest + @testing-library/react.

## Documentation

- [`DESIGN.md`](DESIGN.md) — design system: palette, typography, components, philosophy
- [`TESTING.md`](TESTING.md) — manual testing checklist (70+ items)
- [`../architecture.md`](../architecture.md) — full product architecture

## Key Decisions

- **Magic link auth** — email OTP via Supabase, no passwords
- **Expenses are tasks** with `category='expense'` + extra fields. No separate table.
- **Messages processed inline** in the webhook handler. Vercel kills fire-and-forget.
- **Conversation memory** — last 10 messages loaded into Claude context for continuity.
- **Album grouping** — multi-photo WhatsApp messages grouped into one task.
- **Phone normalization** — stored as digits only, matching WASenderApi format.
- **Client messaging** — agent drafts, developer approves. Never autonomous.
- **Daily retry cron** — reprocesses stale unprocessed messages (Vercel Hobby tier).
