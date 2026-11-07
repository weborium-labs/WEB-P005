import multer, { FileFilterCallback } from "multer";
import { Request, RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files (JPG, PNG, WEBP, GIF) are allowed!"));
  }
};

// Explicit annotation keeps declaration emit portable: the inferred type of
// multer's handler references ParamsDictionary from express-serve-static-core.
export const uploadGlimpseImages: RequestHandler = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
}).array("images", 5);

/** Single-image upload used by the admin media library (field name: `file`). */
export const uploadMediaImage: RequestHandler = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
}).single("file");