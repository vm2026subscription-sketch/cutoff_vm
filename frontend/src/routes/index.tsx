import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge, Button, Card, Chip, SectionHead } from "@/components/ui/kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CutoffSaathi — Maharashtra CAP Cutoff Sheets by Category & Branch" },
      {
        name: "description",
        content:
          "Get a personalised Maharashtra CAP cutoff sheet for Engineering, Medical and Diploma admissions — filtered by your caste category and branches, sorted, for ₹99.",
      },
      { property: "og:title", content: "CutoffSaathi — Your exact cutoff, in one sheet" },
      {
        property: "og:description",
        content:
          "Round-wise CAP cutoffs filtered by caste category and branch for 620+ Maharashtra colleges.",
      },
    ],
  }),
  component: Home,
});

const STATS = [
  { value: "620+", label: "Colleges covered" },
  { value: "3", label: "Exam streams" },
  { value: "CAP 1–3", label: "Rounds included" },
];

const STEPS = [
  {
    n: 1,
    title: "Pick category & branches",
    desc: "Choose your exam stream, your caste category and up to three branches you actually care about.",
  },
  {
    n: 2,
    title: "Pay ₹99",
    desc: "One-time payment via UPI, card or netbanking. No subscription, no account needed to buy.",
  },
  {
    n: 3,
    title: "Get your sorted sheet",
    desc: "A clean, round-wise sheet sorted highest to lowest — download as PDF or Excel instantly.",
  },
];

const COMPARISON = [
  "Filtered to your category",
  "Sorted by cutoff",
  "Round-wise trend",
  "Only your branches",
  "Downloadable Excel",
];

const FEATURES = [
  {
    icon: "📈",
    title: "Round-wise trend",
    desc: "See how each college's cutoff moved between CAP1, CAP2 and CAP3.",
  },
  {
    icon: "⚖️",
    title: "College Compare",
    desc: "Put two or three colleges side by side on cutoff, fees and placement.",
    tag: "Coming soon",
  },
  {
    icon: "🎯",
    title: "Rank / Percentile Predictor",
    desc: "Estimate your likely allotment from your score before CAP opens.",
    tag: "Coming soon",
  },
  {
    icon: "📍",
    title: "Distance filter",
    desc: "Restrict the sheet to colleges within a chosen radius of your home city.",
  },
  {
    icon: "💬",
    title: "WhatsApp alerts",
    desc: "Get a ping the moment a new round's official data is published and cleaned.",
  },
  {
    icon: "🗂️",
    title: "3-year historical trend",
    desc: "Compare 2024, 2025 and 2026 closing cutoffs for the same seat type.",
  },
];

const TESTIMONIALS = [
  {
    initials: "SP",
    name: "Sanika Patil",
    place: "Kolhapur",
    quote:
      "The official PDF was 700 pages. This gave me 40 rows that actually applied to me. Worth every rupee.",
  },
  {
    initials: "AK",
    name: "Aditya Kulkarni",
    place: "Nashik",
    quote:
      "The CAP1 to CAP2 trend column is what made me shift my preference order. Got PICT in round 2.",
  },
  {
    initials: "RS",
    name: "Rehan Shaikh",
    place: "Aurangabad",
    quote:
      "My parents could finally read one sheet instead of scrolling a giant government file on a phone.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Comparison />
        <Features />
        <Testimonials />
        <PricingBand />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b border-line bg-paper py-14 sm:py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Badge>CAP 2026 · Round-wise data live</Badge>
          <h1 className="mt-5 text-[34px] leading-[1.1] sm:text-[46px]">
            Your exact cutoff — by <span className="text-saffron-dark">caste category</span> and{" "}
            <span className="text-saffron-dark">branch</span> — in one sheet.
          </h1>
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-muted-ink">
            Stop scrolling through hundreds of pages of official CAP allotment PDFs. Tell us your
            stream, your category and up to three branches, and get a single sorted sheet of every
            Maharashtra college you realistically stand a chance at.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/select">
              <Button className="px-6 py-3 text-[14px]">Get My Cutoff Sheet — ₹99</Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="ghost" className="px-5 py-3 text-[14px]">
                See how it works
              </Button>
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border-[1.5px] border-line bg-card px-4 py-3"
              >
                <dt className="text-2xl font-extrabold text-navy">{s.value}</dt>
                <dd className="mt-0.5 text-[12px] text-muted-ink">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DemoCard />
      </div>
    </section>
  );
}

