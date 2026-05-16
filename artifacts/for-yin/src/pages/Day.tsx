import { useEffect, useMemo, useState, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Link, useLocation, useRoute } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  useGetDay,
  useGetSite,
  getGetDayQueryKey,
  getGetSiteQueryKey,
  useSendDayReply,
  type Day as ApiDay,
} from "@workspace/api-client-react";
import { MastheadBar, PageFrame, SplitHeading, Ticker } from "@/components/Chrome";
import { useAudio } from "@/lib/audio";
import { heroForDay, galleryFallback, IMG } from "@/lib/assets";
import { pingSeenOnce } from "@/lib/seen";
import { usePageMeta } from "@/lib/meta";
import { LETTER_COPY_TEMPLATE, BIRTHDAY_COPY_TEMPLATE, REPLY_COPY_TEMPLATE } from "@/lib/copyDefaults";

// Helper: get a copy section from day.copy with sensible fallbacks.
function dayCopy<K extends string>(day: any, key: K): any {
  return (day?.copy?.[key] ?? {}) as any;
}

// Normalise an external media URL so an <audio>/<video>/<img> can fetch it
// directly. Google Drive share links and Dropbox links need their hostnames
// flipped to direct-download equivalents.
function normaliseMedia(url: string | null | undefined): string {
  if (!url) return "";
  const s = url.trim();
  if (!s) return "";
  if (s.includes("dropbox.com")) {
    return s.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace(/[?&]dl=[01]/g, "");
  }
  const drive = s.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  // Google Drive "open?id=..." or "uc?id=..." styles already work — leave alone.
  return s;
}

// Detect whether a URL points at a video file or Cloudinary video resource.
function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const s = url.toLowerCase();
  if (s.includes("/video/upload/")) return true; // Cloudinary video
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(s);
}

const TEN_WAYS_DEFAULT: readonly string[] = [
  "The way you laugh like you're telling the room a secret",
  "How you make silence feel comfortable instead of empty",
  "That soft focus you get when you're really listening",
  "The way you carry yourself when you think no one's watching",
  "How you turn small moments into something worth remembering",
  "Your stubbornness mixed with that unexpected softness",
  "The way my name sounds different when it comes from you",
  "How you make me want to be more present than I usually am",
  "Your specific kind of chaos that somehow feels like home",
  "The quiet confidence that you don't even know you have",
] as const;

function TenWaysModal({ open, onClose, lines, heading }: { open: boolean; onClose: () => void; lines: string[]; heading: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center px-5 py-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "rgba(12,10,10,0.78)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-xl w-full p-7 sm:p-10 max-h-[88vh] overflow-y-auto"
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ background: "var(--paper, #f5e9dd)", color: "var(--ink, #1a0f0f)", border: "1px solid rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button" aria-label="close"
              onClick={onClose}
              className="absolute right-3 top-3 h-8 w-8 grid place-items-center font-mono uppercase text-xs opacity-70 hover:opacity-100"
            >×</button>
            <div className="font-display text-3xl sm:text-4xl leading-tight mb-6" style={{ color: "var(--rose-deep)" }}>
              {heading}
            </div>
            <ol className="space-y-3 list-none">
              {lines.map((line, i) => (
                <li key={i} className="grid grid-cols-[40px_1fr] gap-3">
                  <div className="font-display text-2xl tabular-nums" style={{ color: "var(--rose-deep)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-serif text-lg leading-snug">{line}</div>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
    <motion.div layoutId={`day-card-${day.slug}`} className="px-5 sm:px-10 mt-6">
      <div className="relative aspect-[16/8] overflow-hidden">
        <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: dark ? "linear-gradient(180deg, rgba(12,10,10,.2), rgba(12,10,10,.8))" : "linear-gradient(180deg, transparent, rgba(12,10,10,.45))" }} />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8" style={{ color: "var(--cream)" }}>
          <div className="uppercase-mono opacity-90">{day.eyebrow}</div>
          <SplitHeading
            text={day.title.toUpperCase()}
            className="font-display leading-[0.9] mt-2"
          />
        </div>
      </div>
    </motion.div>
  );
}

type AudioSource =
  | { type: "youtube"; id: string }
  | { type: "soundcloud"; url: string }
  | { type: "spotify"; kind: string; id: string }
  | { type: "direct"; url: string }
  | { type: "none" };

function resolveAudio(day: ApiDay): AudioSource {
  // YouTube — accept bare 11-char ID OR any youtube/music.youtube/youtu.be URL
  function ytId(s?: string | null): string {
    if (!s?.trim()) return "";
    const m = s.trim().match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/
    );
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s.trim())) return s.trim();
    return "";
  }

  const id = ytId(day.youtubeId) || ytId(day.audioUrl);
  if (id) return { type: "youtube", id };

  const raw = day.audioUrl?.trim();
  if (!raw) return { type: "none" };

  // Spotify — track / album / playlist / episode / show
  const sp = raw.match(/(?:open\.spotify\.com|spotify:)(?:\/?)(track|album|playlist|episode|show)[/:]([A-Za-z0-9]+)/);
  if (sp) return { type: "spotify", kind: sp[1], id: sp[2] };

  if (raw.includes("soundcloud.com")) return { type: "soundcloud", url: raw };
  // Direct file URLs from Dropbox / Drive / Cloudinary / generic CDN
  const direct = normaliseMedia(raw);
  if (direct.startsWith("http")) return { type: "direct", url: direct };
  return { type: "none" };
}

