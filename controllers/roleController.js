const db = require("../config/db");
console.log("✅ ROLE CONTROLLER LATEST FILE LOADED");
exports.createRole = (req, res) => {
  console.log("ROLE BODY:", req.body);

  const { name, description, permissions, fieldPermissions } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Role name is required" });
  }

  const sql = `
    INSERT INTO roles (name, description, permissions, field_permissions)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      description || "",
      JSON.stringify(permissions || []),
      JSON.stringify(fieldPermissions || [])
    ],
    (err, result) => {
      if (err) {
        console.error("CREATE ROLE ERROR:", err);
        return res.status(500).json({ message: "Error creating role" });
      }

      res.json({
        success: true,
        message: "Role saved successfully ✅",
        roleId: result.insertId
      });
    }
  );
};
exports.getAllRoles = (req, res) => {
  db.query("SELECT * FROM roles ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error("GET ROLES ERROR:", err);
      return res.status(500).json({ message: "Error fetching roles" });
    }
    res.json(rows);
  });
};

exports.getRoleById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM roles WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("GET ROLE ERROR:", err);
      return res.status(500).json({ message: "Error fetching role" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(rows[0]);
  });
};

exports.deleteRole = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM roles WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("DELETE ROLE ERROR:", err);
      return res.status(500).json({ message: "Error deleting role" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      success: true,
      message: "Role deleted successfully"
    });
  });
};