import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Footer } from "@/components/Footer";
import { Button, Card, Input, Label, Logo } from "@/components/ui/kit";
import { Watermark } from "@/components/Watermark";
import { ApiError, authApi, clearToken, getToken, ordersApi, setToken } from "@/lib/api";
import { useContentProtection } from "@/lib/useContentProtection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search["orderId"] === "string" ? (search["orderId"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Cutoff Sheet — CutoffSaathi Result Dashboard" },
      {
        name: "description",
        content:
          "Your personalised Maharashtra CET cutoff sheet: branch-wise panels sorted high to low, with round trends — viewable online only, from your own logged-in account.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your Cutoff Sheet — CutoffSaathi" },
      {
        property: "og:description",
        content: "Branch-wise CET cutoffs sorted high to low with round-over-round trends.",
      },
    ],
  }),
  component: Dashboard,
});

const ROUNDS = ["CAP1", "CAP2", "CAP3"];

function Dashboard() {
  const { orderId } = Route.useSearch();
  const [round, setRound] = useState("CAP1");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [active, setActive] = useState<string[] | null>(null); // null = "all branches"
  const [loggedIn, setLoggedIn] = useState(!!getToken());

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: loggedIn,
    retry: false,
  });

  const resultQuery = useQuery({
    queryKey: ["order-result", orderId],
    queryFn: () => ordersApi.getResult(orderId!),
    enabled: !!orderId && loggedIn,
    retry: false,
  });

  const branchesData = resultQuery.data?.data.branches ?? [];
  const activeBranches = active ?? branchesData.map((b) => b.branch_name);

  const toggle = (b: string) =>
    setActive((cur) => {
      const base = cur ?? branchesData.map((x) => x.branch_name);
      return base.includes(b) ? base.filter((x) => x !== b) : [...base, b];
    });

  const streamLabel = resultQuery.data?.data.stream ?? "—";
  const courseLabel = resultQuery.data?.data.course ?? "—";
  const categoryLabel = resultQuery.data?.data.category ?? "—";

  const redirectTarget = orderId ? `/dashboard?orderId=${orderId}` : "/dashboard";

  if (!orderId) {
    return (
      <EmptyState
        title="No order selected"
        message="Start from the selector to build and pay for a cutoff sheet."
      />
    );
  }

  // Not logged in at all — no point calling the API, go straight to the gate.
  if (!loggedIn) {
    return <LoginGate redirectTarget={redirectTarget} onLoggedIn={() => setLoggedIn(true)} />;
  }

  // Token exists but is invalid/expired — the API told us so.
  const meFailed = meQuery.isError;
  const resultUnauthorized =
    resultQuery.isError &&
    resultQuery.error instanceof ApiError &&
    resultQuery.error.status === 401;
  if (meFailed || resultUnauthorized) {
    clearToken();
    return <LoginGate redirectTarget={redirectTarget} onLoggedIn={() => setLoggedIn(true)} />;
  }

  if (resultQuery.isLoading || meQuery.isLoading) {
    return <EmptyState title="Loading your sheet…" message="This only takes a moment." />;
  }

  if (resultQuery.isError) {
    const status = resultQuery.error instanceof ApiError ? resultQuery.error.status : undefined;
    if (status === 402) {
      return (
        <EmptyState
          title="Payment not confirmed yet"
          message="If you just paid, this can take a few seconds. Refresh in a moment, or contact support with your order ID if it persists."
        />
      );
    }
    if (status === 403) {
      return (
        <EmptyState
          title="This sheet belongs to a different account"
          message="You're logged in, but this order was purchased from another account. Log in with that account to view it."
        />
      );
    }
    return (
      <EmptyState
        title="Couldn't load this sheet"
        message={resultQuery.error.message ?? "Please try again."}
      />
    );
  }

  const viewerEmail = meQuery.data?.data.user.email ?? "unknown";

  return (
    <ProtectedResultView
      orderId={orderId}
      viewerEmail={viewerEmail}
      streamLabel={streamLabel}
      courseLabel={courseLabel}
      categoryLabel={categoryLabel}
      year={resultQuery.data?.data.year}
      round={round}
      setRound={setRound}
      sort={sort}
      setSort={setSort}
      branchesData={branchesData}
      activeBranches={activeBranches}
      toggle={toggle}
    />
  );
}

