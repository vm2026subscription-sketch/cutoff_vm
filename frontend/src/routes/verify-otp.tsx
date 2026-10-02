import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Input, Label, Logo } from "@/components/ui/kit";
import { authApi, setToken } from "@/lib/api";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): { email: string; redirect?: string } => {
    const email = typeof search["email"] === "string" ? search["email"] : "";
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    return redirect ? { email, redirect } : { email };
  },
  head: () => ({
    meta: [
      { title: "Verify Your Email — CutoffSaathi" },
      {
        name: "description",
        content: "Enter the 6-digit code sent to your email to activate your CutoffSaathi account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email: emailFromSearch, redirect } = Route.useSearch();
  const [email, setEmail] = useState(emailFromSearch);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-12">
      <Card className="w-full max-w-[420px] shadow-lift">
        <div className="flex justify-center">
          <Link to="/">
            <Logo light={false} />
          </Link>
        </div>

        <h1 className="mt-7 text-center text-2xl">Verify your email</h1>
        <p className="mt-2 text-center text-[13px] text-muted-ink">
          Enter the 6-digit code we emailed to {email || "your address"}.
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email || otp.length !== 6) {
              setStatus({ type: "error", text: "Enter your email and the 6-digit code." });
              return;
            }
            setLoading(true);
            setStatus(null);
            try {
              const res = await authApi.verifyOtp({ email, otp });
              setToken(res.token);
              setStatus({ type: "success", text: `Verified! Welcome, ${res.data.user.name}.` });
              setTimeout(() => navigate({ to: redirect || "/" }), 600);
            } catch (err) {
              setStatus({ type: "error", text: (err as Error).message ?? "Verification failed." });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <Label htmlFor="votp-email">Email</Label>
            <Input id="votp-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="votp-code">6-digit code</Label>
            <Input
              id="votp-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="tracking-[0.5em] text-center text-lg font-bold"
            />
          </div>

          <Button type="submit" fullWidth className="py-3 text-[14px]" disabled={loading}>
            {loading ? "Verifying…" : "Verify & continue"}
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
          Didn't get the code?{" "}
          <button
            type="button"
            disabled={resending || !email}
            className="font-bold text-saffron-dark hover:underline disabled:opacity-50"
            onClick={async () => {
              setResending(true);
              setStatus(null);
              try {
                await authApi.resendOtp({ email });
                setStatus({ type: "success", text: "A new code has been sent." });
              } catch (err) {
                setStatus({ type: "error", text: (err as Error).message ?? "Could not resend." });
              } finally {
                setResending(false);
              }
            }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </Card>
    </div>
  );
}
