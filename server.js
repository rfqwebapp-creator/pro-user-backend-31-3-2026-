require("dotenv").config();

const express = require("express");
const db = require("./config/db");
const cors = require("cors");

const app = express();

// ✅ CORS CONFIG (FINAL WORKING)
app.use(cors({
  origin: [
    "https://pro-user-frontend-31-03-2026-crgu.vercel.app",
    "https://pro-user-frontend-31-03-2026-kkr9.vercel.app",
    "https://www.procubid.com",
    "https://procubid.com",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Middleware
app.use(express.json());

// ✅ Request logging (debug)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ✅ Routes
const companyRoutes = require("./routes/companyRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const authRoutes = require("./routes/authRoutes")(db);

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes); // ✅ removed duplicate
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/subscriptions", subscriptionRoutes);

// ✅ Temporary user middleware
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// ✅ Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



// require("dotenv").config();

// const express = require("express");
// const db = require("./config/db");
// const cors = require("cors");

// const app = express();

// // Configure CORS to allow Vercel frontend and proxied requests
// const allowedOrigins = [
//   "https://pro-user-frontend-31-03-2026-crgu.vercel.app",
//   "https://pro-user-frontend-31-03-2026-kkr9.vercel.app",
//   "https://www.procubid.com",
//   "https://procubid.com",
//   "http://localhost:5173",
//   "http://localhost:3000",
//   "http://localhost:5001"
// ];

// // app.use(cors({
// //   origin: function(origin, callback) {
// //     // Allow requests with no origin (like mobile apps, curl requests)
// //     // Also allow requests from whitelisted origins
// //     if (!origin || allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       // Still process the request, just won't include CORS headers
// //       console.log(`⚠️ CORS origin not whitelisted: ${origin}`);
// //       callback(null, true);
// //     }
// //   },
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.options("*", cors());
// app.use(express.json());

// // Request logging middleware - helps debug API calls
// app.use((req, res, next) => {
//   console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
//   next();
// });

// const companyRoutes = require("./routes/companyRoutes");
// const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const authRoutes = require("./routes/authRoutes")(db);


// app.use("/api/auth", authRoutes);
// app.use("/api/company", companyRoutes);
// app.use("/api/company", companyRoutes);
// app.use("/api/roles", require("./routes/roleRoutes"));
// app.use("/api/subscriptions", subscriptionRoutes);
// app.use((req, res, next) => {
//   req.user = { id: 1 }; // temporary user
//   next();
// });

// app.get("/", (req, res) => {
//   res.send("API Running...");
// });

// const PORT = process.env.PORT || 5001;

// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on http://localhost:${PORT}`);
// // });
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });