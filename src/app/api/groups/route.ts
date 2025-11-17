import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions as any);
    const email = (session as any)?.user?.email || null;

    const url = new URL(req.url);
    const ownerOnly = url.searchParams.get("ownerOnly") === "1";

    const query: any = {};
    if (ownerOnly) {
      query.ownerEmail = email;
    } else {
      // visible groups: public OR owner
      query.$or = [{ public: true }, { ownerEmail: email }];
    }

    const groups = await GroupModel.find(query).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ groups });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const email = (session as any)?.user?.email || null;

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const tree = body?.tree;
    const isPublic = !!body?.public;
    const autoInclude = !!body?.autoInclude;
    const description = String(body?.description || "");
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!tree) return NextResponse.json({ error: "Tree is required" }, { status: 400 });

    // Upsert by (ownerEmail, name)
    const existing = await GroupModel.findOne({ ownerEmail: email, name });
    if (existing) {
      existing.tree = tree;
      existing.public = isPublic;
      existing.autoInclude = autoInclude;
      existing.description = description;
      existing.version = (existing.version || 1) + 1;
      await existing.save();
      return NextResponse.json({ group: existing.toObject(), updated: true });
    }

    const created = await GroupModel.create({
      ownerEmail: email,
      name,
      tree,
      public: isPublic,
      autoInclude,
      description,
      version: 1,
    });
    return NextResponse.json({ group: created.toObject(), updated: false });
  } catch (e: any) {
    console.error(e);
    // Handle duplicate key error (E11000)
    if (e?.code === 11000) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || "Failed to save group" }, { status: 500 });
  }
}
