import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Page } from "../models/page.model.js";
import { Publication } from "../models/publication.model.js";
import { Glimpse } from "../models/glimpse.model.js";
import { NavbarItem } from "../models/navbar_item.model.js";
import SubNavItem from "../models/sub_nav_item.model.js";
import { Media } from "../models/media.model.js";
import { Theme } from "../models/theme.model.js";

/**
 * Dashboard overview.
 *
 * Every number is a real `countDocuments`/`count` against MongoDB — nothing is
 * derived, estimated or fabricated. Counts run in parallel and only the five
 * most recently touched pages are fetched as documents.
 */
export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [
    pageCount,
    publishedPages,
    draftPages,
    publicationCount,
    glimpseCount,
    navbarCount,
    subNavCount,
    mediaCount,
    themeCount,
    activeThemeCount,
    recentlyUpdated,
  ] = await Promise.all([
    Page.countDocuments(),
    Page.countDocuments({ status: "published" }),
    Page.countDocuments({ status: "draft" }),
    Publication.countDocuments(),
    Glimpse.countDocuments(),
    NavbarItem.countDocuments(),
    SubNavItem.countDocuments(),
    Media.countDocuments(),
    Theme.countDocuments(),
    Theme.countDocuments({ isActive: true }),
    Page.find()
      .select("slug title status version updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pages: {
          total: pageCount,
          published: publishedPages,
          draft: draftPages,
        },
        publications: publicationCount,
        glimpses: glimpseCount,
        navigation: {
          navbars: navbarCount,
          subnavbars: subNavCount,
        },
        media: mediaCount,
        themes: {
          total: themeCount,
          active: activeThemeCount,
        },
        recentlyUpdated: recentlyUpdated.map((page) => ({
          _id: String(page._id),
          slug: page.slug,
          title: page.title,
          status: page.status,
          version: page.version,
          updatedAt: page.updatedAt,
        })),
      },
      "Overview retrieved successfully.",
    ),
  );
});
