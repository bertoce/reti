# Changelog

## [2026-04-04] — v0 Build Complete + Live Deployment

### Accomplished
- Built the entire v0 pipeline across 4 build sessions: WhatsApp pipe, Claude agent brain, residente dashboard, developer overview
- Deployed to Vercel (reti-lemon.vercel.app) and connected WASenderApi webhook
- Successfully tested the full end-to-end loop: WhatsApp message in -> Claude processes -> task created -> WhatsApp confirmation sent back -> dashboards update
- Set up Supabase project with schema, GitHub repo (bertoce/reti), and all API keys (Anthropic, Groq, WASenderApi)
- 146 tests passing across 18 test files

### Decisions Made
- **Product renamed from "site-tracker" to "reti"** — cleaner name, folder and all references updated
- **Expenses modeled as tasks** (category='expense' with extra fields) rather than a separate table — keeps the v0 schema to 4 tables
- **Messages processed inline in webhook handler** — Vercel kills fire-and-forget fetches after response is sent, so the original async pattern didn't work
- **No auth for v0** — project UUID in the URL acts as a pseudo-secret, sufficient for pilot
- **Phone numbers stored without `+` prefix** — matches WASenderApi's `cleanedSenderPn` format

### Learnings
- WASenderApi's actual webhook payload structure differs significantly from what was assumed: messages are nested inside `data.messages`, not at the top level
- WASenderApi uses LID addressing for `remoteJid` — the real phone number is in `cleanedSenderPn` or `senderPn`
- WASenderApi's send-message API is `POST www.wasenderapi.com/api/send-message` with Bearer token auth — no session ID in the URL path
- The npm package for Claude is `@anthropic-ai/sdk` (not `anthropic`), and types live under `Anthropic.Messages` namespace
- Vercel serverless functions terminate immediately after response — cannot rely on fire-and-forget patterns

### Files Changed
- `README.md` — replaced default Next.js readme with full project documentation
- `CHANGELOG.md` — created (this file)
- `../architecture-v0.md` — updated build plan to reflect completion, added pilot project info, technical learnings section, and Vercel URL
- `src/lib/wasender.ts` — fixed base URL (`www.wasenderapi.com/api`), removed session ID from send-message URL, updated webhook parser for actual payload structure
- `src/app/api/webhooks/whatsapp/route.ts` — switched from fire-and-forget to inline agent processing, added debug logging
- `src/__tests__/lib/wasender.test.ts` — updated tests for new payload structure and API endpoints
- `src/__tests__/api/webhook.test.ts` — updated tests for inline processing pattern
- Removed `.DS_Store` files
