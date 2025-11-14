import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; page?: string[] }> }
) {
  const { id, page } = await params;
  if (!id) return NextResponse.json({ error: "missing app id" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
  await connectDB();
  const app = await AppModel.findById(id).lean();
  if (!app) return NextResponse.json({ error: "app not found" }, { status: 404 });

  const appSlug = (app as any).slug as string;
  const ownerEmail = (app as any).ownerEmail as string;
  const pageParts = Array.isArray(page) ? page : [];
  const resolvedSlug = pageParts.length === 0
    ? appSlug
    : `${appSlug}/${pageParts.map((p) => String(p)).join('/')}`;

  // Primary query including ownerEmail for isolation
  let doc = await PuckDocModel.findOne({ ownerEmail, slug: resolvedSlug, status: "published" }).lean();

  // Build optional debug info
  const debugInfo: any = debug ? {
    id,
    appSlug,
    ownerEmail,
    pageParts,
    resolvedSlug,
    matchedWithOwner: !!doc,
  } : undefined;

  if (!doc) {
    // Secondary query by slug only to detect owner mismatch issues
    const alt = await PuckDocModel.findOne({ slug: resolvedSlug, status: "published" }).lean();
    if (debug) {
      debugInfo.matchedBySlugOnly = !!alt;
      debugInfo.note = !alt ? "No document found for resolved slug" : "Found by slug-only (owner mismatch?)";
    }
    if (alt) doc = alt;
  }

  if (!doc) return NextResponse.json({ error: "not found", debug: debug ? debugInfo : undefined }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null, debug: debug ? debugInfo : undefined });
}
