import mongoose, { Schema, InferSchemaType } from "mongoose";

const AppSchema = new Schema(
  {
    ownerEmail: { type: String, index: true, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
  { timestamps: true }
);

AppSchema.index({ ownerEmail: 1, slug: 1 }, { unique: true });

export type AppDoc = InferSchemaType<typeof AppSchema> & { _id: mongoose.Types.ObjectId };
export const AppModel = mongoose.models.App || mongoose.model("App", AppSchema);
