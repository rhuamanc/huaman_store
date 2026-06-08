import mongoose, { Model, Schema } from "mongoose";
import { CATEGORIES } from "@/types";

export interface IListing extends mongoose.Document {
  title: string;
  description: string;
  price: number;
  category: (typeof CATEGORIES)[number];
  images: string[];
  status: "draft" | "published" | "sold" | "archived";
  moderationStatus: "pending" | "approved" | "rejected";
  paymentLink?: string;
  geo?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
  seller: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published", "sold", "archived"],
      default: "published",
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paymentLink: { type: String },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      city: { type: String },
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ListingSchema.index({ category: 1, createdAt: -1 });
ListingSchema.index({ title: "text", description: "text" });

const Listing =
  (mongoose.models.Listing as Model<IListing>) || mongoose.model<IListing>("Listing", ListingSchema);

export default Listing;
