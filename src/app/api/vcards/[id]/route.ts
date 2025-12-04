import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { VCardModel } from "@/lib/models/VCard";
import { extractPageSlugFromWebsite, getDefaultHubWebsite, normalizePageSlug } from "@/lib/vcards/website";

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

        let nextHubId = existing.hubId ? String(existing.hubId) : undefined;
        if (body.hubId) {
            nextHubId = typeof body.hubId === "string" ? body.hubId : String(body.hubId || "");
            body.hubId = nextHubId;
        } else if (nextHubId) {
            body.hubId = nextHubId;
        }

        // Handle isActive toggle
        if (typeof body.isActive === "boolean") {
            existing.isActive = body.isActive;
        }

        const hasPageSlug = Object.prototype.hasOwnProperty.call(body, "pageSlug");
        const nextPageSlug = hasPageSlug
            ? normalizePageSlug(typeof body.pageSlug === "string" ? body.pageSlug : undefined)
            : normalizePageSlug(existing.pageSlug || extractPageSlugFromWebsite(existing.website));
        body.pageSlug = nextPageSlug;

        if (nextHubId) {
            const defaultWebsite = await getDefaultHubWebsite(nextHubId, session.user.email, nextPageSlug);
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
