import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { finesApi, paymentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, PhilippinePeso } from "lucide-react";

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  unpaid: { bg: "#38bdf811", color: "#38bdf8", border: "#38bdf833" },
  paid:   { bg: "#00ff8811", color: "#00ff88", border: "#00ff8833" },
  waived: { bg: "#ffffff08", color: "#555",    border: "#6b82a0" },
};

export default function Fines() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["my-fines"], queryFn: () => finesApi.my() });

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

  return (
    <Layout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#38bdf866", letterSpacing: "3px", margin: "0 0 8px 0" }}>// FINES</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>MY FINES</h1>
          <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>Manage your overdue fines and payments</p>
        </div>

        {/* Outstanding balance banner */}
        {parseFloat(totalUnpaid) > 0 && (
          <div style={{ background: "#38bdf80a", border: "1px solid #38bdf833", padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "10px", height: "10px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8" }} />
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#38bdf8", flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "15px", color: "#38bdf8", letterSpacing: "1px", margin: "0 0 2px 0" }}>OUTSTANDING BALANCE</p>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", color: "#64748b", margin: 0 }}>₱{totalUnpaid} in unpaid fines</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {[1,2].map(i => <div key={i} style={{ background: "#141a24", height: "100px" }} />)}
          </div>
        ) : fines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2130" }}>
            <CheckCircle style={{ width: "40px", height: "40px", color: "#00ff8844", margin: "0 auto 16px" }} />
            <p style={{ color: "#00ff8866", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "4px" }}>SYSTEM_CLEAR</p>
            <p style={{ color: "#444", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px" }}>No fines — keep returning books on time.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {fines.map((fine: any) => {
              const st = STATUS[fine.status] ?? STATUS.unpaid;
              return (
                <div key={fine.id} style={{ background: "#141a24", padding: "20px 24px", transition: "background 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf810"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141a24"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "16px", color: "#ffffff", margin: "0 0 2px 0" }}>{fine.book?.title ?? `Fine #${fine.id}`}</h3>
                      <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", margin: 0 }}>{fine.book?.author}</p>
                    </div>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", padding: "4px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {(fine.status ?? "").toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>DAYS_OVERDUE: <span style={{ color: "#38bdf8" }}>{fine.overdueDays}</span></span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>RATE: <span style={{ color: "#888" }}>₱{fine.dailyRate}/day</span></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#38bdf8", letterSpacing: "2px", margin: 0, textShadow: "0 0 12px #38bdf844" }}>
                        ₱{parseFloat(fine.fineAmount).toFixed(2)}
                      </p>
                      {fine.status === "unpaid" && (
                        <button
                          onClick={() => payMutation.mutate(fine.id)}
                          disabled={payMutation.isPending}
                          style={{ padding: "8px 20px", background: "#38bdf8", border: "1px solid #38bdf8", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px #38bdf844"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                        >
                          <PhilippinePeso style={{ width: "12px", height: "12px" }} /> PAY NOW
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}