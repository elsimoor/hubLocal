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
  if (!fullSlug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  // Public endpoint: find any published document by slug regardless of session.
  let doc = await PuckDocModel.findOne({ slug: fullSlug, status: "published" }).lean();
  // Fallback: if requesting just "/appSlug" and content lives at "/appSlug/home"
  if (!doc && !fullSlug.includes("/")) {
    doc = await PuckDocModel.findOne({ slug: `${fullSlug}/home`, status: "published" }).lean();
  }
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null });
}
