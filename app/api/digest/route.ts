// app/api/digest/route.ts
// Takes the reader's request, pulls the feed, and asks for a matching digest.
import { summarizeToDigest } from "@/app/lib/digest";
import { type FeedItem, getFeed } from "@/app/lib/feed";

export async function POST(req: Request) {
	const { request } = (await req.json()) as { request?: string };

	if (!request?.trim()) {
		return Response.json(
			{ error: "Describe what you want in the digest." },
			{ status: 400 },
		);
	}

	let items: FeedItem[];
	try {
		items = await getFeed();
	} catch {
		return Response.json({ error: "Couldn't load the feed." }, { status: 502 });
	}

	try {
		const digest = await summarizeToDigest(items, request.trim());
		return Response.json({ digest });
	} catch (e) {
		return Response.json(
			{ error: e instanceof Error ? e.message : "Failed to generate digest." },
			{ status: 500 },
		);
	}
}
