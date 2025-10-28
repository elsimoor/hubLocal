import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user:any = await UserModel.findOne({ email: session.user.email }).lean();
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    isPro: !!user.isPro,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, isPro } = body || {};
  await connectDB();
  const update: any = {};
  if (firstName !== undefined) update.firstName = firstName ?? "";
  if (lastName !== undefined) update.lastName = lastName ?? "";
  if (isPro !== undefined) update.isPro = !!isPro;
  if (Object.keys(update).length > 0) {
    await UserModel.updateOne(
      { email: session.user.email },
      { $set: update },
      { upsert: false }
    );
  }
  return NextResponse.json({ ok: true });
}