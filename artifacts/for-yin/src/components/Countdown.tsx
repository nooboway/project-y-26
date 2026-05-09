/**
 * Countdown — four selectable variants for the run-up to the birthday.
 *
 * The variant is read from `site.copy.countdown.style` once the `copy` jsonb
 * column lands (Phase 3 of PLAN.md). Until then the cast to `any` falls
 * through to "numbers" (the existing default), so this file is a safe
 * drop-in even before the migration.
 *
 * Add the matching CSS from `countdown.css` to `src/index.css` (Phase 4).
 *
 * Usage in Cover.tsx (or anywhere):
 *   import { Countdown } from "@/components/Countdown";
 *   <Countdown />                  // reads site.copy.countdown.style
 *   <Countdown style="vinyl" />    // override per-instance
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGetSite, getGetSiteQueryKey } from "@workspace/api-client-react";

export type CountdownStyle = "numbers" | "flip" | "vinyl" | "letterpress";

export const COUNTDOWN_STYLES: { value: CountdownStyle; label: string; hint: string }[] = [
  { value: "numbers",     label: "Numbers",     hint: "four cells, pipe separators — the classic" },
  { value: "flip",        label: "Flip clock",  hint: "split-flap board, ticks every second" },
  { value: "vinyl",       label: "Vinyl 33⅓",  hint: "rotating record disc, days in the label" },
  { value: "letterpress", label: "Letterpress", hint: "one number, one phrase. extreme minimal" },
];

// ── Shared time math ───────────────────────────────────────────────────────

function useDiff() {
  const { data: site, refetch } = useGetSite({
    query: {
      queryKey: getGetSiteQueryKey(),
      refetchInterval: 8_000,
    },
  });

  useEffect(() => {
    let bc: BroadcastChannel | undefined;
    try {
      bc = new BroadcastChannel("site-update");
      bc.onmessage = () => void refetch();
    } catch { /* BroadcastChannel not supported */ }
    return () => bc?.close();
  }, [refetch]);

  const target = site?.birthdayDate ? new Date(site.birthdayDate).getTime() : null;
  const [diff, setDiff] = useState<number>(() => (target != null ? target - Date.now() : Number.POSITIVE_INFINITY));
  useEffect(() => {
    if (target == null) return;
    setDiff(target - Date.now());
    const id = window.setInterval(() => setDiff(target - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  return { site, diff, target };
}

function breakdown(diff: number) {
  const total = Math.max(0, Math.floor(diff / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

// ── Variant 1: Numbers (current default) ───────────────────────────────────

function NumbersCountdown({ d, h, m, s }: { d: number; h: number; m: number; s: number }) {
  const Cell = ({ n, label }: { n: number; label: string }) => (
    <div className="flex flex-col items-center px-3 sm:px-5">
      <div className="font-display text-5xl sm:text-7xl leading-none tabular-nums" style={{ color: "var(--ink)" }}>
        {String(n).padStart(2, "0")}
      </div>
      <div className="uppercase-mono mt-1 opacity-70">{label}</div>
    </div>
  );
  const Sep = () => (
    <div className="font-display text-5xl sm:text-7xl leading-none" style={{ color: "var(--border-strong)" }}>|</div>
  );
  return (
    <div className="flex items-end justify-center">
      <Cell n={d} label="days" />
      <Sep />
      <Cell n={h} label="hrs" />
      <Sep />
      <Cell n={m} label="min" />
      <Sep />
      <Cell n={s} label="sec" />
    </div>
  );
}

// ── Variant 2: Flip clock ──────────────────────────────────────────────────

function FlipDigit({ value }: { value: string }) {
  return (
    <div className="flip-digit-frame">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="flip-digit-face"
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function FlipCell({ n, label }: { n: number; label: string }) {
  const str = String(n).padStart(2, "0");
  return (
    <div className="flex flex-col items-center px-1 sm:px-2">
      <div className="flip-pair">
        <FlipDigit value={str[0]} />
        <FlipDigit value={str[1]} />
      </div>
      <div className="uppercase-mono mt-3 opacity-70">{label}</div>
    </div>
  );
}

function FlipCountdown({ d, h, m, s }: { d: number; h: number; m: number; s: number }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      <FlipCell n={d} label="days" />
      <FlipCell n={h} label="hrs" />
      <FlipCell n={m} label="min" />
      <FlipCell n={s} label="sec" />
    </div>
  );
}

// ── Variant 3: Vinyl 33⅓ ───────────────────────────────────────────────────

function VinylCountdown({ d, h, m, s }: { d: number; h: number; m: number; s: number }) {
  return (
    <div className="vinyl-block">
      <div className="vinyl-stage">
        <svg className="vinyl-spinning" viewBox="0 0 400 400" aria-hidden>
          <defs>
            <radialGradient id="vinyl-sheen" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="196" fill="#0a0606" />
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={i}
              cx="200"
              cy="200"
              r={188 - i * 4}
              fill="none"
              stroke="rgba(239,230,220,0.045)"
              strokeWidth="0.4"
            />
          ))}
          <circle cx="200" cy="200" r="196" fill="url(#vinyl-sheen)" />
          <circle cx="200" cy="200" r="78" fill="var(--rose-deep)" />
          <circle cx="200" cy="200" r="78" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.6" />
          <circle cx="200" cy="200" r="3" fill="#0a0606" />
          <circle cx="200" cy="200" r="3" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.4" />
        </svg>
        <div className="vinyl-readout">
          <div className="vinyl-num font-display tabular-nums">{String(d).padStart(2, "0")}</div>
          <div className="uppercase-mono opacity-90 mt-[-2px]">days</div>
        </div>
      </div>
      <div className="vinyl-substats uppercase-mono opacity-70 tabular-nums">
        {String(h).padStart(2, "0")} HRS · {String(m).padStart(2, "0")} MIN · {String(s).padStart(2, "0")} SEC
      </div>
    </div>
  );
}

// ── Variant 4: Letterpress ─────────────────────────────────────────────────

function LetterpressCountdown({ d, h, m, s }: { d: number; h: number; m: number; s: number }) {
  const word = d === 1 ? "morning" : "mornings";
  return (
    <motion.div
      className="letterpress-stage"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {d > 0 ? (
        <>
          <div className="letterpress-num font-display tabular-nums">{d}</div>
          <div className="letterpress-line font-serif italic">{word} until you.</div>
          <div className="letterpress-fine uppercase-mono tabular-nums opacity-50">
            {String(h).padStart(2, "0")} : {String(m).padStart(2, "0")} : {String(s).padStart(2, "0")}
          </div>
        </>
      ) : (
        <>
          <div className="letterpress-line-large font-serif italic">
            {h} hours, {m} minutes,
          </div>
          <div className="letterpress-line-large font-serif italic tabular-nums">{s} seconds.</div>
          <div className="letterpress-fine uppercase-mono opacity-50">until morning</div>
        </>
      )}
    </motion.div>
  );
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

const VARIANTS: Record<CountdownStyle, React.FC<{ d: number; h: number; m: number; s: number }>> = {
  numbers: NumbersCountdown,
  flip: FlipCountdown,
  vinyl: VinylCountdown,
  letterpress: LetterpressCountdown,
};

export function Countdown({ style }: { style?: CountdownStyle } = {}) {
  const { site, diff, target } = useDiff();
  if (target == null) return null;

  // Until the `copy` jsonb column lands (Phase 3 of PLAN.md), this cast
  // gracefully falls through to "numbers".
  const fromConfig = (site as any)?.copy?.countdown?.style as CountdownStyle | undefined;
  const fromStorage = (() => {
    try { return localStorage.getItem("countdown-style") as CountdownStyle | null; } catch { return null; }
  })();
  // Listen for style changes made in admin (same browser, different tab)
  const [storageStyle, setStorageStyle] = useState<CountdownStyle | null>(fromStorage);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "countdown-style" && e.newValue) {
        setStorageStyle(e.newValue as CountdownStyle);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const resolved: CountdownStyle = style ?? fromConfig ?? storageStyle ?? "numbers";

  if (diff <= 0) {
    const whenZero = (site as any)?.copy?.countdown?.whenZero ?? "HAPPY BIRTHDAY YIN";
    return (
      <div className="text-center py-6">
        <span
          className="font-serif italic"
          style={{ fontSize: "clamp(28px, 5vw, 48px)", color: "var(--rose-deep)" }}
        >
          {whenZero}
        </span>
      </div>
    );
  }

  const parts = breakdown(diff);
  const Comp = VARIANTS[resolved] ?? NumbersCountdown;
  return <Comp {...parts} />;
}
