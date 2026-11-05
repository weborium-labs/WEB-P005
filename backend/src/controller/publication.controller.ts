import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Publication } from "../models/publication.model.js";

// ==========================================
// 1. CREATE PUBLICATION(S) (SINGLE OR BULK)
// ==========================================
export const createPublications = asyncHandler(async (req: Request, res: Response) => {
  const { publications, user_id } = req.body;

  // Supports either { publications: [...] } or a single object in req.body
  const rawList = Array.isArray(publications)
    ? publications
    : Array.isArray(req.body)
    ? req.body
    : [req.body];

  if (!rawList.length || !rawList[0].title) {
    throw new ApiError(400, "Please provide valid publication data.");
  }

  const preparedPayload = rawList.map((item: any, index: number) => {
    const ownerId = item.user_id || user_id || (req as any).user?.id;

    if (!ownerId) {
      throw new ApiError(400, "user_id is required for publication records.");
    }
    if (!item.title || !item.publication_name || !item.year || !item.redirect_url || !item.type) {
      throw new ApiError(400, "Missing required fields: title, publication_name, year, type, and redirect_url are mandatory.");
    }

    return {
      user_id: ownerId,
      type: item.type, // 'journal' or 'conference'
      title: item.title,
      year: Number(item.year),
      publication_name: item.publication_name,
      volume_issue: item.volume_issue || "",
      indexing: item.indexing || "",
      redirect_url: item.redirect_url,
      order: item.order ?? index,
    };
  });

  const createdRecords = await Publication.insertMany(preparedPayload);

  return res
    .status(201)
    .json(new ApiResponse(201, createdRecords, "Publication(s) created successfully."));
});

// ==========================================
// 2. GET ALL PUBLICATIONS (FILTERABLE BY TYPE & USER)
// ==========================================
export const getAllPublications = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, type } = req.query;

  const filter: Record<string, any> = {};

  if (user_id) {
    filter.user_id = String(user_id);
  }

  if (type) {
    filter.type = String(type).toLowerCase(); // 'journal' or 'conference'
  }

  // Sorted by Year descending (newest first), then by customized order ascending
  const publications = await Publication.find(filter)
    .sort({ year: -1, order: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: publications.length,
        items: publications,
      },
      "Publications retrieved successfully."
    )
  );
});

// ==========================================
// 3. GET SINGLE PUBLICATION BY ID
// ==========================================
export const getPublicationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const publication = await Publication.findById(id);
  if (!publication) {
    throw new ApiError(404, "Publication not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publication, "Publication details retrieved successfully."));
});

// ==========================================
// 4. UPDATE PUBLICATION
// ==========================================
export const updatePublication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const updatedPublication = await Publication.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!updatedPublication) {
    throw new ApiError(404, "Publication not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPublication, "Publication updated successfully."));
});

// ==========================================
// 5. DELETE PUBLICATION
// ==========================================
export const deletePublication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedPublication = await Publication.findByIdAndDelete(id);
  if (!deletedPublication) {
    throw new ApiError(404, "Publication not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Publication deleted successfully."));
});