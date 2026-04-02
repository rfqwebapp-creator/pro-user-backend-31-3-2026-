
require("dotenv").config();

const express = require("express");
const db = require("./config/db");
const cors = require("cors");

const app = express();

// Configure CORS to allow Vercel frontend
const allowedOrigins = [
  "https://pro-user-frontend-31-03-2026-crgu.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logging middleware - helps debug API calls
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

const companyRoutes = require("./routes/companyRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const authRoutes = require("./routes/authRoutes")(db);


app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
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

const PORT = process.env.PORT || 5001;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});