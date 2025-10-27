import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "default";
  await connectDB();
  const doc = (await PuckDocModel.findOne({ ownerEmail: session.user.email, slug }).lean()) as any;

  // Helper to decide if a Puck document is effectively empty
  function isEmptyPuckData(d: any) {
    if (!d || typeof d !== "object") return true;
    const keys = Object.keys(d);
    if (keys.length === 0) return true;
    const content = (d as any)?.content;
    if (Array.isArray(content) && content.length === 0) return true;
    return false;
  }

  // If there's no doc, or it's empty (e.g., freshly-created page), seed from the latest existing doc
  if (!doc || isEmptyPuckData(doc.data)) {
    const latest = (await PuckDocModel.findOne({ ownerEmail: session.user.email })
      .sort({ updatedAt: -1 })
      .lean()) as any;
    if (latest?.data && !isEmptyPuckData(latest.data)) {
      // Clone and lightly adapt title to current slug's last segment
      let seeded = JSON.parse(JSON.stringify(latest.data));
      try {
        const parts = String(slug || "").split("/");
        const last = parts[parts.length - 1] || slug;
        if (seeded?.root?.props) {
          seeded.root.props.title = seeded.root.props.title || last;
        }
      } catch {}
      return NextResponse.json({ data: seeded, status: "draft", updatedAt: null, seededFrom: latest.slug });
    }
  }

  return NextResponse.json({ data: doc?.data || {}, status: doc?.status || "draft", updatedAt: doc?.updatedAt || null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { slug = "default", data = {}, status = "draft" } = body || {};
  await connectDB();
  const update: any = { data, status };
  if (status === "published") update.publishedAt = new Date();
  const doc = (await PuckDocModel.findOneAndUpdate(
    { ownerEmail: session.user.email, slug },
    { $set: update },
    { upsert: true, new: true }
  ).lean()) as any;
  return NextResponse.json({ ok: true, data: doc?.data || {}, status: doc?.status });
}
