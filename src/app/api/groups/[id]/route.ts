import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const group = await GroupModel.findById(params.id);
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
