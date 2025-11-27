import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { VCardModel } from "@/lib/models/VCard";
import { AppModel } from "@/lib/models/App";
import {
    buildAppPublishedPath,
    extractPageSlugFromWebsite,
    getDefaultAppWebsite,
    normalizePageSlug,
} from "@/lib/vcards/website";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const vcards = await VCardModel.find({ ownerEmail: session.user.email }).sort({ createdAt: -1 }).lean();

    const appIds = Array.from(new Set(
        vcards
            .map((v: any) => (v.appId ? String(v.appId) : null))
            .filter((id): id is string => !!id)
    ));
    const apps = appIds.length
        ? await AppModel.find({ _id: { $in: appIds } })
              .select("_id slug")
              .lean()
        : [];
    const appLookup = new Map(apps.map((app: any) => [String(app._id), app]));

    const withViewUrl = vcards.map((vcard: any) => {
        const app = appLookup.get(String(vcard.appId));
        const rawPageSlug = vcard.pageSlug || extractPageSlugFromWebsite(vcard.website);
        const pageSlug = normalizePageSlug(rawPageSlug);
        const viewUrl = app ? buildAppPublishedPath(String(app._id), pageSlug) : null;
        return {
            ...vcard,
            pageSlug,
            viewUrl,
        };
    });

    return NextResponse.json(withViewUrl);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        await connectDB();

        // Basic validation
        if (!body.appId || !body.name || !body.slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const appId = typeof body.appId === "string" ? body.appId : String(body.appId || "");
        body.appId = appId;

        // Check slug uniqueness
        const existing = await VCardModel.findOne({ slug: body.slug });
        if (existing) {
            return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
        }

        const pageSlug = normalizePageSlug(body.pageSlug);
        body.pageSlug = pageSlug;

        // Point website to the selected published page
        const defaultWebsite = await getDefaultAppWebsite(appId, session.user.email, pageSlug);
        if (defaultWebsite) {
            body.website = defaultWebsite;
        }

        const vcard = await VCardModel.create({
            ...body,
            ownerEmail: session.user.email,
        });

        return NextResponse.json(vcard);
    } catch (error) {
        console.error("Error creating vCard:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
