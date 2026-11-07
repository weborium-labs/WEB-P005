import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { assertObjectId } from "../utils/object-id.js";
import { NavbarItem } from "../models/navbar_item.model.js";
import SubNavItem from "../models/sub_nav_item.model.js";
import type { CreateNavbarsInput, CreateSubNavbarsInput, ReplaceNavbarInput, ReplaceSubNavbarInput } from "../schemas/content.schema.js";

/**
 * Ownership always comes from the verified access token. `user_id` in a request
 * body is never trusted — a client cannot create or reassign records for
 * another account.
 */
const resolveOwnerId = (req: Request): string => {
  const ownerId = (req as Request & { user?: { id?: string } }).user?.id;
  if (!ownerId) {
    throw new ApiError(401, "Unable to resolve the authenticated owner.");
  }
  return ownerId;
};

// ==========================================
// 1. NAVBAR ITEM CONTROLLERS (PARENT)
// ==========================================

// Create multiple navbar items (validated; ownership from the token).
export const createNavItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as CreateNavbarsInput;
  const ownerId = resolveOwnerId(req);

  const payload = items.map((item, index) => ({
    user_id: ownerId,
    item_name: item.item_name,
    order: item.order ?? index,
    sub_items: [],
  }));

  const createdItems = await NavbarItem.insertMany(payload);

  return res
    .status(201)
    .json(new ApiResponse(201, createdItems, "Navbar items created successfully."));
});

// Get all navbar items along with their nested sub-items.
export const getAllNavbars = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.query as { user_id?: string };
  const filter = user_id ? { user_id: String(user_id) } : {};

  const navbars = await NavbarItem.find(filter)
    .sort({ order: 1 })
    .populate({
      path: "sub_items",
      options: { sort: { order: 1 } },
    })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, navbars, "Navbar items retrieved successfully."));
});

// Replace the editable fields of a navbar item (whitelisted by the schema).
export const updateNavbar = asyncHandler(async (req: Request, res: Response) => {
  const navbar_id = assertObjectId(req.params.navbar_id, "Navbar item not found.");
  const { item_name, order } = req.body as ReplaceNavbarInput;

  const updatedNavbar = await NavbarItem.findByIdAndUpdate(
    navbar_id,
    { $set: { item_name, order } },
    { new: true, runValidators: true }
  );

  if (!updatedNavbar) {
    throw new ApiError(404, "Navbar item not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNavbar, "Navbar item updated successfully."));
});

// Delete a navbar item and cascade-delete all its child sub-items.
export const deleteNavbar = asyncHandler(async (req: Request, res: Response) => {
  const navbar_id = assertObjectId(req.params.navbar_id, "Navbar item not found.");

  const navItem = await NavbarItem.findByIdAndDelete(navbar_id);
  if (!navItem) {
    throw new ApiError(404, "Navbar item not found.");
  }

  await SubNavItem.deleteMany({ parent_item: navbar_id });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Navbar and associated SubNavbar items deleted successfully."));
});

// ==========================================
// 2. SUB-NAVBAR ITEM CONTROLLERS (CHILD)
// ==========================================

// Add sub-navbar item(s) to a specific navbar.
export const addSubNavItems = asyncHandler(async (req: Request, res: Response) => {
  const navbar_id = assertObjectId(req.params.navbar_id, "Parent Navbar item not found.");
  const { sub_items } = req.body as CreateSubNavbarsInput;

  const parentNav = await NavbarItem.findById(navbar_id);
  if (!parentNav) {
    throw new ApiError(404, "Parent Navbar item not found.");
  }

  const preparedSubItems = sub_items.map((item, index) => ({
    parent_item: parentNav._id,
    item_name: item.item_name,
    page_content: item.page_content ?? "",
    item_type: item.item_type ?? "navItem",
    order: item.order ?? index,
  }));

  const createdSubItems = await SubNavItem.insertMany(preparedSubItems);

  const createdIds = createdSubItems.map((item) => item._id);
  parentNav.sub_items.push(...(createdIds as never[]));
  await parentNav.save();

  return res
    .status(201)
    .json(new ApiResponse(201, createdSubItems, "Sub-navbar items added successfully."));
});

// Get all sub-navbar items for a specific navbar.
export const getSubNavbarsByNavbar = asyncHandler(async (req: Request, res: Response) => {
  const navbar_id = assertObjectId(req.params.navbar_id, "Navbar item not found.");

  const subItems = await SubNavItem.find({ parent_item: navbar_id }).sort({ order: 1 }).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, subItems, "Sub-navbar items retrieved successfully."));
});

// Replace the editable fields of a sub-navbar item (whitelisted by the schema).
export const updateSubNavbar = asyncHandler(async (req: Request, res: Response) => {
  const subnav_id = assertObjectId(req.params.subnav_id, "SubNavbar item not found.");
  const { item_name, page_content, item_type, order } = req.body as ReplaceSubNavbarInput;

  const updatedSub = await SubNavItem.findByIdAndUpdate(
    subnav_id,
    { $set: { item_name, page_content, item_type, order } },
    { new: true, runValidators: true }
  );

  if (!updatedSub) {
    throw new ApiError(404, "SubNavbar item not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSub, "SubNavbar item updated successfully."));
});

// Delete a single sub-navbar item and remove its ID from the parent.
export const deleteSubNavbar = asyncHandler(async (req: Request, res: Response) => {
  const subnav_id = assertObjectId(req.params.subnav_id, "SubNavbar item not found.");

  const subItem = await SubNavItem.findByIdAndDelete(subnav_id);
  if (!subItem) {
    throw new ApiError(404, "SubNavbar item not found.");
  }

  await NavbarItem.findByIdAndUpdate(subItem.parent_item, {
    $pull: { sub_items: subItem._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "SubNavbar item deleted successfully."));
});
