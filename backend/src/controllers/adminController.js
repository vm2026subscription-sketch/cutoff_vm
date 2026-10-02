const XLSX = require("xlsx");
const fs = require("fs");
const Cutoff = require("../models/Cutoff");
const Order = require("../models/Order");
const Fee = require("../models/Fee");
const AppError = require("../utils/AppError");
const { isValidCourse, courseHasBranches, getStreams } = require("../config/courseTaxonomy");

// Government sheets are never consistent — this maps common variants to
// one canonical branch name. Extend this as you encounter new spellings.
const BRANCH_ALIASES = {
  "comp": "Computer Engineering",
  "computer engg": "Computer Engineering",
  "computer engineering": "Computer Engineering",
  "ce": "Computer Engineering",
  "it": "Information Technology",
  "information technology": "Information Technology",
  "entc": "Electronics & Telecommunication",
  "e&tc": "Electronics & Telecommunication",
  "extc": "Electronics & Telecommunication",
  "mech": "Mechanical Engineering",
  "mechanical": "Mechanical Engineering",
  "mechanical engineering": "Mechanical Engineering",
  "civil": "Civil Engineering",
  "civil engineering": "Civil Engineering",
  "electrical": "Electrical Engineering",
  "electrical engineering": "Electrical Engineering",
};

const CATEGORY_ALIASES = {
  general: "OPEN",
  gopen: "OPEN",
  open: "OPEN",
  obc: "OBC",
  sc: "SC",
  st: "ST",
  vj: "VJ",
  nt1: "NT1",
  nt2: "NT2",
  nt3: "NT3",
  ews: "EWS",
  tfws: "TFWS",
  pwd: "PWD",
  defence: "DEFENCE",
};

function normalizeBranch(raw) {
  const key = String(raw).trim().toLowerCase();
  return BRANCH_ALIASES[key] || String(raw).trim();
}

function normalizeCategory(raw) {
  const key = String(raw).trim().toLowerCase();
  return CATEGORY_ALIASES[key] || String(raw).trim().toUpperCase();
}

// POST /api/admin/upload
// multipart/form-data: file (xlsx), stream, course, round, year
// Expected columns in the sheet (case-insensitive, flexible order):
// College Name | College Code | Branch | Category | Percentile | Rank
// `Branch` can be omitted for courses that don't have sub-branches
// (NEET-UG, MCA, etc.) — it falls back to the course name itself.
exports.uploadCutoffFile = async (req, res, next) => {
  const { stream, course, round, year } = req.body;
  if (!req.file) return next(new AppError("No file uploaded.", 400));
  if (!stream || !course || !round || !year) {
    return next(new AppError("stream, course, round, and year are required.", 400));
  }
  if (!getStreams().includes(stream)) {
    return next(new AppError(`"${stream}" is not a recognised stream.`, 400));
  }
  if (!isValidCourse(stream, course)) {
    return next(new AppError(`"${course}" is not a recognised course under ${stream}. Check config/courseTaxonomy.js.`, 400));
  }

  const branchless = !courseHasBranches(stream, course);

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return next(new AppError("The uploaded file has no data rows.", 400));
    }

    const bulkOps = [];
    const errors = [];

    rows.forEach((row, idx) => {
      // Flexible column matching — tolerates header variations.
      const collegeName = row["College Name"] ?? row["College"] ?? row["college_name"];
      const collegeCode = row["College Code"] ?? row["Code"] ?? row["college_code"];
      const branchRaw = row["Branch"] ?? row["Branch Name"] ?? row["branch_name"];
      const categoryRaw = row["Category"] ?? row["category"];
      const percentile = row["Percentile"] ?? row["Cutoff Percentile"] ?? row["cutoff_percentile"];
      const rank = row["Rank"] ?? row["Cutoff Rank"] ?? row["cutoff_rank"];

      // Branchless courses (NEET-UG, MCA, ...) don't need a Branch column at
      // all — every row for the course falls under the course's own name.
      const branchValue = branchless ? course : branchRaw;

      if (!collegeName || !branchValue || !categoryRaw) {
        errors.push({ row: idx + 2, reason: "Missing college/branch/category" });
        return;
      }
      const pct = Number(percentile);
      if (percentile !== "" && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
        errors.push({ row: idx + 2, reason: `Invalid percentile: ${percentile}` });
        return;
      }

      const doc = {
        stream,
        course,
        college_name: String(collegeName).trim(),
        college_code: collegeCode ? String(collegeCode).trim() : undefined,
        branch_name: normalizeBranch(branchValue),
        category: normalizeCategory(categoryRaw),
        round,
        cutoff_percentile: percentile === "" ? undefined : pct,
        cutoff_rank: rank === "" ? undefined : Number(rank),
        year: Number(year),
      };

      bulkOps.push({
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
      });
    });

    let result = { upsertedCount: 0, modifiedCount: 0 };
    if (bulkOps.length > 0) {
      result = await Cutoff.bulkWrite(bulkOps, { ordered: false });
    }

    fs.unlink(req.file.path, () => {}); // cleanup temp upload

    res.status(200).json({
      status: "success",
      data: {
        totalRows: rows.length,
        processed: bulkOps.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        errors,
      },
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return next(new AppError(`Failed to process file: ${err.message}`, 400));
  }
};

