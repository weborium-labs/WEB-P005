import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NextFunction, Request, Response } from "express";

export const healthCheck = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    return res
      .status(200)
      .json(new ApiResponse(200, "", "Weborium - P005 API v1 is running.."));
  },
);
