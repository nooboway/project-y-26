import { Link } from "wouter";
import { PageFrame } from "@/components/Chrome";

export default function NotFound() {
  return (
    <PageFrame>
      <div className="min-h-[80vh] grid place-items-center px-5 text-center">
        <div>
          <div className="font-display text-9xl leading-none outline-text">404</div>
          <div className="font-serif italic text-2xl mt-3" style={{ color: "var(--mauve)" }}>
            this page is not in the issue.
          </div>
          <Link href="/" className="btn-pill mt-8 inline-flex">← back to cover</Link>
        </div>
      </div>
    </PageFrame>
  );
}
