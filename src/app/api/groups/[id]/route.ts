import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    await connectDB();
    const session: any = await getServerSession(authOptions as any);
    const email = session?.user?.email || null;
    const group = await GroupModel.findById(id).lean();
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const previewMode = new URL(req.url).searchParams.get("preview") === "1";
    const isOwner = email && group.ownerEmail === email;
    const isPublic = !!group.public;

    if (!previewMode && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (previewMode && !isOwner && !isPublic) {
      return NextResponse.json({ error: "Preview unavailable" }, { status: 403 });
    }

    return NextResponse.json({ group });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to fetch group" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    await connectDB();
    const session:any = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const group = await GroupModel.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.ownerEmail !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await GroupModel.deleteOne({ _id: group._id, ownerEmail: email });

    // If this group is a clone from a shared template, keep the subscription
    // record but remove the cloned reference so the user can re-accept later.
    await GroupSubscriptionModel.updateMany(
      { userEmail: email, clonedGroupId: group._id },
      { $set: { clonedGroupId: null } }
    );

    // If this is an original public group, clean up pending invitations.
    if (group.public && !group.sourceGroupId) {
      await GroupSubscriptionModel.deleteMany({ groupId: group._id });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to delete group" }, { status: 500 });
  }
}
