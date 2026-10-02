import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline-light" | "navy" | "green-outline" | "quiet";

export function Button({
  variant = "primary",
  className,
  fullWidth,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; fullWidth?: boolean }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-saffron text-navy hover:bg-saffron-dark hover:text-white shadow-soft",
    ghost: "bg-card text-navy border-[1.5px] border-line hover:bg-paper-alt",
    "outline-light": "bg-transparent text-white border-[1.5px] border-white/30 hover:bg-white/10",
    navy: "bg-navy text-white hover:bg-navy-mid",
    "green-outline": "bg-card text-success border-[1.5px] border-success/40 hover:bg-success-light",
    quiet: "bg-transparent text-muted-ink hover:text-navy",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] border-line bg-card p-5 sm:p-6 shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-saffron-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-saffron-dark",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border-[1.5px] px-4 py-2 text-[13px] font-semibold transition-colors",
        selected
          ? "border-navy bg-navy text-white"
          : "border-line bg-card text-ink hover:border-navy/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border-[1.5px] border-line bg-card px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted-ink/70 outline-none transition-shadow focus:border-navy focus:ring-2 focus:ring-navy/15",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-bold text-navy">
      {children}
    </label>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-xl border-[1.5px] border-line bg-card px-3.5 py-2.5 text-[13px] font-semibold text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  center,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow ? <Badge>{eyebrow}</Badge> : null}
      <h2 className="mt-3 text-2xl sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-[14px] text-muted-ink">{description}</p> : null}
    </div>
  );
}

export function Logo({ light = true, size = "md" }: { light?: boolean; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-saffron font-extrabold text-navy",
          size === "md" ? "h-8 w-8 text-[13px]" : "h-7 w-7 text-[12px]",
        )}
      >
        CS
      </span>
      <span
        className={cn(
          "text-[15px] font-extrabold tracking-tight",
          light ? "text-white" : "text-navy",
        )}
      >
        CutoffSaathi
      </span>
    </span>
  );
}
