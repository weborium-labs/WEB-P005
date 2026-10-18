import { NextFunction, Request, Response, Router } from "express";
import passport from "../config/passport-config.js";
import config from "../config/config.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const isProd = config.environment === "production";
const router = Router();

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

      const frontendUrl = config.frontendUrl;
      const redirectUrl = new URL("/verify-token/", frontendUrl);
      redirectUrl.searchParams.set("token", accessToken);

      return res.redirect(redirectUrl.toString());
    } catch (error: unknown) {
      return next(error);
    }
  },
);

export default router;
