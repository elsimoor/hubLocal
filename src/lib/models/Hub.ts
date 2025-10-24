import mongoose, { Schema, InferSchemaType } from "mongoose";

const StatsSchema = new Schema(
    { views: { type: Number, default: 0 }, clicks: { type: Number, default: 0 } },
    { _id: false }
);

const HubSchema = new Schema(
    {
        title: { type: String, required: true, default: "Nouveau hub" },
        slug: { type: String, required: true },
        shortSlug: { type: String, default: null }, // pour hublocal.link/slug
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        data: { type: Schema.Types.Mixed, default: {} }, 
        owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
        ownerEmail: { type: String, index: true, required: true },
        stats: { type: StatsSchema, default: () => ({}) },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

HubSchema.index({ ownerEmail: 1, slug: 1 }, { unique: true });
HubSchema.index({ shortSlug: 1 }, { unique: true, sparse: true });

export type HubDoc = InferSchemaType<typeof HubSchema> & { _id: mongoose.Types.ObjectId };
export const HubModel = mongoose.models.Hub || mongoose.model("Hub", HubSchema);
