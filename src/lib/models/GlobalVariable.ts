import mongoose, { Schema, Types } from "mongoose";

export interface IGlobalVariable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  value: string;
  label: string;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalVariableSchema = new Schema<IGlobalVariable>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true, trim: true },
    value: { type: String, default: "" },
    label: { type: String, required: true, trim: true },
    category: { type: String, default: "general", trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for userId + key uniqueness
GlobalVariableSchema.index({ userId: 1, key: 1 }, { unique: true });

export const GlobalVariableModel =
  mongoose.models.GlobalVariable ||
  mongoose.model<IGlobalVariable>("GlobalVariable", GlobalVariableSchema);
