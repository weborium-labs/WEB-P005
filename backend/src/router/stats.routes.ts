import { Router } from "express";
import { getOverview } from "../controller/stats.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats/overview", verifyAdmin, getOverview);

export default router;
