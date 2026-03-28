const express = require("express");
const router = express.Router();
const db = require("../config/db");
const roleController = require("../controllers/roleController");

// CREATE ROLE
router.post("/create", roleController.createRole);

// GET ALL ROLES
router.get("/all", (req, res) => {
  const sql = "SELECT * FROM roles ORDER BY created_at DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching roles" });
    }

    res.json(result);
  });
});

module.exports = router;