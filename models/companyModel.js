const db = require("../config/db");

const Company = {
  create: (data, callback) => {
    const sql = `
      INSERT INTO company_profile SET ?
    `;
    db.query(sql, data, callback);
  },

  getById: (id, callback) => {
    db.query("SELECT * FROM company_profile WHERE id = ?", [id], callback);
  },

  update: (id, data, callback) => {
    db.query("UPDATE company_profile SET ? WHERE id = ?", [data, id], callback);
  }
};

module.exports = Company;