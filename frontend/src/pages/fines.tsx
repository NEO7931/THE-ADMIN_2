import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { finesApi, paymentsApi, borrowApi, reservationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, PhilippinePeso, Clock } from "lucide-react";
import { Countdown } from "@/components/Countdown";

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  unpaid: { bg: "#ef444411", color: "#ef4444", border: "#ef444433" },
  paid:   { bg: "#2dd4bf11", color: "#2dd4bf", border: "#2dd4bf33" },
  waived: { bg: "#ffffff08", color: "#64748b", border: "#354a63" },
};

export default function Fines() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["my-fines"], queryFn: () => finesApi.my(), refetchInterval: 60000 });
  const { data: borrows = [] } = useQuery({ queryKey: ["borrows"], queryFn: () => borrowApi.list(), refetchInterval: 30000 });
  const { data: reservations = [] } = useQuery({ queryKey: ["reservations"], queryFn: () => reservationsApi.list(), refetchInterval: 30000 });

  const payMutation = useMutation({
    mutationFn: (fineId: number) => paymentsApi.createSession({ fineId }),
    onSuccess: (data: any) => {
      if (data.url) { window.location.href = data.url; }
      else { toast({ title: "Payment recorded (demo mode)" }); qc.invalidateQueries({ queryKey: ["my-fines"] }); }
    },
    onError: (err: any) => toast({ title: "Payment error", description: err.message, variant: "destructive" }),
  });

  const fines = data?.fines ?? [];
  const totalUnpaid = data?.totalUnpaid ?? "0.00";

  // Active borrows with countdowns
  const activeBorrows = (borrows as any[]).filter(b => b.status === "approved");
  // Active reservations with countdowns
  const activeReservations = (reservations as any[]).filter(r => r.status === "confirmed");

  return (
    <Layout>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: "#38bdf866", letterSpacing: "3px", margin: "0 0 8px 0" }}>// FINES & TIMERS</p>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>FINES & DEADLINES</h1>
          <p style={{ color: "#64748b", fontFamily: "'Share Tech Mono',monospace", fontSize: "11px", marginTop: "8px" }}>Track your active borrowing deadlines and outstanding fines</p>
        </div>

        {/* ── Active Borrowing Countdowns ────────────────────────────────── */}
        {(activeBorrows.length > 0 || activeReservations.length > 0) && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Clock style={{ width: "14px", height: "14px", color: "#38bdf8" }} />
              <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#38bdf8", letterSpacing: "2px", margin: 0 }}>ACTIVE TIMERS</p>
            </div>

            {activeBorrows.map((b: any) => (
              <div key={`borrow-${b.id}`} style={{ marginBottom: "8px" }}>
                <p style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "13px", color: "#c8d6e8", margin: "0 0 4px 0" }}>{b.book?.title ?? `Borrow #${b.id}`}</p>
                <Countdown approvedDate={b.approvedDate ?? b.createdAt} type="borrow" />
              </div>
            ))}

            {activeReservations.map((r: any) => (
              <div key={`res-${r.id}`} style={{ marginBottom: "8px" }}>
                <p style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "13px", color: "#c8d6e8", margin: "0 0 4px 0" }}>{r.book?.title ?? `Reservation #${r.id}`}</p>
                <Countdown approvedDate={r.createdAt} type="reservation" />
              </div>
            ))}
          </div>
        )}

        {/* ── Outstanding balance ────────────────────────────────────────── */}
        {parseFloat(totalUnpaid) > 0 && (
          <div style={{ background: "#ef444408", border: "1px solid #ef444433", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "10px", height: "10px", borderTop: "2px solid #ef4444", borderLeft: "2px solid #ef4444" }} />
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "15px", color: "#ef4444", letterSpacing: "1px", margin: "0 0 2px 0" }}>OUTSTANDING BALANCE</p>
              <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "12px", color: "#f97316", margin: 0 }}>₱{totalUnpaid} in unpaid fines</p>
            </div>
          </div>
        )}

        {/* ── Fine records ───────────────────────────────────────────────── */}
        {fines.length === 0 && activeBorrows.length === 0 && activeReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2535" }}>
            <CheckCircle style={{ width: "40px", height: "40px", color: "#2dd4bf44", margin: "0 auto 16px" }} />
            <p style={{ color: "#2dd4bf66", fontFamily: "'Share Tech Mono',monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "4px" }}>SYSTEM_CLEAR</p>
            <p style={{ color: "#475569", fontFamily: "'Rajdhani',sans-serif", fontSize: "13px" }}>No fines and no active borrows. Keep returning books on time!</p>
          </div>
        ) : fines.length > 0 ? (
          <>
            <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: "#ef444466", letterSpacing: "3px", marginBottom: "12px" }}>// FINE_RECORDS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#354a63" }}>
              {fines.map((fine: any) => {
                const st = STATUS[fine.status] ?? STATUS.unpaid;
                return (
                  <div key={fine.id} style={{ background: "#1e2a3d", padding: "20px 24px", transition: "background 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#253548"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1e2a3d"; }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "2px", padding: "3px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {(fine.status ?? "").toUpperCase()}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "15px", color: "#ffffff", margin: "0 0 4px 0" }}>{fine.book?.title ?? `Fine #${fine.id}`}</h3>
                        <p style={{ color: "#64748b", fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", margin: 0 }}>
                          {fine.overdueDays} day{fine.overdueDays !== 1 ? "s" : ""} overdue · ₱{fine.dailyRate}/day
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px", color: "#ef4444", letterSpacing: "2px", margin: 0, textShadow: "0 0 12px #ef444444" }}>
                          ₱{parseFloat(fine.fineAmount).toFixed(2)}
                        </p>
                        {fine.status === "unpaid" && (
                          <button onClick={() => payMutation.mutate(fine.id)} disabled={payMutation.isPending}
                            style={{ padding: "8px 20px", background: "#ef4444", border: "1px solid #ef4444", color: "#fff", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px #ef444444"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                            <PhilippinePeso style={{ width: "12px", height: "12px" }} /> PAY NOW
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}