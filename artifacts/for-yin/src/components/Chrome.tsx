import { useEffect, useState, type ReactNode } from "react";
import { useGetLiveMessage, useGetSite, getGetLiveMessageQueryKey, getGetSiteQueryKey } from "@workspace/api-client-react";
import { useAudio } from "@/lib/audio";
import { Link, useLocation } from "wouter";

export function CoordStamp({ coords, place }: { coords: string; place: string }) {
  return (
    <div className="coord-stamp leading-tight">
      <div>{coords}</div>
      <div className="opacity-60">{place}</div>
    </div>
  );
}

export function Ticker({ accent = false }: { accent?: boolean }) {
  const { data } = useGetLiveMessage({
    query: { queryKey: getGetLiveMessageQueryKey(), refetchInterval: 60_000, staleTime: 30_000 },
  });
  const text = data?.text?.trim() || "thinking about you, in the cab, right now.";
  const items = Array.from({ length: 8 }).map((_, i) => (
    <span key={i} className="font-mono uppercase text-[11px] tracking-[0.18em]">
      {text}
      <span className="mx-6 opacity-50">✦</span>
      live from him
      <span className="mx-6 opacity-50">✦</span>
    </span>
  ));
  return (
    <div
      className="w-full overflow-hidden border-y hairline py-3"
      style={accent ? { background: "var(--rose-deep)", color: "var(--cream)", borderColor: "rgba(255,255,255,.2)" } : { background: "var(--ink)", color: "var(--cream)", borderColor: "rgba(255,255,255,.15)" }}
    >
      <div className="ticker-track">
        {items}{items}
      </div>
    </div>
  );
}

export function Petals() {
  const items = Array.from({ length: 14 });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map((_, i) => {
        const left = `${(i * 7 + 5) % 95}%`;
        const dur = `${14 + (i % 6) * 3}s`;
        const delay = `${(i * 1.2) % 12}s`;
        const dx = `${(i % 5) * 20 - 40}px`;
        const dr = `${(i % 7) * 60}deg`;
        return (
          <span
            key={i}
            className="petal"
            style={{ left, ["--dur" as any]: dur, ["--delay" as any]: delay, ["--dx" as any]: dx, ["--dr" as any]: dr }}
          />
        );
      })}
    </div>
  );
}

export function FloatingAudio() {
  const { isPlaying, isMuted, currentId, togglePlay, toggleMute } = useAudio();
  const [loc] = useLocation();
  if (loc.startsWith("/admin")) return null;
  if (!currentId) return null;
  return (
    <div className="fixed z-50 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 backdrop-blur-md"
         style={{ background: "rgba(12,10,10,0.86)", color: "var(--cream)", padding: "8px 10px", border: "1px solid rgba(255,255,255,.15)" }}>
      <span className="font-mono uppercase text-[10px] tracking-[0.18em] opacity-80 hidden sm:inline">Side A</span>
      <button onClick={togglePlay} className="h-8 w-8 grid place-items-center" aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? "❚❚" : "▶"}
      </button>
      <button onClick={toggleMute} className="h-8 px-2 font-mono uppercase text-[10px] tracking-[0.18em]" aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}

export function PageFrame({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  useEffect(() => {
    if (site?.accentColor) {
      document.documentElement.style.setProperty("--accent", site.accentColor);
    }
    if (site?.title) document.title = site.title;
  }, [site?.accentColor, site?.title]);
  return (
    <div className="relative min-h-screen" style={dark ? { background: "var(--ink)", color: "var(--cream)" } : undefined}>
      {!dark && <Petals />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function MastheadBar({ right }: { right?: ReactNode }) {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  return (
    <div className="flex items-center justify-between px-5 sm:px-10 pt-6">
      <Link href="/" className="font-display text-2xl tracking-wide hover:opacity-70 transition">
        FOR <span style={{ color: "var(--rose-deep)" }}>YIN</span>
      </Link>
      <div className="flex items-center gap-4">
        {site && <CoordStamp coords={site.coordinates} place={site.coordinatesPlace} />}
        {right}
      </div>
    </div>
  );
}

export function Countdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => { setS(seconds); }, [seconds]);
  useEffect(() => {
    if (s <= 0) return;
    const id = window.setInterval(() => setS((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [s > 0]); // eslint-disable-line
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const Cell = ({ n, label }: { n: number; label: string }) => (
    <div className="flex flex-col items-center px-3 sm:px-5">
      <div className="font-display text-5xl sm:text-7xl leading-none tabular-nums" style={{ color: "var(--ink)" }}>
        {String(n).padStart(2, "0")}
      </div>
      <div className="uppercase-mono mt-1 opacity-70">{label}</div>
    </div>
  );
  return (
    <div className="flex items-end justify-center divide-x hairline">
      <Cell n={d} label="days" />
      <Cell n={h} label="hrs" />
      <Cell n={m} label="min" />
      <Cell n={sec} label="sec" />
    </div>
  );
}

export function SplitHeading({ text, className = "" }: { text: string; className?: string }) {
  return (
    <h1 className={className}>
      {text.split("").map((ch, i) => (
        <span key={i} className="split-letter" style={{ animationDelay: `${i * 0.035}s` }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}
