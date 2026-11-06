import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "./ApiError.js";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<unknown> {
    try {
      const result = await fn(req, res, next);
      return result;
    } catch (error: unknown) {
      // Preserve the intended status/message for known API errors instead of
      // collapsing every validation/authorization/not-found error into a 500.
      if (error instanceof ApiError) {
        // Known API errors are logged (name/status/message only) before the
        // response so auth/validation failures stay visible in server logs.
        console.error(
          `[ERROR] ${error.name}: ${error.statusCode} ${error.message}`,
        );
        return res.status(error.statusCode).json(error);
      }

      console.error(error);

      if (error instanceof ZodError) {
        return res
          .status(400)
          .json(new ApiError(400, "Validation Error", error.issues));
      }

      console.error("//========= [ERROR] ========//\n", error);

      return res
        .status(500)
        .json(new ApiError(500, "Internal Server Error", []));
    }
  };
}
