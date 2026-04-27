const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.post("/create", roleController.createRole);
router.get("/all", roleController.getAllRoles);
router.get("/:id", roleController.getRoleById);
router.delete("/:id", roleController.deleteRole);

module.exports = router;