<h1 align="center">
    Pulp 
    <img src="assets/citrus.svg" valign="middle"/>
</h1>
<h2 align="center">Personal news digest you own</h2>

Read a digest of articles you actually want to read

## Why Pulp
Feeds optimize for engagement. Every news article in a feed is deliberately chosen for you to read, and in what order too. Pulp inverts that. It's a tool, not a feed: you state a request, it fetches the RSS feeds, and it returns only the stories that answer your request. Nothing is ranked, recommended, or held back to keep you scrolling.

## Core Features

- **Request-driven selection.** Your free-text request filters feed items to matches only, ordered by relevance — no ranking model, nothing held back.
- **Pluggable RSS sources.** `RSS_FEED_URL` takes one or many comma-separated feeds (defaults to merged, de-duplicated NPR topic feeds). This is the whole point — make it yours.
- **Single, swappable LLM boundary.** Every model call is isolated to `app/lib/digest.ts`, returns schema-constrained (JSON-schema) output the UI can render reliably, and is grounded to the feed content. Feed and UI run without it; swap the model in one file.
- **Punk-utilitarian UI.** Server-rendered Next.js + Tailwind, no client state library. See [DESIGN.md](DESIGN.md).

## Getting started

**Prerequisites:** Node.js 22.13+, [pnpm](https://pnpm.io) 11, and an [Anthropic API key](https://console.anthropic.com).

```bash
# 1. install
pnpm install

# 2. configure — copy the template and fill in your key
cp .env.example .env.local

# 3. run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), type what you want in the digest, and hit **Generate**.

## Configuration

Set these in `.env.local` (start from the committed [`.env.example`](.env.example) template):

| Variable | Required | Default | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Used only by `app/lib/digest.ts` to call the Claude API. |
| `RSS_FEED_URL` | no | merged NPR topic feeds | One URL, or several comma-separated. This is the whole point — make it yours. |

## How it works

```
your request
     │
     ▼
POST /api/digest       app/api/digest/route.ts
     │
     ▼
getFeed()              app/lib/feed.ts
     │
     ▼
summarizeToDigest()    app/lib/digest.ts
     │
     ▼
rendered digest        app/digest-client.tsx
```

- **`app/lib/feed.ts`** — fetches one or more RSS feeds and merges them into a de-duplicated list.
- **`app/lib/digest.ts`** — the only place that talks to an LLM. Sends the feed items + your request to the model with a JSON schema, gets back a `Digest`.
- **`app/api/digest/route.ts`** — ties them together: validate request → fetch feed → summarize.
- **`app/digest-client.tsx` / `app/page.tsx`** — the UI.

## Scripts

```bash
pnpm dev      # start the dev server
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # biome check
pnpm format   # biome format --write
```

CI runs `pnpm lint` and `pnpm build` on every PR into `master` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## License

[MIT](LICENSE)
