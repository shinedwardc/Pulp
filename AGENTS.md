# AGENTS.md

Working agreement for AI agents (and humans) contributing to **Pulp** — a personal,
self-owned news digest. Read this first. It links out to the deeper docs rather than
repeating them, so treat those as the source of truth where pointed:

- **[README.md](README.md)** — what Pulp is, how it works, configuration, roadmap.
- **[DESIGN.md](DESIGN.md)** — the punk-utilitarian design system. **Authoritative for any UI work.**

The guiding principle of the whole project: **the AI is a swappable convenience, never an
owner.** Keep model usage isolated and the rest of the app working without it.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, `strict` mode |
| Runtime | Node.js 20+ |
| Package manager | **pnpm** |
| Styling | Tailwind CSS v4 (PostCSS) |
| Lint/format | Biome |
| LLM | Anthropic API (Claude), isolated to the single boundary in `app/lib/digest.ts` (§4) |

Import alias: `@/*` maps to the repo root (see `tsconfig.json`). Prefer `@/app/lib/...`
over long relative paths.

---

## 2. Repo map

This is a **coarse orientation map — directory responsibilities and the few
architecturally load-bearing files, not a file-by-file index.** It changes only when the
top-level structure or the architecture changes, so you won't need to touch it for routine
file additions. If you add a new top-level directory or move a boundary, update it; otherwise
leave it alone.

