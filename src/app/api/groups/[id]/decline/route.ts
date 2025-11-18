import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";

export async function POST(
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
    if (!group || !group.public || group.ownerEmail === email) {
      return NextResponse.json({ error: "Group unavailable" }, { status: 404 });
    }

    await GroupSubscriptionModel.findOneAndUpdate(
      { userEmail: email, groupId: group._id },
      { $set: { status: "declined", clonedGroupId: null } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ declined: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to decline shared group" }, { status: 500 });
  }
}
