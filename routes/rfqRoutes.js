const express = require("express");
const router = express.Router();
const {
  createRFQ,
  getRFQs,
  getRFQById,
  updateRFQStatus,
} = require("../controllers/rfqController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createRFQ);
router.get("/", authMiddleware, getRFQs);
router.get("/:id", authMiddleware, getRFQById);
router.put("/:id/status", authMiddleware, updateRFQStatus);

module.exports = router;