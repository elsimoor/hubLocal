import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string | string[] }> }
) {
  const { slug: slugParam } = await params;
  const slug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  // Filter by slug and the authenticated user's email if available to avoid cross‑user collisions.
  const session = await getServerSession(authOptions);
  const filter: any = { slug, status: "published" };
  if (session?.user?.email) {
    filter.ownerEmail = session.user.email;
  }
  const doc = await PuckDocModel.findOne(filter).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null });
}
