import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { notificationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, BookOpen, AlertTriangle, CreditCard, CheckCircle } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  borrow_requested:      { icon: <BookOpen style={{ width: "14px", height: "14px" }} />,     color: "#64748b" },
  borrow_approved:       { icon: <CheckCircle style={{ width: "14px", height: "14px" }} />,  color: "#00ff88" },
  borrow_rejected:       { icon: <AlertTriangle style={{ width: "14px", height: "14px" }} />,color: "#38bdf8" },
  book_returned:         { icon: <CheckCircle style={{ width: "14px", height: "14px" }} />,  color: "#555" },
  fine_issued:           { icon: <AlertTriangle style={{ width: "14px", height: "14px" }} />,color: "#38bdf8" },
  fine_waived:           { icon: <CheckCircle style={{ width: "14px", height: "14px" }} />,  color: "#00ff88" },
  payment_confirmed:     { icon: <CreditCard style={{ width: "14px", height: "14px" }} />,   color: "#00ff88" },
  reservation_confirmed: { icon: <CheckCircle style={{ width: "14px", height: "14px" }} />,  color: "#00ff88" },
  reservation_cancelled: { icon: <AlertTriangle style={{ width: "14px", height: "14px" }} />,color: "#38bdf8" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["notifications-page"], queryFn: () => notificationsApi.list() });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <Layout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#64748b66", letterSpacing: "3px", margin: "0 0 8px 0" }}>// ALERTS</p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>NOTIFICATIONS</h1>
            <p style={{ color: unread > 0 ? "#64748b" : "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>
              {unread > 0 ? `${unread} unread` : "ALL_CLEAR"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              style={{ padding: "10px 20px", border: "1px solid #00ff8833", background: "transparent", color: "#00ff88", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#00ff8811"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <CheckCheck style={{ width: "14px", height: "14px" }} /> MARK ALL READ
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#141a24", height: "80px" }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2130" }}>
            <Bell style={{ width: "40px", height: "40px", color: "#222", margin: "0 auto 16px" }} />
            <p style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px" }}>NO_NOTIFICATIONS</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {notifications.map((n: any) => {
              const cfg = TYPE_CONFIG[n.type] ?? { icon: <Bell style={{ width: "14px", height: "14px" }} />, color: "#555" };
              return (
                <div key={n.id} style={{ background: !n.isRead ? "#38bdf804" : "#141a24", padding: "16px 24px", display: "flex", gap: "16px", alignItems: "flex-start", transition: "background 0.2s", borderLeft: !n.isRead ? "2px solid #38bdf822" : "2px solid transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf806"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = !n.isRead ? "#38bdf804" : "#141a24"; }}>
                  {/* Icon */}
                  <div style={{ width: "32px", height: "32px", border: `1px solid ${cfg.color}22`, background: `${cfg.color}11`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "14px", color: "#ffffff", margin: 0, letterSpacing: "1px", textTransform: "uppercase" }}>{n.title}</p>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "1px", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: "6px", height: "6px", background: "#38bdf8", boxShadow: "0 0 6px #38bdf8", flexShrink: 0, marginTop: "4px" }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}