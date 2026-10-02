import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge, Button, Card, SectionHead } from "@/components/ui/kit";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How CutoffSaathi Works — 5 Steps to Your CAP Cutoff Sheet" },
      {
        name: "description",
        content:
          "Choose your exam, category and up to three branches, pay ₹99 and get a sorted round-wise Maharashtra CAP cutoff sheet. Here is exactly how the data is prepared.",
      },
      { property: "og:title", content: "How CutoffSaathi Works" },
      {
        property: "og:description",
        content: "From official CAP round data to a sheet filtered for one student, in five steps.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    title: "Choose your exam type",
    desc: "Engineering (MHT-CET / JEE), Medical (NEET UG state quota) or post-SSC Diploma. Each stream has its own CAP calendar and seat matrix.",
  },
  {
    title: "Select your category",
    desc: "OPEN, OBC, SC, ST, VJ, NT1, NT2, EWS, TFWS, PWD or Defence. Cutoffs differ dramatically across categories — this is the single biggest filter.",
  },
  {
    title: "Pick up to 3 branches",
    desc: "Most students realistically apply to two or three branches. Restricting to three keeps the sheet short enough to actually act on.",
  },
  {
    title: "Pay ₹99",
    desc: "One-time payment through UPI, card or netbanking. Payment is verified server-side before the sheet unlocks.",
  },
  {
    title: "Get your sorted sheet",
    desc: "Colleges sorted highest to lowest closing percentile, with a round-wise trend column. Download as PDF or Excel, or share on WhatsApp.",
  },
];

const PIPELINE = [
  {
    title: "Official round data",
    desc: "Published CAP allotment and cutoff documents for each round are collected as soon as they go live on the state CET cell portal.",
  },
  {
    title: "Cleaned & standardised",
    desc: "College names, codes, seat types and branch names are normalised so the same institute reads identically across every round and year.",
  },
  {
    title: "Filtered for you",
    desc: "Your category and branch selection is applied, rows are sorted by closing cutoff, and the round-over-round movement is calculated.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <section className="border-b border-line py-14">
          <div className="container-page">
            <SectionHead
              eyebrow="The process"
              title="From a 700-page PDF to a sheet you can read on a phone"
              description="CutoffSaathi does not create new data. It takes the official CAP round data and does the filtering, sorting and trend maths that a student would otherwise do by hand."
            />
          </div>
        </section>

        <section className="py-14">
          <div className="container-page max-w-3xl">
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <Card className="flex gap-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-[14px] font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[16px]">{s.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-ink">{s.desc}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-paper-alt py-14">
          <div className="container-page">
            <SectionHead eyebrow="Transparency" title="Where the data comes from" />
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {PIPELINE.map((p, i) => (
                <Card key={p.title}>
                  <Badge>Stage {i + 1}</Badge>
                  <h3 className="mt-3 text-[15px]">{p.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">{p.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container-page">
            <Card className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <Badge>Data freshness</Badge>
                <h2 className="mt-3 text-2xl">Updated within 24 hours of every round</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-ink">
                  When CAP2 and CAP3 results are published, your purchased sheet updates
                  automatically for the same stream, category and branches — at no extra cost for
                  the current admission season.
                </p>
              </div>
              <Link to="/select">
                <Button className="px-6 py-3 text-[14px]">Get My Cutoff Sheet — ₹99</Button>
              </Link>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
