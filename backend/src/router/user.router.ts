import { NextFunction, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport-config.js";
import config from "../config/config.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/async-handler.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";

const isProd = config.environment === "production";
const router: Router = Router();

/**
 * Picks the admin origin first (ADMIN_URL), falling back to FRONTEND_URL,
 * and only if it is present in the configured allowlist. Returns the origin
 * or null when nothing configured is allowed.
 */
const resolveRedirectOrigin = (): string | null => {
  const candidates = [config.adminUrl, config.frontendUrl].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const origin = new URL(candidate).origin;
      if (config.frontendUrls.includes(origin)) {
        return origin;
      }
    } catch {
      // Ignore malformed configured URLs and try the next candidate.
    }
  }

  return null;
};

/**
 * Reads a single cookie value from the request without requiring
 * cookie-parser (only the HttpOnly refresh token needs to be read).
 */
const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim();
    if (key === name) {
      return part.slice(separatorIndex + 1).trim();
    }
  }

  return undefined;
};

router.get(
  "/auth/google",
  (_req: Request, _res: Response, next: NextFunction) => {
    console.log("Using callback:", config.googleCallbackUrl);
    next();
  },
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
    session: false
  }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/user/auth/failure",
    // failureMessage: true
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.id) {
        return next(new ApiError(401, "Authentication Failure"));
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      const redirectOrigin = resolveRedirectOrigin();
      if (!redirectOrigin) {
        return next(
          new ApiError(
            500,
            "No allowed frontend URL configured for the sign-in redirect",
          ),
        );
      }

      const redirectUrl = new URL("/verify-token/", redirectOrigin);
      redirectUrl.searchParams.set("token", accessToken);

      return res.redirect(redirectUrl.toString());
    } catch (error: unknown) {
      return next(error);
    }
  },
);

/**
 * Exchanges the HttpOnly refresh-token cookie for a new short-lived
 * access token. Never requires an Authorization header.
 */
router.post(
  "/auth/refresh-token",
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = readCookie(req, "refreshToken");

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is missing");
    }

    let decoded: { userId?: string };
    try {
      decoded = jwt.verify(
        refreshToken,
        config.jwtRefreshSecret,
      ) as { userId?: string };
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    if (!decoded.userId) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const accessToken = user.generateAccessToken();

    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken }, "Access token refreshed successfully."),
      );
  }),
);

/**
 * Verifies the current access token against the database and returns the
 * authenticated profile (including the authoritative `role`).
 */
router.get(
  "/auth/session",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      throw new ApiError(401, "Unauthorized: User no longer exists");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: user._id,
          display_name: user.display_name,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role,
        },
        "Session verified successfully.",
      ),
    );
  }),
);

/**
 * Clears the HttpOnly refresh-token cookie. Stateless refresh tokens are
 * not persisted server-side, so logout only revokes the browser cookie.
 */
router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

export default router;
