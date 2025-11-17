import mongoose, { Schema, InferSchemaType } from "mongoose";

const GroupSchema = new Schema(
  {
    ownerEmail: { type: String, index: true, default: null },
    name: { type: String, required: true },
    // Opaque Puck subtree (selected node or a container with children)
    tree: { type: Schema.Types.Mixed, required: true },
    public: { type: Boolean, default: false },
    autoInclude: { type: Boolean, default: false },
    // Optional notes/description
    description: { type: String, default: "" },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Prevent duplicate names per owner; public groups have null ownerEmail
GroupSchema.index({ ownerEmail: 1, name: 1 }, { unique: true });

export type Group = InferSchemaType<typeof GroupSchema> & { _id: mongoose.Types.ObjectId };
export const GroupModel = mongoose.models.Group || mongoose.model("Group", GroupSchema);
