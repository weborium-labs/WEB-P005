import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { assertObjectId } from "../utils/object-id.js";
import { Publication } from "../models/publication.model.js";
import type {
  CreatePublicationsInput,
  ListPublicationsQuery,
  ReplacePublicationInput,
} from "../schemas/content.schema.js";

/**
 * Ownership always comes from the verified access token. A client-supplied
 * `user_id` can never create or reassign records for a different account.
 */
const resolveOwnerId = (req: Request): string => {
  const ownerId = (req as Request & { user?: { id?: string } }).user?.id;
  if (!ownerId) {
    throw new ApiError(401, "Unable to resolve the authenticated owner.");
  }
  return ownerId;
};

const readQuery = (req: Request): ListPublicationsQuery =>
  (req as Request & { validatedQuery?: ListPublicationsQuery }).validatedQuery ??
  (req.query as ListPublicationsQuery);

// ==========================================
// 1. CREATE PUBLICATION(S) (single or bulk)
// ==========================================
export const createPublications = asyncHandler(async (req: Request, res: Response) => {
  // `validateBody` has already normalised every accepted request shape to
  // `{ publications: [...] }` and stripped unknown keys.
  const { publications } = req.body as CreatePublicationsInput;
  const ownerId = resolveOwnerId(req);

  const preparedPayload = publications.map((item, index) => ({
    user_id: ownerId,
    type: item.type,
    title: item.title,
    year: Number(item.year),
    publication_name: item.publication_name,
    volume_issue: item.volume_issue ?? "",
    indexing: item.indexing ?? "",
    redirect_url: item.redirect_url,
    order: item.order ?? index,
  }));

  const createdRecords = await Publication.insertMany(preparedPayload);

  return res
    .status(201)
    .json(new ApiResponse(201, createdRecords, "Publication(s) created successfully."));
});

// ==========================================
// 2. GET ALL PUBLICATIONS (filterable by type & user)
// ==========================================
export const getAllPublications = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, type, page, limit } = readQuery(req);

  const filter: Record<string, unknown> = {};
  if (user_id) filter.user_id = String(user_id);
  if (type) filter.type = String(type).toLowerCase();

  // Sorted by year descending (newest first), then by custom order ascending.
  const base = Publication.find(filter).sort({ year: -1, order: 1 });

  // Paging is opt-in: without `limit` the historical `{total, items}` contract
  // is returned unchanged, so existing consumers keep working.
  if (limit === undefined) {
    const publications = await base.lean();
    return res.status(200).json(
      new ApiResponse(
        200,
        { total: publications.length, items: publications },
        "Publications retrieved successfully.",
      ),
    );
  }

  const currentPage = page ?? 1;
  const [items, total] = await Promise.all([
    base.skip((currentPage - 1) * limit).limit(limit).lean(),
    Publication.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        items,
        page: currentPage,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      "Publications retrieved successfully.",
    ),
  );
});

// ==========================================
// 3. GET SINGLE PUBLICATION BY ID
// ==========================================
export const getPublicationById = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "Publication not found.");

  const publication = await Publication.findById(id).lean();
  if (!publication) {
    throw new ApiError(404, "Publication not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publication, "Publication details retrieved successfully."));
});

// ==========================================
// 4. REPLACE PUBLICATION (whitelisted fields only)
// ==========================================
export const updatePublication = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, "Publication not found.");
  // `validateBody` reduced the payload to the client-writable field set, so
  // `_id`, `user_id`, `createdAt` and `updatedAt` can never be reassigned.
  const input = req.body as ReplacePublicationInput;

  const updatedPublication = await Publication.findByIdAndUpdate(
    id,
    {
      $set: {
        type: input.type,
        title: input.title,
        year: input.year,
        publication_name: input.publication_name,
        volume_issue: input.volume_issue ?? "",
        indexing: input.indexing ?? "",
        redirect_url: input.redirect_url,
        order: input.order ?? 0,
      },
    },
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
  const id = assertObjectId(req.params.id, "Publication not found.");

  const deleted = await Publication.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Publication not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Publication deleted successfully."));
});
