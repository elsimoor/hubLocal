import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing app id" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
  await connectDB();
  const app = await AppModel.findById(id).lean();
  if (!app) return NextResponse.json({ error: "app not found" }, { status: 404 });
  const ownerEmail = (app as any).ownerEmail as string;
  const appSlug = (app as any).slug as string;
  
  const debugInfo: any = debug ? { id, appSlug, ownerEmail } : undefined;
  
  // Try exact home first (with owner)
  let doc = await PuckDocModel.findOne({ ownerEmail, slug: appSlug, status: "published" }).lean();
  if (debug) debugInfo.matchExactWithOwner = !!doc;
  // Fallback to "home" under app slug (with owner)
  if (!doc) {
    const altHome = await PuckDocModel.findOne({ ownerEmail, slug: `${appSlug}/home`, status: "published" }).lean();
    if (debug) debugInfo.matchHomeWithOwner = !!altHome;
    if (altHome) doc = altHome;
  }
  // Secondary fallback: slug-only (no owner) exact
  if (!doc) {
    const slugOnly = await PuckDocModel.findOne({ slug: appSlug, status: "published" }).lean();
    if (debug) debugInfo.matchExactSlugOnly = !!slugOnly;
    if (slugOnly) doc = slugOnly;
  }
  // Secondary fallback: slug-only home
  if (!doc) {
    const slugOnlyHome = await PuckDocModel.findOne({ slug: `${appSlug}/home`, status: "published" }).lean();
    if (debug) debugInfo.matchHomeSlugOnly = !!slugOnlyHome;
    if (slugOnlyHome) doc = slugOnlyHome;
  }
  
  if (!doc) return NextResponse.json({ error: "not found", debug: debug ? debugInfo : undefined }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null, debug: debug ? debugInfo : undefined });
}
