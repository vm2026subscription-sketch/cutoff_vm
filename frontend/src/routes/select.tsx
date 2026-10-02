import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SlimNavbar } from "@/components/Navbar";
import { Button, Card, Chip, Input, Logo } from "@/components/ui/kit";
import { BRANCH_FALLBACK, CATEGORIES, COURSES, STREAMS } from "@/lib/data";
import { metaApi, getToken, type Stream } from "@/lib/api";
import { saveSelection } from "@/lib/selection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/select")({
  head: () => ({
    meta: [
      { title: "Build Your Cutoff Sheet — CutoffSaathi" },
      {
        name: "description",
        content:
          "Pick your stream, course, caste category and up to three branches to build a personalised Maharashtra CET cutoff sheet for ₹99.",
      },
      { property: "og:title", content: "Build Your Cutoff Sheet — CutoffSaathi" },
      {
        property: "og:description",
        content: "Stream, course, category, branches — five quick steps to your sorted CET sheet.",
      },
    ],
  }),
  component: SelectPage,
});

const STEP_LABELS = ["Stream", "Course", "Category", "Branches", "Review"];

function SelectPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stream, setStream] = useState<Stream | null>(null);
  const [course, setCourse] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [branchQuery, setBranchQuery] = useState("");

  const done = [!!stream, !!course, !!category, branches.length > 0, false];
  const canContinue = [!!stream, !!course, !!category, branches.length > 0, true][step];

  // Live course/category/branch lists from the database — falls back to the
  // static taxonomy in lib/data.ts (mirrors backend/src/config/courseTaxonomy.js)
  // if the API is unreachable, so the wizard never breaks in isolated dev.
  const coursesQuery = useQuery({
    queryKey: ["courses", stream],
    queryFn: () => metaApi.courses(stream!),
    enabled: !!stream,
    staleTime: 5 * 60 * 1000,
  });
  const liveCourses = coursesQuery.data?.data;
  const courseList = useMemo(() => {
    const all =
      (liveCourses && liveCourses.length > 0 ? liveCourses : stream ? COURSES[stream] : []) ?? [];
    return all.filter((c) => c.toLowerCase().includes(courseQuery.toLowerCase()));
  }, [stream, liveCourses, courseQuery]);

  const categoriesQuery = useQuery({
    queryKey: ["categories", stream, course],
    queryFn: () => metaApi.categories(stream!, course!),
    enabled: !!stream && !!course,
    staleTime: 5 * 60 * 1000,
  });
  const liveCategories = categoriesQuery.data?.data;
  const categoryList = liveCategories && liveCategories.length > 0 ? liveCategories : CATEGORIES;

  const branchesQuery = useQuery({
    queryKey: ["branches", stream, course],
    queryFn: () => metaApi.branches(stream!, course!),
    enabled: !!stream && !!course,
    staleTime: 5 * 60 * 1000,
  });
  const liveBranches = branchesQuery.data?.data;
  const branchList = useMemo(() => {
    const all =
      liveBranches && liveBranches.length > 0
        ? liveBranches
        : (course && BRANCH_FALLBACK[course]) || (course ? [course] : []);
    return all.filter((b) => b.toLowerCase().includes(branchQuery.toLowerCase()));
  }, [course, liveBranches, branchQuery]);

  // Branchless courses (NEET-UG, MCA, ...) resolve to exactly one "branch"
  // equal to the course name itself — auto-select it so the student never
  // has to click a redundant single checkbox.
  useEffect(() => {
    const only = branchList[0];
    if (branchList.length === 1 && branches.length === 0 && only) {
      setBranches([only]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchList.length]);

  const handleProceedToCheckout = () => {
    if (!stream || !course || !category || branches.length === 0) return;
    saveSelection({
      stream,
      course,
      category,
      branches,
      year: new Date().getFullYear(),
    });
    // Login is required before payment — the paid sheet can only ever be
    // viewed by the account that bought it, so there's no such thing as a
    // guest checkout here. The selection is already saved above, so after
    // login/signup the student lands straight on checkout, not back here.
    if (!getToken()) {
      navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }
    navigate({ to: "/checkout" });
  };

  const toggleBranch = (b: string) =>
    setBranches((cur) => {
      if (cur.includes(b)) return cur.filter((x) => x !== b);
      if (cur.length >= 3) return cur;
      return [...cur, b];
    });

  return (
    <div className="min-h-screen bg-paper">
      <SlimNavbar
        right={
          <Link to="/">
            <Button variant="outline-light">Save & exit</Button>
          </Link>
        }
      />

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-5 py-6 lg:flex-row lg:gap-8 lg:py-8">
        {/* Stepper */}
        <aside className="w-full shrink-0 rounded-2xl bg-navy-deep p-5 lg:sticky lg:top-6 lg:h-fit lg:w-[270px]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
            Your sheet
          </p>
          <ol className="flex gap-2 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
            {STEP_LABELS.map((label, i) => {
              const active = step === i;
              const complete = done[i] && step > i;
              return (
                <li key={label} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-white/10" : "hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold",
                        active
                          ? "bg-saffron text-navy"
                          : complete
                            ? "bg-success text-white"
                            : "bg-white/10 text-white/40",
                      )}
                    >
                      {complete ? "✓" : i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        active || complete ? "text-white" : "text-white/45",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 hidden border-t border-white/10 pt-4 lg:block">
            <p className="text-[12px] text-white/45">Total</p>
            <p className="text-2xl font-extrabold text-saffron">₹99</p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <Card>
            {step === 0 && (
              <>
                <h1 className="text-2xl">Which stream is this for?</h1>
                <p className="mt-2 text-[13px] text-muted-ink">
                  Each stream has its own CAP calendar, colleges and seat matrix.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {STREAMS.map((s) => {
                    const sel = stream === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStream(s.id as Stream);
                          setCourse(null);
                          setCategory(null);
                          setBranches([]);
                        }}
                        className={cn(
                          "rounded-2xl border-[1.5px] p-5 text-left transition-colors",
                          sel
                            ? "border-saffron bg-saffron-light"
                            : "border-line bg-card hover:border-navy/30",
                        )}
                      >
                        <span className="text-2xl">{s.icon}</span>
                        <h3 className="mt-3 text-[15px]">{s.title}</h3>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">
                          {s.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-2xl">Which course?</h1>
                <p className="mt-2 text-[13px] text-muted-ink">
                  {stream} has {courseList.length} courses on the CET portal.
                </p>
                <div className="mt-5">
                  <Input
                    placeholder="Search courses…"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                  />
                </div>
                <ul className="mt-4 max-h-[420px] divide-y divide-line overflow-y-auto overflow-x-hidden rounded-xl border-[1.5px] border-line">
                  {courseList.map((c) => {
                    const sel = course === c;
                    return (
                      <li key={c}>
                        <button
                          onClick={() => {
                            setCourse(c);
                            setCategory(null);
                            setBranches([]);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-semibold transition-colors",
                            sel ? "bg-saffron-light text-navy" : "bg-card text-ink hover:bg-paper",
                          )}
                        >
                          {c}
                          {sel && <span className="text-saffron-dark">✓</span>}
                        </button>
                      </li>
                    );
                  })}
                  {courseList.length === 0 && (
                    <li className="px-4 py-6 text-center text-[13px] text-muted-ink">
                      No courses match that search.
                    </li>
                  )}
                </ul>
                <SummaryStrip
                  stream={stream}
                  course={course}
                  category={category}
                  branches={branches}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl">Select your category</h1>
                <p className="mt-2 text-[13px] text-muted-ink">
                  Cutoffs differ sharply across categories — this is the single biggest filter.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {categoryList.map((c) => (
                    <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
                <SummaryStrip
                  stream={stream}
                  course={course}
                  category={category}
                  branches={branches}
                />
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-2xl">Pick up to 3 branches</h1>
                <p className="mt-2 text-[13px] text-muted-ink">
                  {branchList.length === 1
                    ? "This course doesn't split by branch — it's pre-selected for you."
                    : `${branches.length} of 3 selected${branches.length === 3 ? " — deselect one to change." : "."}`}
                </p>
                {branchList.length > 1 && (
                  <div className="mt-5">
                    <Input
                      placeholder="Search branches…"
                      value={branchQuery}
                      onChange={(e) => setBranchQuery(e.target.value)}
                    />
                  </div>
                )}
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border-[1.5px] border-line">
                  {branchList.map((b) => {
                    const sel = branches.includes(b);
                    const disabled = !sel && branches.length >= 3;
                    return (
                      <li key={b}>
                        <button
                          onClick={() => toggleBranch(b)}
                          disabled={disabled}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors",
                            sel ? "bg-saffron-light" : "bg-card hover:bg-paper",
                            disabled && "cursor-not-allowed opacity-40",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] text-[11px] font-extrabold",
                              sel
                                ? "border-navy bg-navy text-white"
                                : "border-line bg-card text-transparent",
                            )}
                          >
                            ✓
                          </span>
                          <span className={cn("font-semibold", sel ? "text-navy" : "text-ink")}>
                            {b}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {branchList.length === 0 && (
                    <li className="px-4 py-6 text-center text-[13px] text-muted-ink">
                      {course ? "No branches match that search." : "Pick a course first."}
                    </li>
                  )}
                </ul>
                <SummaryStrip
                  stream={stream}
                  course={course}
                  category={category}
                  branches={branches}
                />
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-2xl">Review your selection</h1>
                <p className="mt-2 text-[13px] text-muted-ink">
                  Confirm before payment — you can go back and change anything.
                </p>
                <dl className="mt-6 overflow-hidden rounded-xl border-[1.5px] border-line">
                  {[
                    ["Stream", stream ?? "—"],
                    ["Course", course ?? "—"],
                    ["Category", category ?? "—"],
                    ["Branches", branches.length ? branches.join(", ") : "—"],
                    ["Rounds", "CAP 1, CAP 2, CAP 3 (auto-updating)"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <dt className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted-ink">
                        {k}
                      </dt>
                      <dd className="text-[13px] font-semibold text-navy sm:text-right">{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-paper px-4 py-3.5">
                    <dt className="text-[13px] font-bold text-navy">Total</dt>
                    <dd className="text-xl font-extrabold text-saffron-dark">₹99</dd>
                  </div>
                </dl>
                <Button
                  className="mt-6 py-3 text-[14px]"
                  fullWidth
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Payment
                </Button>
                {!getToken() && (
                  <p className="mt-3 text-center text-[11.5px] text-muted-ink">
                    You'll be asked to log in or create a free account first — your sheet is only
                    ever viewable from your own account, after login.
                  </p>
                )}
              </>
            )}

            <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleProceedToCheckout}>Continue to checkout</Button>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

function SummaryStrip({
  stream,
  course,
  category,
  branches,
}: {
  stream: string | null;
  course: string | null;
  category: string | null;
  branches: string[];
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-navy-deep px-4 py-3">
      {[
        ["Stream", stream ?? "Not selected"],
        ["Course", course ?? "Not selected"],
        ["Category", category ?? "Not selected"],
        ["Branches", branches.length ? `${branches.length} selected` : "None yet"],
      ].map(([k, v]) => (
        <span key={k} className="text-[12px]">
          <span className="text-white/45">{k}: </span>
          <span className="font-bold text-saffron">{v}</span>
        </span>
      ))}
    </div>
  );
}

export { Logo };
