import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { booksApi, borrowApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, Filter } from "lucide-react";

const S = {
  page: { maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" } as React.CSSProperties,
  label: { fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#666", letterSpacing: "3px", textTransform: "uppercase" as const },
  input: { background: "#151e2d", border: "1px solid #384558", color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", padding: "9px 14px 9px 38px", width: "100%", outline: "none" } as React.CSSProperties,
  select: { background: "#151e2d", border: "1px solid #384558", color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", padding: "9px 14px", outline: "none", cursor: "pointer" } as React.CSSProperties,
  card: { background: "#141a24", border: "1px solid #2e3a4e", padding: "0", overflow: "hidden" as const, transition: "border-color 0.2s, box-shadow 0.2s" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  available: { bg: "#00ff8811", color: "#00ff88", border: "#00ff8833" },
  borrowed:  { bg: "#38bdf811", color: "#38bdf8", border: "#38bdf833" },
  reserved:  { bg: "#64748b11", color: "#64748b", border: "#64748b33" },
};

export default function Books() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [borrowingId, setBorrowingId] = useState<number | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", search, category, status],
    queryFn: () => booksApi.list({ search: search || undefined, category: category || undefined, status: status || undefined }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["book-categories"],
    queryFn: () => booksApi.categories(),
  });

  const borrow = useMutation({
    mutationFn: (bookId: number) => borrowApi.create({ bookId, borrowDate: new Date().toISOString().split("T")[0]! }),
    onSuccess: () => {
      toast({ title: "Borrow request submitted!", description: "Waiting for admin approval." });
      qc.invalidateQueries({ queryKey: ["books"] });
      setBorrowingId(null);
    },
    onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }); setBorrowingId(null); },
  });

  const handleBorrow = (bookId: number) => {
    if (!user) { toast({ title: "Please sign in", description: "You must be logged in to borrow books.", variant: "destructive" }); return; }
    setBorrowingId(bookId);
    borrow.mutate(bookId);
  };

  return (
    <Layout>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={S.label}>// CATALOG</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", letterSpacing: "3px", color: "#ffffff", margin: "8px 0 4px 0", lineHeight: 1 }}>BOOK CATALOG</h1>
          <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}>{books.length} books in system</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#444" }} />
            <input
              type="text" placeholder="Search title, author..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.input}
              onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} style={S.select}
            onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }}>
            <option value="">All Categories</option>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={S.select}
            onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; }}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1px", background: "#151e2d" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: "#141a24", height: "300px", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <BookOpen style={{ width: "40px", height: "40px", color: "#222", margin: "0 auto 16px" }} />
            <p style={{ color: "#444", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "2px" }}>NO_BOOKS_FOUND</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1px", background: "#151e2d" }}>
            {books.map((book: any) => {
              const st = STATUS_STYLES[book.status] ?? STATUS_STYLES.available;
              return (
                <div key={book.id} style={S.card}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#38bdf833"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px #38bdf808"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#354a63"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  {/* Cover */}
                  <div style={{ height: "200px", background: "#141a24", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #1a2130", overflow: "hidden", position: "relative" }}>
                    {book.imageUrl ? (
                      <img src={book.imageUrl} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <BookOpen style={{ width: "32px", height: "32px", color: "#38bdf822" }} />
                        <p style={{ color: "#a8becc", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px" }}>NO_COVER</p>
                      </div>
                    )}
                    {/* Status overlay */}
                    <div style={{ position: "absolute", top: "8px", right: "8px", background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "1px", padding: "3px 8px" }}>
                      {book.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px" }}>
                    <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "2px", marginBottom: "6px" }}>{book.code}</p>
                    <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "15px", color: "#ffffff", margin: "0 0 4px 0", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{book.title}</h3>
                    <p style={{ color: "#555", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginBottom: "4px" }}>{book.author}</p>
                    <p style={{ color: "#444", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", marginBottom: "16px" }}>{book.category}</p>

                    {book.status === "available" && (
                      <button
                        onClick={() => handleBorrow(book.id)}
                        disabled={borrowingId === book.id}
                        style={{
                          width: "100%", padding: "8px",
                          background: borrowingId === book.id ? "transparent" : "#38bdf811",
                          border: "1px solid #38bdf844",
                          color: "#38bdf8",
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700, fontSize: "11px", letterSpacing: "2px",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf822"; (e.currentTarget as HTMLElement).style.borderColor = "#38bdf8"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#38bdf811"; (e.currentTarget as HTMLElement).style.borderColor = "#38bdf844"; }}
                      >
                        {borrowingId === book.id ? "REQUESTING..." : "[ BORROW ]"}
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