function SongBlock({ day }: { day: ApiDay }) {
  const audio = useAudio();
  const source = resolveAudio(day);
  if (!day.songTitle && source.type === "none") return null;
  return (
    <div
      className="mx-5 sm:mx-10 mt-10 p-5 sm:p-7 border hairline flex flex-col gap-4"
      style={{ background: "rgba(12,10,10,0.04)" }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="uppercase-mono opacity-60">play this while you read</div>
          <div className="font-serif italic text-2xl mt-1">{day.songTitle}</div>
          <div className="uppercase-mono mt-1 opacity-70">{day.songArtist}</div>
        </div>
        {source.type === "youtube" && (
          <button className="btn-solid" onClick={() => audio.play(source.id)}>
            play side a
          </button>
        )}
      </div>
      {source.type === "soundcloud" && (
        <iframe
          title="soundcloud"
          width="100%"
          height="80"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(source.url)}&color=%23c47a6a&auto_play=false&hide_related=true&show_comments=false&show_user=false`}
          style={{ borderRadius: 4 }}
        />
      )}
      {source.type === "spotify" && (
        <iframe
          title="spotify"
          src={`https://open.spotify.com/embed/${source.kind}/${source.id}?utm_source=for-yin`}
          width="100%"
          height={source.kind === "track" ? 80 : 152}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ borderRadius: 12 }}
        />
      )}
      {source.type === "direct" && (
        <audio
          controls
          preload="none"
          src={source.url}
          className="w-full"
          style={{ borderRadius: 4, accentColor: "var(--rose,#c47a6a)" }}
        />
      )}
    </div>
  );
}

function VoiceNoteBlock({ url, copy }: { url?: string | null; copy?: { prompt?: string } }) {
  if (!url) return null;
  const src = normaliseMedia(url);
  return (
    <div className="mx-5 sm:mx-10 mt-6">
      <div className="uppercase-mono opacity-60 mb-2">{copy?.prompt || "a one-take voice note · play me"}</div>
      <div className="voice">
        <audio controls preload="none" src={src} className="w-full" />
      </div>
    </div>
  );
}

function SignatureBlock({ svg, signedAs }: { svg?: string | null; signedAs?: string }) {
  if (!svg) return null;
  const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  return (
    <div className="mt-10 sig-svg">
      <div className="uppercase-mono opacity-60 mb-2">{signedAs || LETTER_COPY_TEMPLATE.signedAs}</div>
      <div dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  );
}

