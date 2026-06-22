# Pulp — Design System

> **Punk-utilitarian.** Software you own, not software that owns you. The interface looks like a tool — a terminal, a printing press, a piece of equipment — not a feed. Every element earns its place. No ranking, no infinite scroll, no decoration for decoration's sake.

**Implemented in:** design tokens live in `app/globals.css`; fonts are loaded in `app/layout.tsx`. This document is the spec — keep it and those files in sync.

---

## 1. Principles

1. **The tool shows its work.** Monospace labels, file paths (`~/today/digest.txt`), shell prompts (`$ show me —`), status readouts (`rss · 41 sources`). The UI reads like a machine reporting honestly, never like a brand performing.
2. **Hard edges, no apology.** 2px solid borders, square corners, hard offset shadows. Nothing is soft, rounded, blurred, or gradient. Punk is direct.
3. **Black ink, white paper, one loud accent.** High contrast is the whole palette. Color is used sparingly and on purpose — a highlighter swipe, never a wash.
4. **Content over chrome.** Headlines and source data are the design. Structure is hairlines and grids, not cards and containers.
5. **Honest copy.** The voice states what the machine did: *"no ranking applied," "you asked, we fetched — nothing more."* Never markety, never cute about it.

---

## 2. Color

Tokens are CSS custom properties on the root, defined in `app/globals.css`. Light is default; dark is a true invert (the accent stays put).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `oklch(0.99 0 0)` | `oklch(0.17 0.004 250)` | Page background |
| `--ink` | `oklch(0.17 0 0)` | `oklch(0.95 0.004 250)` | Text, borders, fills |
| `--soft` | `oklch(0.44 0 0)` | `oklch(0.66 0.006 250)` | Secondary text, deks, meta |
| `--line` | `ink / 0.14` | `ink / 0.16` | Hairline dividers |
| `--acid` | accent (see below) | accent | Highlights, the one loud move |
| `--acidink` | `color-mix(in oklab, var(--acid), black 40%)` | `…white 12%` | Accent used as *text* (kept readable) |

**Accent options** (curated, not a free picker). Default is **Safety Orange**:

- `#FF5A1F` — Safety Orange **(default)**
- `#BCE000` — Acid Lime
- `#2F6BFF` — Electric Blue
- `#FF2D8E` — Hot Magenta

**Rules**
- Exactly **one** accent on screen at a time.
- Bright accent (`--acid`) only as a *fill* behind dark text or as a small block. For accent-colored **text**, always use `--acidink` so it stays legible on paper.
- Text selection is accent-on-near-black: `::selection { background: var(--acid); color: #111; }`.
- Neutrals are pure/near-pure (chroma ≈ 0). No tinted grays in light mode; a faint cool tint (`hue 250`) in dark mode only.

---

## 3. Typography

Three families, each with a job. Fonts are loaded in `app/layout.tsx` and exposed as family variables (`--display`, etc.) in `app/globals.css`. Headlines are swappable (`grotesk` default / `serif` / `mono`); UI labels are **always** mono.

| Role | Family | Notes |
|---|---|---|
| Display / headlines | **Space Grotesk** (var `--display`) | weight 500, `letter-spacing: -0.01em`, `text-wrap: balance` |
| Body / deks | **Space Grotesk** | 14.5px, `line-height: 1.45`, color `--soft`, `max-width: 64ch` |
| Labels / system / data | **JetBrains Mono** | UPPERCASE, `letter-spacing: .04–.12em`, 10.5–13px |
| Headline alt | Newsreader (serif) / JetBrains Mono | selectable via the `display` tweak |

**Conventions**
- Anything the *machine* says is monospace: paths, prompts, status, tags, read-times, stamps.
- Anything a *human* wrote (headlines, deks, the prompt) is the display font.
- Tabular numerals for read-times and counts.
- Negative tracking on display, generous positive tracking on mono labels — the contrast between the two voices is the type system.

---

## 4. Shape, line & shadow

- **Borders:** structural = `2px solid var(--ink)`; dividers = `1px solid var(--line)`.
- **Corners:** `border-radius: 0` everywhere. No exceptions.
- **Shadow:** one kind only — a hard offset block, `box-shadow: 5px 5px 0 var(--ink)`. Used on the primary button; collapses on press (`3px 3px` hover, `0 0` active) with an equal `translate` so the button physically "presses in."
- **No** blur, glow, soft drop-shadow, or gradient anywhere.

---

## 5. Spacing & layout

- Content column: `max-width: 980px`, centered. Page padding `clamp(20px, 5vw, 56px)`.
- **Density** scales row rhythm (tweakable). Default is **comfy**:

| Density | Row padding | Headline | List gap |
|---|---|---|---|
| compact | 16px | 19px | 34px |
| regular | 22px | 21px | 40px |
| comfy **(default)** | 30px | 23px | 52px |

- Lists are CSS **grid** with explicit `gap` (`[idx] [content] [read]`), never inline flow. Collapses to 2 columns under 560px.
- Sticky header bar, 2px bottom rule, accent square logo mark.

---

## 6. Components

**Console (prompt input)**
- Bordered box with a black title bar showing the file path and a 3-dot window control (one dot filled accent).
- Body: mono prefix `$ show me —`, then a borderless auto-growing textarea in the display font. The input *is* the headline.

**Primary button — `Generate ▸ 5-min`**
- Accent fill, 2px ink border, mono uppercase label, hard offset shadow that presses in on click. Disabled → 50% opacity, shadow frozen.

**Digest row**
- Grid: `[NN] · source/tag/time + headline + dek · read-time`.
- Index in `--acidink` mono brackets `[01]`. Source line is mono uppercase with a bordered tag chip. Hairline divider between rows.

**Status / stamps**
- `● rss · 41 sources` with a live accent dot. Black inverted stamp blocks for declarations: `NO ALGORITHM`.

**Loading state**
- Five accent bars doing a staggered equalizer pulse + honest mono status: *"reading 41 sources · matching your request · trimming to 5 minutes."*

---

## 7. Voice & copy

- Plainspoken, technical, a little defiant. The product narrates its mechanism.
- Recurring lines: *"No ranking. No feed. Just what you asked for."* · *"you asked, we fetched — nothing more."* · *"local-first."* · *"no ranking applied."*
- Lowercase for machine asides (`// …`, `~/path`), UPPERCASE for declarations (`NO ALGORITHM`).
- Never use exclamatory marketing, emoji, or "AI magic" framing. The whole point is that there's no algorithm hiding from you.

---

## 8. Don'ts

- ✗ Rounded corners, soft shadows, gradients, glassmorphism.
- ✗ More than one accent color on screen.
- ✗ Bright accent as body text (use `--acidink`).
- ✗ Tinted grays in light mode.
- ✗ Inline-flow spacing for groups — use flex/grid `gap`.
- ✗ Decorative imagery or icon soup. If it isn't content or structure, cut it.
