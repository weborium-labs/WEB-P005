import mongoose, { Document, model, Schema, Types } from "mongoose";

/**
 * Content kinds a sub-navigation entry can hold.
 *
 * `navItem`/`gallery` are the original declared values; `interests`,
 * `patents`, `list`, `courses` and `mentorship` are present in production
 * documents. The enum must include every stored value, otherwise editing an
 * existing row fails schema validation (Mongoose rejects the whole update).
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

export interface ISubNavItem extends Document {
  _id: Types.ObjectId;
  parent_item: Types.ObjectId;
  item_name: string;
  page_content: string;
  item_type: SubItemType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubNavItemSchema = new Schema<ISubNavItem>(
  {
    parent_item: {
      type: Schema.Types.ObjectId,
      ref: "NavbarItem",
      required: true,
      index: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional: an empty page is a legitimate state and must not fail
    // validation (a required String rejects "" and turns a 400 into a 500).
    page_content: {
      type: String,
      default: "",
      trim: true,
    },
    item_type: {
      type: String,
      required: true,
      trim: true,
      enum: [...SUB_ITEM_TYPES],
    },
    // Drives `sort({ order: 1 })` in the controllers; previously absent from
    // the schema, so the value was silently dropped and sorting was unstable.
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const SubNavItem = model<ISubNavItem>("SubNavItem", SubNavItemSchema);
export default SubNavItem;
