import { Router } from "express";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { healthCheck } from "../controller/health.controller.js";
import userRouter from "./user.router.js";

const router = Router();

router.use("/user",userRouter);
router.get("/health", healthCheck);

export default router;
