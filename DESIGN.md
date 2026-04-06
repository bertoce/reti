# reti — Design System

## The Feeling

reti should feel like opening a beautiful architect's field notebook. Not a tech product. Not a dashboard. A notebook that happens to be intelligent.

The people using this — residentes, developers, architects — are visually sensitive. They notice when something is cheap. They notice when something is considered. The interface should feel like it was made by someone who understands their world: precise, warm, quiet, confident.

**Reference spaces, not software:**
- Tadao Ando's concrete and light — precise geometry with warmth and soul
- Teshima Art Museum — organic intimacy, not grand gestures
- A Kyoto ambient space — natural, contemplative, lived-in but precise
- An architect's Moleskine graph-paper notebook — the grid is the surface

**Not this:**
- White American museum walls (MoMA, Gagosian) — too clinical, too cold
- Generic SaaS dashboards — too busy, too corporate
- Chat apps (WhatsApp clones) — too casual, too digital

---

## The Grid

The Agnes Martin "Stars" grid pattern is the foundation of every surface. It's not decoration. It IS the product.

Every page sits on graph paper. The grid shows through headers (via `backdrop-blur`). Content is written on the notebook, not placed in floating boxes.

**Two intensities:**
- `bg-stars` — full strength, used on the login page and empty states where the grid is the primary visual
- `bg-stars-faint` — present but subtle, used on all dashboard surfaces (residente, developer, project list)

The grid is 32px × 32px. Martin Blue dots at intersections, hairline rules between. This rhythm should inform spacing decisions — 32px multiples feel natural on this surface.

---

## Palette

Warm concrete and paper, not digital white and black.

| Token | Value | Feeling |
|-------|-------|---------|
| `--background` | `#F7F6F3` | Washi paper. Warm off-white, not sterile. |
| `--foreground` | `#2C2C28` | Concrete dark. Readable but not harsh. |
| `--muted` | `#8A8A82` | Warm stone gray. For secondary text. |
| `--border` | `#E0DED8` | Sand. Hairline dividers, card edges. |
| `--card` | `#FFFFFE` | Paper white. Slightly warmer than pure white. |
| `--subtle` | `#EEECEA` | Paper texture. Placeholder backgrounds. |
| `--paper` | `#F2F1ED` | Layered surface. Between background and card. |
| `--accent` / `--martin-blue` | `#4A7A90` | The sole accent. Desaturated cerulean. Sky through linen. |
| `--success` | `#4A7C59` | Muted forest green. Completions. |
| `--warning` | `#C4841D` | Warm amber. Issues, alerts. |
| `--danger` | `#B5332E` | Muted red. Problems, deletions. |

