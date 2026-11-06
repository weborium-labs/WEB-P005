import { Router } from "express";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { authFailureRedirect, healthCheck } from "../controller/health.controller.js";
import userRouter from "./user.router.js";

const router: Router = Router();

router.use("/user",userRouter);
router.get("/health", healthCheck);
router.get('/user/auth/failure',authFailureRedirect)

export default router;
