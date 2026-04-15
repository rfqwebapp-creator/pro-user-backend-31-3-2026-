require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const path = require("path");
const app = express();

const allowedOrigins = [
  "https://www.procubid.com",
  "https://procubid.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

// Allow Vercel preview + production domains safely
app.use(cors({
  origin: function (origin, callback) {
    // allow requests without origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());

// Parse JSON
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON raw body:", req.rawBody);
    return res.status(400).json({
      message: "Invalid JSON body",
      rawBody: req.rawBody
    });
  }
  next(err);
});
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health routes
app.get("/", (req, res) => {
  res.send("API Running...");
});

app.get("/api", (req, res) => {
  res.status(200).json({ message: "API running" });
});

app.head("/api", (req, res) => {
  res.sendStatus(200);
});

// Temporary user middleware
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

// Routes
const companyRoutes = require("./routes/companyRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const authRoutes = require("./routes/authRoutes")(db);


const companyInfoRoutes = require("./routes/companyInfoRoutes");
app.use("/api/company-info", companyInfoRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/subscriptions", subscriptionRoutes);

// Handle invalid JSON body errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON received:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body"
    });
  }
  next(err);
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// require("dotenv").config();

// const express = require("express");
// const db = require("./config/db");
// const cors = require("cors");

// const app = express();

// // ✅ CORS CONFIG (FINAL WORKING)
// app.use(cors({
//   origin: [
//     "https://pro-user-frontend-31-03-2026-crgu.vercel.app",
//     "https://pro-user-frontend-31-03-2026-kkr9.vercel.app",
//     "https://www.procubid.com",
//     "https://api.procubid.com",
//     "https://procubid.com",
//     "http://localhost:5173"
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true
// }));

// // ✅ Handle preflight manually (SAFE)
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Origin", req.headers.origin);
//     res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     return res.sendStatus(200);
//   }
//   next();
// });

// // ✅ Middleware
// app.use(express.json());

// // ✅ Request logging (debug)
// app.use((req, res, next) => {
//   console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
//   next();
// });

// // ✅ Routes
// const companyRoutes = require("./routes/companyRoutes");
// const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const authRoutes = require("./routes/authRoutes")(db);

// app.use("/api/auth", authRoutes);
// app.use("/api/company", companyRoutes); // ✅ removed duplicate
// app.use("/api/roles", require("./routes/roleRoutes"));
// app.use("/api/subscriptions", subscriptionRoutes);

// // ✅ Temporary user middleware
// app.use((req, res, next) => {
//   req.user = { id: 1 };
//   next();
// });

// // ✅ Root route
// app.get("/", (req, res) => {
//   res.send("API Running...");
// });

// // ✅ Start server
// const PORT = process.env.PORT || 5001;

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });



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