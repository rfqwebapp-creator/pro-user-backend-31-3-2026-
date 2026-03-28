const db = require("../config/db");
// GET subscriptions
exports.getSubscriptions = async (req, res) => {
  const userId = req.user.id;

  const [rows] = await db.query(
    
    "SELECT event, is_enabled FROM email_subscriptions WHERE user_id = ?",
    [userId]
  );

  res.json(rows);
};

// UPDATE subscriptions
exports.updateSubscriptions = async (req, res) => {
  const userId = req.user.id;
  const data = req.body;

  try {
    for (const item of data) {
      await db.query(
        `INSERT INTO email_subscriptions (user_id, event, is_enabled)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_enabled = ?`,
        [userId, item.event, item.is_enabled, item.is_enabled]
      );
    }

    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving data" });
  }
};