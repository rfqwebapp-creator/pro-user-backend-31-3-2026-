const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const companyRoutes = require("./routes/companyRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

app.use("/api/company", companyRoutes);
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/subscriptions", subscriptionRoutes);
app.use((req, res, next) => {
  req.user = { id: 1 }; // temporary user
  next();
});

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});