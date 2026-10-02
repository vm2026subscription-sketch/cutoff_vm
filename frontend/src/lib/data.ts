export const CATEGORIES = [
  "OPEN",
  "OBC",
  "SC",
  "ST",
  "VJ",
  "NT1",
  "NT2",
  "EWS",
  "TFWS",
  "PWD",
  "Defence",
] as const;

// Mirrors backend/src/config/courseTaxonomy.js — the 6 streams and their
// courses, straight from the State CET Cell portal's own navigation.
// Used both for the stream-selection cards (icon/desc) and as an offline
// fallback list if the live /api/meta calls are unreachable, so the wizard
// never breaks in isolated frontend dev.
export const STREAMS = [
  {
    id: "Technical Education",
    icon: "🛠️",
    title: "Technical Education",
    desc: "Engineering, Pharmacy, Architecture, MBA, MCA and allied professional courses.",
  },
  {
    id: "Higher Education",
    icon: "📚",
    title: "Higher Education",
    desc: "Law, B.Ed/M.Ed, physical education and teacher-training courses.",
  },
  {
    id: "Medical Education",
    icon: "🩺",
    title: "Medical Education",
    desc: "NEET-based MBBS/BDS, nursing, and postgraduate medical seats.",
  },
  {
    id: "Ayush Education",
    icon: "🌿",
    title: "Ayush Education",
    desc: "Ayurveda, Homeopathy and Unani postgraduate admissions (AIAPGET).",
  },
  {
    id: "Agriculture Education",
    icon: "🌾",
    title: "Agriculture Education",
    desc: "Agriculture, horticulture, forestry and allied science degrees.",
  },
  {
    id: "Fine Art Education",
    icon: "🎨",
    title: "Fine Art Education",
    desc: "Fine art diploma and degree admissions.",
  },
] as const;

export const COURSES: Record<string, string[]> = {
  "Technical Education": [
    "MBA/MMS",
    "MCA",
    "M.E/M.Tech",
    "M.E/M.Tech (Working Professionals)",
    "M.Architecture",
    "M.HMCT",
    "M.Pharmacy/Pharm D (Post Baccalaureate)",
    "MCA Second Year (Lateral Entry)",
    "MCA (Working Professionals)",
    "MBA Second Year (Lateral Entry)",
    "MBA/MMS (Working Professionals)",
    "B.E/B.Tech",
    "BCA/MCA (Integrated)",
    "BBA/BMS/BBM/MBA (Integrated)",
    "B.Pharmacy/Pharm D",
    "B.Architecture",
    "B.HMCT/M.HMCT (Integrated)",
    "Direct Second Year Engineering (DSE)",
    "Direct Second Year Engineering (DSE) (Working Professional)",
    "Direct Second Year Pharmacy (DSP)",
    "B.Planning",
    "B.Design",
    "Direct Second Year Degree in HMCT",
    "B.Pharmacy (Practice)",
    "Direct Third-Year Degree in Engineering",
    "Direct Final-Year Degree in Engineering",
  ],
  "Higher Education": [
    "M.Ed.",
    "M.P.Ed.",
    "B.Ed.M.Ed. Integrated",
    "L.L.B.-5 Years (Integrated)",
    "L.L.B.-3 Years",
    "B.Ed",
    "B.P.Ed",
  ],
  "Medical Education": [
    "NEET-PGM",
    "PG DNB",
    "NEET-PGD",
    "PGP/PGO/PGASLP/M.Sc-(P&O)",
    "NEET-UG",
    "B.Sc. Nursing",
    "GNM",
    "DPN-PHN",
    "AIQ (15%) For AYUSH Courses",
  ],
  "Ayush Education": [
    "AIAPGET (PGA/PGH/PGU) (State Quota)",
    "AIAPGET (PGA/PGH/PGU) (AIQ 15% Quota)",
  ],
  "Agriculture Education": [
    "Agriculture & Allied Courses",
    "B.F.Sc. (Fishery Science)",
    "B.Sc. (Hons) Agriculture",
    "B.Sc. (Hons) Horticulture",
    "B.Sc. (Hons) Community Science",
    "B.Sc. (Hons) Agri-Business Management",
    "B.Sc. (Hons) Forestry",
    "B.Tech. (Agricultural Engineering)",
    "B.Tech. (Food Technology)",
    "B.Tech. (Biotechnology)",
    "Direct Second Year of Bachelor of Science (Agriculture)",
  ],
  "Fine Art Education": ["Fine Art"],
};

export type SheetRow = {
  college: string;
  city: string;
  percentile: number;
  trend: { label: string; tone: "stable" | "down" };
};

// Mirrors backend/src/config/branchTaxonomy.js — used only as an offline
// fallback if the live /api/meta branches call fails entirely (e.g. backend
// not running yet in local dev). The backend itself is the source of truth
// once it's reachable: live cutoff data first, then this reference list.
const ENGINEERING_BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Computer Science & Engineering",
  "Artificial Intelligence & Data Science",
  "Electronics & Telecommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Instrumentation Engineering",
];

const MBA_SPECIALIZATIONS = [
  "Marketing Management",
  "Finance Management",
  "Human Resource Management",
  "Operations Management",
  "Information Technology Management",
  "International Business",
];

export const BRANCH_FALLBACK: Record<string, string[]> = {
  "B.E/B.Tech": ENGINEERING_BRANCHES,
  "Direct Second Year Engineering (DSE)": ENGINEERING_BRANCHES,
  "Direct Second Year Engineering (DSE) (Working Professional)": ENGINEERING_BRANCHES,
  "Direct Third-Year Degree in Engineering": ENGINEERING_BRANCHES,
  "Direct Final-Year Degree in Engineering": ENGINEERING_BRANCHES,
  "MBA/MMS": MBA_SPECIALIZATIONS,
  "MBA/MMS (Working Professionals)": MBA_SPECIALIZATIONS,
  "MBA Second Year (Lateral Entry)": MBA_SPECIALIZATIONS,
};
