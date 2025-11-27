import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  email: { type: String, unique: true },
  username: { type: String, unique: true, sparse: true },
  /**
   * Hashed password for credential logins. When a user signs up with email
   * and password, the plain text password is hashed using SHA-256 and stored
   * here. This field may be null for users created via OAuth providers or
   * magic link sign‑in. It should never be exposed to the client.
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  email: { type: String, unique: true },
  username: { type: String, unique: true, sparse: true },
  /**
   * Hashed password for credential logins. When a user signs up with email
   * and password, the plain text password is hashed using SHA-256 and stored
   * here. This field may be null for users created via OAuth providers or
   * magic link sign‑in. It should never be exposed to the client.
   */
  passwordHash: { type: String, default: null },
  isPro: { type: Boolean, default: false },
  stripeCustomerId: { type: String, default: null },
}, { timestamps: true });

export type UserDoc = mongoose.InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };
export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);