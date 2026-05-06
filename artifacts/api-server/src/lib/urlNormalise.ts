/**
 * Normalise a stored URL for API responses.
 * Absolute URLs (http/https/data) are returned as-is.
 * Empty strings are returned as empty strings.
 */
export function urlNormalise(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = raw.trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) {
    return s;
  }
  // Relative path — keep as-is; clients resolve against API origin
  return s;
}
