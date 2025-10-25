import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { HubModel } from "@/lib/models/Hub";
import { UserModel } from "@/lib/models/User";

function slugify(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        .slice(0, 64) || "hub";
}
const nano = (len = 8) => Math.random().toString(36).slice(2, 2 + len);

export async function GET() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await connectDB();
    const hubs = await HubModel.find({ ownerEmail: session.user.email })
        .sort({ updatedAt: -1 })
        .select("_id title slug shortSlug status stats updatedAt createdAt")
        .lean();
    return NextResponse.json(hubs);
}

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const title = (body.title || "Nouveau hub").toString();
    let slug = body.slug ? slugify(String(body.slug)) : slugify(title);

    let tries = 0;
    while (await HubModel.exists({ ownerEmail: session.user.email, slug })) {
        slug = `${slug}-${nano(4)}`;
        if (++tries > 5) break;
    }

    const user = await UserModel.findOne({ email: session.user.email }).lean();

    // Build a simple default layout for the new hub. This acts as a basic AI
    // generator placeholder. The structure matches the JSONNode type used in
    // the editor: a root node with a text element and a list of base links.
    const uid = () => "n_" + Math.random().toString(36).slice(2, 9);
    const rootNode = {
        id: uid(),
        type: "root",
        props: {},
        style: {},
        children: [
            {
                id: uid(),
                type: "text",
                props: { text: "Bienvenue sur votre hub auto‑généré!" },
                style: {},
                children: [],
            },
            {
                id: uid(),
                type: "linksList",
                props: {
                    title: "Mes liens",
                    items: JSON.stringify([
                        { label: "LinkedIn", href: "https://www.linkedin.com/" },
                        { label: "YouTube", href: "https://www.youtube.com/" },
                    ]),
                },
                style: {},
                children: [],
            },
        ],
    };
    // Create separate clones per device to avoid shared references across viewports.
    const rootDesktop = structuredClone(rootNode);
    const rootTablet = structuredClone(rootNode);
    const rootMobile = structuredClone(rootNode);
    const defaultBucket = {
        desktop: [rootDesktop],
        tablet: [rootTablet],
        mobile: [rootMobile],
        meta: { title: "Accueil", description: "", keywords: "" },
    };
    const data = { "/": defaultBucket };

    const hub = await HubModel.create({
        title,
        slug,
        owner: (user as any)?._id,
        ownerEmail: session.user.email,
        data,
        status: "draft",
    });

    return NextResponse.json({ _id: hub._id, slug: hub.slug }, { status: 201 });
}
