import { markDaySeen } from "@workspace/api-client-react";

const KEY = "for-yin:seen";

function loadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(s: Set<string>) {
  try { window.localStorage.setItem(KEY, JSON.stringify(Array.from(s))); } catch { /* noop */ }
}

export function pingSeenOnce(slug: string) {
  if (!slug) return;
  const set = loadSet();
  if (set.has(slug)) return;
  set.add(slug);
  saveSet(set);
  void markDaySeen(slug).catch(() => { /* swallow */ });
}
