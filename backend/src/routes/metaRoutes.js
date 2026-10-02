const express = require("express");
const metaController = require("../controllers/metaController");

const router = express.Router();

router.get("/streams", metaController.getStreams);
router.get("/:stream/courses", metaController.getCourses);
router.get("/:stream/:course/categories", metaController.getCategories);
router.get("/:stream/:course/branches", metaController.getBranches);
router.get("/:stream/:course/years", metaController.getYears);

module.exports = router;
