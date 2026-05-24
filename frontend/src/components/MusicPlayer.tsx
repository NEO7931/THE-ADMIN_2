import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music, Play } from "lucide-react";

// ── Set your YouTube video ID here ──────────────────────────────────────────
const MUSIC_VIDEO_ID = "qEzWqUhnbVA";
const VOLUME = 5;

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

export function MusicPlayer() {
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mount by 3s so page loads first
    const mountTimer = setTimeout(() => setMounted(true), 3000);
    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const init = () => {
      if (!document.getElementById("yt-music-player")) return;
      playerRef.current = new window.YT.Player("yt-music-player", {
        videoId: MUSIC_VIDEO_ID,
        playerVars: {
          autoplay: 1, mute: 0, loop: 1,
          playlist: MUSIC_VIDEO_ID,
          controls: 0, disablekb: 1, fs: 0,
          rel: 0, iv_load_policy: 3, modestbranding: 1,
        },
        events: {
          onReady: (e: any) => {
            setReady(true);
            e.target.setVolume(VOLUME);
            e.target.playVideo();
            setTimeout(() => {
              const state = e.target.getPlayerState?.();
              if (state !== 1 && state !== 3) setBlocked(true);
              else setPlaying(true);
            }, 2000);
          },
          onStateChange: (e: any) => {
            setPlaying(e.data === 1);
            if (e.data === 1) setBlocked(false);
          },
          onError: () => setBlocked(true),
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        document.head.appendChild(tag);
      }
    }

    return () => { if (playerRef.current?.destroy) playerRef.current.destroy(); };
  }, [mounted]);

  const handlePlay = () => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(VOLUME);
    playerRef.current.unMute();
    playerRef.current.playVideo();
    setMuted(false);
    setBlocked(false);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(VOLUME);
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  if (!visible || !mounted) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 100,
      display: "flex", alignItems: "center", gap: "10px",
      background: "rgba(30,42,61,0.95)",
      backdropFilter: "blur(10px)",
      border: "1px solid #354a63",
      padding: "10px 14px",
      boxShadow: "0 0 20px rgba(56,189,248,0.08), 0 4px 16px rgba(0,0,0,0.4)",
      minWidth: "180px",
    }}>
      <div id="yt-music-player" style={{ display: "none", width: 0, height: 0 }} />

      <div style={{
        width: "28px", height: "28px",
        border: `1px solid ${playing && !muted ? "#38bdf8" : "#354a63"}`,
        background: playing && !muted ? "#38bdf811" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        transition: "all 0.3s",
      }}>
        <Music style={{
          width: "12px", height: "12px",
          color: playing && !muted ? "#38bdf8" : "#4d6480",
          animation: playing && !muted ? "spin 3s linear infinite" : "none",
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: "#38bdf8", letterSpacing: "2px", margin: 0, whiteSpace: "nowrap" }}>
          {blocked ? "CLICK TO PLAY" : playing && !muted ? "NOW PLAYING" : muted ? "MUTED" : "LOADING..."}
        </p>
        <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "11px", color: "#8aa4bc", margin: "2px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Library Ambience
        </p>
      </div>

      {blocked ? (
        <button onClick={handlePlay} style={{ background: "#0ea5e9", border: "none", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Play">
          <Play style={{ width: "12px", height: "12px", color: "#fff" }} />
        </button>
      ) : (
        <button onClick={toggleMute} style={{ background: "transparent", border: "1px solid #354a63", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: muted ? "#4d6480" : "#8aa4bc", transition: "all 0.2s" }} title={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX style={{ width: "12px", height: "12px" }} /> : <Volume2 style={{ width: "12px", height: "12px" }} />}
        </button>
      )}

      <button onClick={() => { if (playerRef.current?.stopVideo) playerRef.current.stopVideo(); setVisible(false); }}
        style={{ background: "transparent", border: "none", color: "#4d6480", fontSize: "16px", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, flexShrink: 0 }} title="Dismiss">
        ×
      </button>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}