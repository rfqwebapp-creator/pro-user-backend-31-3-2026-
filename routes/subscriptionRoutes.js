const express = require("express");
const router = express.Router();
const {
  getSubscriptions,
  updateSubscriptions
} = require("../controllers/subscriptionController");

// middleware required (auth)
router.get("/", getSubscriptions);
router.post("/update", updateSubscriptions);

module.exports = router;