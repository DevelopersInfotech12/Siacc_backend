import express from "express";
import { login, getMe, changePassword, seedAdmin } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/seed", seedAdmin); // Remove in production after first use

export default router;
