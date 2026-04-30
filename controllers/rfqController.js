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
      costCenters = [],
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
        cost_centers,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
       
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
        JSON.stringify(costCenters || []),
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

    // Get unique status values for debugging
    const [uniqueStatuses] = await db.promise().query(
      `SELECT DISTINCT status FROM rfqs LIMIT 20`
    );
    console.log(`📋 UNIQUE STATUS VALUES IN DB:`, uniqueStatuses.map(r => `"${r.status}"`));

    let sql = `
      SELECT 
        id, 
        heading, 
        requisition_type, 
        purpose, 
        status,
        created_at
      FROM rfqs 
      WHERE user_id = ?
    `;
    let params = [userId];

    if (status && status !== "ALL") {
      sql += ` AND UPPER(TRIM(COALESCE(status, ''))) = ?`;
      params.push(status.toUpperCase());
    }

    sql += ` ORDER BY id DESC`;

    console.log("📋 GETRFQS QUERY:", sql);
    console.log("📋 GETRFQS PARAMS:", params);
    
    const [rows] = await db.promise().query(sql, params);

    console.log("📋 GETRFQS RESULT COUNT:", rows.length);
    rows.forEach((row, i) => {
      console.log(`📋 Row ${i}: id=${row.id}, raw_status="${row.status}" (type: ${typeof row.status}, length: ${row.status?.length ?? 0})`);
    });
    
    // Process rows to normalize status values
    const processedRows = rows.map(row => {
      let normalizedStatus = null;
      
      if (row.status) {
        const trimmed = String(row.status).trim();
        if (trimmed) {
          normalizedStatus = trimmed.toUpperCase();
        }
      }
      
      console.log(`📋 PROCESSING: id=${row.id}, raw="${row.status}" → normalized="${normalizedStatus}"`);
      
      return {
        ...row,
        status: normalizedStatus
      };
    });
    
    console.log("📋 PROCESSED ROWS (after normalization):");
    processedRows.forEach((row, i) => {
      console.log(`📋 Row ${i}: id=${row.id}, normalized_status="${row.status}" (type: ${typeof row.status})`);
    });

    res.json({
      success: true,
      data: processedRows,
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
        costCenters: rfqRows[0].cost_centers
    ? JSON.parse(rfqRows[0].cost_centers)
    : [],
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
// exports.updateRFQ = async (req, res) => {
//   const conn = await db.promise().getConnection();

//   try {
//     await conn.beginTransaction();

//     const { id } = req.params;
//     const userId = req.user.id;

//     const {
//       heading,
//       description,
//       procurementType,
//       requisitionType,
//       bidType,
//       purpose,
//       evaluationMethod,
//       classification,
//       publishDate,
//       closingDate,
//       selectedIndustry,
//       selectedSubItems = [],
//       items = [],
//       itemDescriptionNote,
//       documents = [],
//       deliveryTime,
//       paymentTerms,
//       supplierOption,
//       searchSupplierText,
//       inviteEmails = [],
//       rfxVisibility,
//     } = req.body;

//     // 🔹 Update main RFQ
//     await conn.query(
//       `UPDATE rfqs SET
//         heading = ?,
//         description = ?,
//         procurement_type = ?,
//         requisition_type = ?,
//         bid_type = ?,
//         purpose = ?,
//         evaluation_method = ?,
//         classification = ?,
//         publish_date = ?,
//         closing_date = ?,
//         selected_industry = ?,
//         item_description_note = ?,
//         delivery_time = ?,
//         payment_terms = ?,
//         supplier_option = ?,
//         search_supplier_text = ?,
//         rfx_visibility = ?
//       WHERE id = ? AND user_id = ?`,
//       [
//         heading,
//         description,
//         procurementType,
//         requisitionType,
//         bidType,
//         purpose,
//         evaluationMethod,
//         classification,
//         publishDate,
//         closingDate,
//         selectedIndustry,
//         itemDescriptionNote,
//         deliveryTime,
//         paymentTerms,
//         supplierOption,
//         searchSupplierText,
//         rfxVisibility,
//         id,
//         userId,
//       ]
//     );

//     // 🔥 OLD DATA DELETE (IMPORTANT)
//     await conn.query(`DELETE FROM rfq_items WHERE rfq_id = ?`, [id]);
//     await conn.query(`DELETE FROM rfq_documents WHERE rfq_id = ?`, [id]);
//     await conn.query(`DELETE FROM rfq_invite_emails WHERE rfq_id = ?`, [id]);
//     await conn.query(`DELETE FROM rfq_sub_items WHERE rfq_id = ?`, [id]);

//     // 🔹 INSERT UPDATED ITEMS
//     for (const item of items) {
//       await conn.query(
//         `INSERT INTO rfq_items (rfq_id, sl_no, item_description, quantity, unit)
//          VALUES (?, ?, ?, ?, ?)`,
//         [id, item.slNo, item.itemDescription, item.quantity, item.unit]
//       );
//     }

//     // 🔹 DOCUMENTS
//     for (const doc of documents) {
//       await conn.query(
//         `INSERT INTO rfq_documents (rfq_id, name, url)
//          VALUES (?, ?, ?)`,
//         [id, doc.name, doc.url]
//       );
//     }

//     // 🔹 EMAILS
//     for (const email of inviteEmails) {
//       await conn.query(
//         `INSERT INTO rfq_invite_emails (rfq_id, email)
//          VALUES (?, ?)`,
//         [id, email]
//       );
//     }

//     // 🔹 SUB ITEMS
//     for (const sub of selectedSubItems) {
//       await conn.query(
//         `INSERT INTO rfq_sub_items (rfq_id, sub_item)
//          VALUES (?, ?)`,
//         [id, sub]
//       );
//     }

//     await conn.commit();

//     res.json({
//       success: true,
//       message: "RFQ updated successfully",
//     });
//   } catch (error) {
//     await conn.rollback();
//     console.error("UPDATE RFQ ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update RFQ",
//     });
//   } finally {
//     conn.release();
//   }
// };
// UPDATE RFQ (WITH STATUS SUPPORT)
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
      costCenters = [],
      status, // ✅ ADDED
    } = req.body;

    // 🔹 Update main RFQ (NOW INCLUDING STATUS)
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
        rfx_visibility = ?,
        cost_centers = ?,
        status = ?   -- ✅ ADDED
      WHERE id = ? AND user_id = ?`,
      [
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
        JSON.stringify(costCenters || []),
        status || "DRAFT", // ✅ DEFAULT
        id,
        userId,
      ]
    );

    // 🔥 DELETE OLD RELATED DATA
    await conn.query(`DELETE FROM rfq_items WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_documents WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_invite_emails WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_sub_items WHERE rfq_id = ?`, [id]);

    // 🔹 INSERT UPDATED ITEMS
    for (const item of items) {
      await conn.query(
        `INSERT INTO rfq_items (rfq_id, sl_no, item_description, quantity, unit)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          item.slNo || null,
          item.itemDescription || "",
          item.quantity || "",
          item.unit || "",
        ]
      );
    }

    // 🔹 INSERT DOCUMENTS
    for (const doc of documents) {
      await conn.query(
        `INSERT INTO rfq_documents (rfq_id, name, url)
         VALUES (?, ?, ?)`,
        [
          id,
          doc.name || "",
          doc.url || "",
        ]
      );
    }

    // 🔹 INSERT EMAILS
    for (const email of inviteEmails) {
      if (email && email.trim()) {
        await conn.query(
          `INSERT INTO rfq_invite_emails (rfq_id, email)
           VALUES (?, ?)`,
          [id, email]
        );
      }
    }

    // 🔹 INSERT SUB ITEMS
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
      error: error.message,
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

    // STEP 1: Fetch current status BEFORE update
    const [beforeUpdate] = await db.promise().query(
      `SELECT id, status, user_id FROM rfqs WHERE id = ?`,
      [id]
    );
    
    console.log(`📋 BEFORE UPDATE - RFQ ID ${id}: status="${beforeUpdate[0]?.status}", user_id=${beforeUpdate[0]?.user_id}`);

    // STEP 2: Execute UPDATE with explicit CANCELLED value
    const [result] = await db.promise().query(
      `UPDATE rfqs SET status = ? WHERE id = ? AND user_id = ?`,
      ['CANCELLED', id, userId]
    );

    console.log(`📋 CANCEL UPDATE AFFECTED ROWS: ${result.affectedRows}`);
    console.log(`📋 UPDATE RESULT - changed_rows: ${result.changedRows}, affected_rows: ${result.affectedRows}`);

    if (result.affectedRows === 0) {
      console.log(`❌ NO ROWS UPDATED! Checking why...`);
      console.log(`   - ID: ${id}`);
      console.log(`   - USER_ID: ${userId}`);
      console.log(`   - Actual user_id in DB: ${beforeUpdate[0]?.user_id}`);
      
      return res.status(404).json({
        success: false,
        message: "RFQ not found or user mismatch",
        debug: {
          id,
          userId,
          actualUserId: beforeUpdate[0]?.user_id,
        }
      });
    }

    // STEP 3: Verify the update - fetch TWICE with different queries
    const [verify1] = await db.promise().query(
      `SELECT id, status FROM rfqs WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    console.log(`📋 VERIFY 1 (with user_id WHERE) - RFQ ID ${id}: status="${verify1[0]?.status}"`);
    
    // Also try without user_id filter
    const [verify2] = await db.promise().query(
      `SELECT id, status FROM rfqs WHERE id = ?`,
      [id]
    );
    
    console.log(`📋 VERIFY 2 (without user_id WHERE) - RFQ ID ${id}: status="${verify2[0]?.status}"`);

    // STEP 4: Check for triggers - get ALL columns
    if (!verify1[0]?.status || verify1[0]?.status === '') {
      console.warn(`⚠️ STATUS IS EMPTY AFTER UPDATE! Possible trigger or constraint.`);
      const [fullRow] = await db.promise().query(
        `SELECT * FROM rfqs WHERE id = ? LIMIT 1`,
        [id]
      );
      
      const columnNames = Object.keys(fullRow[0] || {});
      console.log(`📋 ALL COLUMNS for RFQ ${id}:`, columnNames);
      
      for (const col of columnNames) {
        console.log(`   ${col}: "${fullRow[0][col]}" (type: ${typeof fullRow[0][col]})`);
      }
    }

    const finalStatus = verify1[0]?.status || 'CANCELLED';
    
    res.json({
      success: true,
      message: "RFQ cancelled successfully",
      data: {
        id,
        status: finalStatus
      }
    });
  } catch (error) {
    console.error("❌ CANCEL RFQ ERROR:", error);
    console.error("❌ ERROR DETAILS:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: "Failed to cancel RFQ",
      error: error.message,
    });
  }
};

exports.getCostCenterSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.promise().query(
      `SELECT cost_centers FROM rfqs 
       WHERE user_id = ? AND cost_centers IS NOT NULL`,
      [userId]
    );

    const suggestions = [
      ...new Set(
        rows.flatMap((row) => {
          try {
            return JSON.parse(row.cost_centers || "[]");
          } catch {
            return [];
          }
        })
      ),
    ];

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("COST CENTER SUGGESTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cost centers",
    });
  }
};






// GET ALL COST CENTERS FROM LOGGED-IN USER RFQS
exports.getUserCostCenters = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.promise().query(
      `SELECT cost_centers FROM rfqs
       WHERE user_id = ? AND cost_centers IS NOT NULL`,
      [userId]
    );

    const costCenters = [
      ...new Set(
        rows.flatMap((row) => {
          try {
            return JSON.parse(row.cost_centers || "[]");
          } catch {
            return [];
          }
        }).filter(Boolean)
      ),
    ];

    res.json({ success: true, data: costCenters });
  } catch (error) {
    console.error("GET COST CENTERS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cost centers" });
  }
};

// ADD NEW COST CENTER
exports.addUserCostCenter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Cost center name required" });
    }

    // create one draft-like RFQ only to store standalone cost center
    await db.promise().query(
      `INSERT INTO rfqs (user_id, heading, cost_centers, status)
       VALUES (?, ?, ?, ?)`,
      [userId, "Cost Center Entry", JSON.stringify([name.trim()]), "DRAFT"]
    );

    res.json({ success: true, message: "Cost center added successfully" });
  } catch (error) {
    console.error("ADD COST CENTER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to add cost center" });
  }
};

// EDIT COST CENTER IN ALL USER RFQS
exports.updateUserCostCenter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldName, newName } = req.body;

    const [rows] = await db.promise().query(
      `SELECT id, cost_centers FROM rfqs
       WHERE user_id = ? AND cost_centers IS NOT NULL`,
      [userId]
    );

    for (const row of rows) {
      let arr = [];
      try {
        arr = JSON.parse(row.cost_centers || "[]");
      } catch {}

      if (arr.includes(oldName)) {
        arr = arr.map((cc) => cc === oldName ? newName.trim() : cc);

        await db.promise().query(
          `UPDATE rfqs SET cost_centers = ? WHERE id = ? AND user_id = ?`,
          [JSON.stringify([...new Set(arr)]), row.id, userId]
        );
      }
    }

    res.json({ success: true, message: "Cost center updated successfully" });
  } catch (error) {
    console.error("UPDATE COST CENTER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update cost center" });
  }
};

// DELETE COST CENTER FROM ALL USER RFQS
exports.deleteUserCostCenter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const [rows] = await db.promise().query(
      `SELECT id, cost_centers FROM rfqs
       WHERE user_id = ? AND cost_centers IS NOT NULL`,
      [userId]
    );

    for (const row of rows) {
      let arr = [];
      try {
        arr = JSON.parse(row.cost_centers || "[]");
      } catch {}

      if (arr.includes(name)) {
        arr = arr.filter((cc) => cc !== name);

        await db.promise().query(
          `UPDATE rfqs SET cost_centers = ? WHERE id = ? AND user_id = ?`,
          [JSON.stringify(arr), row.id, userId]
        );
      }
    }

    res.json({ success: true, message: "Cost center deleted successfully" });
  } catch (error) {
    console.error("DELETE COST CENTER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete cost center" });
  }
};