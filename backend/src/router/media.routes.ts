import { Router } from "express";
import { deleteMedia, listMedia, uploadMedia } from "../controller/media.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import { uploadMediaImage } from "../middlewares/upload.middleware.js";
import { z } from "zod";

const router = Router();

const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

// Authorization runs before Multer buffers the upload so unauthenticated
// callers can never consume memory or reach Cloudinary.
router.post("/media", verifyAdmin, uploadMediaImage, uploadMedia);
router.get("/media", verifyAdmin, validateQuery(listMediaQuerySchema), listMedia);
router.delete("/media/:id", verifyAdmin, deleteMedia);

export default router;
