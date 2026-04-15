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

if (!fs.existsSync(uploadBaseDir)) fs.mkdirSync(uploadBaseDir);
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

// SAVE COMPANY PROFILE
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
        INSERT INTO company_profiles (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("❌ Insert error:", err);
          return res.status(500).json({
            success: false,
            message: "Database insert failed",
            error: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Company profile saved successfully",
          id: result.insertId,
        });
      });
    } catch (error) {
      console.error("❌ Server error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// GET ALL
router.get("/", (req, res) => {
  const sql = "SELECT * FROM company_profiles ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Fetch error:", err);
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

module.exports = router;