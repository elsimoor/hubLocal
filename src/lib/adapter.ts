import { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { UserModel } from "@/lib/models/User";
import { AccountModel } from "@/lib/models/Account";

/*
 * A minimal Mongoose adapter for NextAuth used to support the EmailProvider.
 * NextAuth's EmailProvider requires an adapter implementing the
 * createVerificationToken and useVerificationToken methods to store and
 * consume one‑time login tokens. We also provide basic user lookup
 * functions so NextAuth can associate OAuth accounts with users. Sessions
 * are handled via JWTs (see session.strategy = "jwt" in authOptions), so
 * session methods in this adapter return null.
 */

// Define a schema for verification tokens. These are used for magic link
// logins. Each token is associated with an identifier (email) and an
// expiration date. Tokens are removed after they are used.
const VerificationTokenSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

// The model is lazily created so it can be reused across hot reloads.
const VerificationTokenModel =
  mongoose.models.VerificationToken ||
  mongoose.model(
    "VerificationToken",
    VerificationTokenSchema
  );

// Helper to serialize a mongoose document to a plain JS object expected by
// NextAuth. Without this, NextAuth might receive Mongoose objects and fail
// type checks.
function serializeUser(doc: any): AdapterUser {
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    email: doc.email ?? null,
    emailVerified: null,
    image: null,
  };
}

export const MongooseAdapter: Adapter = {
  // --- User methods ---
  async createUser(data:any) {
    await connectDB();
    // Create a new user document. We store additional fields (firstName,
    // lastName) if provided. If name is not explicitly passed, derive it
    // from firstName/lastName. NextAuth only cares about id, name and email.
    const name =
      data.name ||
      [
        (data as any).firstName ?? null,
        (data as any).lastName ?? null,
      ]
        .filter(Boolean)
        .join(" ");
    const user = await UserModel.create({
      name,
      email: data.email,
      firstName: (data as any).firstName ?? "",
      lastName: (data as any).lastName ?? "",
    });
    return serializeUser(user);
  },

  async getUser(id) {
    await connectDB();
    const user = await UserModel.findById(id).lean();
    return user ? serializeUser(user) : null;
  },

  async getUserByEmail(email) {
    await connectDB();
    const user = await UserModel.findOne({ email }).lean();
    return user ? serializeUser(user) : null;
  },

  async getUserByAccount({ providerAccountId, provider }) {
    await connectDB();
    const acc:any = await AccountModel.findOne({
      provider,
      providerAccountId,
    }).lean();
    if (!acc) return null;
    const user = await UserModel.findById(acc.userId).lean();
    return user ? serializeUser(user) : null;
  },

  async updateUser(user) {
    await connectDB();
    const existing:any = await UserModel.findById(user.id);
    if (!existing) return serializeUser(user as any);
    existing.name = user.name ?? existing.name;
    existing.email = user.email ?? existing.email;
    await existing.save();
    return serializeUser(existing);
  },

  async deleteUser(id) {
    await connectDB();
    await UserModel.deleteOne({ _id: id });
  },

  // --- Account linking methods ---
  async linkAccount(account:any) {
    // Store OAuth account details. Upsert on provider+providerAccountId.
    await connectDB();
    try {
      await AccountModel.updateOne(
        { provider: account.provider, providerAccountId: account.providerAccountId },
        {
          $set: {
            userId: account.userId,
            type: account.type,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: (account as any).session_state,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.error("linkAccount error", e);
    }
    return;
  },

  async unlinkAccount({ providerAccountId, provider }:any) {
    await connectDB();
    await AccountModel.deleteOne({ provider, providerAccountId });
    return;
  },

  // --- Session methods ---
  async createSession(session) {
    // We use JWT sessions, so no DB persistence. Return the session with an
    // id equal to the token (sessionToken) for completeness.
    return { ...session, id: session.sessionToken } as any;
  },

  async getSessionAndUser(sessionToken) {
    // No DB sessions; return null so NextAuth falls back to JWT handling.
    return null;
  },

  async updateSession(session) {
    // No DB sessions; nothing to update.
    return null;
  },

  async deleteSession(sessionToken) {
    // No DB sessions; nothing to delete.
    return null;
  },

  // --- Verification token methods ---
  async createVerificationToken(token: VerificationToken) {
    await connectDB();
    await VerificationTokenModel.create(token);
    return token;
  },

  async useVerificationToken(params: {
    identifier: string;
    token: string;
  }): Promise<VerificationToken | null> {
    await connectDB();
    const doc = await VerificationTokenModel.findOneAndDelete({
      identifier: params.identifier,
      token: params.token,
    });
    if (!doc) return null;
    return {
      identifier: doc.identifier,
      token: doc.token,
      expires: doc.expires,
    };
  },
};