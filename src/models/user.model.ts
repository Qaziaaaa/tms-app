import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "teacher" | "student";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], default: "teacher" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
