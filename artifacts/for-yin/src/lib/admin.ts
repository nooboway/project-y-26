const KEY = "for-yin-admin-token";

export function getAdminToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setAdminToken(t: string | null): void {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function adminHeaders(): { "x-admin-token": string } | undefined {
  const t = getAdminToken();
  return t ? { "x-admin-token": t } : undefined;
}
