import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Security & parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
}, express.static("uploads"));

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Blog Admin Backend running on http://localhost:${PORT}`);
});
