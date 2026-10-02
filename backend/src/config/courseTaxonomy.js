/**
 * The real State CET Cell admission portal isn't "3 exam types" — it's
 * 6 streams, each containing 10-20 independent courses, and EACH course is
 * its own separate CAP process with its own colleges, categories, and
 * cutoffs. This file is the single source of truth for that taxonomy.
 *
 * Used by:
 *  - Admin upload form (dropdown + validation — rejects a course name
 *    that isn't in this list, catching typos before bad data hits the DB)
 *  - Frontend Select wizard (Stream → Course → Category → Branch)
 *  - Seed/migration scripts
 *
 * `hasBranches: true` means the course has sub-specializations/branches
 * (e.g. B.E/B.Tech → Computer, Mechanical, etc.). `false` means the
 * "branch" is really just the course itself (e.g. NEET-UG → MBBS/BDS is
 * handled as a category-level split, not a branch split — see note below).
 */

const TAXONOMY = {
  "Technical Education": {
    "Post Graduate": [
      { course: "MBA/MMS", hasBranches: true },
      { course: "MCA", hasBranches: false },
      { course: "M.E/M.Tech", hasBranches: true },
      { course: "M.E/M.Tech (Working Professionals)", hasBranches: true },
      { course: "M.Architecture", hasBranches: false },
      { course: "M.HMCT", hasBranches: false },
      { course: "M.Pharmacy/Pharm D (Post Baccalaureate)", hasBranches: true },
      { course: "MCA Second Year (Lateral Entry)", hasBranches: false },
      { course: "MCA (Working Professionals)", hasBranches: false },
      { course: "MBA Second Year (Lateral Entry)", hasBranches: true },
      { course: "MBA/MMS (Working Professionals)", hasBranches: true },
    ],
    "Under Graduate": [
      { course: "B.E/B.Tech", hasBranches: true },
      { course: "BCA/MCA (Integrated)", hasBranches: false },
      { course: "BBA/BMS/BBM/MBA (Integrated)", hasBranches: false },
      { course: "B.Pharmacy/Pharm D", hasBranches: false },
      { course: "B.Architecture", hasBranches: false },
      { course: "B.HMCT/M.HMCT (Integrated)", hasBranches: false },
      { course: "Direct Second Year Engineering (DSE)", hasBranches: true },
      { course: "Direct Second Year Engineering (DSE) (Working Professional)", hasBranches: true },
      { course: "Direct Second Year Pharmacy (DSP)", hasBranches: false },
      { course: "B.Planning", hasBranches: false },
      { course: "B.Design", hasBranches: false },
      { course: "Direct Second Year Degree in HMCT", hasBranches: false },
      { course: "B.Pharmacy (Practice)", hasBranches: false },
      { course: "Direct Third-Year Degree in Engineering", hasBranches: true },
      { course: "Direct Final-Year Degree in Engineering", hasBranches: true },
    ],
  },

  "Higher Education": {
    "Post Graduate": [
      { course: "M.Ed.", hasBranches: false },
      { course: "M.P.Ed.", hasBranches: false },
      { course: "B.Ed.M.Ed. Integrated", hasBranches: false },
    ],
    "Under Graduate": [
      { course: "L.L.B.-5 Years (Integrated)", hasBranches: false },
      { course: "L.L.B.-3 Years", hasBranches: false },
      { course: "B.Ed", hasBranches: false },
      { course: "B.P.Ed", hasBranches: false },
    ],
  },

  "Medical Education": {
    "Post Graduate": [
      { course: "NEET-PGM", hasBranches: true }, // branches = MD/MS specializations
      { course: "PG DNB", hasBranches: true },
      { course: "NEET-PGD", hasBranches: true },
      { course: "PGP/PGO/PGASLP/M.Sc-(P&O)", hasBranches: false },
    ],
    "Under Graduate": [
      { course: "NEET-UG", hasBranches: false }, // MBBS/BDS handled as separate category, not branch
      { course: "B.Sc. Nursing", hasBranches: false },
      { course: "GNM", hasBranches: false },
      { course: "DPN-PHN", hasBranches: false },
      { course: "AIQ (15%) For AYUSH Courses", hasBranches: false },
    ],
  },

  "Ayush Education": {
    "Post Graduate": [
      { course: "AIAPGET (PGA/PGH/PGU) (State Quota)", hasBranches: true },
      { course: "AIAPGET (PGA/PGH/PGU) (AIQ 15% Quota)", hasBranches: true },
    ],
  },

  "Agriculture Education": {
    "Under Graduate": [
      { course: "Agriculture & Allied Courses", hasBranches: true },
      { course: "B.F.Sc. (Fishery Science)", hasBranches: false },
      { course: "B.Sc. (Hons) Agriculture", hasBranches: false },
      { course: "B.Sc. (Hons) Horticulture", hasBranches: false },
      { course: "B.Sc. (Hons) Community Science", hasBranches: false },
      { course: "B.Sc. (Hons) Agri-Business Management", hasBranches: false },
      { course: "B.Sc. (Hons) Forestry", hasBranches: false },
      { course: "B.Tech. (Agricultural Engineering)", hasBranches: false },
      { course: "B.Tech. (Food Technology)", hasBranches: false },
      { course: "B.Tech. (Biotechnology)", hasBranches: false },
      { course: "Direct Second Year of Bachelor of Science (Agriculture)", hasBranches: false },
    ],
  },

  "Fine Art Education": {
    "Under Graduate": [{ course: "Fine Art", hasBranches: false }],
  },
};

// ---------- Helpers ----------

function getStreams() {
  return Object.keys(TAXONOMY);
}

function getLevels(stream) {
  return Object.keys(TAXONOMY[stream] || {});
}

function getCourses(stream, level) {
  if (level) return (TAXONOMY[stream]?.[level] || []).map((c) => c.course);
  // no level given — flatten across PG + UG for that stream
  return Object.values(TAXONOMY[stream] || {})
    .flat()
    .map((c) => c.course);
}

function isValidCourse(stream, course) {
  return getCourses(stream).includes(course);
}

function courseHasBranches(stream, course) {
  const all = Object.values(TAXONOMY[stream] || {}).flat();
  return all.find((c) => c.course === course)?.hasBranches ?? true;
}

module.exports = { TAXONOMY, getStreams, getLevels, getCourses, isValidCourse, courseHasBranches };
