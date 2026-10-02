import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button, Card, SectionHead } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & FAQ — CutoffSaathi Cutoff Sheets at ₹99" },
      {
        name: "description",
        content:
          "One cutoff sheet for ₹99 with CAP 1–3 round data, trend column and Excel export. Answers on data sources, refunds, payment methods and auto-updates.",
      },
      { property: "og:title", content: "CutoffSaathi Pricing & FAQ" },
      {
        property: "og:description",
        content: "₹99 per personalised CAP cutoff sheet. No subscription, free round updates.",
      },
    ],
  }),
  component: PricingPage,
});

const INCLUDED = [
  {
    title: "CAP 1–3 round data",
    desc: "Every published round for the current admission year in one sheet.",
  },
  {
    title: "Category-filtered rows",
    desc: "Only the seat types that apply to your caste category.",
  },
  { title: "Up to 3 branches", desc: "Each branch gets its own sorted panel in the sheet." },
  {
    title: "Round-wise trend column",
    desc: "See whether a college's cutoff held steady or dropped.",
  },
  {
    title: "PDF & Excel download",
    desc: "Print for your parents, or filter further in Excel yourself.",
  },
  {
    title: "Free season re-downloads",
    desc: "Come back any time until admissions close — no re-payment.",
  },
];

const FAQS = [
  {
    q: "Is this an official government website?",
    a: "No. CutoffSaathi is an independent tool built by students. We are not affiliated with the State CET Cell, DTE Maharashtra or any government body. Always confirm final decisions against the official CAP documents.",
  },
  {
    q: "Where does the data come from?",
    a: "Every row originates from officially published CAP allotment and cutoff documents. We clean and standardise college names, seat types and branch codes so the same institute reads consistently across rounds and years — but we never invent or estimate a cutoff.",
  },
  {
    q: "What if I want a 4th branch?",
    a: "A single sheet covers up to three branches, which keeps it short enough to act on. If you need more, buy a second sheet for ₹99 with your remaining branches — the same category and exam filters apply.",
  },
  {
    q: "Does it auto-update for CAP2 and CAP3?",
    a: "Yes. Once you have bought a sheet for a given exam, category and branch set, it refreshes within 24 hours of each new round being published, for the whole current admission season, at no extra cost.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI (GPay, PhonePe, Paytm, any UPI app), debit and credit cards, and netbanking. Payment is verified server-side before your sheet unlocks, so a failed or pending transaction never charges you for an unlocked sheet.",
  },
  {
    q: "What is your refund policy?",
    a: "If your sheet fails to generate, or the data for your chosen combination has not been published yet, you get a full refund to the original payment method within 5–7 working days. Write to us with your order ID.",
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <section className="py-14">
          <div className="container-page">
            <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-navy-deep p-8 sm:p-10 lg:flex-row">
              <div className="max-w-xl">
                <h1 className="text-[30px] text-white sm:text-[36px]">
                  One personalised cutoff sheet
                </h1>
                <p className="mt-3 text-[13px] leading-relaxed text-white/60">
                  No subscription. No account required to buy. Pay once for your exam, category and
                  branch combination and keep it for the full admission season.
                </p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {INCLUDED.map((i) => (
                    <li key={i.title} className="flex items-start gap-2 text-[13px] text-white/75">
                      <span className="mt-0.5 text-success">✓</span>
                      {i.title}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/50">
                  Single sheet
                </span>
                <span className="text-6xl font-extrabold text-saffron">₹99</span>
                <Link to="/select">
                  <Button className="px-6 py-3 text-[14px]">Get My Cutoff Sheet</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14">
          <div className="container-page">
            <SectionHead eyebrow="Included" title="What's inside every sheet" />
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED.map((f) => (
                <Card key={f.title}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-success-light text-[14px] font-extrabold text-success">
                    ✓
                  </span>
                  <h3 className="mt-4 text-[15px]">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper-alt py-14">
          <div className="container-page max-w-3xl">
            <SectionHead eyebrow="FAQ" title="Questions students actually ask" />
            <div className="mt-8">
              <Accordion />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Accordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-card shadow-soft"
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-[14px] font-bold text-navy">{f.q}</span>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-saffron-light text-[14px] font-extrabold text-saffron-dark transition-transform duration-200",
                  isOpen && "rotate-45",
                )}
              >
                +
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-200",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-muted-ink">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
