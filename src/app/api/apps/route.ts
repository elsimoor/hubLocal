import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";

function slugify(input: string) {
  return (input || "").toLowerCase().trim().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const apps = await AppModel.find({ ownerEmail: session.user.email }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ apps });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").slice(0, 120);
  let slug = String(body?.slug || slugify(name));
  const description = String(body?.description || "");
  const icon = String(body?.icon || "");
  if (!name || !slug) return NextResponse.json({ error: "missing name/slug" }, { status: 400 });
  slug = slugify(slug);
  await connectDB();
  const exists = await AppModel.findOne({ ownerEmail: session.user.email, slug }).lean();
  if (exists) return NextResponse.json({ error: "slug exists" }, { status: 409 });
  const app = await AppModel.create({ ownerEmail: session.user.email, name, slug, description, icon });
  return NextResponse.json({ ok: true, app });
}
