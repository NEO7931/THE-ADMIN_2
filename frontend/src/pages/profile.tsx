import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateProfile, changeMyPassword } from "../lib/api";

function compress(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const size = 256, scale = Math.min(size / img.width, size / img.height, 1);
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

const CrowbarBadge = () => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
    borderRadius: 4, background: "linear-gradient(135deg,#7a5c12,#d9a528,#f5d76e)",
    color: "#1a1206", fontFamily: "Share Tech Mono", fontWeight: 700, boxShadow: "0 0 18px rgba(245,215,110,.5)" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1206" strokeWidth="2">
      <path d="M4 20 L14 10" /><path d="M14 10 a4 4 0 1 1 5 -5 l-2 2 -3 -1 1 3 -1 1z" />
    </svg>
    GOLDEN CROWBAR
  </div>
);

export default function Profile() {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { if (me) { setDisplayName(me.displayName ?? ""); setUsername(me.username ?? ""); setAvatar(me.avatar ?? null); } }, [me]);

  const save = useMutation({
    mutationFn: () => updateProfile({ displayName, username, avatar }),
    onSuccess: (r) => { setMsg(r.error ? r.error : "Saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });
  const pw = useMutation({
    mutationFn: () => changeMyPassword({ currentPassword: curPw, newPassword: newPw }),
    onSuccess: (r) => { setMsg(r.error ? r.error : "Password changed"); setCurPw(""); setNewPw(""); },
  });

  const card = { background: "#1e2a3d", border: "1px solid #354a63", borderRadius: 6, padding: 24, marginBottom: 20 };
  const input = { width: "100%", padding: 10, background: "#141a24", border: "1px solid #354a63", color: "#e2e8f0", borderRadius: 4, fontFamily: "Rajdhani" };
  const label = { display: "block", marginBottom: 6, fontFamily: "Share Tech Mono", fontSize: 12, color: "#7891ab" };

  if (!me) return null;
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontFamily: "Bebas Neue", fontSize: 42, color: "#38bdf8" }}>MY ACCOUNT</h1>
      {msg && <div style={{ ...card, borderColor: "#38bdf8", padding: 12 }}>{msg}</div>}

      <div style={card}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", background: "#141a24", border: "2px solid #38bdf8" }}>
            {avatar && <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <label style={{ ...label, cursor: "pointer", color: "#38bdf8" }}>
            CHANGE PHOTO
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await compress(f)); }} />
          </label>
          {me.hasGoldenCrowbar && <CrowbarBadge />}
        </div>
        <label style={label}>DISPLAY NAME</label>
        <input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <label style={{ ...label, marginTop: 14 }}>USERNAME</label>
        <input style={input} value={username} onChange={(e) => setUsername(e.target.value)} />
        <button onClick={() => save.mutate()} style={{ marginTop: 18, padding: "10px 20px", background: "#38bdf8", color: "#0a0f16", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>SAVE</button>
      </div>

      <div style={card}>
        <h2 style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "#38bdf8" }}>CHANGE PASSWORD</h2>
        <label style={label}>CURRENT PASSWORD</label>
        <input style={input} type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
        <label style={{ ...label, marginTop: 14 }}>NEW PASSWORD</label>
        <input style={input} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        <button onClick={() => pw.mutate()} style={{ marginTop: 18, padding: "10px 20px", background: "#38bdf8", color: "#0a0f16", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>UPDATE PASSWORD</button>
      </div>
    </div>
  );
}