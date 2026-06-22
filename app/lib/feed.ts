// app/lib/feed.ts
// Reads one or more RSS feeds into a single, de-duplicated list of items.
// RSS is the punk part: an open protocol, no API key, no algorithm deciding
// what you see. Set RSS_FEED_URL to your own feed(s) — that's the whole point.
import Parser from "rss-parser";

export type FeedItem = {
	title: string;
	link: string;
	isoDate?: string;
	contentSnippet?: string;
};

// Set RSS_FEED_URL in .env.local to one URL, or several separated by commas.
// A single RSS feed only serves the ~10 items the publisher includes (there's
// no "page 2" in RSS), so the default pulls several NPR topic feeds and merges
// them for a broader pool. AP has no reliable public RSS, and the rsshub.app
// mirror now blocks direct fetches (403); for actual AP, self-host RSSHub and
// point RSS_FEED_URL at it (e.g. http://localhost:1200/apnews/topics/ap-top-news).
const DEFAULT_FEEDS = [
	"https://feeds.npr.org/1001/rss.xml", // News
	"https://feeds.npr.org/1003/rss.xml", // National
	"https://feeds.npr.org/1004/rss.xml", // World
	"https://feeds.npr.org/1014/rss.xml", // Politics
	"https://feeds.npr.org/1006/rss.xml", // Business
	"https://feeds.npr.org/1007/rss.xml", // Science
	"https://feeds.npr.org/1019/rss.xml", // Technology
	"https://feeds.npr.org/1128/rss.xml", // Health
];

const FEED_URLS =
	process.env.RSS_FEED_URL?.split(",")
		.map((u) => u.trim())
		.filter(Boolean) ?? DEFAULT_FEEDS;

const parser = new Parser();

async function fetchFeed(url: string): Promise<FeedItem[]> {
	// Fetch with WHATWG fetch and hand the XML to parseString — this avoids
	// rss-parser's parseURL, which uses the deprecated url.parse() internally.
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Feed fetch failed (${res.status}): ${url}`);
	const feed = await parser.parseString(await res.text());
	return (feed.items ?? [])
		.map((item) => ({
			title: item.title ?? "(untitled)",
			link: item.link ?? "",
			isoDate: item.isoDate,
			contentSnippet: item.contentSnippet,
		}))
		.filter((item) => item.link.length > 0);
}

export async function getFeed(): Promise<FeedItem[]> {
	// Fetch every feed in parallel; tolerate individual feeds failing.
	const results = await Promise.allSettled(FEED_URLS.map(fetchFeed));
	const ok = results.filter((r) => r.status === "fulfilled");

	// If every feed failed, surface the error so the page shows its warning.
	if (ok.length === 0) {
		throw new Error("All feeds failed to load.");
	}

	// Merge, de-duplicate by link (topic feeds overlap), and sort newest-first.
	const byLink = new Map<string, FeedItem>();
	for (const r of ok) {
		for (const item of (r as PromiseFulfilledResult<FeedItem[]>).value) {
			if (!byLink.has(item.link)) byLink.set(item.link, item);
		}
	}

	return [...byLink.values()].sort((a, b) =>
		(b.isoDate ?? "").localeCompare(a.isoDate ?? ""),
	);
}
