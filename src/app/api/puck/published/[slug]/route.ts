import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string | string[] }> }
) {
  const { slug: slugParam } = await params;
  const slug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  const doc = await PuckDocModel.findOne({ slug, status: "published" }).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null });
}
