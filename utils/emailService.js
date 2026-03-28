const db = require("../db");

async function shouldSendEmail(userId, event) {
  const [rows] = await db.query(
    "SELECT is_enabled FROM email_subscriptions WHERE user_id = ? AND event = ?",
    [userId, event]
  );

  return rows.length && rows[0].is_enabled;
}

module.exports = { shouldSendEmail };