import { useGetSite, useListDays, getGetSiteQueryKey, getListDaysQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Countdown, MastheadBar, PageFrame, SplitHeading, Ticker } from "@/components/Chrome";
import { IMG } from "@/lib/assets";
import { motion } from "framer-motion";

export default function Cover() {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey(), refetchInterval: 60_000 } });
  const { data: days } = useListDays({ query: { queryKey: getListDaysQueryKey(), refetchInterval: 60_000 } });
  const [, navigate] = useLocation();

  if (!site || !days) {
    return (
      <PageFrame>
        <div className="min-h-screen grid place-items-center">
          <div className="font-mono uppercase text-[11px] tracking-[0.2em] opacity-60">
            developing the issue…
          </div>
        </div>
      </PageFrame>
    );
  }

  const today = days.find((d) => d.isToday) ?? days.find((d) => d.unlocked);
  const isAftermath = site.isAftermath;
  const isBirthday = site.isBirthday;

  const handleOpen = () => {
    if (!today) return;
    // Play song for today's day (we don't have it yet; will load on day page).
    navigate(`/day/${today.slug}`);
  };

  return (
    <PageFrame>
      <MastheadBar
        right={
          <Link href="/admin" className="uppercase-mono opacity-60 hover:opacity-100 transition">
            admin
          </Link>
        }
      />

      {/* big editorial spread */}
      <div className="px-5 sm:px-10 pt-8 sm:pt-12 grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-7">
          <div className="uppercase-mono opacity-60">Issue {String(site.totalDays).padStart(2, "0")} · {new Date(site.birthdayDate).toUTCString().slice(5, 16)}</div>
          <SplitHeading
            text={isBirthday ? "TODAY IS YOU" : isAftermath ? "THANK YOU FOR BEING" : "FIVE DAYS TO YIN"}
            className="font-display leading-[0.85] mt-3"
          />
          <div
            className="font-display leading-[0.82] -mt-2"
            style={{ fontSize: "clamp(64px, 16vw, 220px)" }}
          >
            <span className="outline-text">HAPPY</span>
            <br />
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--rose-deep)" }}>
              birthday,
            </span>
            <br />
            <span style={{ color: "var(--ink)" }}>YIN.</span>
          </div>

          <p className="font-serif italic text-xl sm:text-2xl mt-6 max-w-md leading-snug" style={{ color: "var(--mauve)" }}>
            from {site.senderName}, slowly. an unbroken letter, opened one day at a time.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button className="btn-solid" onClick={handleOpen} disabled={!today}>
              {isBirthday ? "open the morning" : isAftermath ? "revisit the issues" : "open today's letter"}
              <span aria-hidden>→</span>
            </button>
            {isAftermath && (
              <Link href="/archive" className="btn-pill">the archive</Link>
            )}
          </div>
        </div>

        <div className="col-span-12 sm:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative aspect-[4/5] overflow-hidden"
          >
            <img src={IMG.coverHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between text-[var(--cream)]"
                 style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.65))" }}>
              <div className="uppercase-mono opacity-90">Photo · 35mm · for y.</div>
              <div className="coord-stamp">{site.coordinates}</div>
            </div>
          </motion.div>

          {/* outline lockup overlay */}
          <div
            className="hidden sm:block absolute -left-6 -bottom-6 font-display outline-text leading-none pointer-events-none select-none"
            style={{ fontSize: "120px" }}
          >
            ISSUE {String(site.totalDays).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Countdown band */}
      <div className="mt-12 sm:mt-16">
        <Ticker accent />
        <div className="px-5 sm:px-10 py-10 sm:py-14 border-b hairline">
          <div className="flex items-center justify-between mb-6">
            <div className="uppercase-mono">
              {isBirthday ? "live · today" : isAftermath ? "after the morning" : "until morning"}
            </div>
            <div className="coord-stamp">SIDE A · 33⅓ RPM</div>
          </div>
          {!isAftermath && <Countdown seconds={site.secondsUntilBirthday} />}
          {isAftermath && (
            <div className="font-serif italic text-3xl text-center" style={{ color: "var(--mauve)" }}>
              the morning has happened. and you were everything.
            </div>
          )}
        </div>
      </div>

      {/* Day pips */}
      <div className="px-5 sm:px-10 py-12">
        <div className="flex items-end justify-between mb-6">
          <div className="font-display text-3xl sm:text-5xl leading-none">THE ISSUES</div>
          <div className="uppercase-mono opacity-60">{site.currentDayIndex} / {site.totalDays} unlocked</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {days.map((d) => {
            const inner = (
              <div
                className="group relative h-44 sm:h-56 border hairline p-4 flex flex-col justify-between transition-all duration-300"
                style={{
                  background: d.unlocked ? "var(--paper)" : "transparent",
                  opacity: d.unlocked ? 1 : 0.55,
                  cursor: d.unlocked ? "pointer" : "not-allowed",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-display text-3xl leading-none">{String(d.index).padStart(2, "0")}</div>
                  <div className={`pip h-2.5 w-2.5 rounded-full ${d.isToday ? "pip-now" : ""}`}
                       style={{ background: d.unlocked ? "var(--accent)" : "transparent", border: "1px solid var(--ink)" }} />
                </div>

                <div>
                  <div className="uppercase-mono opacity-60">{d.eyebrow}</div>
                  <div className="font-serif italic text-xl mt-1 leading-tight">
                    {d.unlocked ? d.title : "—"}
                  </div>
                  <div className="uppercase-mono mt-2 opacity-60">
                    {d.unlocked ? d.kind : new Date(d.unlockDate).toUTCString().slice(0, 11)}
                  </div>
                </div>

                {d.unlocked && (
                  <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--rose-deep)] w-0 group-hover:w-full transition-all duration-500" />
                )}
              </div>
            );
            return d.unlocked ? (
              <Link key={d.slug} href={`/day/${d.slug}`}>{inner}</Link>
            ) : (
              <div key={d.slug} aria-disabled>{inner}</div>
            );
          })}
        </div>
      </div>

      <Ticker />

      <footer className="px-5 sm:px-10 py-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="font-display outline-text text-6xl sm:text-9xl leading-none">FOR&nbsp;YIN</div>
        <div className="uppercase-mono opacity-60 text-right">
          a private issue · printed in one copy<br/>
          {site.coordinatesPlace}
        </div>
      </footer>
    </PageFrame>
  );
}
