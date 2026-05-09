import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useAdminLogin,
  useAdminGetSite,
  useAdminUpdateSite,
  useAdminUpdateLive,
  useAdminListDays,
  useAdminUpdateDay,
  useAdminListSeen,
  getAdminListSeenQueryKey,
  getAdminGetSiteQueryKey,
  getAdminListDaysQueryKey,
  getGetSiteQueryKey,
  getGetLiveMessageQueryKey,
  getListDaysQueryKey,
  getGetDayQueryKey,
  type Day as ApiDay,
  type DayKind,
  type GalleryImageSpan,
  type DraftItem,
  type GalleryImage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { adminHeaders, getAdminToken, setAdminToken } from "@/lib/admin";
import { MediaUpload } from '@/components/MediaUpload';
import { CopyEditor } from "@/components/CopyEditor";
import { SITE_COPY_TEMPLATE, DAY_COPY_TEMPLATES } from "@/lib/copyDefaults";
import { COUNTDOWN_STYLES, type CountdownStyle } from "@/components/Countdown";

function Login({ onIn }: { onIn: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const login = useAdminLogin();
  return (
    <div className="admin-shell grid place-items-center px-5 py-20">
      <form
        className="w-full max-w-md border hairline p-8"
        onSubmit={async (e: any) => {
          e.preventDefault();
          setErr(null);
          try {
            const res = await login.mutateAsync({ data: { passphrase: pass } });
            setAdminToken(res.token);
            onIn();
          } catch (e: any) {
            setErr("wrong passphrase.");
          }
        }}
      >
        <div className="font-display text-5xl leading-none">CONTROL ROOM</div>
        <div className="uppercase-mono opacity-70 mt-1">restricted · for j. only</div>
        <label className="block mt-8 uppercase-mono opacity-80">passphrase</label>
        <input
          className="field mt-2"
          type="password"
          autoFocus
          value={pass}
          onChange={(e: any) => setPass(e.target.value)}
        />
        {err && <div className="mt-3 text-sm" style={{ color: "var(--rose-dust)" }}>{err}</div>}
        <button className="btn-solid mt-6 w-full justify-center" disabled={login.isPending} type="submit">
          {login.isPending ? "checking…" : "enter"}
        </button>
        <Link href="/" className="block uppercase-mono opacity-60 mt-6 text-center">← back to cover</Link>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border hairline p-6 sm:p-8 mt-8">
      <div className="uppercase-mono opacity-70 mb-4">{title}</div>
      {children}
    </section>
  );
}

function SiteEditor({ onChanged }: { onChanged: () => void }) {
  const headers = adminHeaders();
  const { data, refetch } = useAdminGetSite({ request: { headers }, query: { queryKey: getAdminGetSiteQueryKey() } });
  const update = useAdminUpdateSite({ request: { headers } });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data) setForm({ ...(data as any) }); }, [data]);
  if (!form) return <Section title="site"><div className="opacity-60">loading…</div></Section>;
  const F = (k: string, label: string, type: "text" | "number" | "color" = "text", small = false) => (
    <label className={small ? "block" : "block sm:col-span-2"}>
      <div className="uppercase-mono opacity-70 mb-1">{label}</div>
      <input className="field" type={type} value={form[k] ?? ""}
             onChange={(e: any) => setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })} />
    </label>
  );
  return (
    <Section title="site / dates / accent">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {F("title", "title")}
        {F("recipientName", "recipient", "text", true)}
        {F("senderName", "sender", "text", true)}
        {F("startDate", "start (ISO)", "text", true)}
        {F("birthdayDate", "birthday (ISO)", "text", true)}
        {F("accentColor", "accent (hex)", "text", true)}
        {F("unlockOverride", "unlock override (0=none)", "number", true)}
        {F("coordinates", "coordinates", "text", true)}
        {F("coordinatesPlace", "coordinates · place", "text", true)}
      </div>
      <div className="mt-6">
        <div className="uppercase-mono opacity-70 mb-2">countdown style</div>
        <select
          className="field"
          value={form.copy?.countdown?.style ?? "numbers"}
          onChange={(e: any) =>
            setForm({ ...form, copy: { ...(form.copy ?? {}),
              countdown: { ...(form.copy?.countdown ?? {}),
                style: e.target.value as CountdownStyle } } })
          }
        >
          {COUNTDOWN_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label} — {s.hint}</option>
          ))}
        </select>
      </div>
      <div className="mt-6">
        <div className="uppercase-mono opacity-70 mb-3">copy / display text</div>
        <CopyEditor
          template={SITE_COPY_TEMPLATE}
          value={form.copy}
          onChange={(v) => setForm({ ...form, copy: v })}
        />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button className="btn-solid" disabled={update.isPending}
          onClick={async () => {
            await update.mutateAsync({
              data: {
                title: form.title,
                recipientName: form.recipientName,
                senderName: form.senderName,
                startDate: form.startDate,
                birthdayDate: form.birthdayDate,
                accentColor: form.accentColor,
                coordinates: form.coordinates,
                coordinatesPlace: form.coordinatesPlace,
                unlockOverride: form.unlockOverride,
                copy: form.copy,
              },
            }, { onSuccess: () => { refetch(); onChanged(); } });
          }}>
          {update.isPending ? "saving…" : "save site"}
        </button>
        <span className="uppercase-mono opacity-60">issue {form.unlockOverride > 0 ? `manually unlocked to ${form.unlockOverride}` : "auto by date"}</span>
      </div>
      {form.unlockOverride > 0 && (
        <div
          className="uppercase-mono text-[9px] mt-2 px-3 py-2 border"
          style={{ borderColor: "var(--rose-deep)", color: "var(--rose-deep)", background: "rgba(196,122,106,0.06)" }}
        >
          ⚠ override active — all cards up to {form.unlockOverride} are forced open.
          set to 0 when done testing.
        </div>
      )}
    </Section>
  );
}

