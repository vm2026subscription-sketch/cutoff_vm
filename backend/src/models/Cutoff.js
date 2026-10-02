const mongoose = require("mongoose");
const { getStreams } = require("../config/courseTaxonomy");

/**
 * One document = one exact cutoff data point.
 *
 * The real portal has 6 streams (Technical/Higher/Medical/Ayush/Agriculture/
 * Fine Art Education), each containing dozens of independent courses
 * (MBA/MMS, NEET-UG, B.E/B.Tech, AIAPGET, ...). `stream` is a small closed
 * set so it's a schema-level enum; `course` has 60+ possible values across
 * streams and keeps growing, so it's validated against
 * config/courseTaxonomy.js at the controller/upload layer instead of being
 * hardcoded here (adding a new course later is then a one-line config
 * change, not a schema migration).
 *
 * `branch_name` is ALWAYS populated even for courses with no real
 * sub-branches (e.g. NEET-UG, MCA) — it's set equal to the course name in
 * that case. This keeps every downstream query/grouping/UI (which filters
 * and groups "by branch") identical regardless of whether the course
 * actually has specializations, so nothing else in the codebase needs a
 * special case for "branchless" courses.
 */
const cutoffSchema = new mongoose.Schema(
  {
    stream: {
      type: String,
      required: true,
      enum: getStreams(),
      index: true,
    },
    course: { type: String, required: true, trim: true, index: true },

    college_name: { type: String, required: true, trim: true },
    college_code: { type: String, trim: true, index: true },
    branch_name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, uppercase: true, index: true },
    round: {
      type: String,
      required: true,
      enum: ["CAP1", "CAP2", "CAP3"],
    },
    cutoff_percentile: { type: Number, min: 0, max: 100 },
    cutoff_rank: { type: Number, min: 0 },
    year: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

// Prevents duplicate rows for the same exact data point, and doubles
// as an upsert key during data import. Deliberately includes `year` so
// re-importing a later admission year's data never overwrites an earlier
// year's rows — see README section on multi-year data for the full story.
cutoffSchema.index(
  { college_code: 1, course: 1, branch_name: 1, category: 1, round: 1, year: 1 },
  { unique: true, partialFilterExpression: { college_code: { $exists: true } } }
);

// The query every student request actually runs.
cutoffSchema.index({ stream: 1, course: 1, category: 1, branch_name: 1, year: 1 });

module.exports = mongoose.model("Cutoff", cutoffSchema);
