# reti

A B2B platform for residential construction sites in Mexico/LATAM. A residente de obra (site supervisor) messages an AI agent via WhatsApp with tasks, photos, expenses, and progress reports. The agent processes everything and organizes it into a clean web platform. Both the residente and the developer can view the organized data.

## How It Works

```
Residente sends WhatsApp message (text, photo, voice, receipt)
     |
     v
WASenderApi (WhatsApp bridge, QR code pairing)
     |
     v
/api/webhooks/whatsapp -> stores message -> processes with Claude
     |
     v
Claude agent creates tasks, logs expenses, organizes photos
     |
     v
Sends WhatsApp confirmation back to residente
     |
     v
Two dashboards:
  /project/[id]          -- Residente (mobile-first: tasks, expenses, photos)
  /project/[id]/overview -- Developer (read-only: summary, activity, chat log)
```

## Tech Stack

- **Next.js 15** + TypeScript + Tailwind CSS
- **Supabase** -- PostgreSQL + Storage + RLS
- **WASenderApi** -- unofficial WhatsApp bridge ($6/mo, QR code pairing)
- **Claude API** (Sonnet) -- message processing with tool use
- **Groq Whisper** -- Spanish voice note transcription
- **Vercel** -- deployment

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Run `supabase/schema.sql` in the Supabase SQL Editor to create the 4 tables (`projects`, `site_tasks`, `site_photos`, `site_messages`) and the `site-photos` storage bucket.

### 3. Seed a project

```sql
INSERT INTO projects (name, residente_name, residente_phone)
VALUES ('Mi Proyecto', 'Nombre del Residente', '1234567890')
RETURNING id;
```

The `residente_phone` must match the format WASenderApi sends (digits only, with country code, no `+`).

### 4. Set up WASenderApi

Create a session at wasenderapi.com, scan the QR code with WhatsApp, and configure the webhook:

- **Payload URL:** `https://your-domain.vercel.app/api/webhooks/whatsapp`
- **Subscriptions:** only `messages.received`
- **Message filtering:** ignore groups, broadcasts, channels

### 5. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
WASENDER_API_KEY=your-wasender-api-key
GROQ_API_KEY=your-groq-api-key
```

`WASENDER_SESSION_ID` and `WASENDER_WEBHOOK_SECRET` are optional. The API key serves as the Bearer token, and signature verification uses the `x-webhook-signature` header matched against `WASENDER_WEBHOOK_SECRET`.

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy

Push to GitHub and connect to Vercel. Add the same env vars in Vercel Settings > Environment Variables. Redeploy after adding them.

## Project Structure

```
src/
  app/
    api/
      webhooks/whatsapp/    -- receives WhatsApp messages from WASenderApi
      agent/process/        -- processes messages with Claude (also used for retries)
      tasks/                -- GET tasks with filters
      photos/               -- GET photos with filters
      messages/             -- GET message history
      project/              -- GET project summary + stats
    project/
      [id]/
        page.tsx            -- Residente dashboard (tasks, expenses, photos)
        overview/
          page.tsx          -- Developer dashboard (summary, activity, chat)
  components/
    TaskCard.tsx            -- Task card with photo, category, priority
    TaskDetail.tsx          -- Full task overlay with expense breakdown
    TaskList.tsx            -- Filterable task list grouped by status
    ExpenseTab.tsx          -- Expense summary + list
    PhotoGrid.tsx           -- Photo grid with lightbox
    SummaryCards.tsx        -- Developer summary cards
    ActivityFeed.tsx        -- Chronological activity feed
    ChatLog.tsx             -- Read-only WhatsApp conversation view
  lib/
    agent.ts                -- Claude agent: system prompt, tools, processing loop
    wasender.ts             -- WASenderApi client: send messages, download media, parse webhooks
    media.ts                -- Media processing: upload to Supabase, voice transcription via Groq
    supabase.ts             -- Supabase client + TypeScript types
    format.ts               -- Spanish formatting utilities (currency, dates, categories)
```

## Tests

```bash
npm test
```

146 tests across 18 files covering all lib functions, API routes, and components. Uses Vitest + @testing-library/react.

## Architecture Docs

- `../architecture.md` -- full product vision (v1+)
- `../architecture-v0.md` -- pilot architecture, build plan, data model, agent tools

## Key Technical Decisions

- **Expenses are tasks** with `category='expense'` and extra fields (`expense_amount`, `expense_items` JSONB, `receipt_url`). Avoids a separate table for v0.
- **`site_messages.processed` boolean** acts as a job queue. No separate queue system needed.
- **Messages processed inline** in the webhook handler (not fire-and-forget). Vercel kills serverless functions after response is sent, so async fetch to a separate endpoint doesn't work.
- **WASenderApi uses LID format** for `remoteJid` but provides `cleanedSenderPn` with the real phone number. The parser falls back through `cleanedSenderPn` > `senderPn` > `remoteJid`.
- **No auth for v0.** Dashboard URLs use the project UUID as a pseudo-secret. Good enough for a pilot.
- **15-second polling** on both dashboards for near-real-time data updates.
