import express from "express";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/image", upload.single("image"), uploadImage);
router.delete("/:filename", deleteImage);

export default router;
