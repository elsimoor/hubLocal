import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";
import { createSampleProfilePayload } from "@/types/profile";
import {
  getProfileByUserId,
  isSlugTaken,
  normalizeSlug,
  sanitizeProfilePayload,
  serializeProfile,
  upsertProfile,
} from "@/lib/profile/service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email }).lean<{ _id: Types.ObjectId; email: string }>();
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const profile = await getProfileByUserId(user._id);
  if (profile) {
    return NextResponse.json(profile);
  }

  const slug = normalizeSlug(session.user.email.split("@")[0]);
  const fallback = createSampleProfilePayload(slug, session.user.name || slug);
  return NextResponse.json(fallback);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const payload = sanitizeProfilePayload(raw);
  if (!payload.slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email }).lean<{ _id: Types.ObjectId; email: string }>();
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const slugTaken = await isSlugTaken(payload.slug, user._id);
  if (slugTaken) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }

  const updated = await upsertProfile(user._id, payload);
  const serialized = serializeProfile(updated);
  return NextResponse.json(serialized);
}
