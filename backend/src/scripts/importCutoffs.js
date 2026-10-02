/**
 * Standalone bulk-import script — run from the command line for large,
 * one-off imports without going through the admin panel's file-size limits.
 *
 * Usage:
 *   node src/scripts/importCutoffs.js path/to/file.xlsx "Technical Education" "B.E/B.Tech" CAP1 2026
 *
 * Stream and course names must match config/courseTaxonomy.js exactly
 * (wrap them in quotes since most contain spaces or slashes).
 */
require("dotenv").config();
const path = require("path");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const Cutoff = require("../models/Cutoff");
const { isValidCourse, courseHasBranches, getStreams } = require("../config/courseTaxonomy");

const BRANCH_ALIASES = {
  comp: "Computer Engineering",
  "computer engg": "Computer Engineering",
  ce: "Computer Engineering",
  it: "Information Technology",
  entc: "Electronics & Telecommunication",
  extc: "Electronics & Telecommunication",
  mech: "Mechanical Engineering",
  civil: "Civil Engineering",
};
const CATEGORY_ALIASES = { general: "OPEN", gopen: "OPEN", open: "OPEN" };

function normalizeBranch(raw) {
  const key = String(raw).trim().toLowerCase();
  return BRANCH_ALIASES[key] || String(raw).trim();
}
function normalizeCategory(raw) {
  const key = String(raw).trim().toLowerCase();
  return CATEGORY_ALIASES[key] || String(raw).trim().toUpperCase();
}

async function run() {
  const [, , filePath, stream, course, round, year] = process.argv;
  if (!filePath || !stream || !course || !round || !year) {
    console.error('Usage: node importCutoffs.js <file.xlsx> "<Stream>" "<Course>" <Round> <Year>');
    console.error(`Valid streams: ${getStreams().join(", ")}`);
    process.exit(1);
  }
  if (!getStreams().includes(stream)) {
    console.error(`"${stream}" is not a recognised stream. Valid streams: ${getStreams().join(", ")}`);
    process.exit(1);
  }
  if (!isValidCourse(stream, course)) {
    console.error(`"${course}" is not a recognised course under "${stream}". Check config/courseTaxonomy.js.`);
    process.exit(1);
  }
  const branchless = !courseHasBranches(stream, course);

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const workbook = XLSX.readFile(path.resolve(filePath));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`Read ${rows.length} rows from ${filePath}`);

  const bulkOps = rows
    .map((row) => {
      const collegeName = row["College Name"] ?? row["College"];
      const collegeCode = row["College Code"] ?? row["Code"];
      const branchRaw = row["Branch"] ?? row["Branch Name"];
      const categoryRaw = row["Category"];
      const percentile = Number(row["Percentile"] ?? row["Cutoff Percentile"]);
      const rank = Number(row["Rank"] ?? row["Cutoff Rank"]) || undefined;

      const branchValue = branchless ? course : branchRaw;
      if (!collegeName || !branchValue || !categoryRaw) return null;

      const doc = {
        stream,
        course,
        college_name: String(collegeName).trim(),
        college_code: collegeCode ? String(collegeCode).trim() : undefined,
        branch_name: normalizeBranch(branchValue),
        category: normalizeCategory(categoryRaw),
        round,
        cutoff_percentile: Number.isNaN(percentile) ? undefined : percentile,
        cutoff_rank: rank,
        year: Number(year),
      };

      return {
        updateOne: {
          filter: {
            college_code: doc.college_code,
            course: doc.course,
            branch_name: doc.branch_name,
            category: doc.category,
            round: doc.round,
            year: doc.year,
          },
          update: { $set: doc },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  const result = await Cutoff.bulkWrite(bulkOps, { ordered: false });
  console.log(`Import complete. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
