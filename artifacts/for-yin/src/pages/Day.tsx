import { useEffect, useMemo, useState, useRef } from "react";
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

function VoiceNoteBlock({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <div className="mx-5 sm:mx-10 mt-6">
      <div className="uppercase-mono opacity-60 mb-2">a one-take voice note · play me</div>
      <div className="voice">
        <audio controls preload="none" src={url} className="w-full" />
      </div>
    </div>
  );
}

function SignatureBlock({ svg }: { svg?: string | null }) {
  if (!svg) return null;
  return (
    <div className="mt-10 sig-svg">
      <div className="uppercase-mono opacity-60 mb-2">— signed,</div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
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
        <SignatureBlock svg={day.signatureSvg} />
      </article>
      <VoiceNoteBlock url={day.voiceNoteUrl} />
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
              <img src={heroForDay(day.slug, day.heroImage || undefined)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <article className="max-w-3xl mx-auto px-5 sm:px-10 py-14 font-serif text-xl leading-[1.6] whitespace-pre-wrap">
          {day.body}
          <div className="mt-10 italic" style={{ color: "var(--rose-dust)" }}>{day.signoff}</div>
        </article>
        <VoiceNoteBlock url={day.voiceNoteUrl} />
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
      <VoiceNoteBlock url={day.voiceNoteUrl} />
      <SongBlock day={day} />
    </PageFrame>
  );
}

function WhyYouLayout({ day }: { day: ApiDay }) {
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
      <VoiceNoteBlock url={day.voiceNoteUrl} />
      <SongBlock day={day} />
    </PageFrame>
  );
}

