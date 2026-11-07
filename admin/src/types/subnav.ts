/**
 * Content kinds a sub-navigation entry can hold.
 *
 * Mirrors `backend/src/models/sub_nav_item.model.ts`. Production documents
 * already store `interests`, `patents`, `list`, `courses` and `mentorship`,
 * so the admin form must offer every value the API accepts — otherwise editing
 * an existing row would silently change its type.
 */
export const SUB_ITEM_TYPES = [
  "navItem",
  "gallery",
  "interests",
  "patents",
  "list",
  "courses",
  "mentorship",
] as const;

export type SubItemType = (typeof SUB_ITEM_TYPES)[number];

/** Human-friendly label for each content kind. */
export const SUB_ITEM_TYPE_LABELS: Record<SubItemType, string> = {
  navItem: "Navigation link",
  gallery: "Image gallery",
  interests: "Research interests",
  patents: "Patents",
  list: "Card list",
  courses: "Courses taught",
  mentorship: "Mentorship",
};
