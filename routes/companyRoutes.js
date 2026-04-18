const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// create upload folders
const uploadBaseDir = path.join(__dirname, "../uploads");
const logoDir = path.join(uploadBaseDir, "logos");
const coverDir = path.join(uploadBaseDir, "covers");

if (!fs.existsSync(uploadBaseDir)) fs.mkdirSync(uploadBaseDir, { recursive: true });
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });
if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "logo") {
      cb(null, logoDir);
    } else if (file.fieldname === "cover") {
      cb(null, coverDir);
    } else {
      cb(null, uploadBaseDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith("image/");

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// SAVE / UPDATE COMPANY PROFILE
router.post(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      console.log("POST /api/company hit");
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      const {
  user_id,
  legalName,
        address,
        country,
        phone,
        email,
        type,
        size,
        industry,
        regNumber,
        vat,
        incDate,
        procurementCount,
        about,
        socials,
      } = req.body;
user_id = parseInt(user_id);
console.log("FINAL USER_ID:", user_id);

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const logo = req.files?.logo?.[0]?.filename || null;
      const cover = req.files?.cover?.[0]?.filename || null;

      let parsedIndustry = [];
      let parsedSocials = {};

      try {
        parsedIndustry = industry ? JSON.parse(industry) : [];
      } catch (e) {
        parsedIndustry = [];
      }

      try {
        parsedSocials = socials ? JSON.parse(socials) : {};
      } catch (e) {
        parsedSocials = {};
      }

      const checkSql = "SELECT * FROM company_profile WHERE user_id = ?";

      db.query(checkSql, [user_id], (err, result) => {
        if (err) {
          console.error("CHECK ERROR:", err);
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        if (result.length > 0) {
          // UPDATE existing row for same user
          const updateSql = `
            UPDATE company_profile
            SET
              legal_name = ?,
              address = ?,
              country = ?,
              phone = ?,
              email = ?,
              company_type = ?,
              company_size = ?,
              industry = ?,
              reg_number = ?,
              vat = ?,
              inc_date = ?,
              procurement_count = ?,
              about = ?,
              socials = ?,
              logo = COALESCE(?, logo),
              cover = COALESCE(?, cover)
            WHERE user_id = ?
          `;

          db.query(
            updateSql,
            [
              legalName || null,
              address || null,
              country || null,
              phone || null,
              email || null,
              type || null,
              size || null,
              JSON.stringify(parsedIndustry),
              regNumber || null,
              vat || null,
              incDate || null,
              procurementCount || 0,
              about || null,
              JSON.stringify(parsedSocials),
              logo,
              cover,
              user_id,
            ],
            (err) => {
              if (err) {
                console.error("UPDATE ERROR:", err);
                return res.status(500).json({
                  success: false,
                  error: err.message,
                });
              }

              return res.json({
                success: true,
                message: "Company updated",
              });
            }
          );
        } else {
          // INSERT new row
          const insertSql = `
            INSERT INTO company_profile (
              user_id,
              legal_name,
              address,
              country,
              phone,
              email,
              company_type,
              company_size,
              industry,
              reg_number,
              vat,
              inc_date,
              procurement_count,
              about,
              socials,
              logo,
              cover
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertSql,
            [
              user_id,
              legalName || null,
              address || null,
              country || null,
              phone || null,
              email || null,
              type || null,
              size || null,
              JSON.stringify(parsedIndustry),
              regNumber || null,
              vat || null,
              incDate || null,
              procurementCount || 0,
              about || null,
              JSON.stringify(parsedSocials),
              logo,
              cover,
            ],
            (err, result) => {
              if (err) {
                console.error("INSERT ERROR:", err);
                return res.status(500).json({
                  success: false,
                  error: err.message,
                });
              }

              return res.json({
                success: true,
                message: "Company created",
                id: result.insertId,
              });
            }
          );
        }
      });
    } catch (error) {
      console.error("SERVER ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET ALL
router.get("/", (req, res) => {
  const sql = "SELECT * FROM company_profile ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("FETCH ERROR:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  });
});

// GET latest company profile
router.get("/latest", (req, res) => {
  const sql = "SELECT * FROM company_profile ORDER BY id DESC LIMIT 1";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("FETCH ERROR:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No company profile found",
      });
    }

    return res.json({
      success: true,
      data: result[0],
    });
  });
});

// GET company profile by user_id
router.get("/me", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  const sql = "SELECT * FROM company_profile WHERE user_id = ? LIMIT 1";

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("FETCH ERROR:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "No company profile found",
      });
    }

    return res.json({
      success: true,
      data: result[0],
    });
  });
});

// UPDATE company profile by id
router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { id } = req.params;

      const {
        legalName,
        address,
        country,
        phone,
        email,
        type,
        size,
        industry,
        regNumber,
        vat,
        incDate,
        procurementCount,
        about,
        socials,
      } = req.body;

      const logo = req.files?.logo?.[0]?.filename || null;
      const cover = req.files?.cover?.[0]?.filename || null;

      let parsedIndustry = [];
      let parsedSocials = {};

      try {
        parsedIndustry = industry ? JSON.parse(industry) : [];
      } catch (e) {
        parsedIndustry = [];
      }

      try {
        parsedSocials = socials ? JSON.parse(socials) : {};
      } catch (e) {
        parsedSocials = {};
      }

      const sql = `
        UPDATE company_profile
        SET
          legal_name = ?,
          address = ?,
          country = ?,
          phone = ?,
          email = ?,
          company_type = ?,
          company_size = ?,
          industry = ?,
          reg_number = ?,
          vat = ?,
          inc_date = ?,
          procurement_count = ?,
          about = ?,
          socials = ?,
          logo = COALESCE(?, logo),
          cover = COALESCE(?, cover)
        WHERE id = ?
      `;

      const values = [
        legalName || null,
        address || null,
        country || null,
        phone || null,
        email || null,
        type || null,
        size || null,
        JSON.stringify(parsedIndustry),
        regNumber || null,
        vat || null,
        incDate || null,
        procurementCount || 0,
        about || null,
        JSON.stringify(parsedSocials),
        logo,
        cover,
        id,
      ];

      db.query(sql, values, (err) => {
        if (err) {
          console.error("UPDATE ERROR:", err);
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        return res.json({
          success: true,
          message: "Company updated successfully",
        });
      });
    } catch (error) {
      console.error("SERVER ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;