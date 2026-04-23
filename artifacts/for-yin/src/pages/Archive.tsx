import { Link } from "wouter";
import { useListDays, useGetSite, getGetSiteQueryKey, getListDaysQueryKey } from "@workspace/api-client-react";
import { MastheadBar, PageFrame, Ticker } from "@/components/Chrome";
import { heroForDay } from "@/lib/assets";

export default function Archive() {
  const { data: site } = useGetSite({ query: { queryKey: getGetSiteQueryKey() } });
  const { data: days } = useListDays({ query: { queryKey: getListDaysQueryKey() } });
  return (
    <PageFrame>
      <MastheadBar />
      <div className="px-5 sm:px-10 mt-8">
        <div className="uppercase-mono opacity-60">All five issues · for revisiting</div>
        <h1 className="font-display text-7xl sm:text-9xl leading-[0.85] mt-2">THE ARCHIVE</h1>
        <p className="font-serif italic text-xl mt-3 max-w-xl" style={{ color: "var(--mauve)" }}>
          a small back-issue catalogue. read them in any order now.
        </p>
      </div>

      <div className="px-5 sm:px-10 mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-16">
        {days?.map((d) => (
          <Link key={d.slug} href={d.unlocked ? `/day/${d.slug}` : "#"} className="group block">
            <div className="relative aspect-[5/4] overflow-hidden">
              <img src={heroForDay(d.slug)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, rgba(12,10,10,.7))" }} />
              <div className="absolute inset-x-0 bottom-0 p-5" style={{ color: "var(--cream)" }}>
                <div className="uppercase-mono opacity-80">Issue {String(d.index).padStart(2, "0")} · {d.kind}</div>
                <div className="font-display text-4xl mt-1 leading-none">{d.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Ticker />
      <div className="px-5 sm:px-10 py-10 uppercase-mono opacity-60">{site?.coordinates}</div>
    </PageFrame>
  );
}
