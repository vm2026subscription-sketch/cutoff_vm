import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Logo } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing & FAQ" },
  { to: "/dashboard", label: "Sample sheet" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-navy-deep">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13px] font-semibold text-white/65 transition-colors hover:text-white"
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{
                className:
                  "!text-white underline decoration-saffron decoration-2 underline-offset-8",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login">
            <Button variant="outline-light">Log in</Button>
          </Link>
          <Link to="/select">
            <Button>Get my sheet — ₹99</Button>
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 text-white md:hidden"
        >
          <span className="space-y-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "block h-[2px] w-4 bg-white transition-transform",
                  open && "bg-saffron",
                )}
              />
            ))}
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-navy-deep px-5 pb-4 md:hidden">
          <nav className="flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-[13px] font-semibold text-white/70"
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "!text-saffron" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="outline-light" fullWidth>
                Log in
              </Button>
            </Link>
            <Link to="/select" className="flex-1" onClick={() => setOpen(false)}>
              <Button fullWidth>Get sheet</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SlimNavbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="bg-navy-deep">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/how-it-works"
            className="text-[13px] font-semibold text-white/65 hover:text-white"
          >
            Help
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
