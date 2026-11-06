// routes/nav.routes.ts
import { Router } from "express";
import {
  createNavItems,
  getAllNavbars,
  updateNavbar,
  deleteNavbar,
  addSubNavItems,
  getSubNavbarsByNavbar,
  updateSubNavbar,
  deleteSubNavbar,
} from "../controller/navbar.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const NavRouter: Router = Router();

// ==========================================
// 1. NAVBAR (PARENT) ROUTES
// ==========================================

// Create multiple navbars or single navbar (Admin Only)
NavRouter.post("/navbars", verifyAdmin, createNavItems);

// Get all navbars along with all nested subnavbars (Public)
NavRouter.get("/navbars", getAllNavbars);

// Update a navbar (name, order) (Admin Only)
NavRouter.put("/navbars/:navbar_id", verifyAdmin, updateNavbar);

// Delete a navbar (cascade deletes all its child subnavbars) (Admin Only)
NavRouter.delete("/navbars/:navbar_id", verifyAdmin, deleteNavbar);

// ==========================================
// 2. SUB-NAVBAR (CHILD) ROUTES
// ==========================================

// Add one or multiple subnavbars under a specific navbar (Admin Only)
NavRouter.post("/navbars/:navbar_id/subnavbars", verifyAdmin, addSubNavItems);

// Get all subnavbars for a single navbar (Public)
NavRouter.get("/navbars/:navbar_id/subnavbars", getSubNavbarsByNavbar);

// Update a specific subnavbar (name, page content, type, order) (Admin Only)
NavRouter.put("/subnavbars/:subnav_id", verifyAdmin, updateSubNavbar);

// Delete a single subnavbar (removes reference from parent) (Admin Only)
NavRouter.delete("/subnavbars/:subnav_id", verifyAdmin, deleteSubNavbar);

export default NavRouter;