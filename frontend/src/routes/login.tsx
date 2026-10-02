import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Input, Label, Logo } from "@/components/ui/kit";
import { ApiError, authApi, setToken } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Log In — CutoffSaathi" },
      {
        name: "description",
        content:
          "Log in to CutoffSaathi to access your saved Maharashtra CAP cutoff sheets and round alerts.",
      },
      { property: "og:title", content: "Log In — CutoffSaathi" },
      { property: "og:description", content: "Access your saved cutoff sheets and round alerts." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [form, setForm] = useState({ id: "", password: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-12">
      <Card className="w-full max-w-[420px] shadow-lift">
        <div className="flex justify-center">
          <Link to="/">
            <Logo light={false} />
          </Link>
        </div>

        <h1 className="mt-7 text-center text-2xl">Welcome back</h1>
        <p className="mt-2 text-center text-[13px] text-muted-ink">
          Log in to see your saved sheets and alerts.
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.id || !form.password) {
              setStatus({ type: "error", text: "Please fill in both fields." });
              return;
            }
            setLoading(true);
            setStatus(null);
            try {
              const res = await authApi.login({ email: form.id, password: form.password });
              setToken(res.token);
              setStatus({ type: "success", text: `Welcome back, ${res.data.user.name}!` });
              setTimeout(() => navigate({ to: redirect || "/" }), 600);
            } catch (err) {
              if (err instanceof ApiError && err.status === 403) {
                setStatus({ type: "error", text: "Please verify your email first." });
                setTimeout(() => navigate({ to: "/verify-otp", search: { email: form.id } }), 900);
                return;
              }
              setStatus({ type: "error", text: (err as Error).message ?? "Login failed." });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <Label htmlFor="id">Email or phone</Label>
            <Input
              id="id"
              placeholder="you@example.com"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-[12px] font-semibold text-muted-ink hover:text-navy"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth className="py-3 text-[14px]" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>

        {status ? (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-center text-[12px] font-semibold ${
              status.type === "success"
                ? "bg-success-light text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {status.text}
          </p>
        ) : null}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] text-muted-ink">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="ghost" fullWidth className="py-3 text-[13px]">
          <span className="text-[14px]">G</span> Continue with Google
        </Button>

        <p className="mt-6 text-center text-[13px] text-muted-ink">
          New here?{" "}
          <Link to="/signup" className="font-bold text-saffron-dark hover:underline">
            Create an account
          </Link>
        </p>

        <p className="mt-5 rounded-xl border border-line bg-paper px-3.5 py-3 text-[12px] leading-relaxed text-muted-ink">
          An account is required to buy and view a cutoff sheet — this keeps your paid sheet private
          to you, viewable only after you're logged in.
        </p>
      </Card>
    </div>
  );
}
