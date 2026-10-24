import mongoose, { Document, model, Schema, Types } from "mongoose";

export interface ISubNavItem extends Document {
  parent_item: Types.ObjectId;
  item_name: string;
  page_content: string;
  item_type: "navItem" | "gallery";
}

const SubNavItemSchema = new Schema<ISubNavItem>(
  {
    parent_item: {
      type: Schema.Types.ObjectId,
      ref: "NavbarItem",
      required: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    page_content: {
      type: String,
      required: true,
      trim: true,
    },
    item_type: {
      type: String,
      required: true,
      trim: true,
      enum: ["navItem", "gallery"],
    },
  },
  { timestamps: true }
);

const SubNavItem = model<ISubNavItem>("SubNavItem", SubNavItemSchema);
export default SubNavItem;