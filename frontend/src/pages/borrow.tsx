import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { borrowApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { Link } from "wouter";

const STATUS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:  { label: "PENDING",  bg: "#64748b11", color: "#94a3b8", border: "#64748b33" },
  approved: { label: "APPROVED", bg: "#22c55e11", color: "#22c55e", border: "#22c55e33" },
  rejected: { label: "REJECTED", bg: "#ef444411", color: "#ef4444", border: "#ef444433" },
  returned: { label: "RETURNED", bg: "#ffffff08", color: "#64748b", border: "#354a63" },
  overdue:  { label: "OVERDUE",  bg: "#ef444422", color: "#ef4444", border: "#ef444455" },
};

export default function Borrow() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: borrows = [], isLoading } = useQuery({
    queryKey: ["borrows"],
    queryFn: () => borrowApi.list(),
    refetchInterval: 30000,
  });

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

  const toggleExpand = (id: number) => setExpanded(prev => prev === id ? null : id);

  return (
    <Layout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#38bdf866", letterSpacing: "3px", margin: "0 0 8px 0" }}>// MY BORROWS</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>BORROW REQUESTS</h1>
          <p style={{ color: "#64748b", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>
            Click any approved book to see its 7-day countdown timer
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#354a63" }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#1e2a3d", height: "80px" }} />)}
          </div>
        ) : borrows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #2e3a4e" }}>
            <BookOpen style={{ width: "40px", height: "40px", color: "#1e2a3d", margin: "0 auto 16px" }} />
            <p style={{ color: "#475569", fontFamily: "'Share Tech Mono',monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "24px" }}>NO_BORROWS_FOUND</p>
            <Link href="/books">
              <button style={{ padding: "10px 24px", border: "1px solid #38bdf844", background: "transparent", color: "#38bdf8", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                BROWSE CATALOG <ArrowRight style={{ width: "12px", height: "12px" }} />
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#354a63" }}>
            {(borrows as any[]).map((b: any) => {
              const st = STATUS[b.status] ?? STATUS.pending;
              const isApproved = b.status === "approved";
              const isOpen = expanded === b.id;

              return (
                <div key={b.id}>
                  {/* Book row */}
                  <div
                    style={{
                      background: isOpen ? "#253548" : "#1e2a3d",
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                      cursor: isApproved ? "pointer" : "default",
                      transition: "background 0.2s",
                      borderLeft: isApproved ? "3px solid #38bdf844" : "3px solid transparent",
                    }}
                    onClick={() => isApproved && toggleExpand(b.id)}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "#253548"; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "#1e2a3d"; }}
                  >
                    {/* Cover */}
                    <div style={{ width: "44px", height: "60px", background: "#141a24", border: "1px solid #2e3a4e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {b.book?.imageUrl
                        ? <img src={b.book.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <BookOpen style={{ width: "16px", height: "16px", color: "#354a63" }} />
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "16px", color: "#ffffff", margin: "0 0 3px 0" }}>
                        {b.book?.title}
                      </h3>
                      <p style={{ color: "#64748b", fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", margin: "0 0 6px 0" }}>
                        {b.book?.author}
                      </p>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#475569" }}>
                          BORROW: <span style={{ color: "#8aa4bc" }}>{b.borrowDate}</span>
                        </span>
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#475569" }}>
                          DUE: <span style={{ color: b.status === "overdue" ? "#ef4444" : "#8aa4bc" }}>{b.dueDate}</span>
                        </span>
                      </div>
                      {b.rejectionReason && (
                        <p style={{ color: "#ef4444", fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", marginTop: "4px" }}>
                          Reason: {b.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "2px", padding: "4px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>

                      {isApproved && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={e => { e.stopPropagation(); returnMutation.mutate(b.id); }}
                            disabled={returnMutation.isPending}
                            style={{ padding: "6px 14px", border: "1px solid #64748b44", background: "transparent", color: "#94a3b8", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#64748b11"; (e.currentTarget as HTMLElement).style.borderColor = "#64748b"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#64748b44"; }}
                          >
                            RETURN
                          </button>
                          {isOpen
                            ? <ChevronUp style={{ width: "14px", height: "14px", color: "#38bdf8" }} />
                            : <ChevronDown style={{ width: "14px", height: "14px", color: "#38bdf855" }} />
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable countdown */}
                  {isApproved && isOpen && (
                    <div style={{ background: "#141a24", padding: "0 24px 20px" }}>
                      <Countdown
                        approvedDate={b.approvedDate ?? b.createdAt}
                        type="borrow"
                      />
                    </div>
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