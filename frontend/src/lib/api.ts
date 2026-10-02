/**
 * Central API client — every backend call in the app goes through here.
 * Base URL comes from VITE_API_BASE_URL (see .env.example). Falls back to
 * localhost:5000 for local dev if the env var isn't set.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, ...init } = options;
  const token = auth !== false ? getToken() : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include", // send the httpOnly cookie set by the backend
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.message ?? `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

// ---------- Token helpers (kept in localStorage as a fallback to the cookie,
// useful when the API and frontend are on different domains in production) ----------
const TOKEN_KEY = "cutoffsaathi_token";
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Types ----------
// The 6 top-level streams — matches backend/src/config/courseTaxonomy.js.
export type Stream =
  | "Technical Education"
  | "Higher Education"
  | "Medical Education"
  | "Ayush Education"
  | "Agriculture Education"
  | "Fine Art Education";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  category?: string;
};

export type CutoffResult = {
  stream: Stream;
  course: string;
  category: string;
  year: number;
  branches: {
    branch_name: string;
    colleges: {
      college_name: string;
      college_code?: string;
      rounds: Record<string, { percentile?: number; rank?: number }>;
      fees_amount?: number;
      fees_unit?: "per_year" | "total_course";
    }[];
  }[];
};

export type CreateOrderResponse = {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

// ---------- Auth ----------
export const authApi = {
  signup: (payload: { name: string; email: string; password: string; category?: string }) =>
    request<{ message: string; data: { email: string; needsVerification: boolean } }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(payload), auth: false },
    ),

  verifyOtp: (payload: { email: string; otp: string }) =>
    request<{ token: string; data: { user: User } }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),

  resendOtp: (payload: { email: string }) =>
    request<{ message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; data: { user: User } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request<{ data: { user: User } }>("/auth/me"),
};

// ---------- Meta (dropdown data) ----------
// Stream → Course → Category/Branch/Years — mirrors the 4-level taxonomy
// the real CET Cell portal uses (see backend README section 3).
export const metaApi = {
  streams: () => request<{ data: Stream[] }>("/meta/streams", { auth: false }),

  courses: (stream: Stream, level?: "Post Graduate" | "Under Graduate") =>
    request<{ data: string[] }>(
      `/meta/${encodeURIComponent(stream)}/courses${level ? `?level=${encodeURIComponent(level)}` : ""}`,
      { auth: false },
    ),

  categories: (stream: Stream, course: string) =>
    request<{ data: string[] }>(
      `/meta/${encodeURIComponent(stream)}/${encodeURIComponent(course)}/categories`,
      { auth: false },
    ),

  branches: (stream: Stream, course: string, search?: string) =>
    request<{ data: string[] }>(
      `/meta/${encodeURIComponent(stream)}/${encodeURIComponent(course)}/branches${
        search ? `?search=${encodeURIComponent(search)}` : ""
      }`,
      { auth: false },
    ),

  years: (stream: Stream, course: string) =>
    request<{ data: number[] }>(
      `/meta/${encodeURIComponent(stream)}/${encodeURIComponent(course)}/years`,
      { auth: false },
    ),
};

// ---------- Orders / checkout / result ----------
// No guest checkout, no download URLs — every order requires login, and the
// result is only ever served as JSON to the logged-in owner's dashboard.
export const ordersApi = {
  create: (payload: {
    stream: Stream;
    course: string;
    category: string;
    branches: string[];
    year: number;
  }) =>
    request<{ data: CreateOrderResponse }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verify: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    request<{ data: { orderId: string } }>("/orders/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getResult: (orderId: string) => request<{ data: CutoffResult }>(`/orders/${orderId}/result`),

  mine: () => request<{ data: unknown[] }>("/orders/mine"),
};

// ---------- Admin ----------
export const adminApi = {
  stats: () =>
    request<{
      data: {
        sheetsSoldToday: number;
        revenueThisMonthPaise: number;
        totalColleges: number;
        lastDataUpdate: string | null;
      };
    }>("/admin/stats"),

  orders: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<{ data: unknown[]; pagination: { total: number } }>(
      `/admin/orders${query ? `?${query}` : ""}`,
    );
  },

  uploadsLog: () =>
    request<{
      data: {
        _id: { stream: string; course: string; round: string; year: number };
        count: number;
        lastUpdated: string;
      }[];
    }>("/admin/uploads-log"),

  upload: (file: File, meta: { stream: Stream; course: string; round: string; year: number }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("stream", meta.stream);
    form.append("course", meta.course);
    form.append("round", meta.round);
    form.append("year", String(meta.year));
    return request<{
      data: {
        totalRows: number;
        processed: number;
        inserted: number;
        updated: number;
        errors: unknown[];
      };
    }>("/admin/upload", { method: "POST", body: form });
  },

  // Fees are uploaded separately from cutoffs — no `round`, since a fee
  // doesn't change by CAP round, only by year. See backend/src/models/Fee.js.
  feesUploadsLog: () =>
    request<{
      data: {
        _id: { stream: string; course: string; year: number };
        count: number;
        lastUpdated: string;
      }[];
    }>("/admin/fees-uploads-log"),

  uploadFees: (file: File, meta: { stream: Stream; course: string; year: number }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("stream", meta.stream);
    form.append("course", meta.course);
    form.append("year", String(meta.year));
    return request<{
      data: {
        totalRows: number;
        processed: number;
        inserted: number;
        updated: number;
        errors: unknown[];
      };
    }>("/admin/upload-fees", { method: "POST", body: form });
  },
};

export { API_BASE };
