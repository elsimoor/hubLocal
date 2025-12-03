import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { ensureDefaultApp } from "@/lib/apps/service";
import { cloneProfileTemplateData } from "@/lib/puck/profileTemplate";
import { buildProfileUrl } from "@/lib/profile/urls";
import { getProfileDocSlug } from "@/lib/profile/docSlug";
import { extractProfilePayloadFromDoc } from "@/lib/puck/profilePayload";
import { syncProfileToVariables } from "@/lib/variables/service";
import { Types } from "mongoose";

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
    const profileUrl = user?.username ? buildProfileUrl(user.username) : "/profile";

    return NextResponse.json({
        ...docJson,
        data,
        profileUrl,
    });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { data, profilePayload: clientProfilePayload } = body;

    await connectDB();
    const ensure = await ensureDefaultApp(session.user.email);
    if (!ensure) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const profileSlug = getProfileDocSlug(ensure.defaultApp.slug);

    console.log('[ProfilePuck] Saving to slug:', profileSlug, 'for email:', session.user.email);

    const updated = await PuckDocModel.findOneAndUpdate(
        { ownerEmail: session.user.email, slug: profileSlug },
        {
            data,
            status: "published", // Always publish for now
            publishedAt: new Date()
        },
        { new: true }
    );

    console.log('[ProfilePuck] Document updated:', updated?._id, 'slug:', (updated as any)?.slug);

    // Sync profile data to global variables
    try {
        const profilePayload = clientProfilePayload ?? extractProfilePayloadFromDoc(data);
        const userId = ensure.user._id; // Use the user ID from ensure result
        console.log('[ProfilePuck] Syncing variables for userId:', userId, 'displayName:', profilePayload.displayName, 'tagline:', profilePayload.tagline);
        await syncProfileToVariables(userId, profilePayload);
        console.log('[ProfilePuck] Variables synced successfully');
    } catch (error) {
        console.error("Failed to sync variables:", error);
        // Don't fail the whole request if variable sync fails
    }

    return NextResponse.json(updated);
}
