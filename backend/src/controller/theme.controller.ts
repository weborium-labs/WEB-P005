import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  DEFAULT_THEME_TOKENS,
  THEME_TOKEN_GROUPS,
  Theme,
  type ITheme,
  type ThemeTokens,
} from "../models/theme.model.js";
import User from "../models/user.model.js";
import type {
  CreateThemeInput,
  ReplaceThemeInput,
  UpdateThemeInput,
} from "../schemas/theme.schema.js";

/** Serialises a theme without internal ownership data. */
const toClientTheme = (theme: ITheme) => ({
  _id: String(theme._id),
  name: theme.name,
  slug: theme.slug,
  description: theme.description ?? "",
  tokens: theme.tokens,
  isActive: theme.isActive,
  version: theme.version,
  createdAt: theme.createdAt,
  updatedAt: theme.updatedAt,
});

const findByIdOrSlug = async (idOrSlug: string): Promise<ITheme | null> => {
  const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
  if (OBJECT_ID_PATTERN.test(idOrSlug)) return Theme.findById(idOrSlug);
  return Theme.findOne({ slug: idOrSlug.toLowerCase() });
};

/**
 * Makes `theme` the single active theme.
 *
 * Deactivating the others first keeps the partial unique index on `isActive`
 * happy (the index rejects a second `isActive: true` document).
 */
const activate = async (theme: ITheme): Promise<void> => {
  await Theme.updateMany({ _id: { $ne: theme._id } }, { $set: { isActive: false } });
  await Theme.updateOne({ _id: theme._id }, { $set: { isActive: true } });
};

/**
 * Ensures the shipped palette exists and is active.
 *
 * Called on boot so a fresh deployment (or a database that lost its themes)
 * always serves a theme. Idempotent: it only writes when the collection is
 * empty, and it skips (with a warning) when no admin account exists yet —
 * themes are then created from the admin UI instead.
 */
export const ensureDefaultTheme = async (): Promise<void> => {
  const count = await Theme.countDocuments();
  if (count > 0) return;

  const owner = await User.findOne({ role: "admin" }).select("_id").lean();
  if (!owner) {
    console.warn("[THEME] No admin user yet — skipping the default theme seed.");
    return;
  }

  await Theme.create({
    name: "Default",
    slug: "default",
    description: "The original website palette — headings, surfaces, borders and brand colours.",
    tokens: DEFAULT_THEME_TOKENS,
    isActive: true,
    version: 1,
    user_id: owner._id,
  });
  console.log("[THEME] Seeded the default theme (active).");
};

// ==========================================
// 1. ACTIVE THEME (public)
// ==========================================
export const getActiveTheme = asyncHandler(async (_req: Request, res: Response) => {
  const theme = await Theme.findOne({ isActive: true }).lean();

  if (!theme) {
    // No theme configured: the frontend keeps the tokens baked into its CSS,
    // which are identical to the shipped palette.
    throw new ApiError(404, "No active theme configured.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: String(theme._id),
        name: theme.name,
        slug: theme.slug,
        description: theme.description ?? "",
        tokens: theme.tokens,
        updatedAt: theme.updatedAt,
      },
      "Active theme retrieved successfully.",
    ),
  );
});

// ==========================================
// 2. LIST THEMES (admin) + token metadata
// ==========================================
export const listThemes = asyncHandler(async (_req: Request, res: Response) => {
  const themes = await Theme.find().select("-user_id").sort({ isActive: -1, name: 1 }).lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: themes.map((theme) => ({
          _id: String(theme._id),
          name: theme.name,
          slug: theme.slug,
          description: theme.description ?? "",
          tokens: theme.tokens,
          isActive: theme.isActive,
          version: theme.version,
          createdAt: theme.createdAt,
          updatedAt: theme.updatedAt,
        })),
        // Static metadata so the editor renders its groups/labels from the
        // API instead of hardcoding the token list twice.
        tokenGroups: THEME_TOKEN_GROUPS,
        defaultTokens: DEFAULT_THEME_TOKENS,
      },
      "Themes retrieved successfully.",
    ),
  );
});

// ==========================================
// 3. CREATE THEME (admin)
// ==========================================
export const createTheme = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateThemeInput;
  const ownerId = (req as Request & { user?: { id?: string } }).user?.id;

  if (!ownerId) {
    throw new ApiError(401, "Unable to resolve the authenticated owner.");
  }

  const existing = await Theme.findOne({ slug: input.slug }).select("_id").lean();
  if (existing) {
    throw new ApiError(409, "A theme with this slug already exists.");
  }

  const created = await Theme.create({
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    tokens: input.tokens,
    isActive: false,
    version: 1,
    user_id: ownerId,
  });

  // A newly created theme is never active on its own — activating is an
  // explicit admin action (or a PATCH with `isActive: true`).
  if (input.isActive) {
    await activate(created!);
  }

  return res.status(201).json(new ApiResponse(201, toClientTheme(created!), "Theme created successfully."));
});

