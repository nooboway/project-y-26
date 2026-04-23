import { useEffect } from "react";

function setMeta(name: string, content: string, attr: "name" | "property" = "property") {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(opts: { title?: string; description?: string; image?: string }) {
  const { title, description, image } = opts;
  useEffect(() => {
    if (title) {
      document.title = title;
      setMeta("og:title", title);
      setMeta("twitter:title", title, "name");
    }
    if (description) {
      setMeta("description", description, "name");
      setMeta("og:description", description);
      setMeta("twitter:description", description, "name");
    }
    if (image) {
      setMeta("og:image", image);
      setMeta("twitter:image", image, "name");
      setMeta("twitter:card", "summary_large_image", "name");
    }
    setMeta("og:type", "article");
  }, [title, description, image]);
}