function LetterLayout({ day }: { day: ApiDay }) {
  const letter = { ...LETTER_COPY_TEMPLATE, ...dayCopy(day, "letter") };
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <HeroBlock day={day} />
      <article className="max-w-3xl mx-auto px-5 sm:px-10 py-12">
        <div className="font-serif italic text-lg" style={{ color: "var(--mauve)" }}>
          {letter.intro}
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
        <SignatureBlock svg={day.signatureSvg} signedAs={letter.signedAs} />
      </article>
      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function MagazineLayout({ day }: { day: ApiDay }) {
  const vn = dayCopy(day, "voiceNote");
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
              <img src={heroForDay(day.slug, day.heroImage || undefined)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <article className="max-w-3xl mx-auto px-5 sm:px-10 py-14 font-serif text-xl leading-[1.6] whitespace-pre-wrap">
          {day.body}
          <div className="mt-10 italic" style={{ color: "var(--rose-dust)" }}>{day.signoff}</div>
        </article>
        <VoiceNoteBlock url={day.voiceNoteUrl} copy={vn} />
      </div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function DraftsLayout({ day }: { day: ApiDay }) {
  const drafts = dayCopy(day, "drafts");
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 max-w-3xl mx-auto">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <SplitHeading text={drafts.heading || "DRAFTS I NEVER SENT"} className="font-display leading-[0.9] mt-3 text-6xl sm:text-8xl" />
        <p className="font-serif italic text-xl mt-4 max-w-xl" style={{ color: "var(--mauve)" }}>{day.body}</p>
      </div>
      <div className="px-5 sm:px-10 mt-12 max-w-3xl mx-auto space-y-5 pb-16">
        {(day.drafts ?? []).map((d: any, i: any) => {
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
      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
    </PageFrame>
  );
}

function WhyYouLayout({ day }: { day: ApiDay }) {
  const wy = dayCopy(day, "whyYou");
  const hero = day.heroImage?.trim() ?? "";
  const heroSrc = normaliseMedia(hero);
  const isVideo = isVideoUrl(heroSrc);
  const hasJumbo = heroSrc.length > 0;
  return (
    <PageFrame>
      <div className="filmstrip h-2 w-full" />
      <BackBar index={day.index} kind={day.kind} />

      {/* Optional jumbotron: video (auto-play, muted, loop) or hero photo */}
      {hasJumbo && (
        <div className="px-5 sm:px-10 mt-6">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "16/9",
              borderRadius: "6px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              background: "#000",
            }}
          >
            {isVideo ? (
              <video
                src={heroSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img
                src={heroSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      )}

      <div className="px-5 sm:px-10 mt-8 grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5">
          <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
          <SplitHeading text={wy.heading || "WHY YOU."} className="font-display leading-[0.85] mt-3" />
          <div className="font-display text-7xl sm:text-9xl outline-text leading-none -mt-2">{wy.subhead || "FIELD NOTES"}</div>
          <p className="font-serif italic text-xl mt-6 max-w-md" style={{ color: "var(--mauve)" }}>{day.body}</p>
        </div>
        <ol className="col-span-12 sm:col-span-7 mt-6 sm:mt-0">
          {(day.reasons ?? []).map((r: any, i: any) => (
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
      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
    </PageFrame>
  );
}
function PolaroidGallery({ items, prompt }: { items: { url: string; caption: string }[]; prompt?: string }) {
  return (
    <div className="px-5 sm:px-10 mt-10 max-w-5xl mx-auto">
      <div className="uppercase-mono opacity-60 mb-6 text-center">{prompt || "a small stack of frames · pick one up"}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
        {items.map((g, i) => {
          const rot = ((i * 53) % 9) - 4; // -4..+4
          return (
            <motion.div
              key={i}
              className="polaroid mx-auto w-full max-w-xs"
              style={{ transform: `rotate(${rot}deg)` }}
              initial={{ opacity: 0, y: 24, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: rot }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <img className="ph" src={g.url || galleryFallback(i)} alt={g.caption} loading="lazy" decoding="async" />
              <div className="cap">{g.caption || "—"}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GalleryLayout({ day }: { day: ApiDay }) {
  const items = day.gallery ?? [];
  const usePolaroid = items.length > 0 && items.length <= 9;
  const galleryCopy = dayCopy(day, "gallery");
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 max-w-5xl mx-auto">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <SplitHeading text={day.title.toUpperCase()} className="font-display leading-[0.9] mt-3" />
        <p className="font-serif italic text-xl mt-4 max-w-xl" style={{ color: "var(--mauve)" }}>{day.body}</p>
      </div>
      {usePolaroid ? (
        <PolaroidGallery items={items} prompt={galleryCopy.prompt} />
      ) : (
        <div className="px-5 sm:px-10 mt-10 max-w-6xl mx-auto bento">
          {items.map((g: any, i: any) => (
            <div key={i} className={`relative overflow-hidden span-${g.span}`}>
              <img src={g.url || galleryFallback(i)} alt={g.caption} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2 uppercase-mono"
                   style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.7))", color: "var(--cream)" }}>
                {g.caption}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-5 sm:px-10 mt-12 mb-16 font-serif italic text-xl text-center">{day.signoff}</div>
      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
    </PageFrame>
  );
}

function CandleMoment({ onBlow, copy }: { onBlow: () => void; copy?: any }) {
  const [out, setOut] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const pieces = useMemo(() => Array.from({ length: 80 }), []);
  return (
    <div className="text-center mt-8">
      <div className="candle-wrap">
        <div className={`candle ${out ? "out" : ""}`}>
          {!out && <div className="flame" />}
        </div>
      </div>
      <div className="uppercase-mono opacity-60 mt-3">{out ? (copy?.candleHint || BIRTHDAY_COPY_TEMPLATE.candleHint) : "blow out the candle"}</div>
      <button
        className="btn-solid mt-4"
        onClick={() => {
          if (out) return;
          setOut(true);
          setConfetti(true);
          onBlow();
          window.setTimeout(() => setConfetti(false), 2600);
        }}
        disabled={out}
      >
        {out ? (copy?.candleDoneHint || BIRTHDAY_COPY_TEMPLATE.candleDoneHint) : (copy?.candleDoneCta || BIRTHDAY_COPY_TEMPLATE.candleDoneCta)}
      </button>
      {confetti && (
        <div className="confetti" aria-hidden>
          {pieces.map((_: any, i: any) => {
            const angle = (i / pieces.length) * Math.PI * 2;
            const dist = 220 + ((i * 37) % 260);
            const bx = `${Math.cos(angle) * dist}px`;
            const by = `${Math.sin(angle) * dist}px`;
            const br = `${(i * 53) % 720 - 360}deg`;
            const colors = ["#c47a6a", "#6b1f2a", "#c9a86a", "#d6a39b", "#f3d6cc"];
            const bg = colors[i % colors.length];
            const delay = `${(i % 10) * 0.02}s`;
            return (
              <span
                key={i}
                style={{
                  ["--bx" as any]: bx,
                  ["--by" as any]: by,
                  ["--br" as any]: br,
                  background: bg,
                  animationDelay: delay,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReplyForm({ slug, copy: copyProp }: { slug: string; copy?: any }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const reply = useSendDayReply();
  const c = { ...REPLY_COPY_TEMPLATE, ...(copyProp ?? {}) };
  if (done) {
    return (
      <div className="mx-auto max-w-xl mt-10 reply-card text-center">
        <div className="uppercase-mono opacity-60">received · slowly</div>
        <div className="font-serif italic text-2xl mt-2" style={{ color: "var(--rose-deep)" }}>
          {c.sentTitle}
        </div>
        <div className="font-serif italic mt-3" style={{ color: "var(--mauve)" }}>{c.sentBody}</div>
      </div>
    );
  }
  return (
    <form
      className="mx-auto max-w-xl mt-10 reply-card"
      onSubmit={async (e: any) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
          await reply.mutateAsync({ slug, data: { text: text.trim() } });
          setDone(true);
        } catch {
          // ignore — keep form
        }
      }}
    >
      <div className="uppercase-mono opacity-70">leave a one-line reply</div>
      <div className="font-serif italic text-xl mt-1" style={{ color: "var(--mauve)" }}>
        {c.prompt}
      </div>
      <textarea
        className="field mt-4"
        rows={3}
        maxLength={400}
        placeholder={c.placeholder}
        value={text}
        onChange={(e: any) => setText(e.target.value)}
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="uppercase-mono opacity-50">{text.length}/400</span>
        <button className="btn-solid" type="submit" disabled={reply.isPending || !text.trim()}>
          {reply.isPending ? "sending…" : "send slowly"}
        </button>
      </div>
    </form>
  );
}

function ScratchCard({ front, hidden }: { front: string; hidden: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const initedRef = useRef(false);

  // Paint the silver scratch surface. Re-runs if the canvas DOM dimensions
  // change (e.g. responsive resize) so it always matches the rendered box.
  useEffect(() => {
    const paint = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let i = 0; i < 2000; i++) {
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.max(1, dpr), Math.max(1, dpr),
        );
      }
      initedRef.current = true;
    };
    paint();
    // ResizeObserver re-paints on layout changes (covers the "first card
    // mounts before layout settled" race that caused the prior bug).
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  function scratchAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !initedRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) return;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="scratch-card" ref={wrapRef}>
      <div className="scratch-content">
        <div className="uppercase-mono opacity-50 mb-2">{front}</div>
        <div className="font-serif text-xl">{hidden}</div>
      </div>
      <canvas
        ref={canvasRef}
        className="scratch-canvas"
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drawingRef.current = true;
          scratchAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current) return;
          scratchAt(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          drawingRef.current = false;
          try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
        }}
        onPointerCancel={() => { drawingRef.current = false; }}
        onPointerLeave={(e) => {
          if (!drawingRef.current) return;
          // keep drawing while captured
          if (!(e.target as Element).hasPointerCapture?.(e.pointerId)) {
            drawingRef.current = false;
          }
        }}
      />
    </div>
  );
}

function ScratchLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <HeroBlock day={day} />
      <div className="max-w-4xl mx-auto px-5 sm:px-10 py-12">
        <p className="font-serif text-xl mb-10 whitespace-pre-wrap">{day.body}</p>
        <div className="scratch-grid">
          {(day.scratchCards ?? []).map((c: any, i: any) => (
            <ScratchCard key={i} front={c.front} hidden={c.hidden} />
          ))}
        </div>
      </div>
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

// Sequential typewriter: types segments[0] fully, then segments[1], etc.
// Returns: revealed[i] = current visible text for that segment, activeIdx =
// which segment is currently typing (or segments.length when finished).
// Variable per-character delay with longer pauses on punctuation/newlines
// gives a "real-time human typing" feel.
function useTypewriterSeq(
  segments: string[],
  opts?: {
    speedMs?: number;
    jitterMs?: number;
    segmentPauseMs?: number;
    startDelayMs?: number;
    /** 0..1 probability of a typo per character. Set to 0 to disable. */
    typoChance?: number;
    /** 0..1 probability of an extra thinking pause at a word boundary. */
    pauseChance?: number;
  },
) {
  const speed = opts?.speedMs ?? 55;
  const jitter = opts?.jitterMs ?? 35;
  const segPause = opts?.segmentPauseMs ?? 520;
  const startDelay = opts?.startDelayMs ?? 280;
  const typoChance = opts?.typoChance ?? 0.025;
  const pauseChance = opts?.pauseChance ?? 0.012;

  const key = segments.join("|") + "|s" + speed;

  const [revealed, setRevealed] = useState<string[]>(() => segments.map(() => ""));
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (segments.length === 0 || segments.every((s) => !s)) {
      setRevealed(segments.map((s) => s ?? ""));
      setActiveIdx(segments.length);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;

    setRevealed(segments.map(() => ""));
    setActiveIdx(0);

    let cur = 0;
    let i = 0;
    let typoPending = false;

    // Adjacent QWERTY keys for plausible fat-finger typos.
    const NEIGHBOURS: Record<string, string> = {
      a:"sqw", b:"vng", c:"xvd", d:"sfre", e:"wrds", f:"dgrt", g:"fhty", h:"gjyu",
      i:"uoj", j:"hknm", k:"jlmi", l:"ko", m:"nj", n:"bmh", o:"ipl", p:"o",
      q:"wa", r:"etf", s:"adwe", t:"ryg", u:"yij", v:"cbg", w:"qes", x:"zcs",
      y:"tuh", z:"xas",
    };
    function typoFor(ch: string): string | null {
      const opts = NEIGHBOURS[ch.toLowerCase()];
      if (!opts) return null;
      const pick = opts[Math.floor(Math.random() * opts.length)];
      return /[A-Z]/.test(ch) ? pick.toUpperCase() : pick;
    }

    while (cur < segments.length && !segments[cur]) {
      setRevealed((prev) => { const next = [...prev]; next[cur] = ""; return next; });
      cur++;
    }
    if (cur >= segments.length) { setActiveIdx(segments.length); return; }

    const tick = () => {
      if (cancelled) return;
      const seg = segments[cur] ?? "";
      setActiveIdx(cur);

      // Recover from a typo by backspacing the wrong char.
      if (typoPending) {
        setRevealed((prev) => { const next = [...prev]; next[cur] = seg.slice(0, i); return next; });
        typoPending = false;
        timer = window.setTimeout(tick, 90 + Math.random() * 80);
        return;
      }

      // Done with this segment? Advance.
      if (i >= seg.length) {
        let nextCur = cur + 1;
        while (nextCur < segments.length && !segments[nextCur]) {
          setRevealed((prev) => { const next = [...prev]; next[nextCur] = ""; return next; });
          nextCur++;
        }
        if (nextCur >= segments.length) { setActiveIdx(segments.length); return; }
        cur = nextCur; i = 0;
        timer = window.setTimeout(tick, segPause + Math.random() * 220);
        return;
      }

      const ch = seg[i];

      // Maybe make a typo — show it briefly, then backspace it next tick.
      if (i > 1 && /[A-Za-z]/.test(ch) && Math.random() < typoChance) {
        const wrong = typoFor(ch);
        if (wrong) {
          setRevealed((prev) => { const next = [...prev]; next[cur] = seg.slice(0, i) + wrong; return next; });
          typoPending = true;
          timer = window.setTimeout(tick, 220 + Math.random() * 240);
          return;
        }
      }

      // Type one real character.
      i++;
      setRevealed((prev) => { const next = [...prev]; next[cur] = seg.slice(0, i); return next; });

      // Compute delay before the next character.
      let delay = speed + (Math.random() * jitter - jitter / 2);
      if (ch === "." || ch === "!" || ch === "?") delay += 340;
      else if (ch === "\n") delay += 280;
      else if (ch === "," || ch === ";" || ch === ":") delay += 160;
      else if (ch === "-") delay += 110;

      // Random thinking pause at a word boundary.
      if (ch === " " && Math.random() < pauseChance) {
        delay += 420 + Math.random() * 680;
      }

      timer = window.setTimeout(tick, Math.max(12, delay));
    };

    timer = window.setTimeout(tick, startDelay);
    return () => { cancelled = true; if (timer != null) window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { revealed, activeIdx, done: activeIdx >= segments.length };
}
function NotesCursor() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block", width: "2px", marginLeft: "2px",
        height: "1em", verticalAlign: "text-bottom", background: "#f1c40f",
        animation: "blinkY 1s step-end infinite",
      }}
    />
  );
}

function TerminalLayout({ day }: { day: ApiDay }) {
  // Apple Notes layout (dark theme) with real-time typewriter.
  // Optional: day.copy.notes.{app,folder,date,title} for chrome.
  const notes = dayCopy(day, "notes");
  const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const dateStr = notes.date || todayLabel;
  const folder = notes.folder || "On My iPhone";
  const noteTitle = notes.title || day.title || "Untitled";
  const reasons: string[] = Array.isArray(day.reasons) ? day.reasons : [];

  // Build segments: title, body, then each reason, then signoff.
  // The title types first so the note feels like it's being authored.
  const segments = useMemo(() => {
    const segs: string[] = [];
    segs.push(noteTitle);
    segs.push(day.body ?? "");
    reasons.forEach((r) => segs.push(r));
    segs.push(day.signoff ?? "");
    return segs;
  }, [noteTitle, day.body, day.signoff, reasons.join("")]);

  // Admin can tune typing speed via day.copy.notes.typingSpeedMs (ms per char).
  // Default 55ms feels deliberate and human; small/medium/slow presets supported.
  const speedFromCopy = typeof notes.typingSpeedMs === "number" ? notes.typingSpeedMs : undefined;
  const { revealed, activeIdx } = useTypewriterSeq(segments, {
    speedMs: speedFromCopy ?? 55,
    jitterMs: 35,
    segmentPauseMs: 520,
    typoChance: 0.025,
    pauseChance: 0.012,
  });
  const TITLE_IDX = 0;
  const BODY_IDX = 1;
  const FIRST_REASON_IDX = 2;
  const SIGNOFF_IDX = FIRST_REASON_IDX + reasons.length;

  return (
    <PageFrame dark>
      <BackBar index={day.index} kind={day.kind} />
      <div className="max-w-2xl mx-auto px-5 sm:px-10 py-10 sm:py-14">
        {/* iOS Notes header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 select-none" style={{ color: "#f1c40f" }}>
          <div className="flex items-center gap-1 font-mono text-[12px] sm:text-sm">
            <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>‹</span>
            <span className="opacity-90">{folder}</span>
          </div>
          <div className="flex items-center gap-3 opacity-90 font-mono text-[12px] sm:text-sm">
            <span aria-hidden>⤴</span>
            <span aria-hidden>✎</span>
            <span aria-hidden>···</span>
          </div>
        </div>

        {/* Note body — dark notes paper feel */}
        <div
          className="rounded-md p-5 sm:p-7 sm:p-8"
          style={{
            background: "#1c1c1e",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          <style>{`@keyframes blinkY { 50% { opacity: 0; } }`}</style>

          <div className="text-center mb-2 font-mono opacity-50" style={{ fontSize: "11px", color: "#a1a1a6" }}>
            {dateStr}
          </div>

          {day.heroImage && (
            <div className="mb-5">
              <img
                src={day.heroImage}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full"
                style={{
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "block",
                }}
              />
            </div>
          )}

          <h1
            className="font-display text-2xl sm:text-3xl mb-5 leading-tight"
            style={{ color: "#f5f5f7", minHeight: "1.4em" }}
          >
            {revealed[TITLE_IDX]}
            {activeIdx === TITLE_IDX && <NotesCursor />}
          </h1>

          {day.body && (
            <div
              className="font-serif whitespace-pre-wrap leading-relaxed mb-6"
              style={{ color: "#e5e5ea", fontSize: "17px", lineHeight: "1.7", minHeight: activeIdx >= BODY_IDX ? undefined : "1.7em" }}
            >
              {revealed[BODY_IDX]}
              {activeIdx === BODY_IDX && <NotesCursor />}
            </div>
          )}

          {reasons.length > 0 && (
            <ul className="space-y-3 list-none">
              {reasons.map((_, i) => {
                const segIdx = FIRST_REASON_IDX + i;
                if (activeIdx < segIdx) return null;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 font-serif"
                    style={{ color: "#e5e5ea", fontSize: "16px", lineHeight: "1.6" }}
                  >
                    <span aria-hidden style={{ color: "#f1c40f", marginTop: 2 }}>•</span>
                    <span>
                      {revealed[segIdx]}
                      {activeIdx === segIdx && <NotesCursor />}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {day.signoff && activeIdx >= SIGNOFF_IDX && (
            <div
              className="font-serif italic mt-8 pt-5"
              style={{ color: "#aeaeb2", fontSize: "15px", borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              {revealed[SIGNOFF_IDX]}
              {activeIdx === SIGNOFF_IDX && <NotesCursor />}
            </div>
          )}
        </div>
      </div>
      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function VoiceMemoLayout({ day }: { day: ApiDay }) {
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="max-w-2xl mx-auto px-5 sm:px-10 py-20 text-center">
        <div className="w-20 h-20 bg-rose-deep rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg" style={{ color: "var(--cream)" }}>
           <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </div>
        <h1 className="font-display text-6xl mb-4 uppercase">{day.title}</h1>
        <p className="font-serif italic text-xl mb-10 opacity-70 whitespace-pre-wrap">{day.body}</p>
        <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
        <div className="mt-12 font-serif italic text-xl">{day.signoff}</div>
      </div>
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function SlideshowLayout({ day }: { day: ApiDay }) {
  const [index, setIndex] = useState(0);
  const slides = day.slides ?? [];
  const reasons: string[] = Array.isArray(day.reasons) ? day.reasons : [];
  const wy = dayCopy(day, "whyYou");

  // "Jumbotron" — if admin uploaded a video as heroImage (or a Cloudinary
  // /video/upload/ link), render it autoplaying muted+looped at the top. If
  // the heroImage is a plain photo, fall back to image jumbotron.
  const hero = day.heroImage?.trim() ?? "";
  const heroSrc = normaliseMedia(hero);
  const isVideo = isVideoUrl(heroSrc);
  const hasJumbo = heroSrc.length > 0;
  const hasSlides = slides.length > 0;
  const hasReasons = reasons.length > 0;

  return (
    <PageFrame dark>
      <BackBar index={day.index} kind={day.kind} />

      {/* Jumbotron — auto-playing video or hero image at top */}
      {hasJumbo && (
        <div className="px-5 sm:px-10 mt-6">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "16/9",
              borderRadius: "8px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
              background: "#000",
            }}
          >
            {isVideo ? (
              <video
                src={heroSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img
                src={heroSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 p-5 sm:p-8"
              style={{
                color: "var(--cream)",
                background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))",
              }}
            >
              <div className="uppercase-mono opacity-90">{day.eyebrow}</div>
              <SplitHeading
                text={(day.title ?? "").toUpperCase()}
                className="font-display leading-[0.9] mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slides — only when admin has authored some */}
      {hasSlides && (
        <div className="slideshow-wrap mt-10 flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="slide-item"
            >
              <div className="font-display text-5xl sm:text-8xl mb-6 text-center leading-[0.9] max-w-4xl uppercase">
                {slides[index]?.body}
              </div>
              {slides[index]?.sub && (
                <div className="uppercase-mono text-rose-dust text-sm sm:text-base tracking-[0.3em]">
                  {slides[index].sub}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-8">
            <button
              className="btn-pill hairline-cream py-2 px-6"
              onClick={() => setIndex(prev => Math.max(0, prev - 1))}
              disabled={index === 0}
            >PREV</button>
            <div className="font-mono text-xs opacity-40 tracking-widest">
              {index + 1} / {slides.length}
            </div>
            <button
              className="btn-pill hairline-cream py-2 px-6"
              onClick={() => setIndex(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={index === slides.length - 1}
            >NEXT</button>
          </div>
        </div>
      )}

      {/* Body copy under the jumbotron / slides */}
      {day.body && (
        <div className="max-w-3xl mx-auto px-5 sm:px-10 py-10 text-cream opacity-80 font-serif italic text-xl text-center whitespace-pre-wrap">
          {day.body}
        </div>
      )}

      {/* Why-you list — admin populates day.reasons[] */}
      {hasReasons && (
        <div className="px-5 sm:px-10 mt-2 pb-12 max-w-4xl mx-auto" style={{ color: "var(--cream)" }}>
          <div className="grid grid-cols-12 gap-4 items-end mb-6">
            <div className="col-span-12 sm:col-span-5">
              <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
              <SplitHeading text={(wy.heading || "WHY YOU.").toUpperCase()} className="font-display leading-[0.85] mt-3" />
              <div className="font-display text-5xl sm:text-7xl outline-text leading-none -mt-1 opacity-90">
                {wy.subhead || "FIELD NOTES"}
              </div>
            </div>
          </div>
          <ol className="space-y-2">
            {reasons.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="grid grid-cols-[56px_1fr] gap-4 py-4 border-b"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="font-display text-3xl leading-none" style={{ color: "var(--rose-deep)" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="font-serif text-lg sm:text-xl leading-snug">{r}</div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {day.signoff && (
        <div className="px-5 sm:px-10 pb-12 text-center font-serif italic text-xl" style={{ color: "var(--rose-dust)" }}>
          {day.signoff}
        </div>
      )}

      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function BirthdayLayout({ day }: { day: ApiDay }) {
  const birthday = { ...BIRTHDAY_COPY_TEMPLATE, ...dayCopy(day, "birthday") };
  const letter = { ...LETTER_COPY_TEMPLATE, ...dayCopy(day, "letter") };
  const tenWays = dayCopy(day, "tenWays") as { enabled?: boolean; cta?: string; heading?: string; lines?: string[] };
  // Default ON unless admin explicitly sets enabled=false. Empty array also disables.
  const tenWaysLines = (Array.isArray(tenWays.lines) && tenWays.lines.length > 0)
    ? tenWays.lines
    : [...TEN_WAYS_DEFAULT];
  const tenWaysOn = tenWays.enabled !== false && tenWaysLines.length > 0;
  const tenWaysCta = tenWays.cta || "ten ways I'm noticing you";
  const tenWaysHeading = tenWays.heading || "ten ways I'm noticing you";
  const [tenWaysOpen, setTenWaysOpen] = useState(false);
  const [isOpened, setIsOpened] = useState(() => {
    try { return localStorage.getItem(`envelope-opened-${day.slug}`) === "1"; }
    catch { return false; }
  });
  const audio = useAudio();
  const open = () => {
    try { localStorage.setItem(`envelope-opened-${day.slug}`, "1"); } catch {}
    setIsOpened(true);
  };
  const onBlow = () => {
    const src = resolveAudio(day);
    if (src.type === "youtube" && audio.currentId !== src.id) audio.play(src.id);
  };

  return (
    <PageFrame>
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            className="envelope-gate"
            exit={{ opacity: 0, transition: { duration: 1 } }}
          >
            <div className="text-center">
              <motion.div
                className="envelope"
                whileHover={{ y: -5 }}
                onClick={() => open()}
              >
                <div className="envelope-flap" />
                <div className="absolute inset-0 grid place-items-center font-serif italic text-3xl pt-8">
                  {birthday.envelopeCta || "For Yin"}
                </div>
              </motion.div>
              <div className="uppercase-mono mt-12 opacity-40 animate-pulse">tap to unlock the day</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isOpened ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
          <h1
            className="font-display leading-[0.78] text-mask-flower mt-3"
            style={{
              fontSize: "clamp(72px, 22vw, 360px)",
              ["--mask-image" as any]: `url(${IMG.birthdayFloral})`,
            }}
          >
            {(day.title || "HAPPY BIRTHDAY YIN").split(" ").map((w, i, arr) => (
              <span key={i}>{w}{i < arr.length - 1 && <br/>}</span>
            ))}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isOpened ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 1.5 }}
          className="font-serif italic text-2xl mt-6"
          style={{ color: "var(--rose-deep)" }}
        >
          {birthday.subhead || "today is the headline. no subhead."}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isOpened ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <CandleMoment onBlow={onBlow} copy={birthday} />
      </motion.div>

      <article className="max-w-3xl mx-auto px-5 sm:px-10 py-12 font-serif text-xl sm:text-2xl leading-[1.55] drop-cap whitespace-pre-wrap">
        {day.body}
      </article>

      {(day.gallery ?? []).length > 0 && (
        <PolaroidGallery items={day.gallery ?? []} prompt={dayCopy(day, "gallery").prompt} />
      )}

      {tenWaysOn && (
        <div className="px-5 sm:px-10 max-w-3xl mx-auto pb-2">
          <button
            type="button"
            className="btn-pill mt-4"
            onClick={() => setTenWaysOpen(true)}
          >
            {tenWaysCta}
            <span aria-hidden> →</span>
          </button>
        </div>
      )}
      <TenWaysModal
        open={tenWaysOpen}
        onClose={() => setTenWaysOpen(false)}
        lines={tenWaysLines}
        heading={tenWaysHeading}
      />

      <div className="px-5 sm:px-10 max-w-3xl mx-auto pb-4">
        <div className="font-serif italic text-2xl">{day.signoff}</div>
        <SignatureBlock svg={day.signatureSvg} signedAs={letter.signedAs} />
      </div>

      <VoiceNoteBlock url={day.voiceNoteUrl} copy={dayCopy(day, "voiceNote")} />

      <div className="px-5 sm:px-10 pb-16">
        <ReplyForm slug={day.slug} copy={dayCopy(day, "reply")} />
      </div>

      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

export default function DayPage() {
  const [, params] = useRoute<{ slug: string }>("/day/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey(), refetchInterval: 3_000, refetchOnWindowFocus: true, refetchOnMount: 'always' } });
  const { data: day, error, isLoading } = useGetDay(slug, {
    query: { queryKey: getGetDayQueryKey(slug), retry: false, enabled: Boolean(slug), refetchInterval: 3_000, refetchOnWindowFocus: true, refetchOnMount: 'always' },
  });
  const audio = useAudio();

  // Auto-play song once on first arrival
  useEffect(() => {
    const src = day ? resolveAudio(day) : null;
    if (src?.type === "youtube" && audio.currentId !== src.id) audio.play(src.id);
  }, [day?.slug]); // eslint-disable-line

  // Pingback: tell the server we opened it (once per device per slug)
  useEffect(() => {
    if (day?.slug) pingSeenOnce(day.slug);
  }, [day?.slug]);

  useEffect(() => {
    const status = (error as any)?.status;
    if (status === 423) {
      const lock = (error as any)?.data;
      const preview = lock?.previewText ? `&preview=${encodeURIComponent(lock.previewText)}` : "";
      navigate(`/locked?slug=${encodeURIComponent(slug)}&date=${encodeURIComponent(lock?.unlockDate ?? "")}${preview}`);
    }
  }, [error, navigate, slug]);

  usePageMeta({
    title: day ? `for yin · ${day.title}` : "for yin",
    description: day?.pullQuote || day?.eyebrow || undefined,
    image: day ? heroForDay(day.slug, day.heroImage || undefined) : undefined,
  });

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
    case "letter":    return <LetterLayout day={day} />;
    case "magazine":  return <MagazineLayout day={day} />;
    case "drafts":    return <DraftsLayout day={day} />;
    case "why-you":   return <WhyYouLayout day={day} />;
    case "gallery":   return <GalleryLayout day={day} />;
    case "birthday":  return <BirthdayLayout day={day} />;
    case "scratch":   return <ScratchLayout day={day} />;
    case "terminal":  return <TerminalLayout day={day} />;
    case "voicememo": return <VoiceMemoLayout day={day} />;
    case "slideshow": return <SlideshowLayout day={day} />;
    default:          return <LetterLayout day={day} />;
  }
}
