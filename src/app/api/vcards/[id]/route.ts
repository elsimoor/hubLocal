import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { VCardModel } from "@/lib/models/VCard";
import { extractPageSlugFromWebsite, getDefaultAppWebsite, normalizePageSlug } from "@/lib/vcards/website";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const vcard = await VCardModel.findOne({
        _id: id,
        ownerEmail: session.user.email,
    });

    if (!vcard) {
        return NextResponse.json({ error: "vCard not found" }, { status: 404 });
    }

    return NextResponse.json(vcard);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();

        const existing = await VCardModel.findOne({ _id: id, ownerEmail: session.user.email });
        if (!existing) {
            return NextResponse.json({ error: "vCard not found" }, { status: 404 });
        }

        let nextAppId = existing.appId ? String(existing.appId) : undefined;
        if (body.appId) {
            nextAppId = typeof body.appId === "string" ? body.appId : String(body.appId || "");
            body.appId = nextAppId;
        } else if (nextAppId) {
            body.appId = nextAppId;
        }

        const hasPageSlug = Object.prototype.hasOwnProperty.call(body, "pageSlug");
        const nextPageSlug = hasPageSlug
            ? normalizePageSlug(typeof body.pageSlug === "string" ? body.pageSlug : undefined)
            : normalizePageSlug(existing.pageSlug || extractPageSlugFromWebsite(existing.website));
        body.pageSlug = nextPageSlug;

        if (nextAppId) {
            const defaultWebsite = await getDefaultAppWebsite(nextAppId, session.user.email, nextPageSlug);
            if (defaultWebsite) {
                body.website = defaultWebsite;
            }
        }

        existing.set(body);
        await existing.save();

        return NextResponse.json(existing);
    } catch (error) {
        console.error("Error updating vCard:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const deleted = await VCardModel.findOneAndDelete({
        _id: id,
        ownerEmail: session.user.email,
    });

    if (!deleted) {
        return NextResponse.json({ error: "vCard not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
