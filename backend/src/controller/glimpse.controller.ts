import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Glimpse } from "../models/glimpse.model.js";
import "multer";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// ==========================================
// 1. UPLOAD UP TO 5 IMAGES AT ONCE (ADMIN)
// ==========================================
export const addGlimpses = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const { user_id } = req.body;

  const ownerId = user_id || (req as any).user?.id;

  if (!ownerId) {
    throw new ApiError(400, "user_id is required.");
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, "Please upload at least one image (max 5).");
  }

  if (files.length > 5) {
    throw new ApiError(400, "You cannot upload more than 5 images at once.");
  }

  // Upload each file buffer with its own unique filename/public_id
  const uploadPromises = files.map((file, idx) => {
    // Generate a unique clean name for Cloudinary: name-timestamp-random
    const cleanFileName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    const uniquePublicId = `${cleanFileName}_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;

    return uploadBufferToCloudinary(
      file.buffer,
      "portfolio_glimpses",
      uniquePublicId
    );
  });

  const uploadResults = await Promise.all(uploadPromises);

  // Prepare distinct database records
  const glimpseDocs = uploadResults.map((result, idx) => ({
    user_id: ownerId,
    image_url: result.secure_url,
    public_id: result.public_id,
    order: idx,
  }));

  const savedGlimpses = await Glimpse.insertMany(glimpseDocs);

  return res.status(201).json(
    new ApiResponse(
      201,
      savedGlimpses,
      `${savedGlimpses.length} image(s) uploaded successfully.`
    )
  );
});

// ==========================================
// 2. GET ALL GLIMPSES (PUBLIC)
// ==========================================
export const getAllGlimpses = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.query;

  const filter: Record<string, any> = {};
  
  // If user_id is provided, filter by it; otherwise, fetch all glimpses
  if (user_id) {
    filter.user_id = String(user_id);
  }

  const glimpses = await Glimpse.find(filter).sort({ createdAt: -1, order: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: glimpses.length,
        items: glimpses,
      },
      "Glimpses retrieved successfully."
    )
  );
});

// ==========================================
// 3. DELETE GLIMPSE (ADMIN)
// ==========================================
export const deleteGlimpse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const glimpse = await Glimpse.findById(id);
  if (!glimpse) {
    throw new ApiError(404, "Glimpse image not found.");
  }

  // 1. Remove from Cloudinary storage
  if (glimpse.public_id) {
    await deleteFromCloudinary(glimpse.public_id);
  }

  // 2. Remove record from MongoDB
  await Glimpse.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Glimpse image deleted successfully."));
});