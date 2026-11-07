import { Document, model, Schema, Types } from "mongoose";

/**
 * Media library entry.
 *
 * Uploaded images live in Cloudinary (never in MongoDB); this collection only
 * stores the metadata needed to preview, re-use and safely delete them.
 * Page sections denormalise `url`/`public_id` so the public frontend renders
 * without an extra join, while this record stays the owner of the asset.
 */
export interface IMedia extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  url: string;
  public_id: string;
  alt: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    url: { type: String, required: true, trim: true },
    public_id: { type: String, required: true, unique: true, index: true, trim: true },
    alt: { type: String, default: "", trim: true },
    format: { type: String, default: "", trim: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    folder: { type: String, default: "portfolio_media", trim: true },
  },
  { timestamps: true },
);

export const Media = model<IMedia>("Media", MediaSchema);
export default Media;
