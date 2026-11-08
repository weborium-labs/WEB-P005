import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Page, type IPage, type ISection } from "../models/page.model.js";
import {
  type CreatePageInput,
  type ReplacePageInput,
  type UpdatePageInput,
} from "../schemas/page.schema.js";
import { PAGE_PATH_PATTERN } from "../schemas/page.schema.js";

/**
 * Page documents are addressed by their stable `_id` (preferred) or their
 * stable `slug`, so admin edits always target an existing document instead of
 * creating a duplicate.
 */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const resolvePage = async (idOrSlug: string): Promise<IPage | null> => {
  if (OBJECT_ID_PATTERN.test(idOrSlug)) {
    return Page.findById(idOrSlug);
  }
  return Page.findOne({ slug: idOrSlug.toLowerCase() });
};

/**
 * Serialises a page without internal ownership data. `user_id` stays server
 * side; `_id`/`version`/timestamps remain so the admin can target and
 * concurrency-check the document.
 */
const toClientPage = (page: IPage) => ({
  _id: String(page._id),
  slug: page.slug,
  title: page.title,
  status: page.status,
  content: page.content ?? { sections: [] },
  seo: page.seo ?? {},
  version: page.version,
  createdAt: page.createdAt,
  updatedAt: page.updatedAt,
});

/** Sections keep a deterministic `order` equal to their array position. */
const normaliseSections = (sections: ISection[]): ISection[] =>
  sections.map((section, index) => ({ ...section, order: index }));

/** Drafts are visible only to admins (never enumerable by the public). */
const canView = (page: IPage, isAdmin: boolean): boolean =>
  page.status === "published" || isAdmin;

/**
 * Turns a browser pathname into a page slug.
 *
 * Accepts `%2F`-encoded input, lower-cases it, collapses duplicate slashes and
 * strips leading/trailing ones. Returns `null` when the path cannot address a
 * page at all — callers map that to a plain 404 rather than a validation
 * error, so arbitrary URLs never leak implementation detail.
 */
const normalisePath = (raw: string): string | null => {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const slug = decoded
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!slug || !PAGE_PATH_PATTERN.test(slug)) return null;
  return slug;
};

/** Mongoose duplicate-key errors are surfaced as a friendly 409. */
const rethrowDuplicateSlug = (error: unknown): never => {
  const code = (error as { code?: number } | null)?.code;
  if (code === 11000) {
    throw new ApiError(409, "A page with this slug already exists.");
  }
  throw error;
};

/**
 * Builds an update document that always writes every top-level content path.
 * Using explicit dot paths avoids relying on Mongoose's object flattening, so
 * removing a field in the editor really removes it from the document — true
 * whole-document replacement rather than a shallow merge.
 */
const buildFullReplace = (input: ReplacePageInput) => ({
  slug: input.slug,
  title: input.title,
  status: input.status,
  "content.sections": normaliseSections(input.content.sections),
  "seo.title": input.seo.title ?? "",
  "seo.description": input.seo.description ?? "",
  "seo.keywords": input.seo.keywords ?? [],
});

// ==========================================
// 1. LIST PAGES (admin — includes drafts)
// ==========================================
export const listPages = asyncHandler(async (req: Request, res: Response) => {
  const { status } = (req as Request & { validatedQuery?: { status?: string } })
    .validatedQuery ?? (req.query as { status?: string });

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const pages = await Page.find(filter)
    .select("-user_id")
    .sort({ slug: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, pages, "Pages retrieved successfully."));
});

// ==========================================
// 2. GET PAGE BY SLUG OR ID (public; drafts for admins)
// ==========================================
export const getPage = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const page = await resolvePage(idOrSlug);

  if (!page) {
    throw new ApiError(404, "Page not found.");
  }

  const isAdmin = (req as Request & { user?: { role?: string } }).user?.role === "admin";
  if (!canView(page, isAdmin)) {
    // Drafts are invisible to the public: report them exactly like a missing
    // page so unpublished work is never leaked or enumerated.
    throw new ApiError(404, "Page not found.");
  }

  const payload = toClientPage(page);
  payload.content.sections = [...payload.content.sections].sort(
    (a, b) => a.order - b.order,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Page retrieved successfully."));
});

// ==========================================
// 2b. RESOLVE A URL PATH TO A PAGE (public route resolution)
// ==========================================
/**
 * `GET /api/v1/pages/resolve?path=/research/overview`
 *
 * The frontend's `App.tsx` sends the current pathname here and renders the
 * returned document through its section registry — this is what makes a newly
 * published page reachable at its URL with zero frontend deployment.
 */
