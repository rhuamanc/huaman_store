import mongoose, { Model, Schema } from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String },
  },
  { timestamps: true }
);

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
