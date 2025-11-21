import mongoose, { Schema } from "mongoose";

const LinkSchema = new Schema(
  {
    type: { type: String, enum: ["link", "album", "vcf"], required: true },
    label: { type: String, required: true },
    iconKey: { type: String, default: "Share" },
    url: { type: String, default: "" },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const VcfSchema = new Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    cellPhone: { type: String, default: "" },
    workPhone: { type: String, default: "" },
    workEmail: { type: String, default: "" },
    homeEmail: { type: String, default: "" },
    workAddress: { type: String, default: "" },
    workCity: { type: String, default: "" },
    workZip: { type: String, default: "" },
    homeAddress: { type: String, default: "" },
    homeCity: { type: String, default: "" },
    homeZip: { type: String, default: "" },
    org: { type: String, default: "" },
    title: { type: String, default: "" },
    url: { type: String, default: "" },
    note: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    displayName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    backgroundUrl: { type: String, default: "" },
    buttonPrimaryLabel: { type: String, default: "Connect" },
    buttonSecondaryLabel: { type: String, default: "Links" },
    links: { type: [LinkSchema], default: [] },
    vcf: { type: VcfSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const ProfileModel = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
