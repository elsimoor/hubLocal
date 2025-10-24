import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { HubModel } from "@/lib/models/Hub";

// GET /api/admin/hubs
// Returns a list of all hubs with summary information. Only accessible to admins.
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email || !session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await connectDB();
  const hubs = await HubModel.find({}).lean();
  const out = hubs.map((h: any) => ({
    id: h._id.toString(),
    title: h.title,
    slug: h.slug,
    ownerEmail: h.ownerEmail,
    views: h.stats?.views ?? 0,
    clicks: h.stats?.clicks ?? 0,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  }));
  return NextResponse.json(out);
}