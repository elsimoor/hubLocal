import mongoose, { Schema, InferSchemaType } from "mongoose";

const AppSchema = new Schema(
  {
    ownerEmail: { type: String, index: true, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    // Template system fields
    isTemplate: { type: Boolean, default: false, index: true },
    visibility: { type: String, enum: ["private", "public"], default: "private", index: true },
    templateSource: { type: Schema.Types.ObjectId, ref: "App", default: null }, // original template _id if cloned
    templateVersion: { type: Number, default: 0 }, // templates start at 1, clones store snapshot version
    templateUpdatedAt: { type: Date, default: null },
    lastTemplateSyncAt: { type: Date, default: null },
    clonedAt: { type: Date, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppSchema.index({ ownerEmail: 1, slug: 1 }, { unique: true });
// Fast lookup for public templates
AppSchema.index({ isTemplate: 1, visibility: 1 });

export type AppDoc = InferSchemaType<typeof AppSchema> & { _id: mongoose.Types.ObjectId };
export const AppModel = mongoose.models.App || mongoose.model("App", AppSchema);

// Backward compatibility aliases for any hub-based imports
export type HubDoc = AppDoc;
export const HubModel = AppModel;
