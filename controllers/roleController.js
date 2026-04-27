const db = require("../config/db");
const nodemailer = require("nodemailer");
console.log("✅ ROLE CONTROLLER LATEST FILE LOADED");


exports.createRole = (req, res) => {
  const { name, description, email, password, permissions, fieldPermissions } = req.body;

  const sql = `INSERT INTO roles (name, description, permissions, field_permissions)
               VALUES (?, ?, ?, ?)`;

  db.query(
    sql,
    [
      name,
      description || "",
      JSON.stringify(permissions || []),
      JSON.stringify(fieldPermissions || [])
    ],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating role" });
      }

      // 🔥 EMAIL SEND
      if (email && password) {
        await sendRoleEmail({
          email,
          password,
          roleName: name,
        });
      }

      res.json({
        success: true,
        message: "Role created & email sent ✅",
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
const sendRoleEmail = async ({ email, password, roleName }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Procubid" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Procubid Login Details",
    html: `
      <p>Hello,</p>

      <p>You have been added to Procubid with the role: <b>${roleName}</b>.</p>

      <p>Please use the below login details:</p>

      <p>
        <b>Email:</b> ${email}<br/>
        <b>Password:</b> ${password}
      </p>

      <p>Login here:</p>
      <p>https://www.procubid.com/login</p>

      <p>After login, please change your password for security.</p>

      <p>Regards,<br/>Procubid Team</p>
    `,
  });
};