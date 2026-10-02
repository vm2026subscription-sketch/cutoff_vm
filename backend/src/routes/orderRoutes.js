const express = require("express");
const orderController = require("../controllers/orderController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Login is mandatory to create an order — no guest checkout. This is what
// makes "only the logged-in buyer can ever view their sheet" enforceable;
// there's no such thing as an anonymous order to secure later.
router.post("/", protect, orderController.createOrder);
router.post("/verify", optionalAuth, orderController.verifyPayment);
router.get("/mine", protect, orderController.getMyOrders);

// Result is view-only, in-browser, and requires the same logged-in account
// that paid for it — see orderController.getResult for the ownership check.
// There are deliberately no /download/pdf or /download/excel routes: the
// cutoff sheet is never exported as a file a student could redistribute.
router.get("/:orderId/result", protect, orderController.getResult);

module.exports = router;
