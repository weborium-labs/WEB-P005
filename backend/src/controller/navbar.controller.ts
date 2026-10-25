import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { NavbarItem } from "../models/navbar_item.model.js";
import SubNavItem from "../models/sub_nav_item.model.js";

// ==========================================
// 1. NAVBAR ITEM CONTROLLERS (PARENT)
// ==========================================

// Create Multiple Navbar items at once (Accepts single object OR array)
export const createNavItems = asyncHandler(async (req: Request, res: Response) => {
  const { items, user_id } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Provide an array of items with at least one item.");
  }

  const payload = items.map((item: any, index: number) => ({
    user_id: item.user_id || user_id,
    item_name: item.item_name,
    order: item.order ?? index,
    sub_items: [],
  }));

  const createdItems = await NavbarItem.insertMany(payload);

  return res
    .status(201)
    .json(new ApiResponse(201, createdItems, "Navbar items created successfully."));
});

// Get All Navbar items (along with all nested SubNavbar items)

export const getAllNavbars = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.query;
  const filter = user_id ? { user_id: String(user_id) } : {};

  const navbars = await NavbarItem.find(filter)
    .sort({ order: 1 })
    .populate({
      path: "sub_items",
      options: { sort: { order: 1 } },
    });

  return res
    .status(200)
    .json(new ApiResponse(200, navbars, "Navbar items retrieved successfully."));
});

// Update Navbar Item name and/or order
export const updateNavbar = asyncHandler(async (req: Request, res: Response) => {
  const { navbar_id } = req.params;
  const { item_name, order } = req.body;

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

// Delete a Navbar item and cascade-delete all its child SubNavbar items
export const deleteNavbar = asyncHandler(async (req: Request, res: Response) => {
  const { navbar_id } = req.params;

  const navItem = await NavbarItem.findByIdAndDelete(navbar_id);
  if (!navItem) {
    throw new ApiError(404, "Navbar item not found.");
  }

  // Cascade delete all attached sub-items
  await SubNavItem.deleteMany({ parent_item: navbar_id });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Navbar and associated SubNavbar items deleted successfully."));
});

// ==========================================
// 2. SUB-NAVBAR ITEM CONTROLLERS (CHILD)
// ==========================================

// Add SubNavbar item(s) to a specific Navbar (Supports adding one or multiple)
export const addSubNavItems = asyncHandler(async (req: Request, res: Response) => {
  const { navbar_id } = req.params;
  const { sub_items } = req.body;

  const parentNav = await NavbarItem.findById(navbar_id);
  if (!parentNav) {
    throw new ApiError(404, "Parent Navbar item not found.");
  }

  // Standardize input to an array (supports single object or array)
  const itemsList = Array.isArray(sub_items) ? sub_items : [sub_items];

  const preparedSubItems = itemsList.map((item: any, index: number) => ({
    parent_item: parentNav._id,
    item_name: item.item_name,
    page_content: item.page_content || "",
    item_type: item.item_type || "navItem",
    order: item.order ?? index,
  }));

  const createdSubItems = await SubNavItem.insertMany(preparedSubItems);

  // Push new sub-item IDs into parent's sub_items array
  const createdIds = createdSubItems.map((item) => item._id);
  parentNav.sub_items.push(...(createdIds as any));
  await parentNav.save();

  return res
    .status(201)
    .json(new ApiResponse(201, createdSubItems, "Sub-navbar items added successfully."));
});

// Get all SubNavbar items for a specific Navbar
export const getSubNavbarsByNavbar = asyncHandler(async (req: Request, res: Response) => {
  const { navbar_id } = req.params;

  const subItems = await SubNavItem.find({ parent_item: navbar_id }).sort({ order: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, subItems, "Sub-navbar items retrieved successfully."));
});

// Update SubNavbar item (name, content, type, order)
export const updateSubNavbar = asyncHandler(async (req: Request, res: Response) => {
  const { subnav_id } = req.params;
  const { item_name, page_content, item_type, order } = req.body;

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

// Delete a single SubNavbar item and remove its ID from the parent
export const deleteSubNavbar = asyncHandler(async (req: Request, res: Response) => {
  const { subnav_id } = req.params;

  const subItem = await SubNavItem.findByIdAndDelete(subnav_id);
  if (!subItem) {
    throw new ApiError(404, "SubNavbar item not found.");
  }

  // Pull sub-item reference from parent Navbar
  await NavbarItem.findByIdAndUpdate(subItem.parent_item, {
    $pull: { sub_items: subItem._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "SubNavbar item deleted successfully."));
});