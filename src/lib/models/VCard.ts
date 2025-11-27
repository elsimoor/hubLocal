import mongoose, { Schema, InferSchemaType } from "mongoose";

const VCardSchema = new Schema(
    {
        ownerEmail: { type: String, required: true, index: true },
        appId: { type: Schema.Types.ObjectId, ref: "App", required: true },
        slug: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        title: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        website: { type: String, default: "" },
        avatar: { type: String, default: "" },
        bio: { type: String, default: "" },
        pageSlug: { type: String, default: "home" },
        socialLinks: [
            {
                platform: { type: String, required: true },
                url: { type: String, required: true },
            },
        ],
        theme: { type: String, default: "default" },
    },
    { timestamps: true }
);

export type VCardDoc = InferSchemaType<typeof VCardSchema> & { _id: mongoose.Types.ObjectId };
export const VCardModel = mongoose.models.VCard || mongoose.model("VCard", VCardSchema);