// ==========================================
// 4. WHOLE-DOCUMENT REPLACEMENT (PUT)
// ==========================================
export const replaceTheme = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const input = req.body as ReplaceThemeInput;

  const existing = await findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Theme not found.");
  }

  const duplicate = await Theme.findOne({ slug: input.slug, _id: { $ne: existing._id } })
    .select("_id")
    .lean();
  if (duplicate) {
    throw new ApiError(409, "A theme with this slug already exists.");
  }

  const filter: Record<string, unknown> = { _id: existing._id };
  if (input.expectedVersion !== undefined) {
    filter.version = input.expectedVersion;
  }

  const updated = await Theme.findOneAndUpdate(
    filter,
    {
      $set: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? "",
        tokens: input.tokens as ThemeTokens,
        isActive: false,
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    const stillExists = await Theme.exists({ _id: existing._id });
    if (stillExists) {
      throw new ApiError(
        409,
        "This theme was changed by someone else since you loaded it. Reload to get the latest version.",
      );
    }
    throw new ApiError(404, "Theme not found.");
  }

  if (input.isActive) {
    await activate(updated!);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toClientTheme(updated!), "Theme updated successfully."));
});

// ==========================================
// 5. PARTIAL UPDATE (PATCH) — includes activation
// ==========================================
export const updateTheme = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const input = req.body as UpdateThemeInput;

  const existing = await findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Theme not found.");
  }

  if (input.slug !== undefined && input.slug !== existing.slug) {
    const duplicate = await Theme.findOne({ slug: input.slug, _id: { $ne: existing._id } })
      .select("_id")
      .lean();
    if (duplicate) {
      throw new ApiError(409, "A theme with this slug already exists.");
    }
  }

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.slug !== undefined) set.slug = input.slug;
  if (input.description !== undefined) set.description = input.description;
  if (input.tokens !== undefined) set.tokens = input.tokens as ThemeTokens;
  // `isActive` is never written directly here: activation goes through
  // `activate()` so the single-active invariant stays intact.
  const wantsActive = input.isActive === true;
  const wantsInactive = input.isActive === false;

  if (Object.keys(set).length === 0 && !wantsActive && !wantsInactive) {
    throw new ApiError(400, "Provide at least one field to update.");
  }

  const filter: Record<string, unknown> = { _id: existing._id };
  if (input.expectedVersion !== undefined) {
    filter.version = input.expectedVersion;
  }

  let updated: ITheme | null = null;
  if (Object.keys(set).length > 0) {
    updated = await Theme.findOneAndUpdate(
      filter,
      { $set: set, $inc: { version: 1 } },
      { new: true, runValidators: true },
    );
    if (!updated) {
      const stillExists = await Theme.exists({ _id: existing._id });
      if (stillExists) {
        throw new ApiError(
          409,
          "This theme was changed by someone else since you loaded it. Reload to get the latest version.",
        );
      }
      throw new ApiError(404, "Theme not found.");
    }
  } else {
    updated = existing;
  }

  if (wantsActive) {
    await activate(updated!);
    updated = await Theme.findById(updated!._id);
  } else if (wantsInactive) {
    // Never leave the site without an active theme.
    const others = await Theme.countDocuments({ _id: { $ne: updated!._id }, isActive: true });
    if (updated!.isActive && others === 0) {
      throw new ApiError(409, "Another theme must be active before this one can be deactivated.");
    }
    if (updated!.isActive) {
      await Theme.updateOne({ _id: updated!._id }, { $set: { isActive: false } });
      updated = await Theme.findById(updated!._id);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toClientTheme(updated!), "Theme updated successfully."));
});

// ==========================================
// 6. DELETE THEME (admin)
// ==========================================
export const deleteTheme = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };

  const existing = await findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new ApiError(404, "Theme not found.");
  }

  if (existing.isActive) {
    throw new ApiError(409, "Activate another theme before deleting this one.");
  }

  await Theme.deleteOne({ _id: existing._id });

  return res.status(200).json(new ApiResponse(200, null, "Theme deleted successfully."));
});

/** Number of theme documents — used by the dashboard statistics. */
export const countThemes = async (): Promise<{ total: number; active: number }> => {
  const [total, active] = await Promise.all([
    Theme.countDocuments(),
    Theme.countDocuments({ isActive: true }),
  ]);
  return { total, active };
};
