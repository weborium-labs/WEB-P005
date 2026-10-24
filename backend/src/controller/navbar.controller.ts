import { Request, Response } from "express";
import { NavbarItem } from "../models/navbar_item.model.js";
import SubNavItem from "../models/sub_nav_item.model.js";

// ==========================================
// 1. NAVBAR ITEM CONTROLLERS (PARENT)
// ==========================================

// Create Multiple Navbar items at once (Accepts single object OR array)
export const createNavItems = async (req: Request, res: Response) => {
  try {
    const { items, user_id } = req.body;

    // items can be passed as an array: [{ item_name: "Home", order: 1 }, { item_name: "Services", order: 2 }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an array of items with at least one item." });
    }

    const payload = items.map((item: any, index: number) => ({
      user_id: item.user_id || user_id,
      item_name: item.item_name,
      order: item.order ?? index,
      sub_items: [],
    }));

    const createdItems = await NavbarItem.insertMany(payload);
    return res.status(201).json({ success: true, count: createdItems.length, data: createdItems });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get All Navbar items (along with all nested SubNavbar items)
export const getAllNavbars = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const filter = user_id ? { user_id } : {};

    const navbars = await NavbarItem.find(filter)
      .sort({ order: 1 })
      .populate({
        path: "sub_items",
        options: { sort: { order: 1 } },
      });

    return res.status(200).json({ success: true, count: navbars.length, data: navbars });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Navbar Item name and/or order
export const updateNavbar = async (req: Request, res: Response) => {
  try {
    const { navbar_id } = req.params;
    const { item_name, order } = req.body;

    const updatedNavbar = await NavbarItem.findByIdAndUpdate(
      navbar_id,
      { $set: { item_name, order } },
      { new: true, runValidators: true }
    );

    if (!updatedNavbar) {
      return res.status(404).json({ success: false, message: "Navbar item not found." });
    }

    return res.status(200).json({ success: true, data: updatedNavbar });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a Navbar item and cascade-delete all its child SubNavbar items
export const deleteNavbar = async (req: Request, res: Response) => {
  try {
    const { navbar_id } = req.params;

    const navItem = await NavbarItem.findByIdAndDelete(navbar_id);
    if (!navItem) {
      return res.status(404).json({ success: false, message: "Navbar item not found." });
    }

    // Cascade delete all attached sub-items
    await SubNavItem.deleteMany({ parent_item: navbar_id });

    return res.status(200).json({
      success: true,
      message: "Navbar and all associated SubNavbar items deleted successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 2. SUB-NAVBAR ITEM CONTROLLERS (CHILD)
// ==========================================

// Add SubNavbar item(s) to a specific Navbar (Supports adding one or multiple)
export const addSubNavItems = async (req: Request, res: Response) => {
  try {
    const { navbar_id } = req.params;
    const { sub_items } = req.body;

    const parentNav = await NavbarItem.findById(navbar_id);
    if (!parentNav) {
      return res.status(404).json({ success: false, message: "Parent Navbar item not found." });
    }

    // Standardize input to an array (supports adding 1 item or multiple items in one request)
    const itemsList = Array.isArray(sub_items) ? sub_items : [sub_items];

    const preparedSubItems = itemsList.map((item: any, index: number) => ({
      parent_item: parentNav._id,
      item_name: item.item_name,
      page_content: item.page_content || "",
      item_type: item.item_type || "navItem",
      order: item.order ?? index,
    }));

    const createdSubItems = await SubNavItem.insertMany(preparedSubItems);

    // Push the new sub-item IDs into parent's sub_items array
    const createdIds = createdSubItems.map((item) => item._id);
    parentNav.sub_items.push(...(createdIds as any));
    await parentNav.save();

    return res.status(201).json({ success: true, count: createdSubItems.length, data: createdSubItems });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get all SubNavbar items for a specific Navbar
export const getSubNavbarsByNavbar = async (req: Request, res: Response) => {
  try {
    const { navbar_id } = req.params;

    const subItems = await SubNavItem.find({ parent_item: navbar_id }).sort({ order: 1 });

    return res.status(200).json({ success: true, count: subItems.length, data: subItems });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update SubNavbar item (name, content, type, order)
export const updateSubNavbar = async (req: Request, res: Response) => {
  try {
    const { subnav_id } = req.params;
    const { item_name, page_content, item_type, order } = req.body;

    const updatedSub = await SubNavItem.findByIdAndUpdate(
      subnav_id,
      { $set: { item_name, page_content, item_type, order } },
      { new: true, runValidators: true }
    );

    if (!updatedSub) {
      return res.status(404).json({ success: false, message: "SubNavbar item not found." });
    }

    return res.status(200).json({ success: true, data: updatedSub });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a single SubNavbar item and remove its ID from the parent
export const deleteSubNavbar = async (req: Request, res: Response) => {
  try {
    const { subnav_id } = req.params;

    const subItem = await SubNavItem.findByIdAndDelete(subnav_id);
    if (!subItem) {
      return res.status(404).json({ success: false, message: "SubNavbar item not found." });
    }

    // Pull sub-item reference from parent Navbar
    await NavbarItem.findByIdAndUpdate(subItem.parent_item, {
      $pull: { sub_items: subItem._id },
    });

    return res.status(200).json({ success: true, message: "SubNavbar item deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};