const db = require("../config/db");

exports.createRole = (req, res) => {
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