// POST /api/admin/upload-fees
// multipart/form-data: file (xlsx), stream, course, year
// No `round` here — fees don't change by CAP round, only by year (see
// models/Fee.js for the full reasoning on why this is a separate upload
// from the cutoff data entirely).
// Expected columns: College Name | College Code | Branch (optional) | Fees | Fees Unit (optional)
exports.uploadFeesFile = async (req, res, next) => {
  const { stream, course, year } = req.body;
  if (!req.file) return next(new AppError("No file uploaded.", 400));
  if (!stream || !course || !year) {
    return next(new AppError("stream, course, and year are required.", 400));
  }
  if (!getStreams().includes(stream)) {
    return next(new AppError(`"${stream}" is not a recognised stream.`, 400));
  }
  if (!isValidCourse(stream, course)) {
    return next(
      new AppError(`"${course}" is not a recognised course under ${stream}. Check config/courseTaxonomy.js.`, 400),
    );
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return next(new AppError("The uploaded file has no data rows.", 400));
    }

    const bulkOps = [];
    const errors = [];

    rows.forEach((row, idx) => {
      const collegeName = row["College Name"] ?? row["College"] ?? row["college_name"];
      const collegeCode = row["College Code"] ?? row["Code"] ?? row["college_code"];
      // Blank/omitted Branch means "this fee applies to every branch at
      // this college" — see models/Fee.js.
      const branchRaw = row["Branch"] ?? row["Branch Name"] ?? row["branch_name"] ?? "";
      const feesRaw = row["Fees"] ?? row["Fee"] ?? row["Tuition Fee"] ?? row["fees_amount"];
      const unitRaw = String(row["Fees Unit"] ?? row["fees_unit"] ?? "per_year")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      if (!collegeName || feesRaw === "" || feesRaw === undefined) {
        errors.push({ row: idx + 2, reason: "Missing college name or fees amount" });
        return;
      }
      const amount = Number(feesRaw);
      if (Number.isNaN(amount) || amount < 0) {
        errors.push({ row: idx + 2, reason: `Invalid fees amount: ${feesRaw}` });
        return;
      }

      const doc = {
        stream,
        course,
        college_name: String(collegeName).trim(),
        college_code: collegeCode ? String(collegeCode).trim() : undefined,
        branch_name: branchRaw ? normalizeBranch(branchRaw) : undefined,
        year: Number(year),
        fees_amount: amount,
        fees_unit: ["per_year", "total_course"].includes(unitRaw) ? unitRaw : "per_year",
      };

      bulkOps.push({
        updateOne: {
          filter: {
            college_code: doc.college_code,
            course: doc.course,
            branch_name: doc.branch_name,
            year: doc.year,
          },
          update: { $set: doc },
          upsert: true,
        },
      });
    });

    let result = { upsertedCount: 0, modifiedCount: 0 };
    if (bulkOps.length > 0) {
      result = await Fee.bulkWrite(bulkOps, { ordered: false });
    }

    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      status: "success",
      data: {
        totalRows: rows.length,
        processed: bulkOps.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        errors,
      },
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return next(new AppError(`Failed to process file: ${err.message}`, 400));
  }
};

// GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [sheetsToday, revenueMonthAgg, totalColleges, lastCutoff] = await Promise.all([
    Order.countDocuments({ status: "paid", createdAt: { $gte: startOfDay } }),
    Order.aggregate([
      { $match: { status: "paid", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Cutoff.distinct("college_code").then((arr) => arr.length),
    Cutoff.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      sheetsSoldToday: sheetsToday,
      revenueThisMonthPaise: revenueMonthAgg[0]?.total || 0,
      totalColleges,
      lastDataUpdate: lastCutoff?.updatedAt || null,
    },
  });
};

// GET /api/admin/orders?status=paid&page=1&limit=20
exports.listOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    status: "success",
    data: orders,
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
};

// GET /api/admin/uploads-log — recent distinct upload batches, derived from Cutoff data
exports.getRecentUploads = async (req, res) => {
  const recent = await Cutoff.aggregate([
    { $group: { _id: { stream: "$stream", course: "$course", round: "$round", year: "$year" }, count: { $sum: 1 }, lastUpdated: { $max: "$updatedAt" } } },
    { $sort: { lastUpdated: -1 } },
    { $limit: 20 },
  ]);
  res.status(200).json({ status: "success", data: recent });
};

// GET /api/admin/fees-uploads-log — same idea, for the separate Fee collection
exports.getRecentFeeUploads = async (req, res) => {
  const recent = await Fee.aggregate([
    { $group: { _id: { stream: "$stream", course: "$course", year: "$year" }, count: { $sum: 1 }, lastUpdated: { $max: "$updatedAt" } } },
    { $sort: { lastUpdated: -1 } },
    { $limit: 20 },
  ]);
  res.status(200).json({ status: "success", data: recent });
};
