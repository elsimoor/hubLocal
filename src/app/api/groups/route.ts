import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions as any);
    const email = (session as any)?.user?.email || null;

    const url = new URL(req.url);
    const ownerOnly = url.searchParams.get("ownerOnly") === "1";
    const publicOnly = url.searchParams.get("public") === "1";

    // For unauthenticated callers (e.g. published pages), expose public groups only.
    if (!email || publicOnly) {
      const publicGroups = await GroupModel.find({ public: true }).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ groups: publicGroups });
    }

    const groupsQuery: any = { ownerEmail: email };
    if (ownerOnly) {
      const groups = await GroupModel.find(groupsQuery).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ groups, pendingSharedGroups: [] });
    }

    const groups = await GroupModel.find(groupsQuery).sort({ updatedAt: -1 }).lean();

    // Determine which public groups from other owners still need approval
    const existingSubs = await GroupSubscriptionModel.find({ userEmail: email })
      .select("groupId")
      .lean();
    const seenIds = new Set(
      existingSubs
        .map((sub) => (sub.groupId ? (sub.groupId as mongoose.Types.ObjectId).toString() : null))
        .filter(Boolean)
    );
    const pendingQuery: any = {
      public: true,
      ownerEmail: { $ne: email },
      $or: [{ sourceGroupId: { $exists: false } }, { sourceGroupId: null }],
    };
    if (seenIds.size > 0) {
      pendingQuery._id = {
        $nin: Array.from(seenIds).map((id) => new mongoose.Types.ObjectId(id as string)),
      };
    }
    const pendingSharedGroups = await GroupModel.find(pendingQuery).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ groups, pendingSharedGroups });
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