function LiveEditor({ onChanged }: { onChanged: () => void }) {
  const headers = adminHeaders();
  const update = useAdminUpdateLive({ request: { headers } });
  const [text, setText] = useState("");
  return (
    <Section title="live · ticker message (cross-device, polled every 60s)">
      <textarea className="field" rows={3} placeholder="thinking about you, in the cab, right now."
                value={text} onChange={(e: any) => setText(e.target.value)} />
      <div className="mt-4">
        <button className="btn-solid" disabled={update.isPending || !text.trim()}
          onClick={async () => {
            await update.mutateAsync({ data: { text } }, { onSuccess: () => { setText(""); onChanged(); } });
          }}>
          {update.isPending ? "broadcasting…" : "broadcast"}
        </button>
      </div>
    </Section>
  );
}

function DayEditor({ day, onChanged }: { day: ApiDay; onChanged: () => void }) {
  const initial: ApiDay = {
    ...day,
    drafts: day.drafts ?? [],
    reasons: day.reasons ?? [],
    gallery: day.gallery ?? [],
    igboTitle: day.igboTitle ?? "",
    heroImage: day.heroImage ?? "",
    body: day.body ?? "",
    pullQuote: day.pullQuote ?? "",
    signoff: day.signoff ?? "",
    songTitle: day.songTitle ?? "",
    songArtist: day.songArtist ?? "",
    youtubeId: day.youtubeId ?? "",
    signatureSvg: day.signatureSvg ?? "",
    voiceNoteUrl: day.voiceNoteUrl ?? "",
    audioUrl: day.audioUrl ?? "",
    previewText: day.previewText ?? "",
    scratchCards: day.scratchCards ?? [],
    slides: day.slides ?? [],
  };
  const [d, setD] = useState<ApiDay>(initial);
  const headers = adminHeaders();
  const update = useAdminUpdateDay({ request: { headers } });
  useEffect(() => { setD(initial); }, [day.slug]); // eslint-disable-line
  const drafts: DraftItem[] = d.drafts ?? [];
  const reasons: string[] = d.reasons ?? [];
  const gallery: GalleryImage[] = d.gallery ?? [];
  const scratchCards: any[] = d.scratchCards ?? [];
  const slides: any[] = d.slides ?? [];
  const set = (patch: Partial<ApiDay>) => setD((p: ApiDay) => ({ ...p, ...patch }));

  const save = async () => {
    await update.mutateAsync({
      slug: d.slug,
      data: {
        title: d.title,
        igboTitle: d.igboTitle,
        eyebrow: d.eyebrow,
        kind: d.kind as unknown as DayKind,
        heroImage: d.heroImage,
        body: d.body,
        pullQuote: d.pullQuote,
        signoff: d.signoff,
        songTitle: d.songTitle,
        songArtist: d.songArtist,
        youtubeId: d.youtubeId,
        unlockTime: (d as any).unlockTime ?? "00:00",
        drafts,
        reasons,
        gallery,
        scratchCards,
        slides,
        signatureSvg: d.signatureSvg ?? "",
        voiceNoteUrl: d.voiceNoteUrl ?? "",
        previewText: d.previewText ?? "",
        audioUrl: d.audioUrl ?? "",
        copy: (d as any).copy,
      } as any,
    }, { onSuccess: () => onChanged() });
  };

  return (
    <details className="border hairline mt-3" open={false}>
      <summary className="cursor-pointer p-4 flex items-center justify-between">
        <div>
          <span className="uppercase-mono opacity-70 mr-3">{String(d.index).padStart(2, "0")} · {d.kind}</span>
          <span className="font-serif italic text-xl">{d.title}</span>
        </div>
        <span className="uppercase-mono opacity-60">edit</span>
      </summary>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t hairline">
        <label><div className="uppercase-mono opacity-70 mb-1">title</div>
          <input className="field" value={d.title} onChange={(e: any) => set({ title: e.target.value })} /></label>
        <div>
          <label className="block mb-1">
            <div className="uppercase-mono opacity-70">Igbo Title</div>
            <input
              type="text"
              className="field"
              value={d.igboTitle ?? ''}
              onChange={(e: any) => set({ igboTitle: e.target.value })}
              placeholder="e.g. Ụtọ"
            />
          </label>
          <div className="uppercase-mono opacity-40 text-[9px] mt-1">
            Visible on the home screen — locked and unlocked.
            Do not change unless you are certain.
          </div>
        </div>
        <label><div className="uppercase-mono opacity-70 mb-1">eyebrow</div>
          <input className="field" value={d.eyebrow} onChange={(e: any) => set({ eyebrow: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">kind</div>
          <select className="field" value={d.kind} onChange={(e: any) => set({ kind: e.target.value as unknown as DayKind })}>
            <option value="letter">letter</option>
            <option value="magazine">magazine</option>
            <option value="drafts">drafts</option>
            <option value="why-you">why-you</option>
            <option value="gallery">gallery</option>
            <option value="birthday">birthday</option>
            <option value="scratch">scratch</option>
            <option value="terminal">terminal</option>
            <option value="voicememo">voicememo</option>
            <option value="slideshow">slideshow</option>
          </select></label>
        <div className="sm:col-span-1">
          <div className="uppercase-mono opacity-70 mb-1">Hero Image</div>
          <MediaUpload
            accept="image/*"
            label="Upload hero photo"
            token={getAdminToken() ?? ""}
            currentUrl={d.heroImage ?? ""}
            onUploaded={(r: any) => set({ heroImage: r.url })}
          />
          <input
            className="field"
            type="text"
            placeholder="or paste URL directly"
            value={d.heroImage ?? ""}
            onChange={(e: any) => set({ heroImage: e.target.value })}
          />
        </div>
        <label className="sm:col-span-2"><div className="uppercase-mono opacity-70 mb-1">body</div>
          <textarea className="field" rows={8} value={d.body ?? ""} onChange={(e: any) => set({ body: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">pull quote</div>
          <input className="field" value={d.pullQuote ?? ""} onChange={(e: any) => set({ pullQuote: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">signoff</div>
          <input className="field" value={d.signoff ?? ""} onChange={(e: any) => set({ signoff: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">song title</div>
          <input className="field" value={d.songTitle ?? ""} onChange={(e: any) => set({ songTitle: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">song artist</div>
          <input className="field" value={d.songArtist ?? ""} onChange={(e: any) => set({ songArtist: e.target.value })} /></label>
        <label><div className="uppercase-mono opacity-70 mb-1">youtube id</div>
          <input className="field" value={d.youtubeId ?? ""} onChange={(e: any) => set({ youtubeId: e.target.value })} /></label>
        <label>
          <div className="uppercase-mono opacity-70 mb-1">unlock time (GMT+1, HH:MM)</div>
          <input
            className="field"
            type="time"
            value={(d as any).unlockTime ?? "00:00"}
            onChange={(e: any) => set({ unlockTime: e.target.value } as any)}
          />
          <div className="uppercase-mono opacity-40 text-[9px] mt-1">
            time is GMT+1 — 00:00 = midnight GMT+1 (current default)
          </div>
        </label>
        <div className="sm:col-span-1">
          <div className="uppercase-mono opacity-70 mb-1">Voice Note (mp3/m4a/ogg)</div>
          <MediaUpload
            accept="audio/*"
            label="Upload audio (mp3, m4a, wav)"
            token={getAdminToken() ?? ""}
            currentUrl={d.voiceNoteUrl ?? ""}
            onUploaded={(r: any) => set({ voiceNoteUrl: r.url })}
          />
          <input
            className="field"
            type="text"
            placeholder="or paste URL directly"
            value={d.voiceNoteUrl ?? ""}
            onChange={(e: any) => set({ voiceNoteUrl: e.target.value })}
          />
        </div>
        <div className="sm:col-span-1">
          <div className="uppercase-mono opacity-70 mb-1">Audio URL (for kind=voicememo)</div>
          <MediaUpload
            accept="audio/*"
            label="Upload audio file"
            token={getAdminToken() ?? ""}
            currentUrl={d.audioUrl ?? ""}
            onUploaded={(r: any) => set({ audioUrl: r.url })}
          />
          <input
            className="field"
            type="text"
            placeholder="or paste audio URL directly"
            value={d.audioUrl ?? ""}
            onChange={(e: any) => set({ audioUrl: e.target.value })}
          />
        </div>
        <label className="sm:col-span-2"><div className="uppercase-mono opacity-70 mb-1">preview text · whispered when locked</div>
          <input className="field" value={d.previewText ?? ""} onChange={(e: any) => set({ previewText: e.target.value })} placeholder="a hint she'll see on the locked door…" /></label>
        <label className="sm:col-span-2"><div className="uppercase-mono opacity-70 mb-1">signature svg · paste raw &lt;svg&gt;…&lt;/svg&gt; (used on letter / birthday)</div>
          <textarea className="field" rows={4} value={d.signatureSvg ?? ""} onChange={(e: any) => set({ signatureSvg: e.target.value })} placeholder='<svg viewBox="0 0 200 60"><path d="M5 40 C 30 5, 80 65, 110 25 S 180 50, 195 30" /></svg>' /></label>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-2">drafts (for kind=drafts)</div>
          {drafts.map((dr: DraftItem, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <input className="field flex-1" value={dr.text}
                     onChange={(e: any) => set({ drafts: drafts.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
              <label className="uppercase-mono flex items-center gap-2 px-2 py-2">
                <input type="checkbox" checked={dr.crossed}
                       onChange={(e: any) => set({ drafts: drafts.map((x, j) => j === i ? { ...x, crossed: e.target.checked } : x) })} />
                crossed
              </label>
              <button type="button" className="btn-pill" onClick={() => set({ drafts: drafts.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button type="button" className="btn-pill mt-2" onClick={() => set({ drafts: [...drafts, { text: "", crossed: false }] })}>+ draft</button>
        </div>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-2">reasons (for kind=why-you)</div>
          {reasons.map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <input className="field flex-1" value={r}
                     onChange={(e: any) => set({ reasons: reasons.map((x, j) => j === i ? e.target.value : x) })} />
              <button type="button" className="btn-pill" onClick={() => set({ reasons: reasons.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button type="button" className="btn-pill mt-2" onClick={() => set({ reasons: [...reasons, ""] })}>+ reason</button>
        </div>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-2">gallery (for kind=gallery / birthday)</div>
          {gallery.map((g: GalleryImage, i: number) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 p-3 border hairline bg-paper/30">
              <div className="sm:col-span-1">
                <MediaUpload
                  accept="image/*"
                  label={`Gallery photo ${i + 1}`}
                  token={getAdminToken() ?? ""}
                  currentUrl={g.url}
                  onUploaded={(r: any) => set({ gallery: gallery.map((x, j) => j === i ? { ...x, url: r.url } : x) })}
                />
                <input
                  className="field"
                  placeholder="or paste photo URL"
                  value={g.url}
                  onChange={(e: any) => set({ gallery: gallery.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <input className="field" placeholder="caption" value={g.caption}
                       onChange={(e: any) => set({ gallery: gallery.map((x, j) => j === i ? { ...x, caption: e.target.value } : x) })} />
                <div className="flex gap-2">
                  <select className="field" value={g.span}
                          onChange={(e: any) => set({ gallery: gallery.map((x, j) => j === i ? { ...x, span: e.target.value as unknown as GalleryImageSpan } : x) })}>
                    <option value="s">s</option><option value="m">m</option><option value="l">l</option><option value="xl">xl</option>
                  </select>
                  <button type="button" className="btn-pill" onClick={() => set({ gallery: gallery.filter((_, j) => j !== i) })}>×</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-pill mt-2" onClick={() => set({ gallery: [...gallery, { url: "", caption: "", span: "m" as unknown as GalleryImageSpan }] })}>+ image</button>
        </div>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-2">scratch cards (for kind=scratch)</div>
          {scratchCards.map((c: any, i: number) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 p-2 border hairline">
              <input className="field" placeholder="Front text" value={c.front}
                     onChange={(e: any) => set({ scratchCards: scratchCards.map((x, j) => j === i ? { ...x, front: e.target.value } : x) })} />
              <div className="flex gap-2">
                <input className="field flex-1" placeholder="Hidden text" value={c.hidden}
                       onChange={(e: any) => set({ scratchCards: scratchCards.map((x, j) => j === i ? { ...x, hidden: e.target.value } : x) })} />
                <button type="button" className="btn-pill" onClick={() => set({ scratchCards: scratchCards.filter((_, j) => j !== i) })}>×</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-pill mt-2" onClick={() => set({ scratchCards: [...scratchCards, { front: "", hidden: "" }] })}>+ card</button>
        </div>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-2">slides (for kind=slideshow)</div>
          {slides.map((s: any, i: number) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 p-2 border hairline">
               <input className="field" placeholder="Body text (large)" value={s.body}
                     onChange={(e: any) => set({ slides: slides.map((x, j) => j === i ? { ...x, body: e.target.value } : x) })} />
              <div className="flex gap-2">
                <input className="field flex-1" placeholder="Subtext (small)" value={s.sub}
                       onChange={(e: any) => set({ slides: slides.map((x, j) => j === i ? { ...x, sub: e.target.value } : x) })} />
                <button type="button" className="btn-pill" onClick={() => set({ slides: slides.filter((_, j) => j !== i) })}>×</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-pill mt-2" onClick={() => set({ slides: [...slides, { body: "", sub: "" }] })}>+ slide</button>
        </div>

        <div className="sm:col-span-2">
          <div className="uppercase-mono opacity-70 mb-3">copy / display text</div>
          <CopyEditor
            template={DAY_COPY_TEMPLATES[d.kind] ?? {}}
            value={(d as any).copy}
            onChange={(v) => set({ copy: v } as any)}
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="button" className="btn-solid" disabled={update.isPending} onClick={save}>
            {update.isPending ? "saving…" : "save day"}
          </button>
          <span className="uppercase-mono opacity-60">{d.slug}</span>
        </div>
      </div>
    </details>
  );
}

function SeenPanel() {
  const headers = adminHeaders();
  const seen = useAdminListSeen({
    request: { headers },
    query: { queryKey: getAdminListSeenQueryKey(), refetchInterval: 30_000 },
  });
  const items = seen.data ?? [];
  const opened = items.filter((i: any) => i.openedAt);
  const replied = items.filter((i: any) => i.replyText);
  return (
    <Section title="opens · replies (cross-device, polled every 30s)">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="uppercase-mono opacity-60">opened</div>
          <div className="font-display text-5xl leading-none mt-1">{opened.length} <span className="opacity-40 text-2xl">/ {items.length}</span></div>
        </div>
        <div>
          <div className="uppercase-mono opacity-60">replies received</div>
          <div className="font-display text-5xl leading-none mt-1">{replied.length}</div>
        </div>
        <div>
          <div className="uppercase-mono opacity-60">last seen</div>
          <div className="font-serif italic text-xl mt-1">
            {opened.length
              ? new Date(opened.map((i: any) => i.openedAt!).sort().reverse()[0]).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((it: any) => (
          <div key={it.slug} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_180px] gap-3 items-start py-3 border-t hairline">
            <div>
              <div className="uppercase-mono opacity-70">{it.slug}</div>
              <div className="font-serif italic text-lg">{it.title}</div>
            </div>
            <div>
              {it.replyText ? (
                <div>
                  <div className="uppercase-mono opacity-60">reply</div>
                  <div className="font-serif italic text-xl mt-1" style={{ color: "var(--rose-deep)" }}>“{it.replyText}”</div>
                </div>
              ) : (
                <div className="font-serif italic opacity-50">no reply yet</div>
              )}
            </div>
            <div className="uppercase-mono opacity-70 text-right">
              {it.openedAt ? `opened · ${new Date(it.openedAt).toLocaleString()}` : "not opened"}
              {it.replyAt && <div>replied · {new Date(it.replyAt).toLocaleString()}</div>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const headers = adminHeaders();
  const qc = useQueryClient();
  const days = useAdminListDays({ request: { headers }, query: { queryKey: getAdminListDaysQueryKey(), enabled: authed } });

  const invalidateAll = () => {
    // Push an immediate update signal to any other open tab (Cover, Day page)
    try { new BroadcastChannel("site-update").postMessage("refresh"); } catch {}

    qc.refetchQueries({ queryKey: getGetSiteQueryKey() });
    qc.refetchQueries({ queryKey: getGetLiveMessageQueryKey() });
    qc.refetchQueries({ queryKey: getListDaysQueryKey() });
    qc.refetchQueries({ queryKey: getAdminGetSiteQueryKey() });
    qc.refetchQueries({ queryKey: getAdminListDaysQueryKey() });
    days.data?.forEach((d: any) => qc.refetchQueries({ queryKey: getGetDayQueryKey(d.slug) }));
  };

  // If token is invalid (e.g. server restarted secret), drop it.
  useEffect(() => {
    if (authed && days.error) {
      const status = (days.error as any)?.status;
      if (status === 401) {
        setAdminToken(null);
        setAuthed(false);
      }
    }
  }, [days.error, authed]);

  if (!authed) return <Login onIn={() => setAuthed(true)} />;

  return (
    <div className="admin-shell">
      <div className="px-5 sm:px-10 pt-8 flex items-center justify-between">
        <div>
          <div className="uppercase-mono opacity-60">control room · for-yin</div>
          <div className="font-display text-6xl leading-none mt-1">EDITORIAL DESK</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-pill">view site</Link>
          <button className="btn-pill" onClick={() => { setAdminToken(null); setAuthed(false); }}>sign out</button>
        </div>
      </div>

      <div className="px-5 sm:px-10 pb-20">
        <SiteEditor onChanged={invalidateAll} />
        <LiveEditor onChanged={invalidateAll} />

        <SeenPanel />

        <Section title="days">
          {days.data?.map((d: any) => <DayEditor key={d.slug} day={d} onChanged={invalidateAll} />)}
        </Section>
      </div>
    </div>
  );
}
