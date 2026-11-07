import { Router } from "express";
import {
  createPublications,
  deletePublication,
  getAllPublications,
  getPublicationById,
  updatePublication,
} from "../controller/publication.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import {
  createPublicationsSchema,
  listPublicationsQuerySchema,
  replacePublicationSchema,
} from "../schemas/content.schema.js";

const PublicationRouter: Router = Router();

// Public reads (optional `page`/`limit` paging, backwards compatible)
PublicationRouter.get(
  "/publications",
  validateQuery(listPublicationsQuerySchema),
  getAllPublications,
);
PublicationRouter.get("/publications/:id", getPublicationById);

// Admin Only: Protected with verifyAdmin
PublicationRouter.post(
  "/publications",
  verifyAdmin,
  validateBody(createPublicationsSchema),
  createPublications,
);
PublicationRouter.put(
  "/publications/:id",
  verifyAdmin,
  validateBody(replacePublicationSchema),
  updatePublication,
);
PublicationRouter.delete("/publications/:id", verifyAdmin, deletePublication);

export default PublicationRouter;
