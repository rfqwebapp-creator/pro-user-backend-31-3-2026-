const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

module.exports = (db) => {

  // ================= REGISTER =================
  router.post("/register", (req, res) => {
    const {
      country,
      email,
      password,
      firstName,
      lastName,
      phone,
      industry,
      workNumber,
      gst,
      companyName,
      referralCode,
    } = req.body;

    const checkSql = "SELECT * FROM RegCustomers WHERE email = ?";
    db.query(checkSql, [email], (err, result) => {
      if (err) return res.status(500).send("DB Error ❌");

      if (result.length > 0) {
        return res.status(400).send("Email already registered ❌");
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send("Hash error ❌");

        const insertSql = `
          INSERT INTO RegCustomers 
          (country, email, password, firstName, lastName, phone, industry, workNumber, gst, companyName, referralCode)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          country,
          email,
          hash,
          firstName,
          lastName,
          phone,
          industry,
          workNumber,
          gst,
          companyName,
          referralCode,
        ];

        db.query(insertSql, values, (err) => {
          if (err) return res.status(500).send("Insert failed ❌");

          res.send("User registered successfully ✅");
        });
      });
    });
  });

  // ================= LOGIN =================
  router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM RegCustomers WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
      if (err) return res.status(500).send("DB Error ❌");

      if (result.length === 0) {
        return res.status(400).send("User not found ❌");
      }

      const user = result[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).send("Invalid password ❌");
        }

        res.json({
          message: "Login successful ✅",
          user: {
            email: user.email,
            firstName: user.firstName,
          },
        });

      } catch (error) {
        return res.status(500).send("Compare error ❌");
      }
    });
  });

  return router;
};