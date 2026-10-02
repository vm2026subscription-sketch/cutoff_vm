/**
 * Reference branch/specialization list per course. This exists because
 * `getBranches` in metaController.js normally derives branches from LIVE
 * cutoff data (`Cutoff.distinct("branch_name", ...)`) — but before any
 * actual CAP round Excel has been uploaded for a course, that query
 * correctly returns an empty array. Without this file, the frontend would
 * misread "no data yet" as "this course has no branches", which is wrong
 * for courses like B.E/B.Tech that very much have branches.
 *
 * Resolution order used by metaController.getBranches:
 *   1. Live DB data (real cutoffs — always wins once uploaded)
 *   2. This reference list (keeps the wizard useful before data exists)
 *   3. The course name itself (genuinely branchless courses — NEET-UG, MCA, ...)
 *
 * Not every branch-having course is listed here yet — only the
 * highest-traffic ones. Add more as needed; nothing else has to change.
 */

const ENGINEERING_BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Computer Science & Engineering",
  "Artificial Intelligence & Data Science",
  "Artificial Intelligence & Machine Learning",
  "Electronics & Telecommunication Engineering",
  "Electronics & Computer Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Instrumentation Engineering",
  "Production Engineering",
  "Automobile Engineering",
  "Robotics & Automation",
  "Textile Engineering",
  "Mining Engineering",
  "Metallurgy Engineering",
  "Bio-Medical Engineering",
  "Petrochemical Engineering",
];

const ME_MTECH_BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "VLSI Design",
  "Data Science",
  "Artificial Intelligence",
  "Digital Electronics",
  "Mechanical Engineering (Design)",
  "Mechanical Engineering (Heat Power)",
  "Mechanical Engineering (CAD/CAM)",
  "Civil Engineering (Structural)",
  "Civil Engineering (Environmental)",
  "Civil Engineering (Construction Management)",
  "Electrical Engineering (Power Systems)",
  "Electrical Engineering (Electronic Drives)",
];

const MBA_SPECIALIZATIONS = [
  "Marketing Management",
  "Finance Management",
  "Human Resource Management",
  "Operations Management",
  "Information Technology Management",
  "International Business",
  "Business Analytics",
  "Rural Management",
  "Pharmaceutical Management",
  "Agri-Business Management",
];

const PHARMACY_PG_BRANCHES = [
  "Pharmaceutics",
  "Pharmaceutical Chemistry",
  "Pharmacology",
  "Pharmacognosy",
  "Quality Assurance",
  "Industrial Pharmacy",
];

const NEET_PGM_BRANCHES = [
  "General Medicine",
  "General Surgery",
  "Pediatrics",
  "Obstetrics & Gynaecology",
  "Orthopedics",
  "Ophthalmology",
  "ENT (Otorhinolaryngology)",
  "Dermatology",
  "Psychiatry",
  "Radiology",
  "Radiotherapy",
  "Anaesthesiology",
  "Pathology",
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Forensic Medicine",
  "Community Medicine (PSM)",
  "Microbiology",
  "Pharmacology",
  "Respiratory Medicine",
];

const NEET_PGD_BRANCHES = [
  "Diploma in Child Health",
  "Diploma in Gynaecology & Obstetrics",
  "Diploma in Anaesthesia",
  "Diploma in Ophthalmology",
  "Diploma in Orthopedics",
  "Diploma in ENT",
  "Diploma in Radiology",
  "Diploma in Tuberculosis & Chest Diseases",
  "Diploma in Psychiatric Medicine",
];

const AIAPGET_PGA_BRANCHES = [
  "Ayurveda Samhita Siddhanta",
  "Rachana Sharir",
  "Kriya Sharir",
  "Dravyaguna Vigyan",
  "Rasashastra Evum Bhaishajya Kalpana",
  "Kayachikitsa",
  "Panchakarma",
  "Prasuti Tantra Evum Stri Roga",
  "Shalya Tantra",
  "Shalakya Tantra",
];

const AGRICULTURE_BRANCHES = [
  "Agriculture",
  "Horticulture",
  "Forestry",
  "Agricultural Engineering",
  "Food Technology",
  "Fishery Science",
  "Community Science",
  "Agri-Business Management",
  "Biotechnology",
  "Dairy Technology",
];

const BRANCH_TAXONOMY = {
  "B.E/B.Tech": ENGINEERING_BRANCHES,
  "Direct Second Year Engineering (DSE)": ENGINEERING_BRANCHES,
  "Direct Second Year Engineering (DSE) (Working Professional)": ENGINEERING_BRANCHES,
  "Direct Third-Year Degree in Engineering": ENGINEERING_BRANCHES,
  "Direct Final-Year Degree in Engineering": ENGINEERING_BRANCHES,

  "M.E/M.Tech": ME_MTECH_BRANCHES,
  "M.E/M.Tech (Working Professionals)": ME_MTECH_BRANCHES,

  "MBA/MMS": MBA_SPECIALIZATIONS,
  "MBA/MMS (Working Professionals)": MBA_SPECIALIZATIONS,
  "MBA Second Year (Lateral Entry)": MBA_SPECIALIZATIONS,

  "M.Pharmacy/Pharm D (Post Baccalaureate)": PHARMACY_PG_BRANCHES,

  "NEET-PGM": NEET_PGM_BRANCHES,
  "PG DNB": NEET_PGM_BRANCHES,
  "NEET-PGD": NEET_PGD_BRANCHES,

  "AIAPGET (PGA/PGH/PGU) (State Quota)": AIAPGET_PGA_BRANCHES,
  "AIAPGET (PGA/PGH/PGU) (AIQ 15% Quota)": AIAPGET_PGA_BRANCHES,

  "Agriculture & Allied Courses": AGRICULTURE_BRANCHES,
};

function getReferenceBranches(course) {
  return BRANCH_TAXONOMY[course] || null;
}

module.exports = { BRANCH_TAXONOMY, getReferenceBranches };
