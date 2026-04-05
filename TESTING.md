# reti v0.1 — Manual Testing Checklist

## Prerequisites

- [ ] Migration `002_album_and_clients.sql` run in Supabase SQL Editor
- [ ] Migration `003_auth_setup.sql` run in Supabase SQL Editor
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel env vars
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://reti-lemon.vercel.app` in Vercel env vars
- [ ] Supabase Site URL set to `https://reti-lemon.vercel.app/`
- [ ] Supabase redirect URLs include `https://reti-lemon.vercel.app/auth/callback`
- [ ] WASenderApi session active (QR paired)

---

## 1. Auth Flow

### Magic link login
- [ ] Go to `/login` — see login form with email input
- [ ] Enter email, click "Enviar enlace de acceso"
- [ ] See success message "Revisa tu correo"
- [ ] Receive magic link email
- [ ] Click magic link — redirected to `/dashboard`
- [ ] See your email displayed in the header

### Protected routes
- [ ] Open `/dashboard` in incognito — redirected to `/login`
- [ ] Open `/project/any-id` in incognito — redirected to `/login`
- [ ] Hit `/api/tasks?project_id=xxx` in incognito — get 401

### Public routes stay accessible
- [ ] `/login` loads without auth
- [ ] `/api/webhooks/whatsapp` accepts POST without auth
- [ ] `/api/cron/retry` accepts GET without auth

### Logout
- [ ] Click "Salir" button on dashboard — redirected to `/login`
- [ ] Cannot access `/dashboard` after logout without re-authenticating

---

## 2. Project Management

### Create project
- [ ] On `/dashboard`, click "+ Nuevo proyecto"
- [ ] See form with: project name, residente name, residente phone
- [ ] Submit button disabled until all 3 fields are filled
- [ ] Fill all fields, submit — redirected to project overview
- [ ] Return to `/dashboard` — see the project listed

### Project listing
- [ ] Dashboard shows all projects associated with logged-in email
- [ ] Click a project card — navigates to `/project/[id]/overview`

---

## 3. Residente Dashboard (Interactive)

> Test at `/project/[id]` — use a project with existing tasks, or create via WhatsApp first.

### Task completion toggle
- [ ] Each task card shows a checkbox on the left
- [ ] Tap checkbox on a pending task — fills green with checkmark
- [ ] Task title gets strikethrough styling
- [ ] Refresh page — task still shows as completed (persisted)
- [ ] Tap checkbox again — reverts to pending

### Manual task creation
- [ ] See floating "+" button at bottom-right on Tasks tab
- [ ] Tap "+" — bottom sheet form appears
- [ ] Form has: title input, category chips, priority chips
- [ ] Submit disabled when title is empty
- [ ] Type title, select category and priority, tap "Crear tarea"
- [ ] Form closes, new task appears in the list
- [ ] Refresh — task persists

### Edit existing task
- [ ] Tap a task card — TaskDetail opens fullscreen
- [ ] See pencil icon in header
- [ ] Tap pencil — fields become editable (title, description, category, priority)
- [ ] Change the title, tap "Guardar"
- [ ] Close and reopen — change persisted

### Delete task
- [ ] Open TaskDetail for any task
- [ ] See trash icon in header
- [ ] Tap trash — task disappears, returned to task list
- [ ] Refresh — task is gone

### Agent chat from dashboard
- [ ] Open TaskDetail for any task
- [ ] Scroll down to "Chat con el agente" section
- [ ] Type a message, tap "Enviar"
- [ ] See your message (blue bubble, right-aligned)
- [ ] See "Pensando..." loading state
- [ ] Agent responds (gray bubble, left-aligned)
- [ ] Agent response is contextual to the task

---

## 4. Developer Overview

> Test at `/project/[id]/overview`

### Tabs
- [ ] Four tabs visible: Resumen, Actividad, Chat, Clientes
- [ ] Each tab loads its content
- [ ] Active tab has accent underline

### Client management (Clientes tab)
- [ ] Click "Clientes" tab
- [ ] See "+ Agregar" button
- [ ] Click it — form appears (name, phone, unit)
- [ ] Fill name and phone, submit — client appears in list
- [ ] Client shows checkbox for selection

