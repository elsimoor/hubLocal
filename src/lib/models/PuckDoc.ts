import mongoose, { Schema, InferSchemaType } from "mongoose";

const PuckDocSchema = new Schema(
  {
    ownerEmail: { type: String, index: true, required: true },
    slug: { type: String, index: true, default: "default" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    data: { type: Schema.Types.Mixed, default: {} },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PuckDocSchema.index({ ownerEmail: 1, slug: 1 }, { unique: true });

export type PuckDoc = InferSchemaType<typeof PuckDocSchema> & { _id: mongoose.Types.ObjectId };
export const PuckDocModel = mongoose.models.PuckDoc || mongoose.model("PuckDoc", PuckDocSchema);
