import { Router } from "express";
import {
  createPage,
  deletePage,
  getPage,
  listPages,
  replacePage,
  updatePage,
} from "../controller/page.controller.js";
import { verifyAdmin, optionalAuth } from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import {
  createPageSchema,
  listPagesQuerySchema,
  replacePageSchema,
  updatePageSchema,
} from "../schemas/page.schema.js";

const router = Router();

// Admin listing — every status, so drafts are manageable.
router.get(
  "/pages",
  verifyAdmin,
  validateQuery(listPagesQuerySchema),
  listPages,
);

// Public read (drafts visible only to admins). Runs before the admin-only
// routes so `:idOrSlug` never shadows them.
router.get("/pages/:idOrSlug", optionalAuth, getPage);

// Create — slug is checked for uniqueness inside the controller.
router.post(
  "/pages",
  verifyAdmin,
  validateBody(createPageSchema),
  createPage,
);

// Whole-document replacement: targets the stable `_id` (or slug), preserves
// identity/system metadata, and honours `expectedVersion` for concurrency.
router.put(
  "/pages/:idOrSlug",
  verifyAdmin,
  validateBody(replacePageSchema),
  replacePage,
);

// Intentional partial update.
router.patch(
  "/pages/:idOrSlug",
  verifyAdmin,
  validateBody(updatePageSchema),
  updatePage,
);

router.delete("/pages/:idOrSlug", verifyAdmin, deletePage);

export default router;
