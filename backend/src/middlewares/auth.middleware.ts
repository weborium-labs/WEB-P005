import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Define the interface here
export interface AuthenticatedUser {
  id?: string;
  userId?: string;
  role?: string;
  email?: string;
  display_name?: string;
  [key: string]: any;
}

/**
 * Verifies the Bearer access token and exposes the decoded claims on
 * `req.user`. Always maps the JWT `userId` claim to `req.user.id` so the
 * existing controller owner-fallbacks (`req.user.id`) resolve correctly.
 * Fails with 401 for missing/invalid/expired tokens.
 */
export const verifyToken = (
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

    (req as any).user = {
      ...decoded,
      id: decoded.userId ?? decoded.id,
    };

    next();
  } catch (error: any) {
    return next(new ApiError(401, "Unauthorized: Invalid or expired token"));
  }
};

/**
 * Attaches `req.user` when a *valid* Bearer token is present, but never fails.
 *
 * Used by public GET endpoints that serve different payloads depending on who
 * is asking (e.g. `GET /pages/:slug` returns drafts only to admins). A missing
 * or invalid token simply leaves the request anonymous.
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;

    (req as any).user = {
      ...decoded,
      id: decoded.userId ?? decoded.id,
    };
  } catch {
    // Anonymous — the caller simply does not get privileged payloads.
  }

  next();
};

/**
 * Requires a valid access token AND the `admin` role.
 */
export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  verifyToken(req, res, (error?: unknown) => {
    if (error) {
      return next(error);
    }

    if ((req as any).user?.role !== "admin") {
      return next(new ApiError(403, "Forbidden: Admin access required"));
    }

    next();
  });
};
