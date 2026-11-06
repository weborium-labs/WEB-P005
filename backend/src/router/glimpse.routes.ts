import { Router } from "express";
import {
  addGlimpses,
  getAllGlimpses,
  deleteGlimpse,
} from "../controller/glimpse.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { uploadGlimpseImages } from "../middlewares/upload.middleware.js";

const GlimpseRouter: Router = Router();

// Public: Visitors can view all glimpses
GlimpseRouter.get("/glimpses", getAllGlimpses);

// Admin: Upload images (up to 5 at once via multipart/form-data)
// Authorization runs BEFORE Multer so unauthorized uploads are rejected
// before any file bytes are processed.
GlimpseRouter.post("/glimpses", verifyAdmin, uploadGlimpseImages, addGlimpses);

// Admin: Delete image by ID (cleans up Cloudinary + DB)
GlimpseRouter.delete("/glimpses/:id", verifyAdmin, deleteGlimpse);

export default GlimpseRouter;