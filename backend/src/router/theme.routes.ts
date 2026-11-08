import { Router } from "express";
import {
  createTheme,
  deleteTheme,
  getActiveTheme,
  listThemes,
  replaceTheme,
  updateTheme,
} from "../controller/theme.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createThemeSchema,
  replaceThemeSchema,
  updateThemeSchema,
} from "../schemas/theme.schema.js";

const router: Router = Router();

// Public read — the active theme drives the CSS custom properties of the
// whole website. Declared before the admin-only `/themes` list route.
router.get("/themes/active", getActiveTheme);

// Admin listing (includes token groups + default palette for the editor).
router.get("/themes", verifyAdmin, listThemes);

router.post("/themes", verifyAdmin, validateBody(createThemeSchema), createTheme);

router.put("/themes/:idOrSlug", verifyAdmin, validateBody(replaceThemeSchema), replaceTheme);

router.patch("/themes/:idOrSlug", verifyAdmin, validateBody(updateThemeSchema), updateTheme);

router.delete("/themes/:idOrSlug", verifyAdmin, deleteTheme);

export default router;
