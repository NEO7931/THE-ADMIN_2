import { useState, useEffect } from "react";

export function useEasterEgg() {
  const [clicks, setClicks] = useState(0);
  const [show, setShow] = useState(false);

  const handleLogoClick = () => {
    setClicks(c => {
      const next = c + 1;
      if (next >= 30) {
        setShow(true);
        return 0; // reset
      }
      return next;
    });
  };

  // Close on any key press
  useEffect(() => {
    if (!show) return;
    const close = () => setShow(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [show]);

  return { clicks, handleLogoClick, show, setShow };
}

export function DancingBaby({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(8, 13, 20, 0.92)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Confetti dots */}
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${4 + Math.random() * 6}px`,
          height: `${4 + Math.random() * 6}px`,
          borderRadius: "50%",
          background: ["#38bdf8","#7dd3fc","#38bdf8","#ffffff","#0ea5e9"][i % 5],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `confetti ${1.5 + Math.random() * 2}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
          opacity: 0.7,
        }} />
      ))}

      {/* Dancing baby GIF */}
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* Glow behind baby */}
        <div style={{
          position: "absolute",
          inset: "-40px",
          background: "radial-gradient(ellipse at center, #38bdf833 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        <img
          src="https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif"
          alt="Dancing Baby"
          style={{
            width: "200px",
            imageRendering: "pixelated",
            position: "relative",
            filter: "drop-shadow(0 0 20px #38bdf888)",
            animation: "bounce 0.5s ease-in-out infinite alternate",
          }}
        />

        <div style={{ marginTop: "24px", position: "relative" }}>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "36px",
            letterSpacing: "6px",
            color: "#38bdf8",
            textShadow: "0 0 20px #38bdf888",
            margin: "0 0 8px 0",
          }}>
            YOU FOUND IT! 🎉
          </p>
          <p style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px",
            color: "#64748b",
            letterSpacing: "2px",
            margin: "0 0 4px 0",
          }}>
            // 30 clicks unlocked the secret
          </p>
          <p style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "10px",
            color: "#38bdf855",
            letterSpacing: "1px",
          }}>
            click anywhere or press any key to close
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          from { transform: translateY(0px) rotate(-3deg); }
          to   { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes confetti {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          50%       { transform: translateY(-30px) rotate(180deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}