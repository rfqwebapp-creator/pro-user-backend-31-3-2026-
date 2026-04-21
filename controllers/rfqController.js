const db = require("../config/db");

// CREATE RFQ
exports.createRFQ = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const userId = req.user.id;

    const {
      heading,
      description,
      procurementType,
      requisitionType,
      bidType,
      purpose,
      evaluationMethod,
      classification,
      publishDate,
      closingDate,
      selectedIndustry,
      selectedSubItems = [],
      items = [],
      itemDescriptionNote,
      documents = [],
      deliveryTime,
      paymentTerms,
      supplierOption,
      searchSupplierText,
      inviteEmails = [],
      rfxVisibility,
      status,
    } = req.body;
    const finalStatus = status || "DRAFT";

    const [rfqResult] = await conn.query(
      `INSERT INTO rfqs (
        user_id,
        heading,
        description,
        procurement_type,
        requisition_type,
        bid_type,
        purpose,
        evaluation_method,
        classification,
        publish_date,
        closing_date,
        selected_industry,
        item_description_note,
        delivery_time,
        payment_terms,
        supplier_option,
        search_supplier_text,
        rfx_visibility,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        heading || "",
        description || "",
        procurementType || "",
        requisitionType || "",
        bidType || "",
        purpose || "",
        evaluationMethod || "",
        classification || "",
        publishDate || null,
        closingDate || null,
        selectedIndustry || "",
        itemDescriptionNote || "",
        deliveryTime || "",
        paymentTerms || "",
        supplierOption || "",
        searchSupplierText || "",
        rfxVisibility || "",
        finalStatus,
      ]
    );

    const rfqId = rfqResult.insertId;

    // items
    for (const item of items) {
      await conn.query(
        `INSERT INTO rfq_items (rfq_id, sl_no, item_description, quantity, unit)
         VALUES (?, ?, ?, ?, ?)`,
        [
          rfqId,
          item.slNo || null,
          item.itemDescription || "",
          item.quantity || "",
          item.unit || "",
        ]
      );
    }

    // documents
    for (const doc of documents) {
      await conn.query(
        `INSERT INTO rfq_documents (rfq_id, name, url, file_path)
         VALUES (?, ?, ?, ?)`,
        [
          rfqId,
          doc.name || "",
          doc.url || "",
          doc.file_path || "",
        ]
      );
    }

    // invite emails
    for (const email of inviteEmails) {
      if (email && email.trim()) {
        await conn.query(
          `INSERT INTO rfq_invite_emails (rfq_id, email)
           VALUES (?, ?)`,
          [rfqId, email]
        );
      }
    }

    // selected sub items
    for (const subItem of selectedSubItems) {
      await conn.query(
        `INSERT INTO rfq_sub_items (rfq_id, sub_item)
         VALUES (?, ?)`,
        [rfqId, subItem]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      rfqId,
    });
  } catch (error) {
    await conn.rollback();
    console.error("CREATE RFQ ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create RFQ",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

// GET ALL / FILTER BY STATUS
exports.getRFQs = async (req, res) => {
  
  try {
    const userId = req.user.id; 
    const { status } = req.query;

    let sql = `
      SELECT 
  id, 
  heading, 
  requisition_type, 
  purpose, 
  UPPER(TRIM(status)) AS status,
  created_at
FROM rfqs 
WHERE user_id = ?
    `;
    let params = [userId];

    if (status && status !== "ALL") {
  sql += ` AND UPPER(TRIM(status)) = ?`;
  params.push(status.toUpperCase());
}

    sql += ` ORDER BY id DESC`;

    console.log("📋 GETRFQS QUERY:", sql);
    console.log("📋 GETRFQS PARAMS:", params);
    
    const [rows] = await db.promise().query(sql, params);

    console.log("📋 GETRFQS RESULT COUNT:", rows.length);
    rows.forEach((row, i) => {
      console.log(`📋 Row ${i}: id=${row.id}, status="${row.status}" (type: ${typeof row.status})`);
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET RFQS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch RFQs",
      error: error.message,
    });
  }
};

// GET SINGLE RFQ
exports.getRFQById = async (req, res) => {
  try {
    const { id } = req.params;

   const userId = req.user.id;

const [rfqRows] = await db.promise().query(
  `SELECT * FROM rfqs WHERE id = ? AND user_id = ?`,
  [id, userId]
);

    if (rfqRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const [items] = await db.promise().query(
      `SELECT * FROM rfq_items WHERE rfq_id = ? ORDER BY sl_no ASC`,
      [id]
    );

    const [documents] = await db.promise().query(
      `SELECT * FROM rfq_documents WHERE rfq_id = ?`,
      [id]
    );

    const [emails] = await db.promise().query(
      `SELECT * FROM rfq_invite_emails WHERE rfq_id = ?`,
      [id]
    );

    const [subItems] = await db.promise().query(
      `SELECT * FROM rfq_sub_items WHERE rfq_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rfqRows[0],
        items,
        documents,
       inviteEmails: emails.map((e) => e.email),
selectedSubItems: subItems.map((s) => s.sub_item),
      },
    });
  } catch (error) {
    console.error("GET RFQ BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch RFQ",
      error: error.message,
    });
  }
};

