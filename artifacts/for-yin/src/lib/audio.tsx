import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type AudioCtx = {
  play: (youtubeId: string) => void;
  toggleMute: () => void;
  togglePlay: () => void;
  pause: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  currentId: string | null;
};

const Ctx = createContext<AudioCtx | null>(null);

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
}

let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return ytApiPromise;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      try { playerRef.current?.destroy?.(); } catch { /* noop */ }
    };
  }, []);

  const play = (youtubeId: string) => {
    if (!youtubeId) return;
    setCurrentId(youtubeId);
    void loadYTApi().then(() => {
      if (!containerRef.current) return;
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(youtubeId);
        playerRef.current.setVolume?.(28);
        playerRef.current.playVideo?.();
        setPlaying(true);
        setMuted(false);
        return;
      }
      const el = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);
      playerRef.current = new window.YT.Player(el, {
        height: "0",
        width: "0",
        videoId: youtubeId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: any) => {
            try { e.target.setVolume(28); e.target.playVideo(); setPlaying(true); } catch { /* noop */ }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
    });
  };

  const pause = () => {
    try { playerRef.current?.pauseVideo?.(); setPlaying(false); } catch { /* noop */ }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) pause();
    else { try { playerRef.current.playVideo(); setPlaying(true); } catch { /* noop */ } }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute?.(); setMuted(false); }
    else { playerRef.current.mute?.(); setMuted(true); }
  };

  return (
    <Ctx.Provider value={{ play, pause, togglePlay, toggleMute, isPlaying, isMuted, currentId }}>
      <div ref={containerRef} aria-hidden style={{ position: "fixed", left: -9999, top: -9999 }} />
      {children}
    </Ctx.Provider>
  );
}

export function useAudio(): AudioCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("AudioProvider missing");
  return v;
}
