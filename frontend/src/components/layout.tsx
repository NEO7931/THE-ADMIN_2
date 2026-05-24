import { useAuth } from "@/lib/auth";
import { notificationsApi, authApi } from "@/lib/api";
import { MusicPlayer } from "./MusicPlayer";
import { useEasterEgg, DancingBaby } from "./EasterEgg";
import { Link, useLocation } from "wouter";
import { BookOpen, UserCircle, LogOut, Bell, Zap, Settings, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

// ─── Floating Pages Background ───────────────────────────────────────────────
function BookBackground() {
  return (
    <>
      <div className="scan-line" />
      <div className="pages-bg">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className={`book-page-float fp${i}`} />
        ))}
      </div>
      <div className="book-ambient">
        <svg viewBox="0 0 320 220" width="500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="10" width="155" height="200" rx="2" fill="#38bdf8" opacity=".15"/>
          <rect x="165" y="10" width="155" height="200" rx="2" fill="#38bdf8" opacity=".15"/>
          <line x1="160" y1="5" x2="160" y2="215" stroke="#38bdf8" strokeWidth="1" opacity=".4"/>
          {[50,65,80,95,110,125].map(y => (
            <g key={y}>
              <line x1="20" y1={y} x2="140" y2={y} stroke="#38bdf8" strokeWidth="0.5" opacity=".3"/>
              <line x1="180" y1={y} x2="300" y2={y} stroke="#38bdf8" strokeWidth="0.5" opacity=".3"/>
            </g>
          ))}
        </svg>
      </div>
      <div className="scan-line" style={{ position: "fixed", zIndex: 0 }} />
    </>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unreadCount ?? 0;
  const recent = (data?.notifications ?? []).slice(0, 5);
  const handleOpen = () => { if (unread > 0) markAllRead.mutate(); };

  return (
    <Popover onOpenChange={(open) => open && handleOpen()}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-gray-500 hover:text-red-500 transition-colors">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-sm bg-red-500 text-[9px] font-bold text-white flex items-center justify-center pulse-glow"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        style={{ background: "#141a24", border: "1px solid #38bdf833", borderRadius: "2px", boxShadow: "0 0 30px #38bdf811" }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #2e3a4e" }}>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", color: "#38bdf8" }}>
            // ALERTS
          </h3>
          <button onClick={() => setLocation("/notifications")}
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888", letterSpacing: "1px" }}
            className="hover:text-red-400 transition-colors">
            view_all →
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center" style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}>
            NO_ALERTS_FOUND
          </div>
        ) : (
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {recent.map((n: any) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #252d3d", background: !n.isRead ? "#38bdf810" : "transparent" }}>
                <p style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{n.title}</p>
                <p style={{ color: "#666", fontSize: "11px", marginTop: "4px", fontFamily: "'Share Tech Mono', monospace" }}>{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────
function UserMenu({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "4px 10px",
            border: "1px solid #384558",
            background: "#1e2a3d",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "#38bdf844";
            (e.currentTarget as HTMLElement).style.background = "#243044";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "#384558";
            (e.currentTarget as HTMLElement).style.background = "#1e2a3d";
          }}
        >
          <UserCircle style={{ width: "12px", height: "12px", color: "#64748b" }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#888" }}>
            {username}
          </span>
          <span style={{ color: "#444", fontSize: "10px", marginLeft: "2px" }}>▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-48 p-0"
        style={{ background: "#141a24", border: "1px solid #38bdf833", borderRadius: "2px", boxShadow: "0 0 30px #38bdf811" }}
      >
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #2e3a4e" }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444", letterSpacing: "1px" }}>
            LOGGED_IN_AS
          </p>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", color: "#38bdf8", marginTop: "2px" }}>
            {username}
          </p>
        </div>

        <button
          onClick={() => setLocation("/profile")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 14px",
            background: "transparent", border: "none",
            color: "#888", cursor: "pointer",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "11px",
            letterSpacing: "1px", textAlign: "left",
            borderBottom: "1px solid #1e2a3d",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#38bdf810";
            (e.currentTarget as HTMLElement).style.color = "#38bdf8";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#888";
          }}
        >
          <User style={{ width: "11px", height: "11px" }} />
          VIEW PROFILE
        </button>

        <button
          onClick={() => setLocation("/profile/settings")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 14px",
            background: "transparent", border: "none",
            color: "#888", cursor: "pointer",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "11px",
            letterSpacing: "1px", textAlign: "left",
            borderBottom: "1px solid #1e2a3d",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#38bdf810";
            (e.currentTarget as HTMLElement).style.color = "#38bdf8";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#888";
          }}
        >
          <Settings style={{ width: "11px", height: "11px" }} />
          EDIT PROFILE
        </button>

        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 14px",
            background: "transparent", border: "none",
            color: "#666", cursor: "pointer",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "11px",
            letterSpacing: "1px", textAlign: "left",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#ff000010";
            (e.currentTarget as HTMLElement).style.color = "#ff4444";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#666";
          }}
        >
          <LogOut style={{ width: "11px", height: "11px" }} />
          LOGOUT
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const { user, setAuthUser } = useAuth();
  const { clicks, handleLogoClick, show, setShow } = useEasterEgg();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await authApi.logout();
    setAuthUser(null);
    setLocation("/login");
    toast({ title: "SESSION TERMINATED" });
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#141a24", position: "relative", fontFamily: "'Rajdhani', sans-serif" }}>
      <BookBackground />

      <header style={{
        borderBottom: "1px solid #38bdf822",
        background: "rgba(30,36,51,0.97)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 0 #38bdf811, 0 4px 20px #00000088",
      }}>
        <div style={{ height: "2px", background: "linear-gradient(to right, #38bdf8, #64748b, #38bdf8)" }} />

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/">
            <div className="logo-flicker" onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", position: "relative" }}>
              <div style={{
                width: "32px", height: "32px", border: "1px solid #38bdf8",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#38bdf80a", boxShadow: "0 0 8px #38bdf844",
              }}>
                <BookOpen style={{ width: "16px", height: "16px", color: "#38bdf8" }} />
              </div>
              <div style={{ position: "relative" }}>
                {clicks >= 5 && (
                  <div style={{
                    position: "absolute", top: "-8px", right: "-8px",
                    background: "#38bdf8", color: "#080d14",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "8px", fontWeight: 700,
                    padding: "1px 4px", letterSpacing: "1px",
                    zIndex: 10,
                  }}>
                    {30 - clicks}
                  </div>
                )}
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "22px",
                  letterSpacing: "6px",
                  color: "#38bdf8",
                  textShadow: "0 0 8px #38bdf888, 0 0 20px #38bdf844",
                  lineHeight: 1,
                }}>
                  LIBCORE
                </span>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#64748b88", letterSpacing: "3px", marginTop: "-2px" }}>
                  v2.0 // SYSTEM
                </div>
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { href: "/books", label: "CATALOG" },
              ...(user ? [
                { href: "/borrow", label: "BORROW" },
                { href: "/reservation", label: "RESERVE" },
                { href: "/history", label: "HISTORY" },
                { href: "/fines", label: "FINES" },
              ] : []),
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "2px",
                  padding: "6px 12px",
                  color: isActive(href) ? "#38bdf8" : "#666",
                  borderBottom: isActive(href) ? "1px solid #38bdf8" : "1px solid transparent",
                  textShadow: isActive(href) ? "0 0 8px #38bdf888" : "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  display: "block",
                }}
                  className="hover:text-red-400"
                  onMouseEnter={e => { if (!isActive(href)) (e.target as HTMLElement).style.color = "#38bdf888"; }}
                  onMouseLeave={e => { if (!isActive(href)) (e.target as HTMLElement).style.color = "#666"; }}
                >
                  {label}
                </span>
              </Link>
            ))}

            {(user?.role === "admin" || user?.role === "librarian") && (
              <Link href="/admin">
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "2px",
                  padding: "6px 12px",
                  color: isActive("/admin") ? "#64748b" : "#64748b66",
                  borderBottom: isActive("/admin") ? "1px solid #64748b" : "1px solid transparent",
                  textShadow: isActive("/admin") ? "0 0 8px #64748b88" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s",
                }}>
                  <Zap style={{ width: "10px", height: "10px" }} />
                  ADMIN
                </span>
              </Link>
            )}

            <div style={{ width: "1px", height: "20px", background: "#38bdf822", margin: "0 8px" }} />

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <NotificationBell />
                <UserMenu username={user.username} onLogout={handleLogout} />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link href="/login">
                  <button style={{
                    padding: "5px 14px",
                    border: "1px solid #384558",
                    background: "transparent",
                    color: "#888",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#38bdf844"; (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4a5f78"; (e.currentTarget as HTMLElement).style.color = "#888"; }}>
                    SIGN IN
                  </button>
                </Link>
                <Link href="/register">
                  <button style={{
                    padding: "5px 14px",
                    border: "1px solid #38bdf8",
                    background: "#38bdf811",
                    color: "#38bdf8",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    boxShadow: "0 0 8px #38bdf822",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf822"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px #38bdf844"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf811"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 8px #38bdf822"; }}>
                    [ JOIN ]
                  </button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, position: "relative", zIndex: 1 }} className="page-enter">
        {children}
      </main>

      <footer style={{
        borderTop: "1px solid #38bdf811",
        padding: "20px",
        textAlign: "center",
        background: "rgba(30,36,51,0.97)",
        position: "relative",
        zIndex: 1,
      }}>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#333", letterSpacing: "3px" }}>
          LIBCORE_SYS &copy; {new Date().getFullYear()} // INSTITUTIONAL_LIBRARY_MANAGEMENT // v2.0
        </p>
      </footer>

      <MusicPlayer />
      {show && <DancingBaby onClose={() => setShow(false)} />}
    </div>
  );
}