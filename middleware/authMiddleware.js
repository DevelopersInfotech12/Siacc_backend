import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) throw new AppError("Not authorized — no token", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");
    if (!req.admin || !req.admin.isActive) throw new AppError("Admin account not found or inactive", 401);
    next();
  } catch (err) {
    throw new AppError("Not authorized — invalid token", 401);
  }
});

export const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== "superadmin") {
    throw new AppError("Superadmin access required", 403);
  }
  next();
};
