import { NextFunction, Request, Response } from "express";
import { ZodType, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Runs a Zod schema over `req.body` and replaces it with the parsed value.
 *
 * Two side effects matter for security:
 *  1. Unknown keys are stripped, so clients cannot mass-assign protected
 *     fields (`_id`, `version`, `user_id`, `createdAt`, …).
 *  2. Failures surface through the existing `ApiError` envelope as
 *     `errors: [{ field, message }]`, which the admin UI renders inline.
 */
export const validateBody =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation Error", errors));
    }

    req.body = result.data;
    next();
  };

/** Same contract as `validateBody`, applied to `req.query`. */
export const validateQuery =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query ?? {});

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation Error", errors));
    }

    // Express 5 exposes `req.query` as a getter; stash the parsed value on a
    // well-known property the controllers read instead of mutating it.
    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };

export { ZodError };
