const express = require("express");
const router = express.Router();
const {
  createRFQ,
  getRFQs,
  getRFQById,
  updateRFQStatus,
} = require("../controllers/rfqController");

router.post("/create", createRFQ);
router.get("/", getRFQs);             
router.get("/:id", getRFQById);       
router.put("/:id/status", updateRFQStatus);

module.exports = router;