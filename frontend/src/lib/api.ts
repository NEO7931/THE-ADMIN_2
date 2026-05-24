// Centralized API client using native fetch + React Query

const BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authApi = {
  me: () => apiFetch<any>("/auth/me"),
  login: (data: { username: string; password: string }) =>
    apiFetch<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: { username: string; email: string; password: string }) =>
    apiFetch<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: () => apiFetch<any>("/auth/logout", { method: "POST" }),
  verifyOTP: (email: string, otp: string) =>
    apiFetch<any>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
  resendOTP: (email: string) =>
    apiFetch<any>("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) }),
};

export const booksApi = {
  list: (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v))
    ).toString();
    return apiFetch<any[]>(`/books${q ? `?${q}` : ""}`);
  },
  categories: () => apiFetch<string[]>("/books/categories"),
  get: (id: number) => apiFetch<any>(`/books/${id}`),
  create: (data: any) =>
    apiFetch<any>("/books", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    apiFetch<any>(`/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<void>(`/books/${id}`, { method: "DELETE" }),
};

export const borrowApi = {
  list: () => apiFetch<any[]>("/borrow"),
  create: (data: { bookId: number; borrowDate: string; returnDate?: string }) =>
    apiFetch<any>("/borrow", { method: "POST", body: JSON.stringify(data) }),
  return: (id: number) =>
    apiFetch<any>(`/borrow/${id}/return`, { method: "PATCH" }),
};

export const reservationsApi = {
  list: () => apiFetch<any[]>("/reservations"),
  create: (data: { bookId: number; pickupDate: string; returnDate: string }) =>
    apiFetch<any>("/reservations", { method: "POST", body: JSON.stringify(data) }),
};

export const historyApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString();
    return apiFetch<any>(`/history${q ? `?${q}` : ""}`);
  },
};

export const finesApi = {
  my: () => apiFetch<any>("/fines/my"),
  list: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${params.status}` : "";
    return apiFetch<any>(`/fines${q}`);
  },
  settings: () => apiFetch<any>("/fines/settings"),
  updateSettings: (data: any) =>
    apiFetch<any>("/fines/settings", { method: "PATCH", body: JSON.stringify(data) }),
  waive: (id: number, data: { waiveReason: string }) =>
    apiFetch<any>(`/fines/${id}/waive`, { method: "POST", body: JSON.stringify(data) }),
};

export const notificationsApi = {
  list: (params?: { is_read?: string }) => {
    const q = params?.is_read ? `?is_read=${params.is_read}` : "";
    return apiFetch<any>(`/notifications${q}`);
  },
  markAllRead: () => apiFetch<any>("/notifications/read-all", { method: "PATCH" }),
  markRead: (id: number) => apiFetch<any>(`/notifications/${id}/read`, { method: "PATCH" }),
};

export const paymentsApi = {
  createSession: (data: { fineId: number }) =>
    apiFetch<any>("/payments/create-session", { method: "POST", body: JSON.stringify(data) }),
  my: () => apiFetch<any[]>("/payments/my"),
};

export const adminApi = {
  stats: () => apiFetch<any>("/admin/stats"),
  requests: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${params.status}` : "";
    return apiFetch<any[]>(`/admin/requests${q}`);
  },
  approve: (id: number) => apiFetch<any>(`/admin/approve/${id}`, { method: "PUT" }),
  reject: (id: number, data: { rejectionReason: string }) =>
    apiFetch<any>(`/admin/reject/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  transactions: () => apiFetch<any[]>("/admin/transactions"),
  reservations: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${params.status}` : "";
    return apiFetch<any[]>(`/admin/reservations${q}`);
  },
  approveReservation: (id: number) =>
    apiFetch<any>(`/admin/reservations/approve/${id}`, { method: "PUT" }),
  rejectReservation: (id: number, data: { rejectionReason: string }) =>
    apiFetch<any>(`/admin/reservations/reject/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const userManagementApi = {
  list: () => apiFetch<any[]>("/admin/users"),
  ban: (id: number) => apiFetch<any>(`/admin/users/${id}/ban`, { method: "PUT" }),
  unban: (id: number) => apiFetch<any>(`/admin/users/${id}/unban`, { method: "PUT" }),
  suspend: (id: number) => apiFetch<any>(`/admin/users/${id}/suspend`, { method: "PUT" }),
  unsuspend: (id: number) => apiFetch<any>(`/admin/users/${id}/unsuspend`, { method: "PUT" }),
  softDelete: (id: number) => apiFetch<any>(`/admin/users/${id}`, { method: "DELETE" }),
  hardDelete: (id: number) => apiFetch<any>(`/admin/users/${id}/permanent`, { method: "DELETE" }),
  restore: (id: number) => apiFetch<any>(`/admin/users/${id}/restore`, { method: "PUT" }),
  setRole: (id: number, role: string) => apiFetch<any>(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  timeout: (id: number, durationMinutes: number) =>
    apiFetch<any>(`/admin/users/${id}/timeout`, { method: "PUT", body: JSON.stringify({ durationMinutes }) }),
};

export const adminBooksApi = {
  setStatus: (id: number, status: string) =>
    apiFetch<any>(`/admin/books/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const getMyProfile      = () => fetch("/api/profile/me", { credentials: "include" }).then(r => r.json());
export const updateProfile     = (b: any) => fetch("/api/profile", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());
export const changeMyPassword  = (b: any) => fetch("/api/profile/password", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());
export const attemptCrowbar    = (sequence: string[]) => fetch("/api/easter-egg/attempt", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequence }) }).then(r => r.json());
export const crowbarMeta       = () => fetch("/api/easter-egg/meta", { credentials: "include" }).then(r => r.json());
// admin
export const adminGetUser      = (id: number) => fetch(`/api/admin/users/${id}`, { credentials: "include" }).then(r => r.json());
export const adminEditUser     = (id: number, b: any) => fetch(`/api/admin/users/${id}/profile`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());
export const adminResetPassword= (id: number, newPassword: string) => fetch(`/api/admin/users/${id}/password`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) }).then(r => r.json());

export const analyticsApi = {
  overview: () => apiFetch<any>("/analytics/overview"),
  borrowTrends: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v))).toString();
    return apiFetch<any>(`/analytics/borrow-trends${q ? `?${q}` : ""}`);
  },
  topBooks: (params?: { limit?: number; from?: string; to?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString();
    return apiFetch<any[]>(`/analytics/top-books${q ? `?${q}` : ""}`);
  },
  requestStatus: () => apiFetch<any>("/analytics/request-status"),
  fineCollection: () => apiFetch<any[]>("/analytics/fine-collection"),
  studentActivity: (params?: { limit?: number }) => {
    const q = params?.limit ? `?limit=${params.limit}` : "";
    return apiFetch<any[]>(`/analytics/student-activity${q}`);
  },
  export: (report: string, params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams({ report, ...Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v)) }).toString();
    return `/api/analytics/export?${q}`;
  },
};