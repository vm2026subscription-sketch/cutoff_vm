const mongoose = require("mongoose");
const { getStreams } = require("../config/courseTaxonomy");

/**
 * Fees are deliberately a SEPARATE collection from Cutoff, even though both
 * describe the same college+course+branch. Reasoning: a cutoff varies by
 * category AND round AND year (so a single college+branch has 8 categories
 * × 3 rounds = 24 cutoff rows per year) — but the fee for that same
 * college+branch is usually just ONE number per year, regardless of
 * category or round. If fees lived on the Cutoff schema, the data entry
 * team would have to re-type the identical fee 24 times per branch per
 * year (once per category/round combination) — pure duplicate effort and
 * a data-consistency risk if only some of those 24 rows get updated.
 *
 * `branch_name` is optional here: leave it blank to mean "this fee applies
 * to every branch at this college for this course" (common for many
 * private colleges that charge one flat course fee regardless of branch).
 * A row with a specific `branch_name` always takes priority over a blank
 * one for that same college — see orderController.attachFees for the
 * exact lookup order.
 */
const feeSchema = new mongoose.Schema(
  {
    stream: { type: String, required: true, enum: getStreams(), index: true },
    course: { type: String, required: true, trim: true, index: true },
    college_name: { type: String, required: true, trim: true },
    college_code: { type: String, trim: true, index: true },
    branch_name: { type: String, trim: true }, // blank = applies to all branches at this college
    year: { type: Number, required: true, index: true },
    fees_amount: { type: Number, required: true, min: 0 },
    fees_unit: {
      type: String,
      enum: ["per_year", "total_course"],
      default: "per_year",
    },
  },
  { timestamps: true },
);

// Upsert key. Two rows for the same college+course+year are only "the same
// record" if they also share the same branch_name (including both being
// blank) — this lets a college have one blank "applies to all" row plus
// specific overrides for individual branches.
feeSchema.index(
  { college_code: 1, course: 1, branch_name: 1, year: 1 },
  { unique: true, partialFilterExpression: { college_code: { $exists: true } } },
);

feeSchema.index({ stream: 1, course: 1, year: 1 });

module.exports = mongoose.model("Fee", feeSchema);
