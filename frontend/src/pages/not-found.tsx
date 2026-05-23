import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#38bdf866", letterSpacing: "4px", marginBottom: "16px" }}>// ERROR</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "160px", lineHeight: 1, color: "#38bdf8", textShadow: "0 0 60px #38bdf833", margin: "0 0 8px 0", letterSpacing: "8px" }}>404</h1>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "20px", color: "#f1f5f9", letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 12px 0" }}>PAGE NOT FOUND</h2>
          <p style={{ color: "#555", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", marginBottom: "40px", letterSpacing: "1px" }}>
            The page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <button style={{
              padding: "12px 32px", background: "#38bdf8", border: "1px solid #38bdf8",
              color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: "13px", letterSpacing: "3px", cursor: "pointer",
              boxShadow: "0 0 20px #38bdf833", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px #38bdf855"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px #38bdf833"; }}>
              BACK TO HOME
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}