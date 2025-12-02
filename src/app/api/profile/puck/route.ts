import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { ensureDefaultApp } from "@/lib/apps/service";
import { cloneProfileTemplateData, ensureDocHasRootContent, ensureProfileTemplateContent } from "@/lib/puck/profileTemplate";
import { buildProfileUrl } from "@/lib/profile/urls";
import { getProfileDocSlug } from "@/lib/profile/docSlug";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await connectDB();

    // Ensure the doc exists
    const result = await ensureDefaultApp(session.user.email);
    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { profileDoc, user } = result;
    const docJson: any =
        typeof profileDoc?.toObject === "function"
            ? profileDoc.toObject()
            : typeof profileDoc?.toJSON === "function"
            ? profileDoc.toJSON()
            : profileDoc ?? {};

    const data = docJson?.data && (docJson.data as any)?.root ? docJson.data : cloneProfileTemplateData();
    ensureProfileTemplateContent(data, { context: "api/profile/puck#get" });
    ensureDocHasRootContent(data);
    const profileUrl = user?.username ? buildProfileUrl(user.username) : "/profile";

    return NextResponse.json({
        ...docJson,
        data,
        profileUrl,
    });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data } = body;
    if (data && typeof data === "object") ensureDocHasRootContent(data);

    await connectDB();
    const ensure = await ensureDefaultApp(session.user.email);
    if (!ensure) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const profileSlug = getProfileDocSlug(ensure.defaultApp.slug);

    const updated = await PuckDocModel.findOneAndUpdate(
        { ownerEmail: session.user.email, slug: profileSlug },
        {
            data,
            status: "published", // Always publish for now
            publishedAt: new Date()
        },
        { new: true }
    );

    return NextResponse.json(updated);
}
