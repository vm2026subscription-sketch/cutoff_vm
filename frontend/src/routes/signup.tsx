import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Input, Label, Logo, Select } from "@/components/ui/kit";
import { CATEGORIES } from "@/lib/data";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Create Your Account — CutoffSaathi" },
      {
        name: "description",
        content:
          "Create a free CutoffSaathi account to save your Maharashtra CAP cutoff sheets, pre-fill your category and get round alerts.",
      },
      { property: "og:title", content: "Create Your Account — CutoffSaathi" },
      {
        property: "og:description",
        content: "Save cutoff sheets, pre-fill your category and get CAP round alerts.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [form, setForm] = useState({ name: "", id: "", password: "", category: "" });
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

        <h1 className="mt-7 text-center text-2xl">Create your account</h1>
        <p className="mt-2 text-center text-[13px] text-muted-ink">
          Free — it only saves your sheets and preferences.
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.name || !form.id || !form.password) {
              setStatus({ type: "error", text: "Please fill in name, email/phone and password." });
              return;
            }
            setLoading(true);
            setStatus(null);
            try {
              const res = await authApi.signup(
                form.category
                  ? {
                      name: form.name,
                      email: form.id,
                      password: form.password,
                      category: form.category,
                    }
                  : { name: form.name, email: form.id, password: form.password },
              );
              setStatus({ type: "success", text: res.message ?? "Check your email for a code." });
              setTimeout(
                () =>
                  navigate({
                    to: "/verify-otp",
                    search: redirect ? { email: form.id, redirect } : { email: form.id },
                  }),
                600,
              );
            } catch (err) {
              setStatus({ type: "error", text: (err as Error).message ?? "Signup failed." });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Sanika Patil"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sid">Email or phone</Label>
            <Input
              id="sid"
              placeholder="you@example.com"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="spw">Password</Label>
            <Input
              id="spw"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cat">Category (optional)</Label>
            <Select
              id="cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select later</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-[12px] text-muted-ink">Pre-fills your future purchases.</p>
          </div>

          <Button type="submit" fullWidth className="py-3 text-[14px]" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
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

        <p className="mt-6 text-center text-[13px] text-muted-ink">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-saffron-dark hover:underline">
            Log in
          </Link>
        </p>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-ink">
          By signing up you agree to our Terms & Privacy Policy.
        </p>
      </Card>
    </div>
  );
}
