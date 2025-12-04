import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VCardModel } from "@/lib/models/VCard";
import { HubModel } from "@/lib/models/App";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    console.log(`[QR Route] Accessing QR for slug: ${slug}`);

    await connectDB();
    const vcard = await VCardModel.findOne({ slug }).lean();

    console.log(`[QR Route] VCard found:`, vcard ? { slug: vcard.slug, isActive: vcard.isActive, website: vcard.website, hubId: vcard.hubId } : 'null');

    if (!vcard) {
        console.log(`[QR Route] VCard not found, redirecting to /card-not-found`);
        return NextResponse.redirect(new URL("/card-not-found", req.url));
    }

    // If card is not active, redirect to 404/not-found page
    if (!vcard.isActive) {
        console.log(`[QR Route] VCard is inactive, redirecting to /card-not-found`);
        return NextResponse.redirect(new URL("/card-not-found", req.url));
    }

    // Priority 1: If there's a manual website URL, use it
    if (vcard.website) {
        let url = vcard.website;
        // Ensure the URL has a protocol
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }
        console.log(`[QR Route] Redirecting to manual website: ${url}`);
        return NextResponse.redirect(url);
    }

    // Priority 2: If linked to a hub, redirect to the published page
    if (vcard.hubId) {
        try {
            // Narrow the shape returned by `lean()` to what we need
            const hub = await HubModel.findById(vcard.hubId).lean<{ slug: string } | null>();
            if (hub && typeof hub.slug === 'string') {
                const pageSlug = vcard.pageSlug || "home";
                const publishedUrl = new URL(`/published/${hub.slug}/${pageSlug}`, req.url);
                console.log(`[QR Route] Redirecting to hub page: ${publishedUrl.toString()}`);
                return NextResponse.redirect(publishedUrl);
            }
        } catch (error) {
            console.error("[QR Route] Error fetching hub:", error);
        }
    }

    // Fallback: If no valid destination, redirect to not found
    console.log(`[QR Route] No valid destination, redirecting to /card-not-found`);
    return NextResponse.redirect(new URL("/card-not-found", req.url));
}
