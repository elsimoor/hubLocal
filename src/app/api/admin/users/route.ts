import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

// GET /api/admin/users
// Returns a list of all users. Only accessible to admins. Admin status is
// determined via the session: session.user.isAdmin must be true.
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email || !session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await connectDB();
  const users = await UserModel.find({}, { passwordHash: 0 }).lean();
  // Serialize ObjectId to string for client consumption
  const out = users.map((u: any) => ({
    id: u._id.toString(),
    email: u.email,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    isPro: !!u.isPro,
    createdAt: u.createdAt,
  }));
  return NextResponse.json(out);
}