import express from "express";
import {
  getBlogs, getPublishedBlogs, getBlogStats,
  getBlogById, getBlogBySlug,
  createBlog, updateBlog,
  toggleStatus, toggleFeatured,
  deleteBlog, bulkAction,
} from "../controllers/blogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public routes ──────────────────────────────────────────
router.get("/published", getPublishedBlogs);
router.get("/public/:slug", getBlogBySlug);

// ── Protected admin routes ─────────────────────────────────
router.use(protect);

router.get("/", getBlogs);
router.get("/stats", getBlogStats);
router.get("/:id", getBlogById);

router.post("/", createBlog);
router.post("/bulk", bulkAction);

router.put("/:id", updateBlog);
router.patch("/:id/status", toggleStatus);
router.patch("/:id/featured", toggleFeatured);

router.delete("/:id", deleteBlog);

export default router;
