import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import mongoose from "mongoose";

// GET single app details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!id || !mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const app = await AppModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ app });
}

// Update limited mutable fields: name, description, icon, visibility
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!id || !mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const nameRaw = String(body?.name || "").trim();
  const descriptionRaw = String(body?.description || "");
  const iconRaw = String(body?.icon || "");
  const visibilityRaw = String(body?.visibility || "").toLowerCase();
  const update: any = {};
  if (nameRaw) update.name = nameRaw.slice(0, 120);
  if (descriptionRaw !== undefined) update.description = descriptionRaw;
  if (iconRaw !== undefined) update.icon = iconRaw;
  if (visibilityRaw === "public" || visibilityRaw === "private") update.visibility = visibilityRaw;
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  await connectDB();
  const app = await AppModel.findOneAndUpdate(
    { _id: id, ownerEmail: session.user.email },
    { $set: update },
    { new: true }
  ).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, app });
}

// Delete app and associated pages (PuckDocs with slug prefix)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session:any = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!id || !mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const app = await AppModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  const slug = (app as any).slug as string;
  const sessionDb = await mongoose.startSession();
  try {
    await sessionDb.withTransaction(async () => {
      await AppModel.deleteOne({ _id: id, ownerEmail: session.user.email }, { session: sessionDb });
      const regex = new RegExp(`^${slug}/?.*`);
      // Delete home doc and prefixed pages in two safe operations (avoid invalid mixed $in/$regex)
      await PuckDocModel.deleteMany({ ownerEmail: session.user.email, slug: slug }, { session: sessionDb });
      await PuckDocModel.deleteMany({ ownerEmail: session.user.email, slug: { $regex: regex } }, { session: sessionDb });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("App delete failed", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  } finally {
    await sessionDb.endSession();
  }
}