**Rules:**
- Martin Blue is the ONLY accent color. No other blues, purples, or bright colors.
- No pure black (#000). Use `--foreground` (#2C2C28).
- No pure white (#FFF). Use `--card` (#FFFFFE) or `--background` (#F7F6F3).
- No neutral grays. Every gray has warmth.
- Semantic colors (success, warning, danger) are desaturated. They inform, they don't shout.

---

## Typography

Inter is the typeface. It's clean, precise, and has the right character for technical-but-warm.

**Hierarchy:**
- **Section labels** — `section-label` class. 10px, uppercase, 0.14em tracking, Martin Blue. These are the architect's annotations on the grid. Use them to introduce every content group.
- **Body text** — 15px (`text-[0.9375rem]`), `--foreground`, relaxed leading. Readable on the warm paper surface.
- **Card titles** — 14px, `font-medium`, `tracking-tight`. Dense but clear.
- **Stat numbers** — `text-2xl font-bold tabular-nums`. Numbers should align like a ledger.
- **Display** — `text-display` class. 44px, -0.03em tracking, semibold. Used sparingly (login page, empty states).

**Rules:**
- Always use `tracking-tight` on headings. Compress them slightly for editorial density.
- Always use `tabular-nums` on currency amounts and counts. Numbers align.
- Always use `leading-relaxed` on body text. Let it breathe.
- Section labels are Martin Blue, not gray. They're annotations, not afterthoughts.

---

## Surfaces and Containers

**Philosophy:** Content sits on the notebook page. Use borders and spacing to separate, not boxes.

**When to use `card`:**
- Self-contained items in a list (task cards, expense cards, client cards)
- Forms and modals that need to lift off the grid surface
- Stat cards in the summary view

**When NOT to use `card`:**
- Section separation — use a `border-t border-border` divider instead
- Grouping related content — use a `section-label` header and spacing instead
- Page backgrounds — let the grid show through

**Card rules:**
- 3px border-radius. Precise, not soft.
- 1px `--border` edge. No drop shadows.
- `card-interactive` adds hover: border goes Martin Blue, card lifts 1px.

**Headers:**
- Use `bg-card/90 backdrop-blur-sm` so the grid shows through. The header is glass over the notebook, not an opaque bar.

---

## Buttons

Three tiers, all with contemplative timing (300ms cubic-bezier).

| Class | When to use |
|-------|-------------|
| `btn-primary` | The one action that matters. Martin Blue background. |
| `btn-secondary` | Alternative actions. Border only, accent on hover. |
| `btn-ghost` | Tertiary (cancel, dismiss). Text only. |

**Micro-interaction:** All buttons lift 1px on hover with a spring-like ease (`cubic-bezier(0.16, 1, 0.3, 1)`). Press returns to origin with a fast 100ms snap. This feels physical — like pressing a key on a mechanical keyboard.

**Rules:**
- Font size 13px (`0.8125rem`), medium weight, slight letter-spacing.
- 3px radius. Not rounded.
- Disabled state: `opacity-40`, no hover transform.

---

## Inputs

Editorial style. Bottom-border only. No box.

Use the `input-editorial` class. These should feel like writing on a ruled line in the notebook, not filling out a web form.

- Focus state: bottom border turns Martin Blue.
- Placeholder text: muted at 60% opacity. Whispered, not stated.
- Transition: 300ms. Slow enough to notice, fast enough to not annoy.

---

## Chips and Badges

Two types:

**`chip`** — Read-only labels. Category badges on task cards. Tiny (10px), 2px radius, colored backgrounds from the semantic palette.

**`chip-select` / `chip-select-active`** — Interactive filter chips. Solid white background when unselected (not transparent — they must read clearly against the grid). Martin Blue when active. Used for status filters, category selectors, priority selectors.

---

## Photos

All photos use the `photo-warm` filter: `saturate(0.92) brightness(1.01) sepia(0.04)`. This desaturates slightly and adds warmth — construction site photos look better when they're not oversaturated digital captures.

Photo containers use `bg-subtle` as the loading placeholder, not gray.

Lightbox uses `bg-foreground/95` — the warm dark, not harsh `bg-black`.

---

## Transitions and Motion

Everything moves at 300ms with `cubic-bezier(0.16, 1, 0.3, 1)` — a spring-like ease that starts fast and settles slowly. This creates a contemplative, physical feel.

Exception: active/press states snap back at 100ms. The release should feel immediate.

**No animations for the sake of animation.** Motion exists to:
- Confirm an interaction (button lift)
- Indicate state change (border color shift)
- Reveal content (form slide-up)

---

## Approaching New Features

When building something new for reti, ask these questions:

### 1. Does this feel like writing in a notebook?
If you're designing a new view or component, imagine the user has a graph-paper notebook in front of them. How would this information be organized on that page? Section headings would be small uppercase annotations. Data would be in clean columns. Dividers would be pencil lines, not boxes.

### 2. Am I adding boxes or using the surface?
Default to spacing and hairline rules. Only use `card` when the content is a distinct, tappable item. If it's a section of information, use a `section-label` header and let the content breathe on the grid.

### 3. Is the color justified?
Martin Blue is the only accent. Semantic colors (success, warning, danger) are only for semantic meaning (completed, issue, error). Everything else is foreground, muted, or border. If you're reaching for a color, ask why.

### 4. Does it feel warm?
Check for neutral grays, pure blacks, or pure whites. They'll feel cold against the warm palette. Use the design tokens. If a new shade is needed, keep it warm — no blue-grays, no cool neutrals.

### 5. Is the timing contemplative?
300ms for reveals and transitions. 100ms for press feedback. No instant snaps (feels cheap), no slow fades (feels sluggish). The spring-like cubic-bezier curve is the default.

### 6. Would an architect appreciate this?
These users notice alignment, proportion, and precision. Grid-align when possible (32px multiples). Use `tabular-nums` for any numbers. Keep text tight (`tracking-tight` on headings) but give sections generous breathing room.

---

## Utility Class Reference

| Class | What it does |
|-------|-------------|
| `bg-stars` | Full-strength grid pattern |
| `bg-stars-faint` | Subtle grid for dashboard surfaces |
| `section-label` | 10px uppercase Martin Blue annotation |
| `input-editorial` | Bottom-border-only input field |
| `card` | Bordered container, 3px radius |
| `card-interactive` | Card with hover lift and accent border |
| `chip` | Tiny read-only label badge |
| `chip-select` | Interactive chip (unselected, solid bg) |
| `chip-select-active` | Interactive chip (selected, Martin Blue) |
| `btn-primary` | Main action button (Martin Blue) |
| `btn-secondary` | Alternative action (border, accent hover) |
| `btn-ghost` | Tertiary action (text only) |
| `photo-warm` | Warm desaturation filter for photos |
| `link-reveal` | Animated underline on hover |
| `text-display` | 44px display heading |
| `text-title` | 32px title heading |
| `text-heading` | 24px section heading |
