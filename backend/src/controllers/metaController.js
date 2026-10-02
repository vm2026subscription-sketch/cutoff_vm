const Cutoff = require("../models/Cutoff");
const taxonomy = require("../config/courseTaxonomy");
const { getReferenceBranches } = require("../config/branchTaxonomy");

// GET /api/meta/streams
// The 6 top-level streams — Technical/Higher/Medical/Ayush/Agriculture/Fine Art.
exports.getStreams = (req, res) => {
  res.status(200).json({ status: "success", data: taxonomy.getStreams() });
};

// GET /api/meta/:stream/courses
// e.g. /api/meta/Technical%20Education/courses
// Optional ?level=Post Graduate | Under Graduate to filter, matching the
// two-column layout the CET portal itself uses.
exports.getCourses = (req, res, next) => {
  const { stream } = req.params;
  const { level } = req.query;
  if (!taxonomy.getStreams().includes(stream)) {
    return res.status(200).json({ status: "success", data: [] });
  }
  const courses = taxonomy.getCourses(stream, level);
  res.status(200).json({ status: "success", data: courses });
};

// GET /api/meta/:stream/:course/categories
// Pulled from live data (not the static taxonomy) because category codes
// like OPEN/OBC/EWS/TFWS etc. can vary by course and change over time.
exports.getCategories = async (req, res) => {
  const { stream, course } = req.params;
  const categories = await Cutoff.distinct("category", { stream, course });
  res.status(200).json({ status: "success", data: categories.sort() });
};

// GET /api/meta/:stream/:course/branches?search=comp
//
// Resolution order (see config/branchTaxonomy.js for the full reasoning):
//   1. Live cutoff data — real uploaded rows always win
//   2. Reference taxonomy — keeps the wizard correct before any Excel has
//      been uploaded for this course (this is what was previously missing
//      and made every course look "branchless" until data was loaded)
//   3. The course name itself — genuinely branchless courses (NEET-UG, MCA, ...)
exports.getBranches = async (req, res) => {
  const { stream, course } = req.params;
  const { search } = req.query;

  const filter = { stream, course };
  if (search) filter.branch_name = { $regex: search, $options: "i" };

  let branches = await Cutoff.distinct("branch_name", filter);

  if (branches.length === 0) {
    const reference = getReferenceBranches(course);
    if (reference) {
      branches = search
        ? reference.filter((b) => b.toLowerCase().includes(search.toLowerCase()))
        : reference;
    } else {
      branches = [course];
    }
  }

  res.status(200).json({ status: "success", data: branches.sort() });
};

// GET /api/meta/:stream/:course/years
// Powers "which admission years do we have data for" — see the multi-year
// data section of the README for how this is used.
exports.getYears = async (req, res) => {
  const { stream, course } = req.params;
  const years = await Cutoff.distinct("year", { stream, course });
  res.status(200).json({ status: "success", data: years.sort((a, b) => b - a) });
};
