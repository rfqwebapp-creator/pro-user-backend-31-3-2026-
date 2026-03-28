const db = require("../config/db");

exports.createRole = (req, res) => {
  const { name, description, permissions, fieldPermissions } = req.body;

  const sql = `
    INSERT INTO roles (name, description, permissions, field_permissions)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      description,
      JSON.stringify(permissions),
      JSON.stringify(fieldPermissions)
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        message: "Role saved in single row ✅"
      });
    }
  );
};