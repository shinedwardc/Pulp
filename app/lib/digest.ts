// app/lib/digest.ts
//
// This is the ONLY place in the app that talks to an LLM. Everything else
// (feed, UI) works without it. To change providers — or to run a local model
// later — you rewrite this one function and nothing else. That's how the AI
// stays a swappable convenience instead of an owner.
import type { FeedItem } from "@/app/lib/feed";

export type DigestStory = {
  title: string;
  summary: string;
  whyItMatters: string;
  sourceUrls: string[];
};

export type Digest = {
  headline: string;
  readTimeMinutes: number;
  stories: DigestStory[];
};

// Schema-constrained output: the model must return exactly this shape, so the
// UI can render it reliably instead of parsing a free-form blob. Structured
// outputs are supported on claude-haiku-4-5. Note the JSON-schema limits:
// every object needs additionalProperties:false, and numeric/string
// constraints (minimum, maxLength, …) are not supported.
const DIGEST_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "A single short line for the digest. If nothing matched, say so here.",
    },
    readTimeMinutes: {
      type: "integer",
      description: "Estimated total reading time in whole minutes (aim for ~5).",
    },
    stories: {
      type: "array",
      description:
        "One entry per matching story, ordered most important first. Empty if nothing matched the request.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Headline for this story." },
          summary: {
            type: "string",
            description:
              "Two to four factual sentences, drawn only from the feed item.",
          },
          whyItMatters: {
            type: "string",
            description: "One sentence on why this matters to the reader.",
          },
          sourceUrls: {
            type: "array",
            description: "The source link(s) this story is based on.",
            items: { type: "string" },
          },
        },
        required: ["title", "summary", "whyItMatters", "sourceUrls"],
        additionalProperties: false,
      },
    },
  },
  required: ["headline", "readTimeMinutes", "stories"],
  additionalProperties: false,
} as const;

export async function summarizeToDigest(
  items: FeedItem[],
  request: string,
): Promise<Digest> {
  const sources = items
    .map(
      (it, i) =>
        `<item index="${i + 1}">\n<title>${it.title}</title>\n<url>${it.link}</url>\n<summary>\n${it.contentSnippet ?? ""}\n</summary>\n</item>`,
    )
    .join("\n\n");

  const prompt =
    `You build a personal news digest from RSS feed items.\n\n` +
    `The reader asked for: "${request}".\n\n` +
    `From the feed items below, select ONLY the ones that match that request, then write a ` +
    `digest of those that takes about five minutes to read. Order stories most important first, ` +
    `keep each summary to a few sentences, and stay strictly factual: use only what is in the ` +
    `feed item, and do not invent names, numbers, or quotes. Set sourceUrls for each story to the ` +
    `<url> value it came from. If nothing matches the request, return an empty stories array and ` +
    `explain that in the headline.\n\n` +
    sources;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      output_config: {
        format: { type: "json_schema", schema: DIGEST_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!r.ok) {
    throw new Error(`Anthropic API error ${r.status}: ${await r.text()}`);
  }

  const data = (await r.json()) as {
    stop_reason: string;
    content: { type: string; text?: string }[];
  };

  // Schema-constrained JSON arrives as text in the first content block.
  const json = data.content.find((b) => b.type === "text")?.text;
  if (!json) {
    throw new Error(`No digest returned (stop_reason: ${data.stop_reason}).`);
  }
  return JSON.parse(json) as Digest;
}
