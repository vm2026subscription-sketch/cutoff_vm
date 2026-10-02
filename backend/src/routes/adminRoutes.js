const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Every route below requires a logged-in admin
router.use(protect, restrictTo("admin"));

router.get("/stats", adminController.getDashboardStats);
router.get("/orders", adminController.listOrders);
router.get("/uploads-log", adminController.getRecentUploads);
router.post("/upload", upload.single("file"), adminController.uploadCutoffFile);

router.get("/fees-uploads-log", adminController.getRecentFeeUploads);
router.post("/upload-fees", upload.single("file"), adminController.uploadFeesFile);

module.exports = router;
