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
      SELECT id, heading, requisition_type, purpose, status, created_at
      FROM rfqs WHERE user_id = ?
    `;
    let params = [userId];

    if (status && status !== "ALL") {
  sql += ` AND status = ?`;
  params.push(status);
}

    sql += ` ORDER BY id DESC`;

    const [rows] = await db.promise().query(sql, params);

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