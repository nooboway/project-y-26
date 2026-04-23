import { Link } from "wouter";
import { MastheadBar, PageFrame } from "@/components/Chrome";

function useQuery() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  return { slug: params.get("slug") ?? "", date: params.get("date") ?? "" };
}

export default function Locked() {
  const { slug, date } = useQuery();
  const dateStr = date ? new Date(date).toUTCString().slice(0, 16) : "";
  return (
    <PageFrame>
      <MastheadBar />
      <div className="min-h-[70vh] grid place-items-center px-5">
        <div className="max-w-xl text-center">
          <div className="uppercase-mono opacity-60">{slug || "issue locked"}</div>
          <div className="font-display text-6xl sm:text-8xl leading-none mt-4 outline-text">CLOSED</div>
          <div className="font-display text-6xl sm:text-8xl leading-none italic" style={{ color: "var(--rose-deep)", fontFamily: "var(--font-serif)" }}>for now.</div>
          <p className="font-serif italic text-xl sm:text-2xl mt-6" style={{ color: "var(--mauve)" }}>
            this one comes alive on its own time. come back {dateStr ? <strong>{dateStr}</strong> : "soon"}.
          </p>
          <Link href="/" className="btn-pill mt-10 inline-flex">← back to cover</Link>
        </div>
      </div>
    </PageFrame>
  );
}
