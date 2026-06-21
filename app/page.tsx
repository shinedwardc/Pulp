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
    <>
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b-2 border-ink bg-paper px-[clamp(20px,5vw,56px)] py-4">
        <div className="flex items-center gap-[11px] font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
          <span className="size-[15px] shrink-0 border-2 border-ink bg-acid" />
          PULP
        </div>
        <div className="flex items-center gap-[18px] font-mono text-[11px] tracking-[0.04em] text-soft">
          <span>
            <span className="text-acidink">● </span>
            {items ? `rss · ${items.length} in feed` : "rss · offline"}
          </span>
          <span className="max-[640px]:hidden">local-first</span>
          <span className="text-ink">{dateShort}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] px-[clamp(20px,5vw,56px)] pt-[clamp(26px,4vw,46px)] pb-16">
        <p className="mb-[clamp(26px,4vw,40px)] max-w-[64ch] text-[15px] leading-relaxed text-soft">
          Tell your feed what today should be about. No ranking, no infinite
          scroll, no algorithm deciding for you — you ask, it fetches from open
          RSS and trims to a five-minute read. Nothing more.
        </p>

        {items === null ? (
          <div className="border-2 border-ink border-l-[6px] border-l-acid px-[18px] py-4 font-mono text-[12.5px] leading-relaxed tracking-[0.02em] text-ink">
            <b className="text-acidink">feed offline: </b>
            no sources answered. Check <code>RSS_FEED_URL</code> (or the default
            feed&apos;s availability) and reload.
          </div>
        ) : (
          <>
            <DigestClient date={dateLong} />

            <details className="mt-9 border-t border-line pt-[18px] font-mono text-[12px] text-soft">
              <summary className="cursor-pointer select-none uppercase tracking-[0.06em] marker:text-acid">
                raw feed · {items.length} items
              </summary>
              <ul className="mt-[14px] flex list-none flex-col gap-2 p-0">
                {items.map((item) => (
                  <li key={item.link} className="relative pl-4 leading-snug">
                    <span className="absolute left-[2px] text-acidink">·</span>
                    {item.title}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </main>
    </>
  );
}