// UPDATE STATUS
exports.updateRFQStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "DRAFT",
      "IN_REVIEW",
      "PURCHASE_ORDER_ISSUED",
      "ACCEPTED",
      "REJECTED",
      "DELIVERY_PENDING",
      "SHIPMENT_RECEIVED",
      "INVOICE_RECEIVED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const [result] = await db.promise().query(
      `UPDATE rfqs SET status = ? WHERE id = ?`,
      [status, id]
    );

    res.json({
      success: true,
      message: "RFQ status updated successfully",
      result,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};


// UPDATE RFQ
exports.updateRFQ = async (req, res) => {
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const userId = req.user.id;

    const {
      heading,
      description,
      procurementType,
      requisitionType,
      bidType,
      purpose,
      evaluationMethod,
      classification,
      publishDate,
      closingDate,
      selectedIndustry,
      selectedSubItems = [],
      items = [],
      itemDescriptionNote,
      documents = [],
      deliveryTime,
      paymentTerms,
      supplierOption,
      searchSupplierText,
      inviteEmails = [],
      rfxVisibility,
    } = req.body;

    // 🔹 Update main RFQ
    await conn.query(
      `UPDATE rfqs SET
        heading = ?,
        description = ?,
        procurement_type = ?,
        requisition_type = ?,
        bid_type = ?,
        purpose = ?,
        evaluation_method = ?,
        classification = ?,
        publish_date = ?,
        closing_date = ?,
        selected_industry = ?,
        item_description_note = ?,
        delivery_time = ?,
        payment_terms = ?,
        supplier_option = ?,
        search_supplier_text = ?,
        rfx_visibility = ?
      WHERE id = ? AND user_id = ?`,
      [
        heading,
        description,
        procurementType,
        requisitionType,
        bidType,
        purpose,
        evaluationMethod,
        classification,
        publishDate,
        closingDate,
        selectedIndustry,
        itemDescriptionNote,
        deliveryTime,
        paymentTerms,
        supplierOption,
        searchSupplierText,
        rfxVisibility,
        id,
        userId,
      ]
    );

    // 🔥 OLD DATA DELETE (IMPORTANT)
    await conn.query(`DELETE FROM rfq_items WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_documents WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_invite_emails WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_sub_items WHERE rfq_id = ?`, [id]);

    // 🔹 INSERT UPDATED ITEMS
    for (const item of items) {
      await conn.query(
        `INSERT INTO rfq_items (rfq_id, sl_no, item_description, quantity, unit)
         VALUES (?, ?, ?, ?, ?)`,
        [id, item.slNo, item.itemDescription, item.quantity, item.unit]
      );
    }

    // 🔹 DOCUMENTS
    for (const doc of documents) {
      await conn.query(
        `INSERT INTO rfq_documents (rfq_id, name, url)
         VALUES (?, ?, ?)`,
        [id, doc.name, doc.url]
      );
    }

    // 🔹 EMAILS
    for (const email of inviteEmails) {
      await conn.query(
        `INSERT INTO rfq_invite_emails (rfq_id, email)
         VALUES (?, ?)`,
        [id, email]
      );
    }

    // 🔹 SUB ITEMS
    for (const sub of selectedSubItems) {
      await conn.query(
        `INSERT INTO rfq_sub_items (rfq_id, sub_item)
         VALUES (?, ?)`,
        [id, sub]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "RFQ updated successfully",
    });
  } catch (error) {
    await conn.rollback();
    console.error("UPDATE RFQ ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update RFQ",
    });
  } finally {
    conn.release();
  }
};


// CANCEL RFQ
exports.cancelRFQ = async (req, res) => {
  try {
    console.log("✅ CANCEL CONTROLLER HIT");
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📋 CANCEL RFQ ID: ${id}, USER ID: ${userId}`);

    const [result] = await db.promise().query(
      `UPDATE rfqs SET status = 'CANCELLED' WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    console.log(`📋 CANCEL UPDATE AFFECTED ROWS: ${result.affectedRows}`);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    // Verify the update was saved
    const [verify] = await db.promise().query(
      `SELECT id, status FROM rfqs WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    console.log(`📋 CANCEL VERIFY - RFQ Status in DB: "${verify[0]?.status}" (type: ${typeof verify[0]?.status})`);

    res.json({
      success: true,
      message: "RFQ cancelled successfully",
      data: {
        id,
        status: verify[0]?.status ?? 'CANCELLED'
      }
    });
  } catch (error) {
    console.error("CANCEL RFQ ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel RFQ",
    });
  }
};