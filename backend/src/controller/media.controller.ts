import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Media, type IMedia } from "../models/media.model.js";
import { Page } from "../models/page.model.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const MEDIA_FOLDER = "portfolio_media";

const toClientMedia = (media: IMedia) => ({
  _id: String(media._id),
  url: media.url,
  public_id: media.public_id,
  alt: media.alt,
  format: media.format,
  width: media.width,
  height: media.height,
  bytes: media.bytes,
  folder: media.folder,
  createdAt: media.createdAt,
});

/**
 * Pages reference images by denormalised `url` + `public_id`, so a media asset
 * can only be destroyed once nothing points at it. Checked across every place a
 * page section can hold an image.
 */
const isMediaReferenced = async (publicId: string): Promise<boolean> => {
  const referencePaths = [
    "content.sections.image.public_id",
    "content.sections.items.image.public_id",
    "content.sections.items.children.image.public_id",
  ];

  const or = referencePaths.map((path) => ({ [path]: publicId }));
  return Boolean(await Page.exists({ $or: or }));
};

// ==========================================
// 1. UPLOAD IMAGE (admin)
// ==========================================
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as Request & { user?: { id?: string } }).user?.id;
  if (!ownerId) {
    throw new ApiError(401, "Unable to resolve the authenticated owner.");
  }

  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw new ApiError(400, "Please choose an image to upload.");
  }

  // Multer's fileFilter already rejected non-images; belt and braces for the
  // Cloudinary side so we never persist a non-image asset.
  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files (JPG, PNG, WEBP, GIF) are allowed!");
  }

  const uploaded = await uploadBufferToCloudinary(file.buffer, MEDIA_FOLDER);

  if (!uploaded?.secure_url || !uploaded.public_id) {
    throw new ApiError(502, "Image upload failed. Please try again.");
  }

  let created: IMedia;
  try {
    created = await Media.create({
      user_id: ownerId,
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
      alt: "",
      format: uploaded.format ?? "",
      width: uploaded.width ?? 0,
      height: uploaded.height ?? 0,
      bytes: uploaded.bytes ?? file.size ?? 0,
      folder: MEDIA_FOLDER,
    });
  } catch (error) {
    // Never leave an orphaned Cloudinary asset behind if the record fails.
    await deleteFromCloudinary(uploaded.public_id).catch(() => undefined);
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, toClientMedia(created), "Image uploaded successfully."));
});

// ==========================================
// 2. LIST MEDIA (admin)
// ==========================================
export const listMedia = asyncHandler(async (req: Request, res: Response) => {
  const { validatedQuery } = req as Request & {
    validatedQuery?: { page?: number; limit?: number };
  };
  const page = validatedQuery?.page ?? 1;
  const limit = validatedQuery?.limit ?? 24;

  const [items, total] = await Promise.all([
    Media.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Media.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        items: items.map((item) => ({
          ...item,
          _id: String(item._id),
        })),
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      "Media retrieved successfully.",
    ),
  );
});

// ==========================================
// 3. DELETE MEDIA (admin)
// ==========================================
export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  if (!/^[a-f0-9]{24}$/i.test(id)) {
    throw new ApiError(400, "Invalid media identifier.");
  }

  const media = await Media.findById(id);
  if (!media) {
    throw new ApiError(404, "Media item not found.");
  }

  if (await isMediaReferenced(media.public_id)) {
    throw new ApiError(
      409,
      "This image is still used by a page. Remove it from the page first.",
    );
  }

  // Destroy the Cloudinary asset first; if it is already gone the API reports
  // "not found" which we treat as success so the record can still be cleaned up.
  try {
    await deleteFromCloudinary(media.public_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.toLowerCase().includes("not found")) {
      throw new ApiError(502, "Could not delete the image from storage.");
    }
  }

  await Media.deleteOne({ _id: media._id });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Image deleted successfully."));
});
