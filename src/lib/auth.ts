import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongooseAdapter } from "@/lib/adapter";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

// Helper to construct an SMTP connection string from individual MAIL_* environment
// variables. If EMAIL_SERVER is defined, it will take precedence. Otherwise
// MAIL_USER, MAIL_PASS, MAIL_HOST and MAIL_PORT are combined. If MAIL_TLS is
// "true" a secure connection is requested via the query string.
function buildEmailServer(): string | undefined {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;
  if (user && pass && host && port) {
    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(pass);
    const secure = process.env.MAIL_TLS === "true" ? "?secure=true" : "";
    return `smtp://${encodedUser}:${encodedPass}@${host}:${port}${secure}`;
  }
  return undefined;
}

// Hash a plain text password using SHA-256. We use a simple hash here for
// demonstration purposes. In production, prefer bcrypt or argon2.
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// NOTE: EmailProvider requires SMTP env variables to be configured:
// EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM
export const authOptions: NextAuthOptions = {
  // The secret is used to sign and encrypt session tokens. Without a secret,
  // NextAuth will throw a configuration error in production. Ensure this
  // environment variable is defined in .env. See https://next-auth.js.org/configuration/options#secret
  secret: process.env.NEXTAUTH_SECRET,
  // Use our custom Mongoose adapter to enable the EmailProvider. The adapter
  // provides verification token storage and basic user lookup. Because we
  // configure the session strategy to 'jwt' (below), session methods in the
  // adapter are effectively unused.
  adapter: MongooseAdapter,
  // Store sessions in JSON Web Tokens instead of the database. This avoids
  // requiring session-related adapter methods and keeps the implementation
  // simple. See https://next-auth.js.org/configuration/options#session
  session: { strategy: "jwt" },
  // Allow linking accounts across providers with the same email. Without this, a
  // user who first signs in via email cannot later connect a Google account
  // with the same address (and vice versa). See https://next-auth.js.org/configuration/options#allowdangerousemailaccountlinking
  allowDangerousEmailAccountLinking: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? buildEmailServer(),
      // Prefer EMAIL_FROM, else fallback to SENDER_EMAIL for backwards compatibility
      from: process.env.EMAIL_FROM ?? process.env.SENDER_EMAIL ?? undefined,
    }),
    // Credentials provider allows users to sign in with email and password.
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;
        await connectDB();
        const user = await UserModel.findOne({ email }).lean();
        if (!user || !user.passwordHash) return null;
        const hashed = hashPassword(password);
        if (hashed !== user.passwordHash) return null;
        // Return the basic user object for NextAuth session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          isPro: !!user.isPro,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ profile }) {
      await connectDB();
      if (profile?.email) {
        // When a new account is created via Google, seed firstName/lastName from
        // the OAuth profile if available. Use $setOnInsert so existing users
        // are not overwritten.
        await UserModel.findOneAndUpdate(
          { email: profile.email },
          {
            $setOnInsert: {
              name: profile.name,
              email: profile.email,
              firstName: (profile as any)?.given_name ?? undefined,
              lastName: (profile as any)?.family_name ?? undefined,
            },
          },
          { upsert: true }
        );
      }
      return true;
    },
    async session({ session }) {
      // Populate session.user with additional fields from the database
      try {
        if (session?.user?.email) {
          await connectDB();
          const user = await UserModel.findOne({ email: session.user.email }).lean();
          if (user) {
            (session.user as any).id = user._id.toString();
            (session.user as any).isPro = !!user.isPro;
            (session.user as any).firstName = user.firstName ?? "";
            (session.user as any).lastName = user.lastName ?? "";
            // Mark user as admin if their email matches the ADMIN_EMAIL env variable
            (session.user as any).isAdmin =
              !!process.env.ADMIN_EMAIL && session.user.email === process.env.ADMIN_EMAIL;
          }
        }
      } catch (e) {
        console.error("session callback error", e);
      }
      return session;
    },
  },
};
