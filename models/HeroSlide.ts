import mongoose, { Model, Schema } from "mongoose";

export interface IHeroSlide extends mongoose.Document {
  title: string;
  subtitle: string;
  image: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    order: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

HeroSlideSchema.index({ order: 1 });

const HeroSlide =
  (mongoose.models.HeroSlide as Model<IHeroSlide>) ||
  mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema);

export default HeroSlide;
