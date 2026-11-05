import { Router } from "express";
import {
  createPublications,
  getAllPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
} from "../controller/publication.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const PublicationRouter = Router();

// Public: Visitors can view all publications or filter by type/user
PublicationRouter.get("/publications", getAllPublications);
PublicationRouter.get("/publications/:id", getPublicationById);

// Admin Only: Protected with verifyAdmin
PublicationRouter.post("/publications", createPublications);
PublicationRouter.put("/publications/:id", updatePublication);
PublicationRouter.delete("/publications/:id", deletePublication);

export default PublicationRouter;