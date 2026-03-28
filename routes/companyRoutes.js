const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ CREATE uploads FOLDER IF NOT EXISTS
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ MULTER STORAGE CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ CREATE COMPANY
router.post(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      console.log("📦 BODY:", req.body);
      console.log("📁 FILES:", req.files);

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
        ndaRequired,
        vendorFormRequired,
      } = req.body;

      // ✅ SAFE PARSE SOCIALS
      let parsedSocials = {};
      try {
        parsedSocials =
          typeof socials === "string"
            ? JSON.parse(socials)
            : socials || {};
      } catch (e) {
        parsedSocials = {};
      }

      // ✅ SAFE INDUSTRY
      const industryData =
        typeof industry === "string"
          ? industry
          : JSON.stringify(industry);

      // ✅ BOOLEAN FIX
      const nda =
        ndaRequired === "true" || ndaRequired === "on" ? 1 : 0;

      const vendor =
        vendorFormRequired === "true" || vendorFormRequired === "on"
          ? 1
          : 0;

      // ✅ FILES
      const logo = req.files?.logo?.[0]?.filename || null;
      const cover = req.files?.cover?.[0]?.filename || null;

      // ✅ SQL QUERY
      const sql = `
        INSERT INTO company_profile 
        (legal_name, address, country, phone, email, type, size, industry, reg_number, vat, inc_date, procurement_count, about, linkedin, twitter, facebook, instagram, youtube, nda_required, vendor_form_required, logo, cover_image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          legalName,
          address,
          country,
          phone,
          email,
          type,
          size,
          industryData,
          regNumber,
          vat,
          incDate || null,
          procurementCount,
          about,
          parsedSocials.linkedin || null,
          parsedSocials.twitter || null,
          parsedSocials.facebook || null,
          parsedSocials.instagram || null,
          parsedSocials.youtube || null,
          nda,
          vendor,
          logo,
          cover,
        ],
        (err, result) => {
          if (err) {
            console.error("❌ DB ERROR:", err);
            return res.status(500).json({ error: err.message });
          }

          res.json({
            message: "✅ Company created successfully",
            id: result.insertId,
          });
        }
      );
    } catch (error) {
      console.error("❌ SERVER ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ GET COMPANY BY ID
router.get("/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT * FROM company_profile WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ DB ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json(result[0]);
    }
  );
});

// ✅ UPDATE COMPANY
router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  (req, res) => {
    const id = req.params.id;

    try {
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
        ndaRequired,
        vendorFormRequired,
      } = req.body;

      let parsedSocials = {};
      try {
        parsedSocials =
          typeof socials === "string"
            ? JSON.parse(socials)
            : socials || {};
      } catch {
        parsedSocials = {};
      }

      const industryData =
        typeof industry === "string"
          ? industry
          : JSON.stringify(industry);

      const nda =
        ndaRequired === "true" || ndaRequired === "on" ? 1 : 0;

      const vendor =
        vendorFormRequired === "true" || vendorFormRequired === "on"
          ? 1
          : 0;

      const logo = req.files?.logo?.[0]?.filename;
      const cover = req.files?.cover?.[0]?.filename;

      const sql = `
        UPDATE company_profile SET
        legal_name=?, address=?, country=?, phone=?, email=?, type=?, size=?, industry=?, reg_number=?, vat=?, inc_date=?, procurement_count=?, about=?, linkedin=?, twitter=?, facebook=?, instagram=?, youtube=?, nda_required=?, vendor_form_required=?,
        ${logo ? "logo=?," : ""}
        ${cover ? "cover_image=?," : ""}
        updated_at = NOW()
        WHERE id=?
      `;

      const values = [
        legalName,
        address,
        country,
        phone,
        email,
        type,
        size,
        industryData,
        regNumber,
        vat,
        incDate || null,
        procurementCount,
        about,
        parsedSocials.linkedin || null,
        parsedSocials.twitter || null,
        parsedSocials.facebook || null,
        parsedSocials.instagram || null,
        parsedSocials.youtube || null,
        nda,
        vendor,
      ];

      if (logo) values.push(logo);
      if (cover) values.push(cover);

      values.push(id);

      db.query(sql, values, (err) => {
        if (err) {
          console.error("❌ UPDATE ERROR:", err);
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: "✅ Company updated successfully" });
      });
    } catch (error) {
      console.error("❌ SERVER ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;