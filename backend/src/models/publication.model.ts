import mongoose, { Document, model, Schema, Types } from "mongoose";

export interface IPublication extends Document {
  user_id: Types.ObjectId;
  type: "journal" | "conference";
  title: string;
  year: number;
  publication_name: string;
  volume_issue?: string;
  indexing?: string;
  redirect_url: string;
  order: number;
}

const PublicationSchema = new Schema<IPublication>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["journal", "conference"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    publication_name: {
      type: String,
      required: true,
      trim: true,
    },
    volume_issue: {
      type: String,
      trim: true,
      default: "",
    },
    indexing: {
      type: String,
      trim: true,
      default: "",
    },
    redirect_url: {
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

export const Publication = model<IPublication>("Publication", PublicationSchema);