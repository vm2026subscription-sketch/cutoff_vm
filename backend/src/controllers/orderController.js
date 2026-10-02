const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Cutoff = require("../models/Cutoff");
const Fee = require("../models/Fee");
const AppError = require("../utils/AppError");
const { isValidCourse } = require("../config/courseTaxonomy");

// Looks up each college's fee and attaches it to the college objects
// already built by fetchPaidResult. Lookup order per college+branch:
//   1. A fee row with this exact branch_name (branch-specific override)
//   2. A fee row with a blank branch_name for this college (applies to all
//      branches — see models/Fee.js)
//   3. undefined — no fee data entered yet for this college/course/year
async function attachFees(branches, order) {
  const feeRows = await Fee.find({
    stream: order.stream,
    course: order.course,
    year: order.year,
  }).lean();

  const specific = new Map(); // key: collegeKey|branch_name
  const collegeWide = new Map(); // key: collegeKey
  for (const f of feeRows) {
    const collegeKey = f.college_code || f.college_name;
    if (f.branch_name) {
      specific.set(`${collegeKey}|${f.branch_name}`, f);
    } else {
      collegeWide.set(collegeKey, f);
    }
  }

  for (const branchGroup of branches) {
    for (const college of branchGroup.colleges) {
      const collegeKey = college.college_code || college.college_name;
      const match =
        specific.get(`${collegeKey}|${branchGroup.branch_name}`) || collegeWide.get(collegeKey);
      if (match) {
        college.fees_amount = match.fees_amount;
        college.fees_unit = match.fees_unit;
      }
    }
  }
}

// Shared by getResult and getMyOrders. There is deliberately no PDF/Excel
// export path built on top of this — the cutoff sheet is view-only, inside
// the logged-in student's own dashboard, and never leaves the server as a
// downloadable file. See README section "View-only result / no downloads"
// for the full reasoning.
async function fetchPaidResult(orderId, requestingUser) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.status !== "paid") throw new AppError("Payment not confirmed for this order yet.", 402);
  // Strict ownership check — no guest fallback. Every order has a `user`
  // because /api/orders now requires login (see routes/orderRoutes.js).
  if (String(order.user) !== String(requestingUser._id)) {
    throw new AppError("You do not have access to this order.", 403);
  }

  const rows = await Cutoff.find({
    stream: order.stream,
    course: order.course,
    category: order.category,
    branch_name: { $in: order.branches },
    year: order.year,
  })
    .sort({ branch_name: 1, cutoff_percentile: -1 })
    .lean();

  const grouped = {};
  for (const row of rows) {
    grouped[row.branch_name] ??= {};
    const collegeKey = row.college_code || row.college_name;
    grouped[row.branch_name][collegeKey] ??= {
      college_name: row.college_name,
      college_code: row.college_code,
      rounds: {},
    };
    grouped[row.branch_name][collegeKey].rounds[row.round] = {
      percentile: row.cutoff_percentile,
      rank: row.cutoff_rank,
    };
  }

  const branches = Object.entries(grouped).map(([branch_name, collegesObj]) => ({
    branch_name,
    colleges: Object.values(collegesObj).sort((a, b) => {
      const pa = a.rounds.CAP1?.percentile ?? 0;
      const pb = b.rounds.CAP1?.percentile ?? 0;
      return pb - pa;
    }),
  }));

  await attachFees(branches, order);

  return {
    stream: order.stream,
    course: order.course,
    category: order.category,
    year: order.year,
    branches,
  };
}

// POST /api/orders
// Body: { stream, course, category, branches: [..up to 3], year }
// Requires login (see routes/orderRoutes.js) — there is no guest checkout,
// because the result can only ever be viewed by the account that paid for
// it, so an order with no account attached would be permanently unviewable.
exports.createOrder = async (req, res, next) => {
  const { stream, course, category, branches, year } = req.body;

  if (!stream || !course || !category || !Array.isArray(branches) || branches.length === 0) {
    return next(
      new AppError("stream, course, category, and at least one branch are required.", 400),
    );
  }
  if (!isValidCourse(stream, course)) {
    return next(new AppError(`"${course}" is not a recognised course under ${stream}.`, 400));
  }
  if (branches.length > 3) {
    return next(new AppError("You can select a maximum of 3 branches per sheet.", 400));
  }

  const amount = Number(process.env.SHEET_PRICE_PAISE || 9900); // paise (₹99 default)

  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `cutoff_${Date.now()}`,
    notes: { stream, course, category, branches: branches.join(","), year: String(year) },
  });

  const order = await Order.create({
    user: req.user._id,
    stream,
    course,
    category,
    branches,
    year,
    amount,
    razorpay_order_id: razorpayOrder.id,
  });

  res.status(201).json({
    status: "success",
    data: {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose — public key
    },
  });
};

// POST /api/orders/verify
// Called by the frontend right after Razorpay checkout succeeds, as a fast
// confirmation path. The webhook below is the SOURCE OF TRUTH for security
// (it's the only one Razorpay itself signs server-to-server) — this route
// just lets the UI unlock instantly without waiting for the webhook to land.
exports.verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return next(new AppError("Payment verification failed.", 400));
  }

  const order = await Order.findOneAndUpdate(
    { razorpay_order_id },
    { status: "paid", razorpay_payment_id, razorpay_signature },
    { new: true },
  );
  if (!order) return next(new AppError("Order not found.", 404));

  res.status(200).json({ status: "success", data: { orderId: order._id } });
};

// POST /api/webhooks/razorpay
// The authoritative payment confirmation — signed server-to-server by Razorpay.
// This is what actually unlocks the sheet if the frontend verify call is ever
// skipped, blocked, or the user closes the tab mid-flow.
exports.razorpayWebhook = async (req, res, next) => {
  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ status: "fail", message: "Invalid webhook signature." });
  }

  const event = req.body;
  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    await Order.findOneAndUpdate(
      { razorpay_order_id: paymentEntity.order_id },
      {
        status: "paid",
        razorpay_payment_id: paymentEntity.id,
      },
    );
  }

  res.status(200).json({ status: "ok" });
};

// GET /api/orders/:orderId/result
// Requires login (routes/orderRoutes.js uses `protect`, not `optionalAuth`).
// Returns cutoff data only if payment is confirmed AND the requesting user
// is the one who placed the order.
exports.getResult = async (req, res, next) => {
  try {
    const data = await fetchPaidResult(req.params.orderId, req.user);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/mine (requires auth)
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ status: "success", data: orders });
};