function ProtectedResultView(props: {
  orderId: string;
  viewerEmail: string;
  streamLabel: string;
  courseLabel: string;
  categoryLabel: string;
  year: number | undefined;
  round: string;
  setRound: (r: string) => void;
  sort: "desc" | "asc";
  setSort: (s: "desc" | "asc") => void;
  branchesData: BranchGroup[];
  activeBranches: string[];
  toggle: (b: string) => void;
}) {
  const {
    orderId,
    viewerEmail,
    streamLabel,
    courseLabel,
    categoryLabel,
    year,
    round,
    setRound,
    sort,
    setSort,
    branchesData,
    activeBranches,
    toggle,
  } = props;

  const contentRef = useRef<HTMLDivElement>(null);
  const { blurred } = useContentProtection(contentRef);

  return (
    <div
      ref={contentRef}
      className={cn(
        "relative flex min-h-screen flex-col bg-paper transition-[filter]",
        blurred && "blur-xl",
      )}
      style={{ userSelect: "none" }}
    >
      {/* Printing this page is blocked outright — see useContentProtection.ts
          and Watermark.tsx for what is and isn't actually enforceable here. */}
      <style>{`@media print { #protected-sheet-root { display: none !important; } }`}</style>
      <div id="protected-sheet-root">
        <Watermark email={viewerEmail} orderId={orderId} />

        <header className="bg-navy-deep">
          <div className="container-page flex h-16 items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/select"
                className="text-[13px] font-semibold text-white/65 hover:text-white"
              >
                New search
              </Link>
              <span className="hidden text-[12px] text-white/45 sm:inline">{viewerEmail}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1160px] flex-1 flex-col gap-6 px-5 py-6 lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 rounded-2xl border-[1.5px] border-line bg-card p-5 lg:sticky lg:top-6 lg:h-fit lg:w-[250px]">
            <FilterBlock title="Your filters">
              <dl className="space-y-2">
                {[
                  ["Stream", streamLabel],
                  ["Course", courseLabel],
                  ["Category", categoryLabel],
                  ["Year", String(year ?? "—")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <dt className="text-muted-ink">{k}</dt>
                    <dd className="font-bold text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
            </FilterBlock>

            <FilterBlock title="Branches">
              <ul className="space-y-2">
                {branchesData.map((b) => (
                  <li key={b.branch_name}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={activeBranches.includes(b.branch_name)}
                        onChange={() => toggle(b.branch_name)}
                        className="h-4 w-4 accent-[#142850]"
                      />
                      {b.branch_name}
                    </label>
                  </li>
                ))}
              </ul>
            </FilterBlock>

            <FilterBlock title="View" last>
              <p className="mb-1.5 text-[12px] text-muted-ink">Round</p>
              <div className="mb-4 flex gap-1.5">
                {ROUNDS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRound(r)}
                    className={cn(
                      "flex-1 rounded-lg border-[1.5px] py-1.5 text-[12px] font-bold transition-colors",
                      round === r
                        ? "border-navy bg-navy text-white"
                        : "border-line bg-card text-muted-ink",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mb-1.5 text-[12px] text-muted-ink">Sort order</p>
              <button
                onClick={() => setSort(sort === "desc" ? "asc" : "desc")}
                className="w-full rounded-lg border-[1.5px] border-line py-2 text-[12px] font-bold text-navy"
              >
                {sort === "desc" ? "High → Low" : "Low → High"}
              </button>
            </FilterBlock>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl">Your Cutoff Sheet</h1>
                <p className="mt-1 text-[13px] text-muted-ink">
                  {courseLabel} · {categoryLabel} · {activeBranches.length} branch
                  {activeBranches.length === 1 ? "" : "es"} · {round}
                </p>
              </div>
              <div className="rounded-xl bg-navy-deep px-3.5 py-2 text-[11px] font-semibold text-white/70">
                🔒 View-only · signed in as {viewerEmail}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {branchesData
                .filter((panel) => activeBranches.includes(panel.branch_name))
                .map((panel) => (
                  <BranchPanel key={panel.branch_name} panel={panel} round={round} sort={sort} />
                ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  t: "Round trend included",
                  d: "Every row shows how the closing cutoff moved from the previous CAP round.",
                },
                {
                  t: "Set an alert",
                  d: "Get a WhatsApp ping the moment CAP2 data lands for these branches.",
                },
                {
                  t: "Compare mode",
                  d: "Put up to three of these colleges side by side. Coming soon.",
                },
              ].map((c) => (
                <Card key={c.t} className="p-5">
                  <h3 className="text-[14px]">{c.t}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">{c.d}</p>
                </Card>
              ))}
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
}

type BranchGroup = {
  branch_name: string;
  colleges: {
    college_name: string;
    college_code?: string;
    rounds: Record<string, { percentile?: number; rank?: number }>;
    fees_amount?: number;
    fees_unit?: "per_year" | "total_course";
  }[];
};

function formatFees(amount?: number, unit?: "per_year" | "total_course") {
  if (amount === undefined || amount === null) return null;
  const formatted = `₹${amount.toLocaleString("en-IN")}`;
  return unit === "total_course" ? `${formatted} total` : `${formatted}/yr`;
}

function BranchPanel({
  panel,
  round,
  sort,
}: {
  panel: BranchGroup;
  round: string;
  sort: "desc" | "asc";
}) {
  const rows = useMemo(() => {
    const withPct = panel.colleges.map((c) => ({
      ...c,
      percentile: c.rounds[round]?.percentile ?? 0,
    }));
    return [...withPct].sort((a, b) =>
      sort === "desc" ? b.percentile - a.percentile : a.percentile - b.percentile,
    );
  }, [panel, round, sort]);

  const max = Math.max(...rows.map((r) => r.percentile), 1);

  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-line bg-paper px-5 py-3.5">
        <h2 className="text-[15px]">{panel.branch_name}</h2>
        <span className="text-[12px] font-semibold text-muted-ink">
          {round} · sorted {sort === "desc" ? "high → low" : "low → high"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-line">
              {["College", "Round trend", "Percentile", "Value"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-ink"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cap1 = r.rounds["CAP1"]?.percentile;
              const trendLabel =
                round !== "CAP1" && cap1 !== undefined && r.percentile !== undefined
                  ? r.percentile === cap1
                    ? "Stable"
                    : `${r.percentile > cap1 ? "↑" : "↓"}${Math.abs(r.percentile - cap1).toFixed(1)} vs CAP1`
                  : "Stable";
              return (
                <tr
                  key={r.college_code ?? r.college_name}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-5 py-3">
                    <span className="block text-[13px] font-bold text-navy">{r.college_name}</span>
                    {formatFees(r.fees_amount, r.fees_unit) && (
                      <span className="mt-0.5 block text-[11px] font-semibold text-muted-ink">
                        {formatFees(r.fees_amount, r.fees_unit)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block rounded-full bg-success-light px-2.5 py-1 text-[11px] font-bold text-success">
                      {trendLabel}
                    </span>
                  </td>
                  <td className="w-[38%] px-5 py-3">
                    <span className="block h-2 w-full overflow-hidden rounded-full bg-paper-alt">
                      <span
                        className="block h-full rounded-full bg-saffron"
                        style={{ width: `${(r.percentile / max) * 100}%` }}
                      />
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-extrabold text-navy">
                    {r.percentile ? r.percentile.toFixed(2) : "—"}
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

function LoginGate({
  redirectTarget,
  onLoggedIn,
}: {
  redirectTarget: string;
  onLoggedIn: () => void;
}) {
  const [form, setForm] = useState({ id: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-12">
      <Card className="w-full max-w-[400px]">
        <div className="flex justify-center">
          <Logo light={false} />
        </div>
        <h1 className="mt-6 text-center text-xl">Log in to view your sheet</h1>
        <p className="mt-2 text-center text-[12.5px] text-muted-ink">
          Your cutoff sheet is only ever viewable from the account that paid for it.
        </p>
        <form
          className="mt-6 space-y-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              const res = await authApi.login({ email: form.id, password: form.password });
              setToken(res.token);
              onLoggedIn();
            } catch (err) {
              setError((err as Error).message ?? "Login failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <Label htmlFor="dg-email">Email</Label>
            <Input
              id="dg-email"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="dg-pw">Password</Label>
            <Input
              id="dg-pw"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        {error && (
          <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-center text-[12px] font-semibold text-danger">
            {error}
          </p>
        )}
        <p className="mt-5 text-center text-[13px] text-muted-ink">
          New here?{" "}
          <Link
            to="/signup"
            search={{ redirect: redirectTarget }}
            className="font-bold text-saffron-dark hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 text-center">
      <Logo light={false} />
      <h1 className="mt-6 text-xl text-navy">{title}</h1>
      <p className="mt-2 max-w-sm text-[13px] text-muted-ink">{message}</p>
      <Link to="/select" className="mt-6">
        <Button>Go to selector</Button>
      </Link>
    </div>
  );
}

function FilterBlock({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("pb-4", !last && "mb-4 border-b border-line")}>
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-ink">
        {title}
      </h3>
      {children}
    </div>
  );
}
