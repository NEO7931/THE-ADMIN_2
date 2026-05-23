import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { ArrowRight, BookOpen, BookMarked, Clock, Shield, Users, BookCopy } from "lucide-react";

const features = [
  {
    icon: <BookCopy style={{ width: "20px", height: "20px", color: "#38bdf8" }} />,
    title: "Book Catalog",
    desc: "Search and filter our full collection by title, author, or category.",
    href: "/books",
    tag: "EXPLORE",
  },
  {
    icon: <BookMarked style={{ width: "20px", height: "20px", color: "#64748b" }} />,
    title: "Borrow & Reserve",
    desc: "Request books online and reserve upcoming titles before they're gone.",
    href: "/borrow",
    tag: "BORROW",
  },
  {
    icon: <Clock style={{ width: "20px", height: "20px", color: "#38bdf8" }} />,
    title: "Reading History",
    desc: "Track your full reading history and see your past transactions.",
    href: "/history",
    tag: "HISTORY",
  },
  {
    icon: <Users style={{ width: "20px", height: "20px", color: "#64748b" }} />,
    title: "Notifications",
    desc: "Get notified on approvals, due dates, and fine issuances instantly.",
    href: "/notifications",
    tag: "ALERTS",
  },
  {
    icon: <Shield style={{ width: "20px", height: "20px", color: "#38bdf8" }} />,
    title: "Fine Management",
    desc: "View overdue fines and settle them directly through the platform.",
    href: "/fines",
    tag: "FINES",
  },
  {
    icon: <BookOpen style={{ width: "20px", height: "20px", color: "#64748b" }} />,
    title: "Admin Dashboard",
    desc: "Full control over requests, catalog, users, analytics, and fines.",
    href: "/admin",
    tag: "ADMIN",
  },
];

// ─── Hero Video ──────────────────────────────────────────────────────────────
const YOUTUBE_VIDEO_ID = "E8ceh5Nx8YA";

function HeroVideo() {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "480px",
      margin: "0 auto",
      aspectRatio: "16/10",
    }}>
      {/* Corner accents */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "16px", height: "16px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8", zIndex: 3 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "16px", height: "16px", borderTop: "2px solid #38bdf8", borderRight: "2px solid #38bdf8", zIndex: 3 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "16px", height: "16px", borderBottom: "2px solid #64748b", borderLeft: "2px solid #64748b", zIndex: 3 }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "16px", height: "16px", borderBottom: "2px solid #64748b", borderRight: "2px solid #64748b", zIndex: 3 }} />

      {/* Dark blend overlay — makes video feel part of the bg */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(135deg, #1e243388 0%, #1e243322 40%, #1e243322 60%, #1e243388 100%)",
        mixBlendMode: "multiply",
      }} />

      {/* Blue tint overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "rgba(30, 58, 90, 0.35)",
      }} />

      {/* Scan line on top */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
      }} />

      {/* Border glow */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        border: "1px solid #38bdf822",
        boxShadow: "inset 0 0 40px #38bdf808, 0 0 30px #38bdf811",
      }} />

      {/* YouTube iframe */}
      <iframe
        src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
        allow="autoplay; fullscreen"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1, opacity: 0.75, filter: "saturate(0.7) brightness(0.8)" }}
        title="Background video"
        loading="lazy"
      />
    </div>
  );
}


