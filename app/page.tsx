import DigestClient from "@/app/digest-client";
import { type FeedItem, getFeed } from "@/app/lib/feed";

// Always read the feed fresh — news changes, and there's nothing to cache about you.
export const dynamic = "force-dynamic";

export default async function Home() {
	let items: FeedItem[] | null = null;
	try {
		items = await getFeed();
	} catch {
		items = null;
	}

	const now = new Date();
	const dateShort = now.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
	const dateLong = now.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return (
		<main className="flex flex-1 px-[clamp(14px,4vw,56px)] py-[clamp(22px,4vw,52px)]">
			<div className="mx-auto my-auto w-full max-w-[980px]">
				{/* Masthead — the only part of the page that isn't the machine talking. */}
				<div className="mb-[clamp(18px,3vw,30px)] px-[3px]">
					<div className="flex items-center gap-[11px] font-display text-[26px] font-bold tracking-[-0.01em]">
						<span className="size-[15px] shrink-0 border-2 border-ink bg-acid" />
						PULP
					</div>
					<p className="mt-[9px] max-w-[52ch] text-[15px] leading-[1.5] text-soft">
						Tell your feed what today should be about. Open RSS in, a
						five-minute read out. No ranking, no scroll.
					</p>
				</div>

				{/* Tab strip: the window's label, and the machine's honest status. */}
				<div className="flex items-end justify-between gap-4 pl-[14px]">
					<div className="flex items-center gap-[9px] border-2 border-ink border-b-0 bg-ink px-[13px] py-[7px] font-mono text-[11.5px] tracking-[0.06em] text-paper">
						<span className="size-[9px] shrink-0 bg-acid" />
						today.digest
					</div>
					<div className="flex items-center gap-[16px] pb-[7px] font-mono text-[11px] tracking-[0.04em] text-soft">
						<span>
							<span className="text-acidink">● </span>
							{items ? `rss · ${items.length} in feed` : "rss · offline"}
						</span>
						<span className="max-[560px]:hidden">local-first</span>
						<span className="text-ink">{dateShort}</span>
					</div>
				</div>

				{/* The terminal. Border in page ink, interior inverted via .crt. */}
				<div className="border-2 border-ink">
					<div className="crt min-h-[clamp(240px,34vh,340px)] bg-paper px-[clamp(15px,3vw,30px)] py-[clamp(17px,2.6vw,26px)] text-ink">
						{items === null ? (
							<div className="font-mono text-[13px] leading-[1.7] text-ink">
								<span className="text-acidink">pulp:~/today$ </span>
								<span className="text-soft">fetch</span>
								<div className="mt-3 border-l-2 border-l-acid pl-[14px] tracking-[0.02em]">
									<b className="text-acidink">feed offline: </b>
									no sources answered. Check <code>RSS_FEED_URL</code> (or the
									default feed&apos;s availability) and reload.
								</div>
							</div>
						) : (
							<DigestClient date={dateLong} />
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
