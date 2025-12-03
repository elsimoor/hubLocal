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
        if (!body.name || !body.slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if using manual URL or app link
        const useManualUrl = !!body.manualUrl;
        
        if (!useManualUrl && !body.appId) {
            return NextResponse.json({ error: "Either appId or manualUrl is required" }, { status: 400 });
        }

        let appId = null;
        let pageSlug = "home";
        let websiteUrl = body.website;

        if (!useManualUrl) {
            appId = typeof body.appId === "string" ? body.appId : String(body.appId || "");
            pageSlug = normalizePageSlug(body.pageSlug);

            // Point website to the selected published page
            const defaultWebsite = await getDefaultAppWebsite(appId, session.user.email, pageSlug);
            if (defaultWebsite) {
                websiteUrl = defaultWebsite;
            }
        } else {
            // Use manual URL directly
            websiteUrl = body.manualUrl;
        }

        // Check slug uniqueness
        const existing = await VCardModel.findOne({ slug: body.slug });
        if (existing) {
            return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
        }

        const vcardData: any = {
            name: body.name,
            title: body.title,
            email: body.email,
            phone: body.phone,
            website: websiteUrl,
            slug: body.slug,
            bio: body.bio,
            pageSlug: pageSlug,
            ownerEmail: session.user.email,
        };

        // Only set appId if it exists (not null)
        if (appId) {
            vcardData.appId = appId;
        }

        const vcard = await VCardModel.create(vcardData);

        return NextResponse.json(vcard);
    } catch (error) {
        console.error("Error creating vCard:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
