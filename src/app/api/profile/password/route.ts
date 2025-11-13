import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { newPassword, confirmPassword } = body || {};

  if (!newPassword || !confirmPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  await connectDB();
  const user: any = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Allow setting password even if none existed before (e.g., OAuth account)
  const newHashed = hashPassword(newPassword);
  if (user.passwordHash && newHashed === user.passwordHash) {
    // No change; treat as success for better UX.
    return NextResponse.json({ ok: true, unchanged: true });
  }

  user.passwordHash = newHashed;
  await user.save();

  return NextResponse.json({ ok: true });
}
