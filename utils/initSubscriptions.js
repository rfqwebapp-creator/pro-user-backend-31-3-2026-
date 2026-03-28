const db = require("../db");
const EVENTS = require("../constants/events");

async function createDefaultSubscriptions(userId) {
  for (const event of EVENTS) {
    await db.query(
      `INSERT IGNORE INTO email_subscriptions (user_id, event, is_enabled)
       VALUES (?, ?, true)`,
      [userId, event]
    );
  }
}

module.exports = createDefaultSubscriptions;