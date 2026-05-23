import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { borrowApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STATUS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:  { label: "PENDING",  bg: "#64748b11", color: "#64748b", border: "#64748b33" },
  approved: { label: "APPROVED", bg: "#00ff8811", color: "#00ff88", border: "#00ff8833" },
  rejected: { label: "REJECTED", bg: "#38bdf811", color: "#38bdf8", border: "#38bdf833" },
  returned: { label: "RETURNED", bg: "#ffffff08", color: "#555",    border: "#6b82a0" },
  overdue:  { label: "OVERDUE",  bg: "#38bdf822", color: "#ff4444", border: "#38bdf855" },
};

export default function Borrow() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: borrows = [], isLoading } = useQuery({ queryKey: ["borrows"], queryFn: () => borrowApi.list() });

  const returnMutation = useMutation({
    mutationFn: (id: number) => borrowApi.return(id),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["borrows"] });
      if (data.fine) {
        toast({ title: "Book returned — fine issued", description: `Overdue by ${data.fine.overdueDays} days. Fine: ₱${parseFloat(data.fine.fineAmount).toFixed(2)}`, variant: "destructive" });
      } else {
        toast({ title: "Book returned successfully!" });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Layout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#64748b66", letterSpacing: "3px", margin: "0 0 8px 0" }}>// MY BORROWS</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>BORROW REQUESTS</h1>
          <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>Track your current and past borrow requests</p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#141a24", height: "100px" }} />)}
          </div>
        ) : borrows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2130" }}>
            <BookOpen style={{ width: "40px", height: "40px", color: "#222", margin: "0 auto 16px" }} />
            <p style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "24px" }}>NO_BORROWS_FOUND</p>
            <Link href="/books">
              <button style={{ padding: "10px 24px", border: "1px solid #38bdf844", background: "transparent", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                BROWSE CATALOG <ArrowRight style={{ width: "12px", height: "12px" }} />
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {borrows.map((b: any) => {
              const st = STATUS[b.status] ?? STATUS.pending;
              return (
                <div key={b.id} style={{ background: "#141a24", padding: "20px 24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", transition: "background 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf810"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141a24"; }}>

                  {/* Cover */}
                  <div style={{ width: "48px", height: "64px", background: "#1e2a3d", border: "1px solid #2e3a4e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {b.book?.imageUrl
                      ? <img src={b.book.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <BookOpen style={{ width: "16px", height: "16px", color: "#a8becc" }} />
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "16px", color: "#ffffff", margin: "0 0 4px 0" }}>{b.book?.title}</h3>
                    <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", margin: "0 0 8px 0" }}>{b.book?.author}</p>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>BORROW: <span style={{ color: "#888" }}>{b.borrowDate}</span></span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>DUE: <span style={{ color: b.status === "overdue" ? "#38bdf8" : "#888" }}>{b.dueDate}</span></span>
                    </div>
                  </div>

                  {/* Status + action */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", padding: "4px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                    {b.status === "approved" && (
                      <button
                        onClick={() => returnMutation.mutate(b.id)}
                        disabled={returnMutation.isPending}
                        style={{ padding: "6px 14px", border: "1px solid #64748b44", background: "transparent", color: "#64748b", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#64748b11"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        RETURN
                      </button>
                    )}
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