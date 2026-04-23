import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useGetDay, useGetSite, getGetDayQueryKey, getGetSiteQueryKey, type Day as ApiDay } from "@workspace/api-client-react";
import { MastheadBar, PageFrame, SplitHeading, Ticker } from "@/components/Chrome";
import { useAudio } from "@/lib/audio";
import { heroForDay, galleryFallback, IMG } from "@/lib/assets";
import { motion } from "framer-motion";

function BackBar({ index, kind }: { index: number; kind: string }) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-10 pt-6">
      <Link href="/" className="btn-pill">← back to cover</Link>
      <div className="uppercase-mono opacity-70">Issue {String(index).padStart(2, "0")} · {kind}</div>
    </div>
  );
}

function HeroBlock({ day, dark }: { day: ApiDay; dark?: boolean }) {
  const src = heroForDay(day.slug, day.heroImage || undefined);
  return (
    <div className="px-5 sm:px-10 mt-6">
      <div className="relative aspect-[16/8] overflow-hidden">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: dark ? "linear-gradient(180deg, rgba(12,10,10,.2), rgba(12,10,10,.8))" : "linear-gradient(180deg, transparent, rgba(12,10,10,.45))" }} />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8" style={{ color: "var(--cream)" }}>
          <div className="uppercase-mono opacity-90">{day.eyebrow}</div>
          <SplitHeading
            text={day.title.toUpperCase()}
            className="font-display leading-[0.9] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

function SongBlock({ day }: { day: ApiDay }) {
  const audio = useAudio();
  if (!day.songTitle && !day.youtubeId) return null;
  return (
    <div className="mx-5 sm:mx-10 mt-10 p-5 sm:p-7 border hairline flex items-center justify-between gap-4 flex-wrap"
         style={{ background: "rgba(12,10,10,0.04)" }}>
      <div>
        <div className="uppercase-mono opacity-60">play this while you read</div>
        <div className="font-serif italic text-2xl mt-1">{day.songTitle}</div>
        <div className="uppercase-mono mt-1 opacity-70">{day.songArtist}</div>
      </div>
      {day.youtubeId && (
        <button className="btn-solid" onClick={() => audio.play(day.youtubeId!)}>play side a</button>
      )}
    </div>
  );
}

function LetterLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <HeroBlock day={day} />
      <article className="max-w-3xl mx-auto px-5 sm:px-10 py-12">
        <div className="font-serif italic text-lg" style={{ color: "var(--mauve)" }}>
          a letter, slowly.
        </div>
        <div className="font-serif text-xl sm:text-2xl leading-[1.5] mt-6 drop-cap whitespace-pre-wrap">
          {day.body}
        </div>
        {day.pullQuote && (
          <blockquote className="mt-12 pl-6 border-l-2 font-serif italic text-3xl leading-snug"
                      style={{ borderColor: "var(--rose-deep)", color: "var(--rose-deep)" }}>
            “{day.pullQuote}”
          </blockquote>
        )}
        <div className="mt-12 font-serif italic text-xl">{day.signoff}</div>
      </article>
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function MagazineLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame dark>
      <div style={{ color: "var(--cream)" }}>
        <BackBar index={day.index} kind={day.kind} />
        <div className="px-5 sm:px-10 mt-10 grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-5">
            <div className="uppercase-mono opacity-70">{day.eyebrow}</div>
            <h1 className="font-serif italic mt-3 leading-[0.95]" style={{ fontSize: "clamp(48px, 9vw, 120px)", color: "var(--rose-dust)" }}>
              {day.title}
            </h1>
            {day.pullQuote && (
              <p className="font-serif italic text-2xl mt-8 max-w-md" style={{ color: "var(--petal)" }}>
                “{day.pullQuote}”
              </p>
            )}
          </div>
          <div className="col-span-12 sm:col-span-7">
            <div className="aspect-[4/5] overflow-hidden border hairline-cream">
              <img src={heroForDay(day.slug, day.heroImage || undefined)} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <article className="max-w-3xl mx-auto px-5 sm:px-10 py-14 font-serif text-xl leading-[1.6] whitespace-pre-wrap">
          {day.body}
          <div className="mt-10 italic" style={{ color: "var(--rose-dust)" }}>{day.signoff}</div>
        </article>
      </div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function DraftsLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 max-w-3xl mx-auto">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <SplitHeading text="DRAFTS I NEVER SENT" className="font-display leading-[0.9] mt-3 text-6xl sm:text-8xl" />
        <p className="font-serif italic text-xl mt-4 max-w-xl" style={{ color: "var(--mauve)" }}>{day.body}</p>
      </div>
      <div className="px-5 sm:px-10 mt-12 max-w-3xl mx-auto space-y-5 pb-16">
        {(day.drafts ?? []).map((d, i) => {
          const rot = Math.max(-2.5, Math.min(2.5, ((i * 73) % 11) / 4 - 1.4));
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className={`draft-slip ${d.crossed ? "crossed" : ""}`}
              style={{ transform: `rotate(${rot}deg)` }}
            >
              <span className="uppercase-mono mr-3 opacity-50">No. {String(i + 1).padStart(2, "0")}</span>
              {d.text}
            </motion.div>
          );
        })}
        <div className="font-serif italic text-xl mt-10">{day.signoff}</div>
      </div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function WhyYouLayout({ day }: { day: ApiDay }) {
  // film-strip top progress (simple decoration)
  return (
    <PageFrame>
      <div className="filmstrip h-2 w-full" />
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5">
          <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
          <SplitHeading text="WHY YOU." className="font-display leading-[0.85] mt-3" />
          <div className="font-display text-7xl sm:text-9xl outline-text leading-none -mt-2">FIELD NOTES</div>
          <p className="font-serif italic text-xl mt-6 max-w-md" style={{ color: "var(--mauve)" }}>{day.body}</p>
        </div>
        <ol className="col-span-12 sm:col-span-7 mt-6 sm:mt-0">
          {(day.reasons ?? []).map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="grid grid-cols-[64px_1fr] gap-4 py-5 border-b hairline"
            >
              <div className="font-display text-4xl leading-none" style={{ color: "var(--rose-deep)" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-serif text-xl leading-snug">{r}</div>
            </motion.li>
          ))}
        </ol>
      </div>
      <div className="px-5 sm:px-10 mt-10 mb-16 font-serif italic text-xl">{day.signoff}</div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function GalleryLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 max-w-5xl mx-auto">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <SplitHeading text={day.title.toUpperCase()} className="font-display leading-[0.9] mt-3" />
        <p className="font-serif italic text-xl mt-4 max-w-xl" style={{ color: "var(--mauve)" }}>{day.body}</p>
      </div>
      <div className="px-5 sm:px-10 mt-10 max-w-6xl mx-auto bento">
        {(day.gallery ?? []).map((g, i) => (
          <div key={i} className={`relative overflow-hidden span-${g.span}`}>
            <img src={g.url || galleryFallback(i)} alt={g.caption} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-2 uppercase-mono"
                 style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.7))", color: "var(--cream)" }}>
              {g.caption}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 sm:px-10 mt-12 mb-16 font-serif italic text-xl text-center">{day.signoff}</div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function BirthdayLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-6">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <h1
          className="font-display leading-[0.78] text-mask-flower mt-3"
          style={{
            fontSize: "clamp(72px, 22vw, 360px)",
            ["--mask-image" as any]: `url(${IMG.birthdayFloral})`,
          }}
        >
          HAPPY<br/>BIRTHDAY<br/>YIN
        </h1>
        <div className="font-serif italic text-2xl mt-6" style={{ color: "var(--rose-deep)" }}>
          today is the headline. no subhead.
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-5 sm:px-10 py-12 font-serif text-xl sm:text-2xl leading-[1.55] drop-cap whitespace-pre-wrap">
        {day.body}
      </article>

      {(day.gallery ?? []).length > 0 && (
        <div className="px-5 sm:px-10 max-w-6xl mx-auto bento mb-12">
          {(day.gallery ?? []).map((g, i) => (
            <div key={i} className={`relative overflow-hidden span-${g.span}`}>
              <img src={g.url || galleryFallback(i)} alt={g.caption} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2 uppercase-mono"
                   style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.7))", color: "var(--cream)" }}>
                {g.caption}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 sm:px-10 max-w-3xl mx-auto pb-12">
        <div className="font-serif italic text-2xl">{day.signoff}</div>
      </div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

export default function DayPage() {
  const [, params] = useRoute<{ slug: string }>("/day/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  const { data: day, error, isLoading } = useGetDay(slug, {
    query: { queryKey: getGetDayQueryKey(slug), retry: false, enabled: Boolean(slug) },
  });
  const audio = useAudio();

  // Auto-play song once on first arrival
  useEffect(() => {
    if (day?.youtubeId && !audio.currentId) {
      audio.play(day.youtubeId);
    }
  }, [day?.slug]); // eslint-disable-line

  useEffect(() => {
    const status = (error as any)?.status;
    if (status === 423) {
      const lock = (error as any)?.data;
      navigate(`/locked?slug=${encodeURIComponent(slug)}&date=${encodeURIComponent(lock?.unlockDate ?? "")}`);
    }
  }, [error, navigate, slug]);

  if (isLoading || !day) {
    return (
      <PageFrame>
        <div className="min-h-screen grid place-items-center font-mono uppercase text-[11px] tracking-[0.2em] opacity-60">
          opening the issue…
        </div>
      </PageFrame>
    );
  }

  void site;
  switch (day.kind) {
    case "letter":   return <LetterLayout day={day} />;
    case "magazine": return <MagazineLayout day={day} />;
    case "drafts":   return <DraftsLayout day={day} />;
    case "why-you":  return <WhyYouLayout day={day} />;
    case "gallery":  return <GalleryLayout day={day} />;
    case "birthday": return <BirthdayLayout day={day} />;
    default:         return <LetterLayout day={day} />;
  }
}
