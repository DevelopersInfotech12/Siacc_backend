import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !admin.isActive) throw new AppError("Invalid credentials", 401);

  const isMatch = await admin.matchPassword(password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  res.json({
    success: true,
    token: generateToken(admin._id),
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError("Both passwords required", 400);
  if (newPassword.length < 6) throw new AppError("Password must be at least 6 characters", 400);

  const admin = await Admin.findById(req.admin._id).select("+password");
  const isMatch = await admin.matchPassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  admin.password = newPassword;
  await admin.save();

  res.json({ success: true, message: "Password updated successfully" });
});

// POST /api/auth/seed — creates first admin (disable in production after use)
export const seedAdmin = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    throw new AppError("Seed not available in production", 403);
  }
  const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (exists) return res.json({ success: true, message: "Admin already exists" });

  await Admin.create({
    name: "Super Admin",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "superadmin",
  });

  res.status(201).json({ success: true, message: "Admin created. Please change password after first login." });
});