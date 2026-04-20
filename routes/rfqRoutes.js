const express = require("express");
const router = express.Router();
const {
  createRFQ,
  getRFQs,
  getRFQById,
  updateRFQStatus,
} = require("../controllers/rfqController");
const authMiddleware = require("../middleware/authMiddleware");
const { updateRFQ } = require("../controllers/rfqController");
const { cancelRFQ } = require("../controllers/rfqController");

router.post("/create", authMiddleware, createRFQ);
router.get("/", authMiddleware, getRFQs);
router.get("/:id", authMiddleware, getRFQById);
router.put("/:id/status", authMiddleware, updateRFQStatus);
router.put("/:id", authMiddleware, updateRFQ);
router.put("/:id/cancel", authMiddleware, cancelRFQ);

module.exports = router;