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

export type ExternalUrlResult =
  | { kind: "fetchable"; url: string; provider: "dropbox" | "drive" | "cloudinary" | "direct" }
  | { kind: "embed"; url: string; provider: "youtube" | "vimeo" | "soundcloud" };

export function normaliseExternalUrl(raw: string): ExternalUrlResult {
  const s = raw.trim();

  // YouTube — cannot be re-hosted; embed as iframe
  const yt = s.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (yt) return { kind: "embed", url: `https://www.youtube.com/watch?v=${yt[1]}`, provider: "youtube" };

  // Vimeo
  const vimeo = s.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "embed", url: `https://vimeo.com/${vimeo[1]}`, provider: "vimeo" };

  if (s.includes("soundcloud.com")) return { kind: "embed", url: s, provider: "soundcloud" };

  // Dropbox — swap domain to dl.dropboxusercontent.com, strip dl= param
  if (s.includes("dropbox.com")) {
    return {
      kind: "fetchable",
      url: s
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace(/[?&]dl=[01]/g, ""),
      provider: "dropbox",
    };
  }

  // Google Drive /file/d/ID/view → uc?export=download&id=ID
  const drive = s.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) {
    return {
      kind: "fetchable",
      url: `https://drive.google.com/uc?export=download&id=${drive[1]}`,
      provider: "drive",
    };
  }

  if (s.includes("res.cloudinary.com")) return { kind: "fetchable", url: s, provider: "cloudinary" };

  return { kind: "fetchable", url: s, provider: "direct" };
}
