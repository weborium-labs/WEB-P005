import { ApiError } from "./ApiError.js";

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && OBJECT_ID_PATTERN.test(value);

/**
 * Rejects malformed document identifiers with a clean 404 before Mongoose can
 * raise a CastError (which would otherwise surface as a 500).
 */
export const assertObjectId = (value: unknown, message = "Resource not found."): string => {
  if (!isObjectId(value)) {
    throw new ApiError(404, message);
  }
  return value;
};
