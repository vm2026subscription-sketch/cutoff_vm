import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SlimNavbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button, Card } from "@/components/ui/kit";
import { ApiError, getToken, ordersApi, type CreateOrderResponse } from "@/lib/api";
import { loadSelection, type Selection } from "@/lib/selection";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Unlock Your ₹99 Cutoff Sheet | CutoffSaathi" },
      {
        name: "description",
        content:
          "Review your exam, category and branch selection and pay ₹99 by UPI, card or netbanking to unlock your Maharashtra CAP cutoff sheet.",
      },
      { property: "og:title", content: "Checkout — CutoffSaathi" },
      { property: "og:description", content: "Pay ₹99 securely and unlock your cutoff sheet." },
    ],
  }),
  component: CheckoutPage,
});

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "ready" | "paying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load the selection made on /select, and create the backend order + Razorpay order.
  useEffect(() => {
    const sel = loadSelection();
    if (!sel) {
      navigate({ to: "/select" });
      return;
    }
    if (!getToken()) {
      navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }
    setSelection(sel);
    setStatus("creating");

    ordersApi
      .create({
        stream: sel.stream,
        course: sel.course,
        category: sel.category,
        branches: sel.branches,
        year: sel.year,
      })
      .then((res) => {
        setOrder(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate({ to: "/login", search: { redirect: "/checkout" } });
          return;
        }
        setErrorMsg(err.message ?? "Could not create your order. Please try again.");
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async () => {
    if (!order) return;
    setStatus("paying");
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg("Could not load the payment gateway. Check your connection and try again.");
      setStatus("error");
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "CutoffSaathi",
      description: "Cutoff sheet — one-time",
      order_id: order.razorpayOrderId,
      theme: { color: "#142850" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await ordersApi.verify(response);
          navigate({ to: "/dashboard", search: { orderId: order.orderId } });
        } catch (err) {
          setErrorMsg(
            (err as Error).message ??
              "Payment succeeded but verification failed. Contact support with your payment ID.",
          );
          setStatus("error");
        }
      },
      modal: {
        ondismiss: () => setStatus("ready"),
      },
    });
    rzp.open();
  };

  const streamLabel = selection?.stream ?? "—";
  const courseLabel = selection?.course ?? "—";
  const branchesLabel = selection?.branches.join(", ") ?? "—";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SlimNavbar
        right={
          <Link to="/select">
            <Button variant="outline-light">← Edit selection</Button>
          </Link>
        }
      />

      <main className="flex-1 py-10">
        <div className="mx-auto grid w-full max-w-[920px] gap-6 px-5 lg:grid-cols-2">
          <Card>
            <h1 className="text-xl">Order summary</h1>
            <dl className="mt-5 space-y-3.5">
              {[
                ["Stream", streamLabel],
                ["Course", courseLabel],
                ["Category", selection?.category ?? "—"],
                ["Branches", branchesLabel],
                ["Rounds", "CAP 1–3, auto-updating"],
                ["Year", String(selection?.year ?? "—")],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <dt className="text-[13px] text-muted-ink">{k}</dt>
                  <dd className="text-right text-[13px] font-bold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center justify-between border-t-[1.5px] border-line pt-5">
              <span className="text-[14px] font-bold text-navy">Total payable</span>
              <span className="text-4xl font-extrabold text-saffron-dark">
                {order ? `₹${(order.amount / 100).toFixed(0)}` : "₹99"}
              </span>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-ink">
              One-time payment. Viewable anytime from your account dashboard, with round updates for
              the rest of this admission season.
            </p>
          </Card>

          <Card>
            <h2 className="text-xl">Pay to unlock</h2>

            {status === "creating" && (
              <p className="mt-5 text-[13px] text-muted-ink">Setting up your order…</p>
            )}

            {status === "error" && (
              <p className="mt-5 rounded-xl bg-danger/10 px-3.5 py-3 text-[12px] font-semibold text-danger">
                {errorMsg}
              </p>
            )}

            {(status === "ready" || status === "paying") && (
              <>
                <p className="mt-5 text-[13px] text-muted-ink">
                  You'll be taken to Razorpay's secure checkout — UPI, card, and netbanking are all
                  supported there.
                </p>
                <Button
                  fullWidth
                  className="mt-5 py-3 text-[14px]"
                  onClick={handlePay}
                  disabled={status === "paying"}
                >
                  {status === "paying" ? "Opening payment window…" : "Pay & unlock sheet"}
                </Button>
              </>
            )}

            <p className="mt-4 rounded-xl bg-success-light px-3.5 py-3 text-[12px] leading-relaxed text-success">
              🔒 Every payment is verified server-side before your sheet unlocks. We never store
              card or UPI credentials.
            </p>
          </Card>
        </div>
      </main>

      <Footer minimal />
    </div>
  );
}
