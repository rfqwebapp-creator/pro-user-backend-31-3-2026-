const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
router.post("/create", roleController.createRole);
router.get("/all", roleController.getAllRoles);

// 🔥 DELETE FIRST
router.delete("/:id", roleController.deleteRole);

// THEN GET BY ID
router.get("/:id", roleController.getRoleById);
module.exports = router;