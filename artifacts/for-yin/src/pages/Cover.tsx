import { useGetSite, useListDays, getGetSiteQueryKey, getListDaysQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { MastheadBar, PageFrame, SplitHeading, Ticker } from "@/components/Chrome";
import { Countdown } from "@/components/Countdown";
import { IMG } from "@/lib/assets";
import { useAudio } from "@/lib/audio";
import { usePageMeta } from "@/lib/meta";
import { SITE_COPY_TEMPLATE } from "@/lib/copyDefaults";
import { motion } from "framer-motion";



export default function Cover() {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey(), refetchInterval: 3_000, refetchOnMount: 'always', refetchOnWindowFocus: true } });
  const { data: days } = useListDays({ query: { queryKey: getListDaysQueryKey(), refetchInterval: 3_000, refetchOnMount: 'always', refetchOnWindowFocus: true } });
  const [, navigate] = useLocation();
  const audio = useAudio();
  usePageMeta({
    title: site ? `${site.title}` : "for yin",
    description: "a five-day, hand-set issue. for yin, slowly. opened one day at a time.",
    image: IMG.coverHero,
  });

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

  const copy = (site as any).copy ?? {};
  // Interpolate {recipientName}, {senderName}, {title} into any copy string.
  const tmpl = (s: string | undefined) =>
    typeof s === "string"
      ? s
        .replace(/\{recipientName\}/g, site.recipientName)
        .replace(/\{senderName\}/g, site.senderName)
        .replace(/\{title\}/g, site.title)
      : s;
  const heroCopy = { ...SITE_COPY_TEMPLATE.hero, ...(copy.hero ?? {}) };
  const labelsCopy = { ...SITE_COPY_TEMPLATE.labels, ...(copy.labels ?? {}) };
  const buttonsCopy = { ...SITE_COPY_TEMPLATE.buttons, ...(copy.buttons ?? {}) };
  const footerCopy = { ...SITE_COPY_TEMPLATE.footer, ...(copy.footer ?? {}) };
  const coverCopy = { ...SITE_COPY_TEMPLATE.cover, ...(copy.cover ?? {}) };
  const countdownCopy = { ...SITE_COPY_TEMPLATE.countdown, ...(copy.countdown ?? {}) };

  const recipient = (site.recipientName ?? "Yin").toUpperCase();
  const stateLabel = tmpl(isBirthday ? labelsCopy.birthday : isAftermath ? labelsCopy.aftermath : labelsCopy.preBirthday);
  const stateButton = tmpl(isBirthday ? buttonsCopy.birthday : isAftermath ? buttonsCopy.aftermath : buttonsCopy.preBirthday);
  const stateBand = tmpl(isBirthday ? "live · today" : isAftermath ? "after the morning" : (countdownCopy.label ?? "until morning"));

  const handleOpen = () => {
    if (!today) return;
    // Kick audio inside the user gesture so mobile browsers honor it.
    if (today.youtubeId && !audio.currentId) {
      audio.play(today.youtubeId);
    }
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
            text={stateLabel}
            className="font-display leading-[0.85] mt-3"
          />
          <div
            className="font-display leading-[0.82] mt-16"
            style={{ fontSize: "clamp(64px, 16vw, 220px)" }}
          >
            <span style={{ color: "#0c0a0a" }}>{(heroCopy.lineOne || "").trim() || SITE_COPY_TEMPLATE.hero.lineOne}</span>
            <br />
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--rose-deep)" }}>
              {heroCopy.lineTwo || SITE_COPY_TEMPLATE.hero.lineTwo}
            </span>
            <br />
            <span style={{ color: "var(--ink)" }}>{tmpl(heroCopy.lineThree) || recipient + "."}</span>
          </div>

          <p className="font-serif italic text-xl sm:text-2xl mt-6 max-w-md leading-snug" style={{ color: "var(--mauve)" }}>
            {tmpl(heroCopy.subtitle) || `from ${site.senderName}, slowly. an unbroken letter, opened one day at a time.`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button className="btn-solid" onClick={handleOpen} disabled={!today}>
              {stateButton}
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
            <img src={heroCopy.image || (today as any)?.heroImage || IMG.coverHero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between text-[var(--cream)]"
                 style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.65))" }}>
              <div className="uppercase-mono opacity-90">{coverCopy.photoCaption}</div>
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
            <div className="uppercase-mono">{stateBand}</div>
            <div className="coord-stamp">{countdownCopy.sub ?? "SIDE A · 33⅓ RPM"}</div>
          </div>
          <Countdown />
        </div>
      </div>

      {/* Day pips */}
      <div className="px-5 sm:px-10 py-12">
        <div className="flex items-end justify-between mb-6">
          <div className="font-display text-3xl sm:text-5xl leading-none">{coverCopy.issuesHeading}</div>
          <div className="uppercase-mono opacity-60">{site.currentDayIndex} / {site.totalDays} unlocked</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {days.map((d) => {
            const inner = (
              <motion.div
                layoutId={`day-card-${d.slug}`}
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
                  <div
                    className="font-serif italic text-xl mt-1 leading-tight"
                    style={{ opacity: d.unlocked ? 1 : 0.28 }}
                  >
                    {d.igboTitle || (d.unlocked ? d.title : null)}
                  </div>
                  <div className="uppercase-mono mt-2 opacity-60">
                    {d.unlocked
                      ? d.eyebrow
                      : `comes alive ${new Date(d.unlockDate)
                          .toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })
                          .toUpperCase()}`}
                  </div>
                </div>

                {d.unlocked && (
                  <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--rose-deep)] w-0 group-hover:w-full transition-all duration-500" />
                )}
              </motion.div>
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
        <div className="font-display outline-text text-6xl sm:text-9xl leading-none">FOR&nbsp;{recipient}</div>
        <div className="uppercase-mono opacity-60 text-right">
          {tmpl(footerCopy.tagline)}<br/>
          {site.coordinatesPlace}
        </div>
      </footer>
    </PageFrame>
  );
}
