import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: paramSlug } = await params;
  const slugArr = paramSlug || [];
  const fullSlug = Array.isArray(slugArr) ? slugArr.join("/") : String(slugArr || "");
  if (!fullSlug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  // Use the session's user email to scope the search to the authenticated user's pages.
  const session = await getServerSession(authOptions);
  const filter: any = { slug: fullSlug, status: "published" };
  if (session?.user?.email) {
    filter.ownerEmail = session.user.email;
  }
  const doc = await PuckDocModel.findOne(filter).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: (doc as any).data || {}, updatedAt: (doc as any).updatedAt || null });
}