export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "80px 24px",
      }}>
        {/* Background gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 70% at 20% 50%, #38bdf808 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 30%, #64748b05 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "1200px", margin: "0 auto", width: "100%",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "80px", alignItems: "center",
          position: "relative", zIndex: 1,
        }}>
          {/* Left — text */}
          <div>
            {/* Eyebrow */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              border: "1px solid #38bdf833", padding: "5px 12px",
              marginBottom: "32px",
            }}>
              <div style={{ width: "6px", height: "6px", background: "#38bdf8", boxShadow: "0 0 6px #38bdf8" }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#64748b", letterSpacing: "3px" }}>
                INSTITUTIONAL LIBRARY SYSTEM
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.95,
              letterSpacing: "2px",
              color: "#ffffff",
              margin: "0 0 8px 0",
            }}>
              YOUR GATEWAY
            </h1>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.95,
              letterSpacing: "2px",
              color: "#38bdf8",
              textShadow: "0 0 40px #38bdf844",
              margin: "0 0 32px 0",
            }}>
              TO KNOWLEDGE.
            </h1>

            <p style={{
              color: "#666",
              fontSize: "15px",
              lineHeight: 1.8,
              maxWidth: "440px",
              marginBottom: "48px",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 500,
            }}>
              Browse thousands of books, manage borrowing, track reservations, and stay on top of your reading — all in one place.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/books">
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px",
                    background: "#38bdf8",
                    border: "1px solid #38bdf8",
                    color: "#fff",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700, fontSize: "13px", letterSpacing: "2px",
                    cursor: "pointer",
                    boxShadow: "0 0 20px #38bdf833",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0284c7"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px #38bdf855"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf8"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px #38bdf833"; }}
                >
                  BROWSE CATALOG <ArrowRight style={{ width: "14px", height: "14px" }} />
                </button>
              </Link>

              {!user && (
                <Link href="/register">
                  <button
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "14px 28px",
                      background: "transparent",
                      border: "1px solid #384558",
                      color: "#888",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700, fontSize: "13px", letterSpacing: "2px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#38bdf844"; (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4a5f78"; (e.currentTarget as HTMLElement).style.color = "#888"; }}
                  >
                    JOIN THE LIBRARY
                  </button>
                </Link>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "32px", marginTop: "56px", paddingTop: "32px", borderTop: "1px solid #1a2130" }}>
              {[
                { value: "10+", label: "Books Available" },
                { value: "24/7", label: "Online Access" },
                { value: "NEU", label: "Exclusive Access" },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#38bdf8", letterSpacing: "2px", margin: 0, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "2px", margin: "4px 0 0 0", textTransform: "uppercase" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — book */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <HeroVideo />
          </div>
        </div>
      </section>

      {/* ── DIVIDER ────────────────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #38bdf822, transparent)" }} />

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", position: "relative" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ marginBottom: "64px" }}>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#64748b", letterSpacing: "4px", margin: "0 0 16px 0" }}>
              // FEATURES
            </p>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(36px, 5vw, 56px)",
              letterSpacing: "2px",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1,
            }}>
              EVERYTHING YOU NEED
            </h2>
          </div>

          {/* Feature grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "#354a63",
            border: "1px solid #354a63",
          }}>
            {features.map((f, i) => (
              <Link key={f.title} href={f.href}>
                <div
                  style={{
                    background: "#1e2a3d",
                    padding: "36px 32px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#253548"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1e2a3d"; }}
                >
                  {/* Tag */}
                  <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "9px",
                    color: i % 2 === 0 ? "#38bdf8aa" : "#94a3b8aa",
                    letterSpacing: "3px",
                    margin: "0 0 20px 0",
                  }}>{f.tag}</p>

                  {/* Icon */}
                  <div style={{ marginBottom: "16px" }}>{f.icon}</div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "18px",
                    letterSpacing: "1px",
                    color: "#ffffff",
                    margin: "0 0 10px 0",
                  }}>{f.title}</h3>

                  {/* Description */}
                  <p style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "13px",
                    color: "#c8d6e8",
                    lineHeight: 1.7,
                    margin: "0 0 20px 0",
                  }}>{f.desc}</p>

                  {/* Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#a8becc", letterSpacing: "1px" }}>access</span>
                    <ArrowRight style={{ width: "10px", height: "10px", color: "#a8becc" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      {!user && (
        <>
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #38bdf822, transparent)" }} />
          <section style={{
            padding: "100px 24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Bg glow */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse 50% 60% at 50% 50%, #38bdf808 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto" }}>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#64748b", letterSpacing: "4px", marginBottom: "24px" }}>
                // GET STARTED
              </p>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(40px, 6vw, 64px)",
                letterSpacing: "2px",
                color: "#ffffff",
                margin: "0 0 16px 0",
                lineHeight: 1,
              }}>
                READY TO START<br />
                <span style={{ color: "#38bdf8", textShadow: "0 0 30px #38bdf844" }}>READING?</span>
              </h2>
              <p style={{ color: "#c8d6e8", fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", marginBottom: "40px", lineHeight: 1.8 }}>
                Create your library account and gain access to our full catalog today.
              </p>
              <Link href="/register">
                <button
                  style={{
                    padding: "16px 40px",
                    background: "#38bdf8",
                    border: "1px solid #38bdf8",
                    color: "#fff",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "14px",
                    letterSpacing: "3px",
                    cursor: "pointer",
                    boxShadow: "0 0 30px #38bdf833",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px #38bdf855"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px #38bdf833"; }}
                >
                  CREATE ACCOUNT <ArrowRight style={{ width: "14px", height: "14px" }} />
                </button>
              </Link>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}