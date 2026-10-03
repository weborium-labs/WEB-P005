import { Router } from "express";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "", "Weborium - P005 API v1 is running.."));
});

export default router;
