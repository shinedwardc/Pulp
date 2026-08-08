"use client";

import { useState } from "react";
import type { Digest } from "@/app/lib/digest";

// The shell prompt. Its length is the textarea's first-line indent in `ch`, so
// typed text lands exactly after the "$ " — keep it in sync with the coloured
// spans that render it below.
const PROMPT = "pulp:~/today$ ";

// One type ramp for both layers of the prompt. The invisible textarea and the
// visible mirror must wrap identically, so they share font, size, and leading —
// and tracking stays at 0 so `ch` units still measure one character.
const PROMPT_TYPE =
	"font-mono text-[clamp(13px,1.5vw,15px)] leading-[1.7] tracking-normal";

// Show the publisher, not the raw URL — the machine names its sources plainly.
function hostOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

export default function DigestClient({ date }: { date: string }) {
	const [request, setRequest] = useState("");
	const [caret, setCaret] = useState(0);
	const [focused, setFocused] = useState(false);
	const [digest, setDigest] = useState<Digest | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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

	// The cursor is a block sitting *on* the next character, the way a terminal
	// draws it — so the line is split at the insertion point rather than having
	// a caret drawn between characters. At a line end there's nothing to sit on,
	// so it occupies one blank cell.
	const under = request.slice(caret, caret + 1);
	const atLineEnd = under === "" || under === "\n";
	const head = request.slice(0, caret);
	const tail = atLineEnd ? request.slice(caret) : request.slice(caret + 1);

	return (
		<div>
			{/* The login banner. A shell prints its usage *before* the prompt —
			    nothing can appear below a prompt — and keeping it unconditional
			    means the line below doesn't jump when you start typing. */}
			<p className="mb-[18px] font-mono text-[11.5px] leading-[1.6] tracking-[0.02em] text-soft">
				{"# enter runs your request · shift+enter adds a line"}
			</p>

			{/* A <label> wrapping the textarea: clicking anywhere on the prompt line
			    focuses it, the way clicking a terminal does — no JS, no ref. */}
			<label className="relative block cursor-text">
				<div
					aria-hidden
					className={`${PROMPT_TYPE} whitespace-pre-wrap break-words`}
				>
					<span className="text-acidink">pulp</span>
					<span className="text-soft">:~/today</span>
					<span>$ </span>
					{head}
					<span
						className={
							focused
								? "animate-blink bg-ink text-paper motion-reduce:animate-none"
								: "outline outline-[1.5px] -outline-offset-[1.5px] outline-soft"
						}
					>
						{atLineEnd ? " " : under}
					</span>
					{tail}
				</div>
				<textarea
					value={request}
					aria-label="What today should be about"
					spellCheck={false}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
					onChange={(e) => {
						setRequest(e.target.value);
						setCaret(e.target.selectionStart);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							generate();
						}
					}}
					style={{ textIndent: `${PROMPT.length}ch` }}
					className={`${PROMPT_TYPE} absolute inset-0 h-full w-full resize-none overflow-hidden break-words border-0 bg-transparent p-0 text-transparent caret-transparent outline-none`}
				/>
			</label>

			<div className="mt-[26px] flex flex-wrap items-center gap-[18px]">
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

			{/* loading */}
			{loading && (
				<div className="mt-[34px] flex items-center gap-[14px] border-t-2 border-ink px-0.5 py-7 font-mono text-[13px] text-acidink">
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
					<div className="mt-[34px] flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-ink pb-3">
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
														className="border border-line px-[7px] py-[2px] text-ink"
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
												className="break-words border-b border-b-transparent text-ink no-underline hover:border-b-acid hover:text-acidink focus-visible:border-b-acid focus-visible:text-acidink focus-visible:outline-none"
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
