// const express = require("express");
// const bcrypt = require("bcrypt");

// module.exports = (db) => {
//   const router = express.Router();

//   router.get("/test", (req, res) => {
//     res.json({ message: "Auth route working" });
//   });

//   // ================= REGISTER =================
//   router.post("/register", async (req, res) => {
//     console.log("🔎 Headers:", req.headers);
//     console.log("📦 Raw Body:", req.body);

//     try {
//       const {
//         country,
//         email,
//         password,
//         firstName,
//         lastName,
//         phone,
//         industry,
//         workNumber,
//         gst,
//         companyName,
//         referralCode,
//       } = req.body;

//       if (!email || !password || !firstName || !lastName) {
//         return res.status(400).json({
//           message: "Required fields are missing",
//         });
//       }

//       const checkSql = "SELECT * FROM RegCustomers WHERE email = ?";

//       db.query(checkSql, [email], async (err, result) => {
//         if (err) {
//           console.error("DB check error:", err);
//           return res.status(500).json({
//             message: "Database error",
//           });
//         }

//         if (result.length > 0) {
//           return res.status(400).json({
//             message: "Email already registered",
//           });
//         }

//         try {
//           const hash = await bcrypt.hash(password, 10);

//           const insertSql = `
//             INSERT INTO RegCustomers
//             (country, email, password, firstName, lastName, phone, industry, workNumber, gst, companyName, referralCode)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `;

//           const values = [
//             country || "",
//             email,
//             hash,
//             firstName || "",
//             lastName || "",
//             phone || "",
//             industry || "",
//             workNumber || "",
//             gst || "",
//             companyName || "",
//             referralCode || "",
//           ];

//           db.query(insertSql, values, (err, insertResult) => {
//             if (err) {
//               console.error("Insert error:", err);
//               return res.status(500).json({
//                 message: "Insert failed",
//               });
//             }

//             return res.status(201).json({
//               message: "User registered successfully",
//               userId: insertResult.insertId,
//             });
//           });
//         } catch (hashError) {
//           console.error("Hash error:", hashError);
//           return res.status(500).json({
//             message: "Password hash failed",
//           });
//         }
//       });
//     } catch (error) {
//       console.error("Register route error:", error);
//       return res.status(500).json({
//         message: "Server error",
//       });
//     }
//   });
//   router.get("/register", (req, res) => {
//   console.log("⚠️ GET REGISTER HIT");
//   res.status(405).json({ message: "Use POST only" });
// });

//   // ================= LOGIN =================
//   router.post("/login", (req, res) => {
//     const { email, password } = req.body;

//     const sql = "SELECT * FROM RegCustomers WHERE email = ?";
//     db.query(sql, [email], async (err, result) => {
//       if (err) return res.status(500).send("DB Error ❌");

//       if (result.length === 0) {
//         return res.status(400).send("User not found ❌");
//       }

//       const user = result[0];

//       try {
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//           return res.status(400).send("Invalid password ❌");
//         }

//         res.json({
//           message: "Login successful ✅",
//           user: {
//             email: user.email,
//             firstName: user.firstName,
//           },
//         });

//       } catch (error) {
//         return res.status(500).send("Compare error ❌");
//       }
//     });
//   });

//   return router;
// };
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (db) => {
  const router = express.Router();

  router.get("/test", (req, res) => {
    res.json({ message: "Auth route working" });
  });

  // ================= REGISTER =================
  router.post("/register", async (req, res) => {
    console.log("🔎 Headers:", req.headers);
    console.log("📦 Raw Body:", req.body);

    try {
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

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          message: "Required fields are missing",
        });
      }

      const checkSql = "SELECT * FROM RegCustomers WHERE email = ?";

      db.query(checkSql, [email], async (err, result) => {
        if (err) {
          console.error("DB check error:", err);
          return res.status(500).json({
            message: "Database error",
          });
        }

        if (result.length > 0) {
          return res.status(400).json({
            message: "Email already registered",
          });
        }

        try {
          const hash = await bcrypt.hash(password, 10);

          const insertSql = `
            INSERT INTO RegCustomers
            (country, email, password, firstName, lastName, phone, industry, workNumber, gst, companyName, referralCode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            country || "",
            email,
            hash,
            firstName || "",
            lastName || "",
            phone || "",
            industry || "",
            workNumber || "",
            gst || "",
            companyName || "",
            referralCode || "",
          ];

          db.query(insertSql, values, (err, insertResult) => {
            if (err) {
              console.error("Insert error:", err);
              return res.status(500).json({
                message: "Insert failed",
              });
            }

            return res.status(201).json({
              message: "User registered successfully",
              userId: insertResult.insertId,
            });
          });
        } catch (hashError) {
          console.error("Hash error:", hashError);
          return res.status(500).json({
            message: "Password hash failed",
          });
        }
      });
    } catch (error) {
      console.error("Register route error:", error);
      return res.status(500).json({
        message: "Server error",
      });
    }
  });

  router.get("/register", (req, res) => {
    console.log("⚠️ GET REGISTER HIT");
    res.status(405).json({ message: "Use POST only" });
  });

  // ================= LOGIN =================
  router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM RegCustomers WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
      if (err) {
        console.error("Login DB Error:", err);
        return res.status(500).json({ message: "DB Error ❌" });
      }

      if (result.length === 0) {
        return res.status(400).json({ message: "User not found ❌" });
      }

      const user = result[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password ❌" });
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          message: "Login successful ✅",
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
              gst: user.gst   // ✅ ADD THIS

          },
        });
      } catch (error) {
        console.error("Compare/JWT error:", error);
        return res.status(500).json({ message: "Compare error ❌" });
      }
    });
  });

  return router;
};


// routes/userRoutes.js or authRoutes.js

router.get("/users/by-gst/:gst", (req, res) => {
  const { gst } = req.params;

  const sql = "SELECT * FROM RegCustomers WHERE gst = ?";

  db.query(sql, [gst], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB Error" });
    }

    res.json(result);
  });
});