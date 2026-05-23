import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { reservationsApi, booksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, BookOpen, Plus, X } from "lucide-react";

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: "#64748b11", color: "#64748b", border: "#64748b33" },
  confirmed: { bg: "#00ff8811", color: "#00ff88", border: "#00ff8833" },
  cancelled: { bg: "#38bdf811", color: "#38bdf8", border: "#38bdf833" },
};

const neonInput = { background: "#151e2d", border: "1px solid #384558", color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", padding: "9px 12px", width: "100%", outline: "none" } as React.CSSProperties;

export default function Reservation() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bookId: "", pickupDate: "", returnDate: "" });
  const today = new Date().toISOString().split("T")[0]!;

  const { data: reservations = [], isLoading } = useQuery({ queryKey: ["reservations"], queryFn: () => reservationsApi.list() });
  const { data: books = [] } = useQuery({ queryKey: ["books", "", "", "available"], queryFn: () => booksApi.list({ status: "available" }) });

  const createMutation = useMutation({
    mutationFn: () => reservationsApi.create({ bookId: parseInt(form.bookId), pickupDate: form.pickupDate, returnDate: form.returnDate }),
    onSuccess: () => {
      toast({ title: "Reservation submitted!", description: "Awaiting admin confirmation." });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      setShowForm(false);
      setForm({ bookId: "", pickupDate: "", returnDate: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Layout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#64748b66", letterSpacing: "3px", margin: "0 0 8px 0" }}>// RESERVATIONS</p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: 0, lineHeight: 1 }}>RESERVATIONS</h1>
            <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", marginTop: "8px" }}>Reserve books for upcoming pickup</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: "10px 20px", border: `1px solid ${showForm ? "#38bdf844" : "#38bdf8"}`, background: showForm ? "transparent" : "#38bdf811", color: showForm ? "#38bdf888" : "#38bdf8", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          >
            {showForm ? <><X style={{ width: "12px", height: "12px" }} /> CANCEL</> : <><Plus style={{ width: "12px", height: "12px" }} /> NEW RESERVATION</>}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#141a24", border: "1px solid #38bdf822", padding: "28px", marginBottom: "32px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "10px", height: "10px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderBottom: "2px solid #64748b", borderRight: "2px solid #64748b" }} />
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#38bdf866", letterSpacing: "3px", marginBottom: "20px" }}>// NEW_RESERVATION</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#666", letterSpacing: "2px", marginBottom: "6px" }}>BOOK</label>
                <select required value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })}
                  style={{ ...neonInput, padding: "9px 12px" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }}>
                  <option value="">Select available book...</option>
                  {books.map((b: any) => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#666", letterSpacing: "2px", marginBottom: "6px" }}>PICKUP DATE</label>
                <input type="date" required min={today} value={form.pickupDate} onChange={e => setForm({ ...form, pickupDate: e.target.value })}
                  style={neonInput}
                  onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#666", letterSpacing: "2px", marginBottom: "6px" }}>RETURN DATE</label>
                <input type="date" required min={form.pickupDate || today} value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })}
                  style={neonInput}
                  onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }} />
              </div>
            </div>
            <button
              onClick={() => { if (form.bookId && form.pickupDate && form.returnDate) createMutation.mutate(); }}
              disabled={createMutation.isPending || !form.bookId || !form.pickupDate || !form.returnDate}
              style={{ padding: "10px 28px", background: "#38bdf8", border: "1px solid #38bdf8", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "2px", cursor: "pointer", transition: "all 0.2s", opacity: createMutation.isPending ? 0.5 : 1 }}
            >
              {createMutation.isPending ? "SUBMITTING..." : "[ SUBMIT RESERVATION ]"}
            </button>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#141a24", height: "80px" }} />)}
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", border: "1px solid #1a2130" }}>
            <CalendarDays style={{ width: "40px", height: "40px", color: "#222", margin: "0 auto 16px" }} />
            <p style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px" }}>NO_RESERVATIONS_FOUND</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#151e2d" }}>
            {reservations.map((r: any) => {
              const st = STATUS[r.status] ?? STATUS.pending;
              return (
                <div key={r.id} style={{ background: "#141a24", padding: "20px 24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", transition: "background 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf810"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141a24"; }}>
                  <div style={{ width: "40px", height: "56px", background: "#1e2a3d", border: "1px solid #2e3a4e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {r.book?.imageUrl ? <img src={r.book.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <BookOpen style={{ width: "14px", height: "14px", color: "#a8becc" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "15px", color: "#ffffff", margin: "0 0 6px 0" }}>{r.book?.title}</h3>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>PICKUP: <span style={{ color: "#888" }}>{r.pickupDate}</span></span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>RETURN: <span style={{ color: "#888" }}>{r.returnDate}</span></span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", padding: "4px 10px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}