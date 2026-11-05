import { Router } from "express";
import {
  addGlimpses,
  getAllGlimpses,
  deleteGlimpse,
} from "../controller/glimpse.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { uploadGlimpseImages } from "../middlewares/upload.middleware.js";

const GlimpseRouter = Router();

// Public: Visitors can view all glimpses
GlimpseRouter.get("/glimpses", getAllGlimpses);

// Admin: Upload images (up to 5 at once via multipart/form-data)
GlimpseRouter.post("/glimpses", uploadGlimpseImages, addGlimpses);

// Admin: Delete image by ID (cleans up Cloudinary + DB)
GlimpseRouter.delete("/glimpses/:id", deleteGlimpse);

export default GlimpseRouter;