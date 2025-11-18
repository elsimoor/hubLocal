import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";

function cloneTree(tree: any) {
  try {
    return JSON.parse(JSON.stringify(tree ?? {}));
  } catch {
    return tree;
  }
}

async function generateUniqueName(ownerEmail: string, baseName: string) {
  let attempt = baseName;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await GroupModel.findOne({ ownerEmail, name: attempt });
    if (!exists) return attempt;
    attempt = `${baseName} (${suffix++})`;
  }
}

export async function POST(
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
    if (!group || !group.public || group.ownerEmail === email) {
      return NextResponse.json({ error: "Group unavailable" }, { status: 404 });
    }

    let subscription = await GroupSubscriptionModel.findOne({ userEmail: email, groupId: group._id });
    if (subscription?.status === "accepted" && subscription.clonedGroupId) {
      const existingClone = await GroupModel.findOne({ _id: subscription.clonedGroupId, ownerEmail: email }).lean();
      if (existingClone) {
        return NextResponse.json({ accepted: true, group: existingClone, alreadyAccepted: true });
      }
    }

    const cloneName = await generateUniqueName(email, group.name);
    const clonedGroup = await GroupModel.create({
      ownerEmail: email,
      name: cloneName,
      tree: cloneTree(group.tree),
      public: false,
      autoInclude: group.autoInclude,
      description: group.description,
      version: 1,
      sourceGroupId: group._id,
      sourceOwnerEmail: group.ownerEmail,
    });

    if (!subscription) {
      subscription = new GroupSubscriptionModel({ userEmail: email, groupId: group._id });
    }
    subscription.status = "accepted";
    subscription.clonedGroupId = clonedGroup._id;
    await subscription.save();

    return NextResponse.json({ accepted: true, group: clonedGroup.toObject() });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to accept shared group" }, { status: 500 });
  }
}