function PolaroidGallery({ items }: { items: { url: string; caption: string }[] }) {
  return (
    <div className="px-5 sm:px-10 mt-10 max-w-5xl mx-auto">
      <div className="uppercase-mono opacity-60 mb-6 text-center">a small stack of frames · pick one up</div>
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
  return (
    <PageFrame>
      <BackBar index={day.index} kind={day.kind} />
      <div className="px-5 sm:px-10 mt-8 max-w-5xl mx-auto">
        <div className="uppercase-mono opacity-60">{day.eyebrow}</div>
        <SplitHeading text={day.title.toUpperCase()} className="font-display leading-[0.9] mt-3" />
        <p className="font-serif italic text-xl mt-4 max-w-xl" style={{ color: "var(--mauve)" }}>{day.body}</p>
      </div>
      {usePolaroid ? (
        <PolaroidGallery items={items} />
      ) : (
        <div className="px-5 sm:px-10 mt-10 max-w-6xl mx-auto bento">
          {items.map((g, i) => (
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
      <VoiceNoteBlock url={day.voiceNoteUrl} />
      <SongBlock day={day} />
    </PageFrame>
  );
}

function CandleMoment({ onBlow }: { onBlow: () => void }) {
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
      <div className="uppercase-mono opacity-60 mt-3">{out ? "make a wish · the morning is yours" : "blow out the candle"}</div>
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
        {out ? "wish made ♡" : "blow"}
      </button>
      {confetti && (
        <div className="confetti" aria-hidden>
          {pieces.map((_, i) => {
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

function ReplyForm({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const reply = useSendDayReply();
  if (done) {
    return (
      <div className="mx-auto max-w-xl mt-10 reply-card text-center">
        <div className="uppercase-mono opacity-60">received · slowly</div>
        <div className="font-serif italic text-2xl mt-2" style={{ color: "var(--rose-deep)" }}>
          your one-line reply landed.
        </div>
        <div className="font-serif italic mt-3" style={{ color: "var(--mauve)" }}>he'll know.</div>
      </div>
    );
  }
  return (
    <form
      className="mx-auto max-w-xl mt-10 reply-card"
      onSubmit={async (e) => {
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
        a single sentence, anything. only he sees it.
      </div>
      <textarea
        className="field mt-4"
        rows={3}
        maxLength={400}
        placeholder="say one thing back…"
        value={text}
        onChange={(e) => setText(e.target.value)}
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
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    let isDrawing = false;
    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
    };

    const handleStart = (e: any) => { isDrawing = true; handleMove(e); };
    const handleEnd = () => { isDrawing = false; };
    const handleMove = (e: any) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
      const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);
      scratch(x, y);
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("touchstart", handleStart);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("touchmove", handleMove);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("touchstart", handleStart);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("touchmove", handleMove);
    };
  }, []);

  return (
    <div className="scratch-card">
      <div className="scratch-content">
        <div className="uppercase-mono opacity-50 mb-2">{front}</div>
        <div className="font-serif text-xl">{hidden}</div>
      </div>
      <canvas ref={canvasRef} width={400} height={300} className="scratch-canvas" />
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
          {(day.scratchCards ?? []).map((c, i) => (
            <ScratchCard key={i} front={c.front} hidden={c.hidden} />
          ))}
        </div>
      </div>
      <SongBlock day={day} />
      <Ticker />
    </PageFrame>
  );
}

function TerminalLayout({ day }: { day: ApiDay }) {
  const [lines, setLines] = useState<string[]>(["Initializing system...", "Loading encrypted memory...", "Done.", "Type 'help' for commands."]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    if (!cmd) return;
    let response = `Command not found: ${cmd}`;
    if (cmd === "help") response = "Available commands: bio, secret, clear, date";
    if (cmd === "bio") response = "Subject: Yin. Status: Extraordinary. Location: Deep in my thoughts.";
    if (cmd === "secret") response = "I still have that napkin from the first night.";
    if (cmd === "date") response = new Date().toString();
    if (cmd === "clear") { setLines([]); setInput(""); return; }

    setLines(prev => [...prev, `> ${input}`, response]);
    setInput("");
  };

  return (
    <PageFrame dark>
      <BackBar index={day.index} kind={day.kind} />
      <div className="max-w-3xl mx-auto px-5 sm:px-10 py-12">
        <div className="terminal-window">
          <div className="space-y-1 mb-4 h-[300px] overflow-y-auto no-scrollbar font-mono text-sm sm:text-base">
            {lines.map((l, i) => <div key={i}>{l}</div>)}
            <div ref={endRef} />
          </div>
          <form onSubmit={handleCommand} className="flex items-center font-mono text-sm sm:text-base">
            <span className="mr-2 text-[#00ff41]">{">"}</span>
            <input 
              type="text" 
              className="bg-transparent border-none outline-none flex-1 text-[#00ff41]" 
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <span className="terminal-cursor" />
          </form>
        </div>
        <p className="font-serif text-cream text-lg mt-8 opacity-70 italic whitespace-pre-wrap">{day.body}</p>
      </div>
      <SongBlock day={day} />
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
        <VoiceNoteBlock url={day.voiceNoteUrl} />
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

  return (
    <PageFrame dark>
      <BackBar index={day.index} kind={day.kind} />
      <div className="slideshow-wrap mt-10 flex flex-col items-center justify-center">
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
      <div className="max-w-3xl mx-auto px-5 sm:px-10 py-12 text-cream opacity-60 font-serif italic text-xl text-center whitespace-pre-wrap">
        {day.body}
      </div>
      <SongBlock day={day} />
    </PageFrame>
  );
}

function BirthdayLayout({ day }: { day: ApiDay }) {
  const [isOpened, setIsOpened] = useState(false);
  const audio = useAudio();
  const onBlow = () => {
    if (day.youtubeId) audio.play(day.youtubeId);
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
                onClick={() => setIsOpened(true)}
              >
                <div className="envelope-flap" />
                <div className="absolute inset-0 grid place-items-center font-serif italic text-3xl pt-8">
                  For Yin
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
            HAPPY<br/>BIRTHDAY<br/>YIN
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={isOpened ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 1.5 }}
          className="font-serif italic text-2xl mt-6" 
          style={{ color: "var(--rose-deep)" }}
        >
          today is the headline. no subhead.
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isOpened ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <CandleMoment onBlow={onBlow} />
      </motion.div>

      <article className="max-w-3xl mx-auto px-5 sm:px-10 py-12 font-serif text-xl sm:text-2xl leading-[1.55] drop-cap whitespace-pre-wrap">
        {day.body}
      </article>

      {(day.gallery ?? []).length > 0 && (
        <PolaroidGallery items={day.gallery ?? []} />
      )}

      <div className="px-5 sm:px-10 max-w-3xl mx-auto pb-4">
        <div className="font-serif italic text-2xl">{day.signoff}</div>
        <SignatureBlock svg={day.signatureSvg} />
      </div>

      <VoiceNoteBlock url={day.voiceNoteUrl} />

      <div className="px-5 sm:px-10 pb-16">
        <ReplyForm slug={day.slug} />
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
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  const { data: day, error, isLoading } = useGetDay(slug, {
    query: { queryKey: getGetDayQueryKey(slug), retry: false, enabled: Boolean(slug), refetchInterval: 10_000 },
  });
  const audio = useAudio();

  // Auto-play song once on first arrival
  useEffect(() => {
    if (day?.youtubeId && !audio.currentId) {
      audio.play(day.youtubeId);
    }
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
