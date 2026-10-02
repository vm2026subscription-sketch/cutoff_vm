import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/ui/kit";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/how-it-works" as const },
      { label: "Pricing & FAQ", to: "/pricing" as const },
      { label: "Sample sheet", to: "/dashboard" as const },
      { label: "Start a sheet", to: "/select" as const },
    ],
  },
  {
    title: "Exams",
    links: [
      { label: "Engineering (MHT-CET)", to: "/select" as const },
      { label: "Medical (NEET UG)", to: "/select" as const },
      { label: "Diploma", to: "/select" as const },
      { label: "CAP round dates", to: "/how-it-works" as const },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Log in", to: "/login" as const },
      { label: "Create account", to: "/signup" as const },
      { label: "Refund policy", to: "/pricing" as const },
      { label: "Contact", to: "/pricing" as const },
    ],
  },
];

export function Footer({ minimal = false }: { minimal?: boolean }) {
  if (minimal) {
    return (
      <footer className="bg-navy-deep py-6">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-[12px] text-white/50 sm:flex-row">
          <span>© 2026 CutoffSaathi. Not affiliated with any government body.</span>
          <span>Payments verified server-side.</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-navy-deep pt-12">
      <div className="container-page grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/55">
            Personalised CAP cutoff sheets for Maharashtra Engineering, Medical and Diploma
            admissions — filtered by your caste category and your branches, sorted and ready.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-saffron">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[13px] text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container-page flex flex-col justify-between gap-2 text-[12px] text-white/45 sm:flex-row">
          <span>© 2026 CutoffSaathi. All rights reserved.</span>
          <span>An independent tool. Always verify with official CAP documents.</span>
        </div>
      </div>
    </footer>
  );
}
