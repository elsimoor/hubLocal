import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: paramSlug } = await params;
  const slugArr = paramSlug || [];
  const fullSlug = Array.isArray(slugArr) ? slugArr.join("/") : String(slugArr || "");
  const url = new URL(req.url);
  const debugOn = url.searchParams.get("debug") === "1" || url.searchParams.get("debug") === "true";
  if (!fullSlug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  const debug: any = debugOn ? { fullSlug, tried: [] as any[] } : null;
  // Public endpoint: find any published document by slug regardless of session.
  if (debugOn) debug.tried.push({ query: { slug: fullSlug, status: "published" } });
  let doc = await PuckDocModel.findOne({ slug: fullSlug, status: "published" }).lean();
  // Fallback: if requesting just "/appSlug" and content lives at "/appSlug/home"
  if (!doc && !fullSlug.includes("/")) {
    const fb = `${fullSlug}/home`;
    if (debugOn) debug.tried.push({ query: { slug: fb, status: "published" } });
    doc = await PuckDocModel.findOne({ slug: fb, status: "published" }).lean();
  }
  if (!doc) {
    if (debugOn) return NextResponse.json({ error: "not found", debug }, { status: 404 });
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body: any = { data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null };
  if (debugOn) body.debug = { ...(debug || {}), matched: { slug: (doc as any).slug } };
  return NextResponse.json(body);
}