export const getPageByPath = asyncHandler(async (req: Request, res: Response) => {
  const { path } = (req as Request & { validatedQuery?: { path?: string } })
    .validatedQuery ?? (req.query as { path?: string });

  const slug = typeof path === "string" ? normalisePath(path) : null;
  if (!slug) {
    // Not a shape a page could ever have — same answer as a missing page.
    throw new ApiError(404, "Page not found.");
  }

  const page = await Page.findOne({ slug });
  if (!page) {
    throw new ApiError(404, "Page not found.");
  }

  const isAdmin = (req as Request & { user?: { role?: string } }).user?.role === "admin";
  if (!canView(page, isAdmin)) {
    throw new ApiError(404, "Page not found.");
  }

  const payload = toClientPage(page);
  payload.content.sections = [...payload.content.sections].sort((a, b) => a.order - b.order);

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Page resolved successfully."));
});

// ==========================================
// 3. CREATE PAGE
// ==========================================
export const createPage = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePageInput;
  const ownerId = (req as Request & { user?: { id?: string } }).user?.id;

  if (!ownerId) {
    throw new ApiError(401, "Unable to resolve the authenticated owner.");
  }

  const existing = await Page.findOne({ slug: input.slug }).select("_id").lean();
  if (existing) {
    throw new ApiError(409, "A page with this slug already exists.");
  }

  let created: IPage;
  try {
    created = await Page.create({
      slug: input.slug,
      title: input.title,
      status: input.status,
      content: { sections: normaliseSections(input.content.sections) },
      seo: {
        title: input.seo.title ?? "",
        description: input.seo.description ?? "",
        keywords: input.seo.keywords ?? [],
      },
      user_id: ownerId,
      version: 1,
    });
  } catch (error) {
    rethrowDuplicateSlug(error);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, toClientPage(created!), "Page created successfully."));
});

// ==========================================
// 4. WHOLE-DOCUMENT REPLACEMENT (PUT)
// ==========================================
export const replacePage = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const input = req.body as ReplacePageInput;

  const existing = await resolvePage(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Page not found.");
  }

  // Identity and system metadata are never client-writable: the filter pins the
  // document by its real `_id`, and `version` is only used as a compare-and-set
  // guard (never taken from the payload as the new value).
  const filter: Record<string, unknown> = { _id: existing._id };
  if (input.expectedVersion !== undefined) {
    filter.version = input.expectedVersion;
  }

  let updated: IPage | null = null;
  try {
    updated = await Page.findOneAndUpdate(
      filter,
      { $set: buildFullReplace(input), $inc: { version: 1 } },
      { new: true, runValidators: true },
    );
  } catch (error) {
    rethrowDuplicateSlug(error);
  }

  if (!updated) {
    const stillExists = await Page.exists({ _id: existing._id });
    if (stillExists) {
      throw new ApiError(
        409,
        "This page was changed by someone else since you loaded it. Reload to get the latest version.",
      );
    }
    throw new ApiError(404, "Page not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toClientPage(updated), "Page updated successfully."));
});

// ==========================================
// 5. PARTIAL UPDATE (PATCH)
// ==========================================
export const updatePage = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const input = req.body as UpdatePageInput;

  const existing = await resolvePage(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Page not found.");
  }

  const set: Record<string, unknown> = {};
  if (input.slug !== undefined) set.slug = input.slug;
  if (input.title !== undefined) set.title = input.title;
  if (input.status !== undefined) set.status = input.status;
  if (input.content !== undefined) {
    set["content.sections"] = normaliseSections(input.content.sections);
  }
  if (input.seo !== undefined) {
    if (input.seo.title !== undefined) set["seo.title"] = input.seo.title;
    if (input.seo.description !== undefined) set["seo.description"] = input.seo.description;
    if (input.seo.keywords !== undefined) set["seo.keywords"] = input.seo.keywords;
  }

  if (Object.keys(set).length === 0) {
    throw new ApiError(400, "Provide at least one field to update.");
  }

  const filter: Record<string, unknown> = { _id: existing._id };
  if (input.expectedVersion !== undefined) {
    filter.version = input.expectedVersion;
  }

  let updated: IPage | null = null;
  try {
    updated = await Page.findOneAndUpdate(
      filter,
      { $set: set, $inc: { version: 1 } },
      { new: true, runValidators: true },
    );
  } catch (error) {
    rethrowDuplicateSlug(error);
  }

  if (!updated) {
    const stillExists = await Page.exists({ _id: existing._id });
    if (stillExists) {
      throw new ApiError(
        409,
        "This page was changed by someone else since you loaded it. Reload to get the latest version.",
      );
    }
    throw new ApiError(404, "Page not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toClientPage(updated), "Page updated successfully."));
});

// ==========================================
// 6. DELETE PAGE
// ==========================================
export const deletePage = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };

  // Resolve first so a malformed identifier yields a clean 404 instead of a
  // Mongoose cast error, and so deletion always uses the document's real _id.
  const existing = await resolvePage(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Page not found.");
  }

  await Page.deleteOne({ _id: existing._id });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Page deleted successfully."));
});
