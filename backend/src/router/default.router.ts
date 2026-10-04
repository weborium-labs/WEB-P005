import { Router } from "express";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { healthCheck } from "../controller/default.controller.js";

const router = Router();

router.get("/", healthCheck);

export default router;
