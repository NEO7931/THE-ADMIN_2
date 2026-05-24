import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { adminApi, booksApi, finesApi, authApi, userManagementApi, adminBooksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Users, Clock, AlertTriangle, CheckCircle, XCircle,
  BarChart3, BookMarked, Plus, Pencil, Trash2, PhilippinePeso,
  Ban, ShieldCheck, UserX, RotateCcw, X, Shield, Crown, UserCog, Flame,
} from "lucide-react";

// ─── Stat Details Modal ───────────────────────────────────────────────────────
type ModalType = "total-books" | "available" | "borrowed" | "pending" | "overdue" | "reservations";

function StatDetailsModal({ type, title, onClose }: { type: ModalType; title: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["modal", type],
    queryFn: () => {
      if (type === "total-books") return booksApi.list();
      if (type === "available") return booksApi.list({ status: "available" });
      if (type === "borrowed") return booksApi.list({ status: "borrowed" });
      if (type === "pending") return adminApi.requests({ status: "pending" });
      if (type === "overdue") return adminApi.requests({ status: "overdue" });
      if (type === "reservations") return adminApi.reservations();
      return Promise.resolve([]);
    },
  });

  const isBookType = type === "total-books" || type === "available" || type === "borrowed";
  const items: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Nothing to show here.</p>
          ) : isBookType ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Code</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Title</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Author</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-400">{b.code}</td>
                    <td className="py-2.5 pr-4 font-medium text-gray-800 max-w-[180px] truncate">{b.title}</td>
                    <td className="py-2.5 pr-4 text-gray-500 max-w-[120px] truncate">{b.author}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.status === "available" ? "bg-green-100 text-green-700" :
                        b.status === "borrowed" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="space-y-3">
              {items.map((r: any) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{r.book?.title ?? `Item #${r.id}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.user?.username && `User: ${r.user.username}`}
                        {r.borrowDate && ` · Borrow: ${r.borrowDate}`}
                        {r.dueDate && ` · Due: ${r.dueDate}`}
                        {r.pickupDate && ` · Pickup: ${r.pickupDate}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      r.status === "pending" ? "bg-amber-100 text-amber-700" :
                      r.status === "overdue" ? "bg-red-100 text-red-700" :
                      r.status === "confirmed" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, onClick,
}: {
  label: string; value: string | number; icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  const base = `rounded-xl p-5 ${color} flex items-center gap-4 transition-all`;
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] text-left w-full`}
      >
        <div className="opacity-80">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-75 mt-0.5">{label}</p>
        </div>
        <div className="ml-auto opacity-40 text-xs">↗</div>
      </button>
    );
  }
  return (
    <div className={base}>
      <div className="opacity-80">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-75 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["auth-me"], queryFn: authApi.me });
  const isAdmin = me?.role === "admin";
  const isLibrarian = me?.role === "librarian";
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => userManagementApi.list(),
  });

  const mutate = (fn: () => Promise<any>, successMsg: string) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => { toast({ title: successMsg }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => userManagementApi.ban(id, reason),
    onSuccess: () => { toast({ title: "User banned" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); setActionModal(null); setActionReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.unban(id),
    onSuccess: () => { toast({ title: "User unbanned" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => userManagementApi.suspend(id, reason),
    onSuccess: () => { toast({ title: "User suspended" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); setActionModal(null); setActionReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.unsuspend(id),
    onSuccess: () => { toast({ title: "User unsuspended" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.delete(id),
    onSuccess: () => { toast({ title: "User deleted" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.restore(id),
    onSuccess: () => { toast({ title: "User restored" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.hardDelete(id),
    onSuccess: () => { toast({ title: "User permanently deleted" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => userManagementApi.setRole(id, role),
    onSuccess: () => { toast({ title: "Role updated" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const timeoutMutation = useMutation({
    mutationFn: ({ id, durationMinutes, reason }: { id: number; durationMinutes: number; reason: string }) =>
      userManagementApi.timeout(id, durationMinutes, reason),
    onSuccess: (data: any) => { toast({ title: "Timeout set", description: data.message }); qc.invalidateQueries({ queryKey: ["admin-users"] }); setTimeoutUser(null); setTimeoutReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [timeoutUser, setTimeoutUser] = useState<{ id: number; username: string } | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState("60");
  const [actionModal, setActionModal] = useState<{ id: number; username: string; type: "suspend" | "ban" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [timeoutReason, setTimeoutReason] = useState("");

  const STATUS_BADGE: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    banned: "bg-red-100 text-red-700",
    suspended: "bg-amber-100 text-amber-700",
    deleted: "bg-gray-100 text-gray-500",
  };

  const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <ShieldCheck className="h-3 w-3" />,
    banned: <Ban className="h-3 w-3" />,
    suspended: <Clock className="h-3 w-3" />,
    deleted: <UserX className="h-3 w-3" />,
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  const TIMEOUT_OPTIONS = [
    { label: "1 Hour",   value: 60 },
    { label: "6 Hours",  value: 360 },
    { label: "12 Hours", value: 720 },
    { label: "1 Day",    value: 1440 },
    { label: "3 Days",   value: 4320 },
    { label: "7 Days",   value: 10080 },
  ];

  return (
    <div>
      {/* Suspend / Ban reason modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setActionModal(null); setActionReason(""); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">
              {actionModal.type === "ban" ? "Ban" : "Suspend"} {actionModal.username}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionModal.type === "ban"
                ? "This user will be permanently banned. Provide a reason."
                : "This user will be suspended indefinitely until you lift it. Provide a reason."}
            </p>
            <textarea
              placeholder="Enter reason..."
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!actionReason.trim()) return;
                  if (actionModal.type === "ban") banMutation.mutate({ id: actionModal.id, reason: actionReason });
                  else suspendMutation.mutate({ id: actionModal.id, reason: actionReason });
                }}
                disabled={!actionReason.trim() || banMutation.isPending || suspendMutation.isPending}
                className={`flex-1 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 ${actionModal.type === "ban" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                {banMutation.isPending || suspendMutation.isPending ? "Processing..." : `Confirm ${actionModal.type === "ban" ? "Ban" : "Suspend"}`}
              </button>
              <button onClick={() => { setActionModal(null); setActionReason(""); }} className="flex-1 border border-gray-200 text-sm py-2 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeout dialog */}
      {timeoutUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setTimeoutUser(null); setTimeoutReason(""); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">Timeout {timeoutUser.username}</h3>
            <p className="text-sm text-gray-500 mb-3">Select duration and provide a reason.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {TIMEOUT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setTimeoutDuration(String(opt.value))}
                  className={`text-sm py-2 rounded-lg border transition-colors ${timeoutDuration === String(opt.value) ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Enter reason..."
              value={timeoutReason}
              onChange={e => setTimeoutReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => timeoutMutation.mutate({ id: timeoutUser.id, durationMinutes: parseInt(timeoutDuration), reason: timeoutReason })}
                disabled={!timeoutReason.trim() || timeoutMutation.isPending}
                className="flex-1 bg-amber-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                {timeoutMutation.isPending ? "Setting..." : "Set Timeout"}
              </button>
              <button onClick={() => { setTimeoutUser(null); setTimeoutReason(""); }} className="flex-1 border border-gray-200 text-sm py-2 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-5">{users.length} registered accounts</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 pb-3 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u: any) => {
              const isMe = u.id === me?.id;
              const isPending =
                banMutation.isPending || unbanMutation.isPending ||
                suspendMutation.isPending || unsuspendMutation.isPending ||
                deleteMutation.isPending || restoreMutation.isPending ||
                hardDeleteMutation.isPending || setRoleMutation.isPending ||
                timeoutMutation.isPending;

              // Librarians can only act on regular users
              const canManage = !isMe && (isAdmin || (isLibrarian && u.role === "user"));

              const roleColors: Record<string, string> = {
                admin:     "bg-blue-100 text-blue-700",
                librarian: "bg-purple-100 text-purple-700",
                user:      "bg-gray-100 text-gray-600",
              };
              const roleIcons: Record<string, React.ReactNode> = {
                admin:     <Crown className="h-3 w-3" />,
                librarian: <UserCog className="h-3 w-3" />,
                user:      null,
              };

              return (
                <tr key={u.id} className={`hover:bg-gray-50 ${isMe ? "bg-blue-50/40" : ""}`}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{u.username}</span>
                      {isMe && <span className="text-xs bg-blue-100 text-blue-600 font-medium px-1.5 py-0.5 rounded-full">You</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 max-w-[140px] truncate">{u.email}</td>

                  {/* Role — admin only can change roles */}
                  <td className="py-3 pr-4">
                    {isMe ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {roleIcons[u.role]}{u.role}
                      </span>
                    ) : isAdmin ? (
                      <select
                        value={u.role}
                        disabled={isPending}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          const msg = newRole === "admin"
                            ? `Promote ${u.username} to ADMIN?`
                            : newRole === "librarian"
                            ? `Make ${u.username} a LIBRARIAN?`
                            : `Demote ${u.username} to regular USER?`;
                          if (confirm(msg)) setRoleMutation.mutate({ id: u.id, role: newRole });
                        }}
                        className="text-xs font-medium px-2 py-0.5 rounded-full border cursor-pointer disabled:opacity-40"
                        style={{
                          background: u.role === "admin" ? "#dbeafe" : u.role === "librarian" ? "#f3e8ff" : "#f3f4f6",
                          color: u.role === "admin" ? "#1d4ed8" : u.role === "librarian" ? "#7c3aed" : "#4b5563",
                          border: "1px solid transparent",
                        }}
                      >
                        <option value="user">user</option>
                        <option value="librarian">librarian</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {roleIcons[u.role]}{u.role}
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_ICON[u.status]}{u.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    {!canManage ? (
                      <span className="text-xs text-gray-400 italic">—</span>
                    ) : (
                      <div className="flex gap-1.5 flex-wrap">
                        {u.status === "active" && (
                          <>
                            <button onClick={() => setTimeoutUser({ id: u.id, username: u.username })} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-40">
                              <Clock className="h-3 w-3" /> Timeout
                            </button>
                            <button onClick={() => { setActionModal({ id: u.id, username: u.username, type: "suspend" }); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40">
                              <Clock className="h-3 w-3" /> Suspend
                            </button>
                            <button onClick={() => { setActionModal({ id: u.id, username: u.username, type: "ban" }); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40">
                              <Ban className="h-3 w-3" /> Ban
                            </button>
                            {isAdmin && (
                              <>
                                <button onClick={() => { if (confirm(`Soft-delete ${u.username}?`)) deleteMutation.mutate(u.id); }} disabled={isPending}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                  <UserX className="h-3 w-3" /> Delete
                                </button>
                                <button onClick={() => { if (confirm(`⚠️ PERMANENTLY delete ${u.username}? CANNOT be undone.`)) hardDeleteMutation.mutate(u.id); }} disabled={isPending}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-semibold">
                                  <Flame className="h-3 w-3" /> Purge
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {u.status === "suspended" && (
                          <>
                            <button onClick={() => unsuspendMutation.mutate(u.id)} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-40">
                              <ShieldCheck className="h-3 w-3" /> Unsuspend
                            </button>
                            <button onClick={() => { setActionModal({ id: u.id, username: u.username, type: "ban" }); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40">
                              <Ban className="h-3 w-3" /> Ban
                            </button>
                            {isAdmin && <button onClick={() => { if (confirm(`⚠️ PERMANENTLY delete ${u.username}?`)) hardDeleteMutation.mutate(u.id); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-semibold">
                              <Flame className="h-3 w-3" /> Purge
                            </button>}
                          </>
                        )}
                        {u.status === "banned" && (
                          <>
                            <button onClick={() => unbanMutation.mutate(u.id)} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-40">
                              <ShieldCheck className="h-3 w-3" /> Unban
                            </button>
                            {isAdmin && <button onClick={() => { if (confirm(`⚠️ PERMANENTLY delete ${u.username}?`)) hardDeleteMutation.mutate(u.id); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-semibold">
                              <Flame className="h-3 w-3" /> Purge
                            </button>}
                          </>
                        )}
                        {u.status === "deleted" && isAdmin && (
                          <>
                            <button onClick={() => restoreMutation.mutate(u.id)} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40">
                              <RotateCcw className="h-3 w-3" /> Restore
                            </button>
                            <button onClick={() => { if (confirm(`⚠️ PERMANENTLY delete ${u.username}? CANNOT be undone.`)) hardDeleteMutation.mutate(u.id); }} disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-semibold">
                              <Flame className="h-3 w-3" /> Purge
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Books Tab ────────────────────────────────────────────────────────────────
function BooksTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [form, setForm] = useState({ code: "", title: "", author: "", category: "", imageUrl: "" });

  const { data: books = [] } = useQuery({ queryKey: ["admin-books"], queryFn: () => booksApi.list() });

  const createMutation = useMutation({
    mutationFn: () => booksApi.create({ ...form, imageUrl: form.imageUrl || null }),
    onSuccess: () => { toast({ title: "Book added" }); qc.invalidateQueries({ queryKey: ["admin-books"] }); setShowForm(false); resetForm(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => booksApi.update(editBook.id, { ...form, imageUrl: form.imageUrl || null }),
    onSuccess: () => { toast({ title: "Book updated" }); qc.invalidateQueries({ queryKey: ["admin-books"] }); setEditBook(null); resetForm(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => booksApi.delete(id),
    onSuccess: () => { toast({ title: "Book deleted" }); qc.invalidateQueries({ queryKey: ["admin-books"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => setForm({ code: "", title: "", author: "", category: "", imageUrl: "" });

  const handleEdit = (book: any) => {
    setEditBook(book);
    setForm({ code: book.code, title: book.title, author: book.author, category: book.category, imageUrl: book.imageUrl ?? "" });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editBook ? updateMutation.mutate() : createMutation.mutate();
  };

  const STATUS_COLORS: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    borrowed: "bg-red-100 text-red-700",
    reserved: "bg-amber-100 text-amber-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{books.length} books total</p>
        <button
          onClick={() => { setShowForm(!showForm); setEditBook(null); resetForm(); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Book
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">{editBook ? "Edit Book" : "Add New Book"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "code", label: "Book Code", placeholder: "e.g. LIB-001" },
              { key: "title", label: "Title", placeholder: "Book title" },
              { key: "author", label: "Author", placeholder: "Author name" },
              { key: "category", label: "Category", placeholder: "e.g. Science" },
              { key: "imageUrl", label: "Image URL (optional)", placeholder: "https://..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className={key === "imageUrl" ? "sm:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  required={key !== "imageUrl"}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {editBook ? "Update" : "Add Book"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditBook(null); resetForm(); }}
                className="border border-gray-300 text-sm px-5 py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Code", "Title", "Author", "Category", "Status", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book: any) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-mono text-xs text-gray-500">{book.code}</td>
                <td className="py-3 pr-4 font-medium text-gray-900 max-w-[200px] truncate">{book.title}</td>
                <td className="py-3 pr-4 text-gray-600">{book.author}</td>
                <td className="py-3 pr-4 text-gray-500">{book.category}</td>
                <td className="py-3 pr-4">
                  <select
                    value={book.status}
                    onChange={(e) => {
                      adminBooksApi.setStatus(book.id, e.target.value)
                        .then(() => qc.invalidateQueries({ queryKey: ["admin-books"] }))
                        .catch((err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                    }}
                    className="text-xs font-medium px-2 py-0.5 rounded border cursor-pointer"
                    style={{
                      background: book.status === "available" ? "#00ff8811" : book.status === "borrowed" ? "#38bdf811" : "#64748b11",
                      color: book.status === "available" ? "#00ff88" : book.status === "borrowed" ? "#38bdf8" : "#64748b",
                      border: `1px solid ${book.status === "available" ? "#00ff8833" : book.status === "borrowed" ? "#38bdf833" : "#64748b33"}`,
                    }}
                  >
                    <option value="available">available</option>
                    <option value="borrowed">borrowed</option>
                    <option value="reserved">reserved</option>
                  </select>
                </td>
                <td className="py-3 flex gap-2 justify-end">
                  <button onClick={() => handleEdit(book)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this book?")) deleteMutation.mutate(book.id); }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────
function RequestsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests", filter],
    queryFn: () => adminApi.requests({ status: filter || undefined }),
    refetchInterval: 15000,
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approve(id),
    onSuccess: () => { toast({ title: "Request approved" }); qc.invalidateQueries({ queryKey: ["admin-requests"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.reject(id, { rejectionReason: reason }),
    onSuccess: () => { toast({ title: "Request rejected" }); qc.invalidateQueries({ queryKey: ["admin-requests"] }); setRejectId(null); setRejectReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    returned: "bg-gray-100 text-gray-600",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["pending", "approved", "overdue", "returned", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${filter === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {rejectId && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-red-800 mb-2">Rejection reason for request #{rejectId}</p>
          <input type="text" placeholder="Enter reason…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div className="flex gap-2">
            <button onClick={() => rejectReason && reject.mutate({ id: rejectId, reason: rejectReason })}
              disabled={!rejectReason || reject.isPending}
              className="bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">
              Confirm Reject
            </button>
            <button onClick={() => setRejectId(null)} className="border border-gray-300 text-sm px-4 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <p className="text-center py-12 text-gray-400">No requests found</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                    <span className="text-xs text-gray-400">#{r.id}</span>
                  </div>
                  <p className="font-medium text-gray-900">{r.book?.title}</p>
                  <p className="text-sm text-gray-500">by {r.user?.username} · Borrow: {r.borrowDate} · Due: {r.dueDate}</p>
                  {r.rejectionReason && <p className="text-xs text-red-600 mt-1">Reason: {r.rejectionReason}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approve.mutate(r.id)} disabled={approve.isPending}
                      className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => setRejectId(r.id)}
                      className="inline-flex items-center gap-1 border border-red-300 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fines Tab ────────────────────────────────────────────────────────────────
function FinesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [waiveId, setWaiveId] = useState<number | null>(null);
  const [waiveReason, setWaiveReason] = useState("");

  const { data } = useQuery({ queryKey: ["admin-fines"], queryFn: () => finesApi.list() });

  const waive = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => finesApi.waive(id, { waiveReason: reason }),
    onSuccess: () => { toast({ title: "Fine waived" }); qc.invalidateQueries({ queryKey: ["admin-fines"] }); setWaiveId(null); setWaiveReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const fines = data?.fines ?? [];
  const STATUS_COLORS: Record<string, string> = {
    unpaid: "bg-red-100 text-red-700",
    paid: "bg-green-100 text-green-700",
    waived: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <div className="flex gap-6 mb-5 text-sm">
        <span className="text-gray-500">Total Unpaid: <strong className="text-red-600">₱{data?.totalUnpaid ?? "0.00"}</strong></span>
        <span className="text-gray-500">Total Collected: <strong className="text-green-600">₱{data?.totalCollected ?? "0.00"}</strong></span>
      </div>

      {waiveId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-amber-800 mb-2">Waive reason for fine #{waiveId}</p>
          <input type="text" placeholder="Enter reason…" value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => waiveReason && waive.mutate({ id: waiveId, reason: waiveReason })}
              disabled={!waiveReason || waive.isPending}
              className="bg-amber-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50">
              Confirm Waive
            </button>
            <button onClick={() => setWaiveId(null)} className="border border-gray-300 text-sm px-4 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fines.length === 0 ? (
          <p className="text-center py-12 text-gray-400">No fines found</p>
        ) : fines.map((f: any) => (
          <div key={f.id} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status] ?? "bg-gray-100 text-gray-600"}`}>{f.status}</span>
                </div>
                <p className="font-medium text-gray-900">{f.book?.title ?? `Fine #${f.id}`}</p>
                <p className="text-sm text-gray-500">User: {f.user?.username} · {f.overdueDays} days overdue</p>
                <p className="text-sm font-semibold text-red-600 mt-1">₱{parseFloat(f.fineAmount).toFixed(2)}</p>
              </div>
              {f.status === "unpaid" && (
                <button onClick={() => setWaiveId(f.id)}
                  className="text-xs font-medium border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                  Waive Fine
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState<"overview" | "requests" | "books" | "fines" | "users">("overview");
  const [modal, setModal] = useState<{ type: ModalType; title: string } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats(),
    refetchInterval: 30000,
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "requests", label: "Requests", icon: <Clock className="h-4 w-4" /> },
    { id: "books", label: "Books", icon: <BookOpen className="h-4 w-4" /> },
    { id: "fines", label: "Fines", icon: <PhilippinePeso className="h-4 w-4" /> },
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  ] as const;

  return (
    <Layout>
      {modal && <StatDetailsModal type={modal.type} title={modal.title} onClose={() => setModal(null)} />}

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Manage the library system</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}{t.label}
              {t.id === "requests" && (stats?.pendingRequests ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {stats!.pendingRequests}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Books" value={stats?.totalBooks ?? 0}
                icon={<BookOpen className="h-6 w-6 text-white" />} color="bg-blue-600 text-white"
                onClick={() => setModal({ type: "total-books", title: "All Books" })}
              />
              <StatCard
                label="Available" value={stats?.availableBooks ?? 0}
                icon={<CheckCircle className="h-6 w-6 text-white" />} color="bg-green-600 text-white"
                onClick={() => setModal({ type: "available", title: "Available Books" })}
              />
              <StatCard
                label="Borrowed" value={stats?.borrowedBooks ?? 0}
                icon={<BookMarked className="h-6 w-6 text-white" />} color="bg-amber-500 text-white"
                onClick={() => setModal({ type: "borrowed", title: "Currently Borrowed" })}
              />
              <StatCard
                label="Pending Requests" value={stats?.pendingRequests ?? 0}
                icon={<Clock className="h-6 w-6 text-white" />} color="bg-indigo-600 text-white"
                onClick={() => setModal({ type: "pending", title: "Pending Borrow Requests" })}
              />
              <StatCard
                label="Overdue" value={stats?.overdueBooks ?? 0}
                icon={<AlertTriangle className="h-6 w-6 text-white" />} color="bg-red-500 text-white"
                onClick={() => setModal({ type: "overdue", title: "Overdue Books" })}
              />
              <StatCard
                label="Total Users" value={stats?.totalUsers ?? 0}
                icon={<Users className="h-6 w-6 text-white" />} color="bg-purple-600 text-white"
                onClick={() => setTab("users")}
              />
              <StatCard
                label="Reservations" value={stats?.reservationsCount ?? 0}
                icon={<BookMarked className="h-6 w-6 text-white" />} color="bg-teal-600 text-white"
                onClick={() => setModal({ type: "reservations", title: "Active Reservations" })}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
              Click any card above to see what's inside it. Use the tabs to manage requests, books, fines, and users.
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6"><RequestsTab /></div>
        )}
        {tab === "books" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6"><BooksTab /></div>
        )}
        {tab === "fines" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6"><FinesTab /></div>
        )}
        {tab === "users" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6"><UsersTab /></div>
        )}
      </div>
    </Layout>
  );
}