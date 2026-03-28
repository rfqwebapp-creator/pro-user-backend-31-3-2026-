const Company = require("../models/companyModel");

exports.createCompany = (req, res) => {
  const data = req.body;

  Company.create(data, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Company created", id: result.insertId });
  });
};

exports.getCompany = (req, res) => {
  const id = req.params.id;

  Company.getById(id, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
};

exports.updateCompany = (req, res) => {
  const id = req.params.id;
  const data = req.body;

  Company.update(id, data, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Company updated" });
  });
};