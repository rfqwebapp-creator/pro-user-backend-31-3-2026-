const express = require("express");
const router = express.Router();
const {
  createRFQ,
  getRFQs,
  getRFQById,
  updateRFQStatus,
    updateRFQ,
  cancelRFQ,
  getCostCenterSuggestions,
  getUserCostCenters,
addUserCostCenter,
updateUserCostCenter,
deleteUserCostCenter,
} = require("../controllers/rfqController");
const authMiddleware = require("../middleware/authMiddleware");
 

router.post("/create", authMiddleware, createRFQ);
router.get("/cost-centers/list", authMiddleware, getUserCostCenters);
router.post("/cost-centers/add", authMiddleware, addUserCostCenter);
router.put("/cost-centers/update", authMiddleware, updateUserCostCenter);
router.delete("/cost-centers/delete", authMiddleware, deleteUserCostCenter);
router.get("/", authMiddleware, getRFQs);

// ✅ specific route first
router.get("/cost-centers/suggestions", authMiddleware, getCostCenterSuggestions);

router.put("/:id/cancel", authMiddleware, (req, res, next) => {
  console.log("✅ CANCEL ROUTE HIT");
  next();
}, cancelRFQ);

router.get("/:id", authMiddleware, getRFQById);
router.put("/:id/status", authMiddleware, updateRFQStatus);
router.put("/:id", authMiddleware, updateRFQ);


module.exports = router;