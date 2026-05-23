import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { historyApi } from "@/lib/api";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  pending:  { bg: "#64748b11", color: "#64748b", border: "#64748b33" },
  approved: { bg: "#00ff8811", color: "#00ff88", border: "#00ff8833" },
  rejected: { bg: "#38bdf811", color: "#38bdf8", border: "#38bdf833" },
  returned: { bg: "#ffffff08", color: "#555",    border: "#6b82a0" },
  overdue:  { bg: "#38bdf822", color: "#ff4444", border: "#38bdf855" },
};

export default function History() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["history", page, statusFilter],
    queryFn: () => historyApi.list({ page, limit: 10, status: statusFilter !== "all" ? statusFilter : undefined }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const neonSelect = { background: "#151e2d", border: "1px solid #384558", color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", padding: "8px 12px", outline: "none", cursor: "pointer" } as React.CSSProperties;

  return (
    <Layout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#64748b66", letterSpacing: "3px", margin: "0 0 8px 0" }}>// RECORDS</p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>BORROW HISTORY</h1>
            <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>{total} total records</p>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={neonSelect}
            onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }}>
            <option value="all">ALL_STATUS</option>
            <option value="pending">PENDING</option>
            <option value="approved">APPROVED</option>
            <option value="returned">RETURNED</option>
            <option value="rejected">REJECTED</option>
            <option value="overdue">OVERDUE</option>
          </select>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ background: "#141a24", height: "80px" }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2130" }}>
            <BookOpen style={{ width: "40px", height: "40px", color: "#222", margin: "0 auto 16px" }} />
            <p style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px" }}>NO_HISTORY_FOUND</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d", marginBottom: "24px" }}>
              {items.map((item: any) => {
                const st = STATUS[item.status] ?? STATUS.returned;
                return (
                  <div key={item.id} style={{ background: "#141a24", padding: "16px 24px", display: "flex", gap: "16px", alignItems: "center", transition: "background 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf810"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141a24"; }}>
                    <div style={{ width: "40px", height: "56px", background: "#1e2a3d", border: "1px solid #2e3a4e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {item.book?.imageUrl ? <img src={item.book.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <BookOpen style={{ width: "14px", height: "14px", color: "#a8becc" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "15px", color: "#ffffff", margin: "0 0 4px 0" }}>{item.book?.title}</h3>
                      <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", margin: 0 }}>{item.book?.author}</p>
                    </div>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>
                        {item.borrowDate} → {item.dueDate}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", padding: "3px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {(item.status ?? "").toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "8px 16px", border: "1px solid #384558", background: "transparent", color: page === 1 ? "#6b82a0" : "#888", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ChevronLeft style={{ width: "12px", height: "12px" }} /> PREV
                </button>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#555", letterSpacing: "2px" }}>
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "8px 16px", border: "1px solid #384558", background: "transparent", color: page === totalPages ? "#6b82a0" : "#888", cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  NEXT <ChevronRight style={{ width: "12px", height: "12px" }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}