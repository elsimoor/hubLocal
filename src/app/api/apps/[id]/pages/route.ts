import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import mongoose from "mongoose";

function pageFromDocSlug(slug: string, appSlug: string) {
  if (!slug) return "";
  if (slug === appSlug) return "home";
  const prefix = appSlug + "/";
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = params?.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const app = await AppModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  const appSlug = (app as any).slug as string;
  // Find all Puck docs that belong to this app by slug prefix
  const regex = new RegExp(`^${appSlug}/?.*`);
  const docs = await PuckDocModel.find({ ownerEmail: session.user.email, slug: regex }).sort({ updatedAt: -1 }).lean();
  const pages = (docs as any[]).map((d) => ({
    pageSlug: pageFromDocSlug(d.slug as string, appSlug),
    slug: d.slug,
    status: d.status,
    updatedAt: d.updatedAt,
    title: d?.data?.root?.props?.title || d?.data?.root?.props?.name || d.slug,
  }));
  return NextResponse.json({ app, pages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = params?.id;
  const body = await req.json().catch(() => ({}));
  const pageSlugRaw = String(body?.pageSlug || "").trim();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  if (!pageSlugRaw) return NextResponse.json({ error: "missing pageSlug" }, { status: 400 });
  const pageSlug = pageSlugRaw.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  await connectDB();
  const app = await AppModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  const slug = `${(app as any).slug}/${pageSlug}`;
  const existing = await PuckDocModel.findOne({ ownerEmail: session.user.email, slug }).lean();
  if (existing) return NextResponse.json({ error: "page exists" }, { status: 409 });
  const created = await PuckDocModel.create({ ownerEmail: session.user.email, slug, status: "draft", data: { root: { props: { title: pageSlug } }, content: [] } });
  return NextResponse.json({ ok: true, page: { slug, pageSlug, id: (created as any)._id } });
}
