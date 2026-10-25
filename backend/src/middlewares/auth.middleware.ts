import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Define the interface here
export interface AuthenticatedUser {
  id?: string;
  role?: string;
  email?: string;
  [key: string]: any;
}

export const verifyAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Access token is missing or invalid"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;

    (req as any).user = decoded;

    if ((req as any).user.role !== "admin") {
      return next(new ApiError(403, "Forbidden: Admin access required"));
    }

    next();
  } catch (error: any) {
    return next(new ApiError(401, "Unauthorized: Invalid or expired token"));
  }
};