function DemoCard() {
  const [exam, setExam] = useState("Engineering");
  const [category, setCategory] = useState("OBC");
  const [branches, setBranches] = useState<string[]>(["Computer", "IT"]);

  const toggle = (b: string) =>
    setBranches((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b].slice(0, 3)));

  return (
    <Card className="shadow-lift">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-ink">
          Live demo
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> CAP1 data loaded
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-[12px] font-bold text-navy">Exam</p>
          <div className="flex flex-wrap gap-2">
            {["Engineering", "Medical", "Diploma"].map((e) => (
              <Chip key={e} selected={exam === e} onClick={() => setExam(e)}>
                {e}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12px] font-bold text-navy">Category</p>
          <div className="flex flex-wrap gap-2">
            {["OPEN", "OBC", "SC", "EWS"].map((c) => (
              <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12px] font-bold text-navy">Branches (max 3)</p>
          <div className="flex flex-wrap gap-2">
            {["Computer", "IT", "AI & DS", "E&TC", "Mechanical"].map((b) => (
              <Chip key={b} selected={branches.includes(b)} onClick={() => toggle(b)}>
                {b}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-navy-deep p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-saffron">
          Preview · {category} · {exam}
        </p>
        <ul className="mt-3 space-y-2.5">
          {[
            { c: "COEP Technological University", p: "99.42" },
            { c: "VJTI Mumbai", p: "99.18" },
            { c: "PICT Pune", p: "98.06" },
          ].map((r) => (
            <li key={r.c} className="flex items-center justify-between gap-3">
              <span className="truncate text-[12px] text-white/80">{r.c}</span>
              <span className="shrink-0 text-[12px] font-bold text-saffron">{r.p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-white/45">
          + 37 more rows in the full sheet
        </p>
      </div>
    </Card>
  );
}

function HowItWorks() {
  return (
    <section className="py-16">
      <div className="container-page">
        <SectionHead
          eyebrow="Three steps"
          title="How it works"
          description="From confusion to a printable shortlist in under two minutes."
        />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-[13px] font-extrabold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-[16px]">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  return (
    <section className="bg-paper-alt py-16">
      <div className="container-page">
        <SectionHead
          eyebrow="Why not just the PDF"
          title="Official CAP PDF vs CutoffSaathi"
          description="The data is public. Making it usable for one specific student is the work."
        />
        <div className="mt-9 overflow-hidden rounded-2xl border-[1.5px] border-line bg-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[1.5px] border-line bg-paper">
                <th className="px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-ink">
                  Feature
                </th>
                <th className="px-5 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-muted-ink">
                  Official CAP PDF
                </th>
                <th className="px-5 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy">
                  CutoffSaathi
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-ink">{row}</td>
                  <td className="px-5 py-3.5 text-center text-[15px] font-bold text-danger">✕</td>
                  <td className="bg-success-light/60 px-5 py-3.5 text-center text-[15px] font-bold text-success">
                    ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-16">
      <div className="container-page">
        <SectionHead
          eyebrow="Beyond the sheet"
          title="Everything else you get"
          description="Built for the two weeks of CAP where every hour counts."
        />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-[16px]">
                  {f.icon}
                </span>
                {f.tag ? <Badge>{f.tag}</Badge> : null}
              </div>
              <h3 className="mt-4 text-[15px]">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="pb-16">
      <div className="container-page">
        <SectionHead eyebrow="Students" title="What they said after CAP" />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <p className="text-[13px] leading-relaxed text-ink">“{t.quote}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron-light text-[12px] font-extrabold text-saffron-dark">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-navy">{t.name}</span>
                  <span className="block text-[12px] text-muted-ink">{t.place}</span>
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingBand() {
  return (
    <section className="pb-16">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy-deep p-8 sm:p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl text-white sm:text-[28px]">
              One sheet. One price. No account required.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">
              Pay once for your stream, category and branch combination. Includes CAP 1–3 round
              data, trend column, PDF and Excel download, and free re-download for the whole
              admission season.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <span className="text-5xl font-extrabold text-saffron">₹99</span>
            <Link to="/select">
              <Button className="px-6 py-3 text-[14px]">Start my sheet</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
