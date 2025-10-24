import mongoose, { Schema } from "mongoose";

/*
 * AccountModel stores OAuth account information for users. Each record links a
 * user (via userId) to a provider (e.g. "google") and a providerAccountId
 * (the unique identifier from the provider). Additional OAuth tokens and
 * metadata fields are included for completeness but are optional. This
 * collection is used by the NextAuth adapter to link OAuth accounts to
 * existing users and to look up users by provider account.
 */
const AccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: { type: String },
    access_token: { type: String },
    expires_at: { type: Number },
    token_type: { type: String },
    scope: { type: String },
    id_token: { type: String },
    session_state: { type: String },
  },
  { timestamps: true }
);

// Ensure uniqueness for provider account combinations
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export const AccountModel =
  mongoose.models.Account || mongoose.model("Account", AccountSchema);