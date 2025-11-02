import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import productRoutes from "./routes/products.js";
import adminRoutes from "./routes/admin.js";
import virtualTryOnRoutes from "./routes/virtualTryOn.js";

dotenv.config();

const app = express();

// ============================
// ✅ CORS Configuration
// ============================
const allowedOrigins = [
  "http://localhost:5173",                      // for local dev
  "virtual-xf5n-git-main-abhigandhi250-gmailcoms-projects.vercel.app",      // replace with your real frontend domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed from this origin"), false);
      }
    },
    credentials: true,
  })
);

// ============================
// ✅ Middleware
// ============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============================
// ✅ MongoDB Connection
// ============================
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/virtual-tryon")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// ============================
// ✅ Routes
// ============================
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/virtual-tryon", virtualTryOnRoutes);

// ============================
// ✅ API Docs (for testing)
// ============================
app.get("/api/docs", (req, res) => {
  res.json({
    name: "Virtual Try-On API",
    version: "1.0.0",
    endpoints: {
      products: {
        "GET /api/products": "Get all products",
        "GET /api/products/:id": "Get single product",
        "POST /api/products/sync": "Sync from Shopify",
        "POST /api/products/batch": "Get multiple products",
      },
      virtualTryOn: {
        "POST /api/virtual-tryon/process": "Process image with AI",
      },
      admin: {
        "POST /api/admin/login": "Admin login",
        "GET /api/admin/analytics": "Get analytics (requires auth)",
        "GET /api/admin/products-analytics": "Get product analytics (requires auth)",
      },
      health: {
        "GET /api/health": "Backend health check",
      },
    },
  });
});

// ============================
// ✅ Health Check
// ============================
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend running successfully 🚀" });
});

// ============================
// ✅ Server
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});