### Client messaging draft
- [ ] Select a client (checkbox)
- [ ] See three template buttons: Avance semanal, Hito alcanzado, Mensaje personalizado
- [ ] Buttons disabled when no client selected
- [ ] Click "Avance semanal" — see "Generando borrador..."
- [ ] Draft review modal appears with generated text
- [ ] Text is editable in the textarea
- [ ] Can click "Cancelar" to dismiss

### Client messaging send
- [ ] With draft modal open, click "Enviar a clientes"
- [ ] See "Enviando..." state
- [ ] Success message appears: "Enviado a X cliente(s)"
- [ ] **Verify:** client received WhatsApp message on their phone

---

## 5. lowkey Design System

### Visual checks (any page)
- [ ] Font is Inter (not Geist)
- [ ] Background is off-white (#FAFAF8), not pure white
- [ ] Accent color is Martin Blue (#4A7A90), not generic blue
- [ ] Card borders are subtle (#E8E8E6), no drop shadows
- [ ] Border radii are tight (4-8px), not rounded-xl (12px)
- [ ] Header has subtle grid texture (bg-stars-faint)
- [ ] Section labels are uppercase, small, tracked-out, muted color
- [ ] Category badges use lowkey palette (green for expense, blue for progress, etc.)

---

## 6. WhatsApp Agent (existing v0 flows)

> Send these messages from the residente's WhatsApp to the reti number.

### Text messages
- [ ] Send "Terminamos el colado del segundo piso" — agent creates task, confirms
- [ ] Dashboard updates within 15 seconds (polling)

### Voice notes
- [ ] Send a voice note in Spanish — agent transcribes and creates task
- [ ] Transcription visible in Chat tab on developer overview

### Photo with caption
- [ ] Send a photo with caption "Avance de la losa" — task created with photo
- [ ] Photo visible on Fotos tab

### Photo without caption
- [ ] Send a photo with no caption — agent asks "¿Avance, problema, o gasto?"

### Expense text
- [ ] Send "Compré 50 blocks a $12 cada uno en Materiales García"
- [ ] Agent creates expense task with amount $600, vendor, and itemized breakdown
- [ ] Visible on Gastos tab

### Task completion from WhatsApp
- [ ] With an existing pending task, send "Ya terminé [task title]"
- [ ] Agent marks it as completed

### Receipt photo
- [ ] Send a photo of a receipt/ticket with caption "Gasto de materiales"
- [ ] Agent extracts vendor and amount, creates expense task

---

## 7. v0.1 Infrastructure

### Conversation memory
- [ ] Send a photo without caption — agent asks what it's about
- [ ] Reply "Avance" — agent understands the context and creates the right task
- [ ] (Previously, agent had no memory and wouldn't know what "Avance" referred to)

### Album grouping (multi-photo)
- [ ] Send 3 photos at once (select multiple in WhatsApp)
- [ ] Agent creates ONE task (not 3 separate tasks)
- [ ] All 3 photos attached to the same task

### Rate limit handling
- [ ] Send multiple messages quickly — no 429 errors in Vercel logs
- [ ] (If on WASenderApi free tier, rate limits will still apply — upgrade to paid for real testing)

### Error retry
- [ ] Check `/api/cron/retry` endpoint manually — returns `{ ok: true, retried: 0 }` if no stale messages
- [ ] Cron runs daily at 6am UTC

---

## 8. Edge Cases

- [ ] Login with email not associated with any project — dashboard shows empty, can create project
- [ ] Create a project, then check residente can access via `/project/[id]` (currently no auth on project pages beyond middleware)
- [ ] Complete a task from dashboard, then send a WhatsApp message — agent knows task is completed
- [ ] Edit a task title from dashboard — developer overview activity feed reflects the change
- [ ] Send client update to an opted-out client — message is NOT sent

---

## Test Results

| Area | Pass | Fail | Notes |
|------|------|------|-------|
| Auth | | | |
| Project management | | | |
| Interactive dashboard | | | |
| Developer overview | | | |
| Design system | | | |
| WhatsApp agent | | | |
| Infrastructure | | | |
| Edge cases | | | |

**Tested by:** _______________
**Date:** _______________
**Build:** _______________
