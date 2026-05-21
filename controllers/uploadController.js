import path from "path";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// POST /api/upload/image
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);

  const fileUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
  });
});

// DELETE /api/upload/:filename
export const deleteImage = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), "uploads", filename);

  if (!fs.existsSync(filePath)) throw new AppError("File not found", 404);

  fs.unlinkSync(filePath);
  res.json({ success: true, message: "File deleted" });
});
