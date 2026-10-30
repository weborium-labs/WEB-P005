// models/NavbarItem.ts
import mongoose, { Document, model, Schema, Types } from "mongoose";

export interface INavItem extends Document {
  user_id: Types.ObjectId;
  item_name: string;
  order: number;
  sub_items: Types.ObjectId[];
}

const NavItemSchema = new Schema<INavItem>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item_name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    sub_items: [{ type: Schema.Types.ObjectId, ref: "SubNavItem" }],
  },
  { timestamps: true }
);

export const NavbarItem = model<INavItem>("NavbarItem", NavItemSchema);