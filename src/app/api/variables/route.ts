import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";
import {
  getUserVariables,
  getUserVariablesMap,
  upsertVariable,
  deleteVariable,
} from "@/lib/variables/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user: any = await UserModel.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user._id;
    const format = request.nextUrl.searchParams.get("format");

    if (format === "map") {
      const variablesMap = await getUserVariablesMap(userId);
      return NextResponse.json({ variables: variablesMap });
    }

    const variables = await getUserVariables(userId);
    return NextResponse.json({ variables });
  } catch (error) {
    console.error("GET /api/variables error:", error);
    return NextResponse.json({ error: "Failed to fetch variables" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user: any = await UserModel.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user._id;
    const body = await request.json();
    const { key, value, label, category, description } = body;

    if (!key || !label) {
      return NextResponse.json(
        { error: "Missing required fields: key and label" },
        { status: 400 }
      );
    }

    const variable = await upsertVariable(
      userId,
      key,
      value || "",
      label,
      category || "custom",
      description
    );

    return NextResponse.json({ variable });
  } catch (error) {
    console.error("POST /api/variables error:", error);
    return NextResponse.json({ error: "Failed to create variable" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user: any = await UserModel.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user._id;
    const { searchParams } = request.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    const deleted = await deleteVariable(userId, key);
    if (!deleted) {
      return NextResponse.json({ error: "Variable not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/variables error:", error);
    return NextResponse.json({ error: "Failed to delete variable" }, { status: 500 });
  }
}
