import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type AudioCtx = {
  play: (urlOrId: string) => void;
  toggleMute: () => void;
  togglePlay: () => void;
  pause: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  currentId: string | null;
};

const Ctx = createContext<AudioCtx | null>(null);

declare global {
  interface Window { 
    YT: any; onYouTubeIframeAPIReady?: () => void; 
    SC: any;
    Spotify: any; onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
  }
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
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return ytApiPromise;
}

let scApiPromise: Promise<void> | null = null;
function loadSCApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SC && window.SC.Widget) return Promise.resolve();
  if (scApiPromise) return scApiPromise;
  scApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://w.soundcloud.com/player/api.js";
    tag.onload = () => resolve();
    document.head.appendChild(tag);
  });
  return scApiPromise;
}

let spotifyApiPromise: Promise<any> | null = null;
function loadSpotifyApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Spotify && window.Spotify.IframeApi) return Promise.resolve(window.Spotify.IframeApi);
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://open.spotify.com/embed/iframe-api/v1";
    document.head.appendChild(tag);
    window.onSpotifyIframeApiReady = (IFrameAPI: any) => resolve(IFrameAPI);
  });
  return spotifyApiPromise;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Players
  const ytPlayerRef = useRef<any>(null);
  const scPlayerRef = useRef<any>(null);
  const spotifyPlayerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setPlaying] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      try { ytPlayerRef.current?.destroy?.(); } catch {}
      try { audioPlayerRef.current?.pause(); } catch {}
      try { spotifyPlayerRef.current?.destroy?.(); } catch {}
    };
  }, []);

  const pauseAll = () => {
    try { ytPlayerRef.current?.pauseVideo?.(); } catch {}
    try { scPlayerRef.current?.pause?.(); } catch {}
    try { spotifyPlayerRef.current?.pause?.(); } catch {}
    try { audioPlayerRef.current?.pause(); } catch {}
  };

  const play = (urlOrId: string) => {
    if (!urlOrId) return;
    setCurrentId(urlOrId);
    pauseAll();

    // Detect provider
    let provider = "direct";
    let ytId = "";
    
    const ytIdMatch = urlOrId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
    const ytBareMatch = /^[A-Za-z0-9_-]{11}$/.test(urlOrId);
    if (ytIdMatch || ytBareMatch) {
      provider = "youtube";
      ytId = ytIdMatch ? ytIdMatch[1] : urlOrId;
    } else if (urlOrId.includes("soundcloud.com")) {
      provider = "soundcloud";
    } else if (urlOrId.includes("spotify.com") || urlOrId.startsWith("spotify:")) {
      provider = "spotify";
    }

    setActiveProvider(provider);

    if (provider === "youtube") {
      void loadYTApi().then(() => {
        if (!containerRef.current) return;
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(ytId);
          if (isMuted) ytPlayerRef.current.mute?.();
          else ytPlayerRef.current.unMute?.();
          ytPlayerRef.current.setVolume?.(28);
          ytPlayerRef.current.playVideo?.();
          setPlaying(true);
          return;
        }
        const el = document.createElement("div");
        containerRef.current.appendChild(el);
        ytPlayerRef.current = new window.YT.Player(el, {
          height: "0", width: "0", videoId: ytId,
          playerVars: { autoplay: 1, controls: 0, playsinline: 1, modestbranding: 1, rel: 0 },
          events: {
            onReady: (e: any) => {
              try { 
                e.target.setVolume(28); 
                if (isMuted) e.target.mute();
                e.target.playVideo(); 
                setPlaying(true); 
              } catch {}
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
              if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setPlaying(false);
            },
          },
        });
      });
    } else if (provider === "soundcloud") {
      void loadSCApi().then(() => {
        if (!containerRef.current) return;
        if (!scPlayerRef.current) {
          const iframe = document.createElement("iframe");
          iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(urlOrId)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
          iframe.width = "0"; iframe.height = "0"; iframe.frameBorder = "0";
          containerRef.current.appendChild(iframe);
          scPlayerRef.current = window.SC.Widget(iframe);
          
          scPlayerRef.current.bind(window.SC.Widget.Events.READY, () => {
            scPlayerRef.current.setVolume(isMuted ? 0 : 28);
            scPlayerRef.current.play();
            setPlaying(true);
          });
          scPlayerRef.current.bind(window.SC.Widget.Events.PLAY, () => setPlaying(true));
          scPlayerRef.current.bind(window.SC.Widget.Events.PAUSE, () => setPlaying(false));
          scPlayerRef.current.bind(window.SC.Widget.Events.FINISH, () => setPlaying(false));
        } else {
          scPlayerRef.current.load(urlOrId, {
            auto_play: true, hide_related: true, show_comments: false, show_user: false, show_reposts: false, visual: false,
            callback: () => {
              scPlayerRef.current.setVolume(isMuted ? 0 : 28);
              scPlayerRef.current.play();
            }
          });
        }
      });
    } else if (provider === "spotify") {
      void loadSpotifyApi().then((IFrameAPI) => {
        if (!containerRef.current || !IFrameAPI) return;
        if (spotifyPlayerRef.current) {
          spotifyPlayerRef.current.loadUri(urlOrId);
          spotifyPlayerRef.current.play();
          setPlaying(true);
        } else {
          const el = document.createElement("div");
          containerRef.current.appendChild(el);
          const options = { uri: urlOrId, width: 0, height: 0, theme: 'dark' };
          const callback = (EmbedController: any) => {
            spotifyPlayerRef.current = EmbedController;
            EmbedController.addListener('ready', () => {
              EmbedController.play();
              setPlaying(true);
            });
            EmbedController.addListener('playback_update', (e: any) => {
              setPlaying(!e.data.isPaused);
            });
          };
          IFrameAPI.createController(el, options, callback);
        }
      });
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
        audioPlayerRef.current.volume = 0.28;
        audioPlayerRef.current.onplay = () => setPlaying(true);
        audioPlayerRef.current.onpause = () => setPlaying(false);
        audioPlayerRef.current.onended = () => setPlaying(false);
      }
      audioPlayerRef.current.src = urlOrId;
      audioPlayerRef.current.muted = isMuted;
      audioPlayerRef.current.play().catch(() => {});
    }
  };

  const pause = () => {
    pauseAll();
    setPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      if (!currentId) return;
      if (activeProvider === "youtube") ytPlayerRef.current?.playVideo?.();
      else if (activeProvider === "soundcloud") scPlayerRef.current?.play?.();
      else if (activeProvider === "spotify") spotifyPlayerRef.current?.play?.();
      else if (activeProvider === "direct") audioPlayerRef.current?.play?.();
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    if (activeProvider === "youtube") {
      if (nextMuted) ytPlayerRef.current?.mute?.();
      else ytPlayerRef.current?.unMute?.();
    } else if (activeProvider === "soundcloud") {
      scPlayerRef.current?.setVolume?.(nextMuted ? 0 : 28);
    } else if (activeProvider === "spotify") {
      if (nextMuted) spotifyPlayerRef.current?.pause?.();
      else spotifyPlayerRef.current?.play?.();
    } else if (activeProvider === "direct") {
      if (audioPlayerRef.current) audioPlayerRef.current.muted = nextMuted;
    }
  };

  return (
    <Ctx.Provider value={{ play, pause, togglePlay, toggleMute, isPlaying, isMuted, currentId }}>
      <div ref={containerRef} aria-hidden style={{ position: "absolute", left: -9999, top: -9999, opacity: 0, pointerEvents: "none" }} />
      {children}
    </Ctx.Provider>
  );
}

export function useAudio(): AudioCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("AudioProvider missing");
  return v;
}
