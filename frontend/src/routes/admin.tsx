import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button, Card, Input, Label, Logo, Select } from "@/components/ui/kit";
import { cn } from "@/lib/utils";
import {
  adminApi,
  authApi,
  getToken,
  setToken,
  clearToken,
  type Stream,
  type User,
} from "@/lib/api";
import { STREAMS, COURSES } from "@/lib/data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — CutoffSaathi Internal" },
      {
        name: "description",
        content:
          "Internal CutoffSaathi console for uploading CAP round data, managing colleges and reviewing orders and payments.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Panel — CutoffSaathi" },
      { property: "og:description", content: "Internal operations console." },
    ],
  }),
  component: AdminPage,
});

const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "upload", icon: "⬆", label: "Upload Cutoff Data" },
  { id: "colleges", icon: "🏛", label: "Manage Colleges" },
  { id: "taxonomy", icon: "🏷", label: "Categories / Branches" },
  { id: "orders", icon: "₹", label: "Orders & Payments" },
  { id: "students", icon: "👤", label: "Students" },
  { id: "settings", icon: "⚙", label: "Settings" },
] as const;

type NavId = (typeof NAV)[number]["id"];

function AdminPage() {
  const [view, setView] = useState<NavId>("dashboard");
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = checking

  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return <CenteredMessage text="Checking your session…" />;
  }

  if (!user || user.role !== "admin") {
    return <AdminLoginGate onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <aside className="shrink-0 bg-navy-deep lg:w-[240px]">
        <div className="px-5 py-4">
          <Logo />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                view === n.id
                  ? "bg-saffron text-navy"
                  : "text-white/55 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className="w-4 text-center">{n.icon}</span>
              <span className="whitespace-nowrap">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto px-3 pb-4 lg:mt-8">
          <button
            onClick={() => {
              clearToken();
              authApi.logout().finally(() => setUser(null));
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold text-white/55 hover:bg-white/10 hover:text-white"
          >
            Log out ({user.name})
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 lg:px-8">
        {view === "dashboard" && <AdminDashboard />}
        {view === "upload" && <UploadView />}
        {view === "orders" && <OrdersView />}
        {!["dashboard", "upload", "orders"].includes(view) && (
          <Placeholder label={NAV.find((n) => n.id === view)!.label} />
        )}
      </main>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-[13px] text-muted-ink">{text}</p>
    </div>
  );
}

function AdminLoginGate({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5">
      <Card className="w-full max-w-[380px]">
        <div className="flex justify-center">
          <Logo light={false} />
        </div>
        <h1 className="mt-6 text-center text-xl">Admin sign-in</h1>
        <p className="mt-2 text-center text-[12px] text-muted-ink">
          Internal access only. Run <code className="text-[11px]">seedAdmin.js</code> on the backend
          to create your first account.
        </p>
        <form
          className="mt-6 space-y-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              const res = await authApi.login({ email: form.email, password: form.password });
              if (res.data.user.role !== "admin") {
                setError("This account doesn't have admin access.");
                return;
              }
              setToken(res.token);
              onSuccess(res.data.user);
            } catch (err) {
              setError((err as Error).message ?? "Login failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <Label htmlFor="aemail">Admin email</Label>
            <Input
              id="aemail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="apw">Password</Label>
            <Input
              id="apw"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {error && (
          <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-center text-[12px] font-semibold text-danger">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border-[1.5px] border-line bg-card p-4", className)}>
      {children}
    </div>
  );
}

function AdminDashboard() {
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats });
  const s = statsQuery.data?.data;

  const stats = [
    { v: statsQuery.isLoading ? "…" : String(s?.sheetsSoldToday ?? 0), l: "Sheets sold today" },
    {
      v: statsQuery.isLoading
        ? "…"
        : `₹${((s?.revenueThisMonthPaise ?? 0) / 100).toLocaleString("en-IN")}`,
      l: "Revenue this month",
    },
    { v: statsQuery.isLoading ? "…" : String(s?.totalColleges ?? 0), l: "Colleges in DB" },
    {
      v: statsQuery.isLoading
        ? "…"
        : s?.lastDataUpdate
          ? new Date(s.lastDataUpdate).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "No data yet",
      l: "Last data update",
    },
  ];

  return (
    <>
      <h1 className="text-xl">Dashboard</h1>
      <p className="mt-1 text-[12px] text-muted-ink">Live operations overview.</p>
      {statsQuery.isError && (
        <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[12px] font-semibold text-danger">
          Couldn't load stats: {(statsQuery.error as Error).message}
        </p>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((st) => (
          <Panel key={st.l}>
            <p className="text-2xl font-extrabold text-navy">{st.v}</p>
            <p className="mt-1 text-[12px] text-muted-ink">{st.l}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}

const ROUNDS = ["CAP1", "CAP2", "CAP3"];

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Success" || status === "paid"
      ? "bg-success-light text-success"
      : status === "Processing" || status === "created"
        ? "bg-warning-light text-saffron-dark"
        : "bg-danger/10 text-danger";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", tone)}>{status}</span>
  );
}

function UploadView() {
  const [mode, setMode] = useState<"cutoff" | "fees">("cutoff");

  return (
    <>
      <h1 className="text-xl">Upload Data</h1>
      <p className="mt-1 text-[12px] text-muted-ink">
        Cutoffs and fees are uploaded separately — fees don't change by CAP round, so they only need
        one upload per course per year, not one per round.
      </p>

      <div className="mt-5 inline-flex rounded-xl border-[1.5px] border-line bg-card p-1">
        {(["cutoff", "fees"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-4 py-2 text-[12.5px] font-bold transition-colors",
              mode === m ? "bg-navy text-white" : "text-muted-ink hover:text-navy",
            )}
          >
            {m === "cutoff" ? "Cutoff Data" : "Fees Data"}
          </button>
        ))}
      </div>

      {mode === "cutoff" ? <UploadCutoffPanel /> : <UploadFeesPanel />}
    </>
  );
}

function UploadCutoffPanel() {
  const queryClient = useQueryClient();
  const [stream, setStream] = useState<Stream>("Technical Education");
  const [course, setCourse] = useState<string>(COURSES["Technical Education"]?.[0] ?? "");
  const [round, setRound] = useState("CAP1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const uploadsLogQuery = useQuery({
    queryKey: ["admin-uploads-log"],
    queryFn: adminApi.uploadsLog,
  });

  const handleImport = async () => {
    if (!file) {
      setResultError("Choose a file first.");
      return;
    }
    setUploading(true);
    setResultMsg(null);
    setResultError(null);
    try {
      const res = await adminApi.upload(file, { stream, course, round, year });
      setResultMsg(
        `Imported ${res.data.processed} rows (${res.data.inserted} new, ${res.data.updated} updated)${
          res.data.errors.length ? `, ${res.data.errors.length} rows skipped.` : "."
        }`,
      );
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-uploads-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setResultError((err as Error).message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <p className="mt-5 text-[12px] text-muted-ink">
        Excel exports (.xlsx/.xls/.csv) from the official CET Cell portal. Columns expected: College
        Name, College Code, Branch (optional for branchless courses), Category, Percentile, Rank.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Stream</p>
          <Select
            value={stream}
            onChange={(e) => {
              const s = e.target.value as Stream;
              setStream(s);
              setCourse(COURSES[s]?.[0] ?? "");
            }}
          >
            {STREAMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Course</p>
          <Select value={course} onChange={(e) => setCourse(e.target.value)}>
            {(COURSES[stream] ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Round</p>
          <Select value={round} onChange={(e) => setRound(e.target.value)}>
            {ROUNDS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Year</p>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-card px-6 py-12 text-center transition-colors hover:border-saffron hover:bg-saffron-light/40">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-2xl">⬆</span>
        <span className="mt-3 text-[14px] font-bold text-navy">
          Drag Excel/CSV here or click to browse
        </span>
        <span className="mt-1 text-[12px] text-muted-ink">
          {file?.name ?? ".xlsx, .xls or .csv — max 10 MB"}
        </span>
      </label>

      <div className="mt-4 flex items-center justify-end gap-3">
        {resultMsg && <span className="text-[12px] font-semibold text-success">{resultMsg}</span>}
        {resultError && (
          <span className="text-[12px] font-semibold text-danger">{resultError}</span>
        )}
        <Button onClick={handleImport} disabled={uploading}>
          {uploading ? "Importing…" : "Run Import"}
        </Button>
      </div>

      <Panel className="mt-5 p-0">
        <div className="border-b-[1.5px] border-line px-4 py-3">
          <h2 className="text-[14px]">Recent cutoff uploads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line">
                {["Stream", "Course", "Round", "Year", "Rows in DB", "Last updated"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-ink"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uploadsLogQuery.data?.data.map((u) => (
                <tr
                  key={`${u._id.stream}-${u._id.course}-${u._id.round}-${u._id.year}`}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-4 py-2.5 text-[12px] font-bold text-navy">{u._id.stream}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u._id.course}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u._id.round}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u._id.year}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u.count}</td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-ink">
                    {new Date(u.lastUpdated).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {uploadsLogQuery.data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-muted-ink">
                    No data uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function UploadFeesPanel() {
  const queryClient = useQueryClient();
  const [stream, setStream] = useState<Stream>("Technical Education");
  const [course, setCourse] = useState<string>(COURSES["Technical Education"]?.[0] ?? "");
  const [year, setYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const uploadsLogQuery = useQuery({
    queryKey: ["admin-fees-uploads-log"],
    queryFn: adminApi.feesUploadsLog,
  });

  const handleImport = async () => {
    if (!file) {
      setResultError("Choose a file first.");
      return;
    }
    setUploading(true);
    setResultMsg(null);
    setResultError(null);
    try {
      const res = await adminApi.uploadFees(file, { stream, course, year });
      setResultMsg(
        `Imported ${res.data.processed} rows (${res.data.inserted} new, ${res.data.updated} updated)${
          res.data.errors.length ? `, ${res.data.errors.length} rows skipped.` : "."
        }`,
      );
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-fees-uploads-log"] });
    } catch (err) {
      setResultError((err as Error).message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <p className="mt-5 text-[12px] text-muted-ink">
        No round here — a fee doesn't change between CAP1/CAP2/CAP3. Columns expected: College Name,
        College Code, Branch (leave blank to apply the fee to every branch at that college), Fees,
        Fees Unit (optional — "per_year" or "total_course", defaults to per_year).
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Stream</p>
          <Select
            value={stream}
            onChange={(e) => {
              const s = e.target.value as Stream;
              setStream(s);
              setCourse(COURSES[s]?.[0] ?? "");
            }}
          >
            {STREAMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Course</p>
          <Select value={course} onChange={(e) => setCourse(e.target.value)}>
            {(COURSES[stream] ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-bold text-navy">Year</p>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-card px-6 py-12 text-center transition-colors hover:border-saffron hover:bg-saffron-light/40">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-2xl">⬆</span>
        <span className="mt-3 text-[14px] font-bold text-navy">
          Drag Excel/CSV here or click to browse
        </span>
        <span className="mt-1 text-[12px] text-muted-ink">
          {file?.name ?? ".xlsx, .xls or .csv — max 10 MB"}
        </span>
      </label>

      <div className="mt-4 flex items-center justify-end gap-3">
        {resultMsg && <span className="text-[12px] font-semibold text-success">{resultMsg}</span>}
        {resultError && (
          <span className="text-[12px] font-semibold text-danger">{resultError}</span>
        )}
        <Button onClick={handleImport} disabled={uploading}>
          {uploading ? "Importing…" : "Run Import"}
        </Button>
      </div>

      <Panel className="mt-5 p-0">
        <div className="border-b-[1.5px] border-line px-4 py-3">
          <h2 className="text-[14px]">Recent fees uploads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-line">
                {["Stream", "Course", "Year", "Rows in DB", "Last updated"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-ink"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uploadsLogQuery.data?.data.map((u) => (
                <tr
                  key={`${u._id.stream}-${u._id.course}-${u._id.year}`}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-4 py-2.5 text-[12px] font-bold text-navy">{u._id.stream}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u._id.course}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u._id.year}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{u.count}</td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-ink">
                    {new Date(u.lastUpdated).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {uploadsLogQuery.data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-muted-ink">
                    No fees data uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function OrdersView() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () =>
      adminApi.orders(statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 }),
  });

  type OrderRow = {
    _id: string;
    user?: { name: string; email: string };
    stream: string;
    course: string;
    category: string;
    branches: string[];
    amount: number;
    status: string;
    createdAt: string;
  };

  const rows = ((ordersQuery.data?.data ?? []) as OrderRow[]).filter((o) =>
    `${o._id} ${o.user?.email ?? ""} ${o.stream} ${o.course} ${o.category}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <>
      <h1 className="text-xl">Orders & Payments</h1>
      <p className="mt-1 text-[12px] text-muted-ink">All transactions across streams.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Search order ID, email, stream, course…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          className="w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Created</option>
          <option value="failed">Failed</option>
        </Select>
      </div>

      <Panel className="mt-4 p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b-[1.5px] border-line">
                {[
                  "Order ID",
                  "Student",
                  "Stream",
                  "Course",
                  "Category",
                  "Branches",
                  "Amount",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-ink"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-[12px] font-bold text-navy">{o._id.slice(-8)}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{o.user?.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{o.stream}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{o.course}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{o.category}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink">{o.branches.join(", ")}</td>
                  <td className="px-4 py-2.5 text-[12px] font-bold text-ink">
                    ₹{(o.amount / 100).toFixed(0)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-ink">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-muted-ink">
                    {ordersQuery.isLoading ? "Loading…" : "No orders match that search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <>
      <h1 className="text-xl">{label}</h1>
      <Panel className="mt-5 py-12 text-center">
        <p className="text-[13px] font-bold text-navy">{label} module</p>
        <p className="mt-1 text-[12px] text-muted-ink">
          Not built yet — planned for a future update.
        </p>
      </Panel>
    </>
  );
}
