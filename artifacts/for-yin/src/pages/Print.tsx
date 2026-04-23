import { useEffect } from "react";
import { useGetSite, useListDays, useGetDay, getGetSiteQueryKey, getListDaysQueryKey, getGetDayQueryKey } from "@workspace/api-client-react";
import { usePageMeta } from "@/lib/meta";

function PrintDay({ slug }: { slug: string }) {
  const { data, error } = useGetDay(slug, { query: { queryKey: getGetDayQueryKey(slug), retry: false } });
  if (error) {
    return (
      <section className="print-day locked">
        <div className="uppercase-mono opacity-70">{slug}</div>
        <h2 className="font-display text-4xl mt-2">CLOSED FOR NOW</h2>
        <p className="font-serif italic mt-2">unlocks on its own time.</p>
        <hr className="my-8" />
      </section>
    );
  }
  if (!data) return null;
  return (
    <section className="print-day">
      <div className="uppercase-mono opacity-70">Issue {String(data.index).padStart(2, "0")} · {data.kind}</div>
      <h2 className="font-display text-5xl leading-none mt-2">{data.title}</h2>
      <div className="uppercase-mono opacity-60 mt-1">{data.eyebrow}</div>
      <article className="font-serif text-base leading-relaxed mt-6 whitespace-pre-wrap">
        {data.body}
      </article>
      {data.pullQuote && (
        <blockquote className="mt-6 pl-4 border-l-2 font-serif italic text-lg" style={{ borderColor: "#6b1f2a", color: "#6b1f2a" }}>
          “{data.pullQuote}”
        </blockquote>
      )}
      {(data.reasons ?? []).length > 0 && (
        <ol className="mt-6 list-decimal list-inside font-serif">
          {data.reasons!.map((r, i) => <li key={i} className="py-1">{r}</li>)}
        </ol>
      )}
      {(data.drafts ?? []).length > 0 && (
        <ul className="mt-6 font-serif">
          {data.drafts!.map((d, i) => (
            <li key={i} className={d.crossed ? "line-through opacity-60" : ""}>— {d.text}</li>
          ))}
        </ul>
      )}
      <div className="font-serif italic mt-6">{data.signoff}</div>
      <hr className="my-8" />
    </section>
  );
}

export default function Print() {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  const { data: days } = useListDays({ query: { queryKey: getListDaysQueryKey() } });
  usePageMeta({ title: "for yin · the print edition" });

  useEffect(() => {
    document.body.classList.add("print-page");
    return () => { document.body.classList.remove("print-page"); };
  }, []);

  if (!site || !days) return <div className="p-10 font-mono text-xs">developing the issue…</div>;

  return (
    <div className="max-w-3xl mx-auto p-10" style={{ background: "white", color: "#111" }}>
      <header className="mb-10">
        <div className="uppercase-mono opacity-70">{site.coordinatesPlace} · {new Date(site.birthdayDate).toUTCString().slice(5, 16)}</div>
        <h1 className="font-display text-7xl leading-none mt-2">FOR YIN — THE PRINT EDITION</h1>
        <p className="font-serif italic mt-3">all five issues, gathered. printed in one copy.</p>
        <div className="mt-4 no-print">
          <button className="btn-pill" onClick={() => window.print()}>print this</button>
        </div>
        <hr className="my-6" />
      </header>

      {days.map((d) => <PrintDay key={d.slug} slug={d.slug} />)}

      <footer className="mt-10 text-center font-serif italic">
        — for you, slowly. always.
      </footer>
    </div>
  );
}
