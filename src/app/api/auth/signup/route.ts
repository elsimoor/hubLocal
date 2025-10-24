import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";
import crypto from "crypto";

/**
 * API endpoint to handle user registration. Accepts a JSON body with
 * { firstName, lastName, email, password }. Validates inputs, checks for
 * existing users, hashes the password and creates a new user record.
 *
 * Responses:
 * 200 { ok: true } on success
 * 400 { error: string } on missing fields or if the email is already taken
 */
export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    await connectDB();
    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 400 });
    }
    const hash = crypto.createHash("sha256").update(String(password)).digest("hex");
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    await UserModel.create({
      name,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      email,
      passwordHash: hash,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("signup error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}