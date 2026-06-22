"use client";

import { useEffect, useRef, useState } from "react";
import type { Digest } from "@/app/lib/digest";

// Show the publisher, not the raw URL — the machine names its sources plainly.
function hostOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

// The input is the headline, so it grows with what you type.
function autosize(el: HTMLTextAreaElement | null) {
	if (!el) return;
	el.style.height = "auto";
	el.style.height = `${el.scrollHeight}px`;
}

export default function DigestClient({ date }: { date: string }) {
	const [request, setRequest] = useState("");
	const [digest, setDigest] = useState<Digest | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const taRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => autosize(taRef.current), []);

	async function generate() {
		if (!request.trim() || loading) return;
		setLoading(true);
		setError("");
		setDigest(null);
		try {
			const res = await fetch("/api/digest", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ request }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "the request failed.");
			setDigest(data.digest as Digest);
		} catch (e) {
			setError(e instanceof Error ? e.message : "the request failed.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			{/* console */}
			<div className="border-2 border-ink">
				<div className="flex items-center justify-between bg-ink px-4 py-[9px] font-mono text-[11px] uppercase tracking-[0.08em] text-paper">
					<span>~/today/digest.txt</span>
					<span className="flex gap-1.5">
						<i className="block size-[9px] border-[1.5px] border-paper" />
						<i className="block size-[9px] border-[1.5px] border-paper" />
						<i className="block size-[9px] border-[1.5px] border-acid bg-acid" />
					</span>
				</div>
				<div className="px-[22px] pb-[22px] pt-6">
					<div className="mb-3 font-mono text-xs tracking-[0.04em] text-acidink">
						$ show me —
					</div>
					<textarea
						ref={taRef}
						rows={1}
						value={request}
						placeholder="Tell your feed what today should be about…"
						onInput={(e) => autosize(e.currentTarget)}
						onChange={(e) => setRequest(e.target.value)}
						onKeyDown={(e) => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
						}}
						className="block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-display text-[clamp(22px,3.4vw,30px)] font-medium leading-[1.25] tracking-[-0.01em] text-paper outline-none placeholder:text-soft"
					/>
					<div className="mt-[22px] flex flex-wrap items-center gap-[18px]">
						<button
							type="button"
							onClick={generate}
							disabled={!request.trim() || loading}
							className="cursor-pointer whitespace-nowrap border-2 border-ink bg-acid px-[22px] py-[15px] font-mono text-[13px] font-bold uppercase tracking-[0.02em] text-[#111] shadow-[5px_5px_0_var(--ink)] transition-[transform,box-shadow] duration-100 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-acidink disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-default disabled:opacity-50 disabled:shadow-[5px_5px_0_var(--ink)]"
						>
							{loading ? "Fetching…" : "Generate ▸ 5-min"}
						</button>
						<span className="flex items-center gap-[9px] font-mono text-[11.5px] text-soft">
							<span className="size-[5px] shrink-0 bg-acid" />
							No ranking. No feed. Just what you asked for.
						</span>
					</div>
				</div>
			</div>

			{/* loading */}
			{loading && (
				<div className="mt-[42px] flex items-center gap-[14px] border-t-2 border-ink px-0.5 py-7 font-mono text-[13px] text-acidink">
					<span className="flex gap-[5px]">
						{[0, 1, 2, 3, 4].map((i) => (
							<i
								key={i}
								className="block h-5 w-[6px] origin-bottom animate-eq bg-acid motion-reduce:animate-none"
								style={{ animationDelay: `${i * 0.12}s` }}
							/>
						))}
					</span>
					<span>
						reading the feed
						<span className="text-soft">
							{" "}
							· matching your request · trimming to 5 minutes
						</span>
					</span>
				</div>
			)}

			{/* error — states what happened, never apologizes */}
			{error && !loading && (
				<div className="mt-7 border-2 border-l-[6px] border-ink border-l-acid px-[18px] py-4 font-mono text-[12.5px] leading-relaxed tracking-[0.02em] text-ink">
					<b className="text-acidink">error: </b>
					{error}
				</div>
			)}

			{/* digest */}
			{digest && !loading && (
				<>
					<div className="mt-[42px] flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-ink pb-3">
						<h2 className="m-0 flex flex-wrap items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.12em]">
							<span className="bg-acid px-[9px] py-[3px] text-[#111]">
								DIGEST
							</span>
							built from your request
						</h2>
						<div className="font-mono text-[11px] tracking-[0.04em] text-soft">
							{digest.stories.length}{" "}
							{digest.stories.length === 1 ? "story" : "stories"} / ~
							{digest.readTimeMinutes} min / no ranking applied
						</div>
					</div>

					<p className="mt-[22px] max-w-[40ch] text-balance font-display text-[clamp(19px,2.6vw,24px)] font-medium leading-[1.25] tracking-[-0.01em]">
						{digest.headline}
					</p>

					{digest.stories.length === 0 ? (
						<p className="mt-7 border-t border-line pt-6 font-mono text-[12.5px] leading-relaxed text-soft">
							{
								"// nothing in the feed matched. Try a broader request, or check the raw feed below."
							}
						</p>
					) : (
						digest.stories.map((story, i) => {
							const hosts = [...new Set(story.sourceUrls.map(hostOf))];
							return (
								<div
									key={story.sourceUrls[0] ?? i}
									className="grid grid-cols-[46px_1fr_132px] items-start gap-[22px] border-b border-line py-[30px] max-[560px]:grid-cols-[30px_1fr]"
								>
									<div className="pt-[3px] font-mono text-[13px] font-bold text-acidink">
										[{String(i + 1).padStart(2, "0")}]
									</div>
									<div>
										{hosts.length > 0 && (
											<div className="mb-2 flex flex-wrap items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-soft">
												{hosts.map((h) => (
													<span
														key={h}
														className="border border-line px-[7px] py-[2px] text-paper"
													>
														{h}
													</span>
												))}
											</div>
										)}
										<h3 className="mb-1.5 text-balance font-display text-[23px] font-medium leading-[1.2] tracking-[-0.01em]">
											{story.title}
										</h3>
										<p className="m-0 max-w-[64ch] text-[14.5px] leading-[1.45] text-soft">
											{story.summary}
										</p>
										<p className="mt-3 max-w-[64ch] font-mono text-[11.5px] leading-[1.5] tracking-[0.02em] text-soft">
											<span className="mr-[9px] uppercase tracking-[0.1em] text-acidink">
												why
											</span>
											{story.whyItMatters}
										</p>
									</div>
									<div className="flex flex-col items-end gap-[7px] pt-[3px] text-right font-mono text-[11px] text-soft max-[560px]:col-start-2 max-[560px]:items-start max-[560px]:text-left">
										<span className="uppercase tracking-[0.06em]">source</span>
										{story.sourceUrls.map((url) => (
											<a
												key={url}
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												className="break-words border-b border-b-transparent text-paper no-underline hover:border-b-acid hover:text-acidink focus-visible:border-b-acid focus-visible:text-acidink focus-visible:outline-none"
											>
												open ↗
											</a>
										))}
									</div>
								</div>
							);
						})
					)}

					<div className="mt-[30px] flex flex-wrap items-center justify-between gap-2.5 font-mono text-[11px] tracking-[0.04em] text-soft">
						<span className="bg-ink px-3 py-1.5 tracking-[0.1em] text-paper">
							NO ALGORITHM
						</span>
						<span>{`// you asked, we fetched — nothing more · ${date}`}</span>
					</div>
				</>
			)}
		</div>
	);
}
