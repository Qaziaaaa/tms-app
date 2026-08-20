import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  department: string;
  batch: string;
  schedule?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
    batch: { type: String, required: true },
    schedule: { type: String },
  },
  { timestamps: true }
);

ClassSchema.index({ department: 1 });
ClassSchema.index({ batch: 1 });

export const Class = mongoose.models.Class || mongoose.model<IClass>("Class", ClassSchema);
