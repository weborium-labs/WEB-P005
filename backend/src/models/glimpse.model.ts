import mongoose, { Document, model, Schema, Types } from "mongoose";

export interface IGlimpse extends Document {
  user_id: Types.ObjectId;
  image_url: string;
  public_id: string;
  order: number;
}

const GlimpseSchema = new Schema<IGlimpse>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    image_url: {
      type: String,
      required: true,
      trim: true,
    },
    public_id: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Glimpse = model<IGlimpse>("Glimpse", GlimpseSchema);