| Path | Responsibility |
|---|---|
| `app/` | The Next.js App Router application — pages, layout, the API route, and `lib/`. |
| `app/api/digest/` | The single API endpoint: validate request → fetch feed → summarize. |
| `app/lib/` | Server-side logic. **`digest.ts` is the only LLM boundary (see §4); `feed.ts` does RSS fetch + de-dupe and touches no model.** |
| `assets/` | Static files only — SVGs, JPGs (e.g. the citrus logo mark). No code. |
| `documents/` | Working notes: the learning process and architecture / system-design decisions and changes over time. Also reserved for user digests / uploads / markdown docs. **Not application code — don't import from here.** |
| root configs | `biome.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `pnpm-workspace.yaml`. |
| `.env.local` | Secrets — git-ignored, never committed (see §6). |

The request → response data flow is documented in **README.md → "How it works"**. Don't
duplicate it here; update it there.

---

## 3. Where conventions live

| Topic | Source of truth |
|---|---|
| Code style & lint rules | `biome.json` + §5 below |
| UI / visual design (color, type, spacing, components, voice) | **DESIGN.md** — follow it exactly |
| Architecture & the LLM boundary | §4 below + README "How it works" |
| Config / env vars | README "Configuration" + §6 |
| TypeScript compiler settings | `tsconfig.json` |
| Branch & commit naming | §10 (branches) + §11 (commits) below |

If a convention isn't written down anywhere, match the surrounding code and, when it's a
non-obvious decision, record the rationale in `documents/`.

---

## 4. The one rule that matters most: keep the LLM boundary intact

`app/lib/digest.ts` is the **only** file allowed to call an LLM. `feed.ts`, the route,
and all UI must function without it.

- **Don't** import the Anthropic SDK, call the model, or read `ANTHROPIC_API_KEY` anywhere else.
- All structured output goes through the JSON schema in `digest.ts`. Schema limits to respect:
  every object needs `additionalProperties: false`; numeric/string constraints
  (`minimum`, `maxLength`, …) are **not** supported — enforce those in prompt/code instead.
- The roadmap (README) is to route through a model-agnostic gateway. Keep changes here
  swappable: one function, one boundary.
- When building anything AI-related, default to current, capable models. For provider and
  model specifics (model IDs, pricing, structured-output rules, SDK usage), consult the
  provider's API reference — for Claude, the `claude-api` skill bundled with Claude Code —
  rather than guessing from memory.

---

## 5. Code style

Biome is the enforcer (`pnpm lint`, `pnpm format`). On top of what it checks:

- **Tab indentation** — indent with tabs, not spaces. (`biome.json` is set to `indentStyle: "tab"`.)
- **Arrow functions** — define functions as `const fn = () => {}`, not `function fn() {}`.
- **`export default`** — modules export their primary value as a default export.
- **ES modules only** — use `import` / `export`. Never `require()` / `module.exports`.
- Imports are auto-organized by Biome; don't hand-sort.
- TypeScript is `strict`. No `any` to dodge a type — model it or narrow it.
- Match the existing comment density: explain *why* (like the header of `digest.ts`), not *what*.

---

## 6. Configuration & secrets

- Config is via env vars in `.env.local` (git-ignored — `.env*` is in `.gitignore`).
- **Never** commit secrets or print `ANTHROPIC_API_KEY`.
- Variables: `ANTHROPIC_API_KEY` (required, used only by `digest.ts`), `RSS_FEED_URL`
  (optional, comma-separated feeds). Full table in **README "Configuration"**. If you add a
  new variable, document it there.

---

## 7. Commands

```bash
pnpm install      # install deps
pnpm dev          # dev server → http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # biome check
pnpm format       # biome format --write
```

**Before every commit: run `pnpm lint` and make sure it passes.** A clean `pnpm build`
is the bar for anything touching build-time behavior.

---

## 8. Testing

There is **no test framework set up yet** — don't assume one exists or invent commands.

When tests are introduced:
- Co-locate them next to the unit (`feed.test.ts` beside `feed.ts`) or under a `__tests__/` dir.
- Prioritize the seams that are easy to break and pure to test: `feed.ts` (fetch + de-dupe
  merging) and the schema/shape contract in `digest.ts`. Mock the network and the LLM call —
  never hit the live Anthropic API in a test.
- Vitest pairs cleanly with this stack if you need to pick something; confirm with the
  maintainer before adding a framework, then document the choice in `documents/`.

---

## 9. Conventions for agents

- **Read before you write.** Open the file you're changing; match its idiom.
- **Stay in your lane on UI.** Any visual change must conform to DESIGN.md — one accent,
  hard edges, mono for machine voice, display font for human voice. When in doubt, re-read it.
- **Document decisions.** Non-trivial architecture or design changes get a short note in
  `documents/` explaining the *why*, consistent with how that folder is used.
- **Don't introduce dependencies casually.** This project values owning its own code. Prefer
  the standard library and what's already here; justify any new package.
- **Branch, don't commit to `master` directly.** Name branches per §10. Run `pnpm lint` before committing.

---

## 10. Branch naming

Branches follow **[Conventional Branch 1.1.0](https://conventionalbranch.org)**. Never
commit to `master` directly (§9) — always branch off it. Format:

```
<type>/<description>
```

Trunk branches (`master`) carry no prefix.

**Prefixes:**

| Prefix | When |
|---|---|
| `feature/` (or `feat/`) | A new feature. |
| `bugfix/` (or `fix/`) | A bug fix. |
| `hotfix/` | An urgent production fix. |
| `release/` | Release prep — version numbers, so dots are allowed here (e.g. `release/v1.2.0`). |
| `chore/` | Everything else — docs, dependencies, config, tooling. |

Conventional Branch's prefix set is narrower than the commit types in §11: work that lands
as a `docs` / `style` / `refactor` / `test` / `ci` commit belongs on a `chore/` branch.
Optional AI-source prefixes (`ai/`, `claude/`, `copilot/`, `cursor/`, `codex/`) are
permitted when authorship matters more than intent (e.g. `claude/…`), but prefer a purpose
prefix above.

**Rules:**

- Lowercase `a-z`, digits `0-9`, and `-` to separate words — no spaces, underscores, or
  other special characters. (Dots only in `release/` version numbers.)
- No consecutive `-` / `.`, and no leading or trailing `-` / `.` in the description.
- Descriptive but concise; include a ticket number when there is one, e.g.
  `feature/issue-123-add-login`.

**Examples:**

```
feature/multi-source-feeds
fix/empty-rss-feed
chore/agents-branch-naming
release/v1.2.0
```

---

## 11. Commit conventions

Commits follow **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**.
Format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types used in this repo:**

| Type | When |
|---|---|
| `feat` | A new feature (→ MINOR in semver). |
| `fix` | A bug fix (→ PATCH). |
| `docs` | Docs only — `README.md`, `DESIGN.md`, `AGENTS.md`, notes in `documents/`. |
| `style` | Formatting / whitespace, no code-meaning change (e.g. a Biome reformat). |
| `refactor` | Code change that neither fixes a bug nor adds a feature. |
| `perf` | A performance improvement. |
| `test` | Adding or fixing tests. |
| `build` | Build system or dependencies (e.g. `package.json`, lockfile). |
| `ci` | CI configuration. |
| `chore` | Anything else that doesn't touch src or tests. |

**Rules:**
- Description is lowercase, imperative mood, no trailing period: `fix: handle empty RSS feed`, not `Fixed the feed.`.
- Scope is optional and names the affected area, e.g. `feat(feed): …`, `fix(digest): …`, `feat(ui): …`.
- **Breaking changes** are marked either with a `!` before the colon (`feat(digest)!: …`) **or** a
  `BREAKING CHANGE: <description>` footer (→ MAJOR). The `!` may be used without the footer.
- Footers use git-trailer style, e.g. `Refs: #12`.

**Examples:**

```
feat(feed): support multiple comma-separated RSS sources
fix(digest): throw a clear error when ANTHROPIC_API_KEY is missing
docs: tighten the README "How it works" diagram
build: pin Node engines to >=20
refactor(digest)!: route model calls through a gateway

BREAKING CHANGE: ANTHROPIC_API_KEY replaced by MODEL/LLM_BASE_URL/LLM_API_KEY.
```
