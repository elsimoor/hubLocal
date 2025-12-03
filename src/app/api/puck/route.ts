import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { AppModel } from "@/lib/models/App";
import { ensureDefaultApp } from '@/lib/apps/service';
import { getLegacyProfileDocSlugs } from '@/lib/profile/docSlug';
import { cloneProfileTemplateData } from '@/lib/puck/profileTemplate';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "default";
  await connectDB();
  let doc = (await PuckDocModel.findOne({ ownerEmail: session.user.email, slug }).lean()) as any;

  if (!doc && slug.endsWith("/home")) {
    const legacySlug = slug.replace(/\/home$/, "");
    const legacyDoc = await PuckDocModel.findOne({ ownerEmail: session.user.email, slug: legacySlug }).lean();
    if (legacyDoc) {
      try {
        const migrated = await PuckDocModel.findOneAndUpdate(
          { ownerEmail: session.user.email, slug: legacySlug },
          { $set: { slug } },
          { new: true }
        ).lean();
        doc = migrated || legacyDoc;
      } catch (err) {
        console.warn("Failed to migrate legacy home slug", err);
        doc = legacyDoc;
      }
    }
  }

  // If no document exists for this slug, try to resolve a sensible default.
  // For profile/home slugs we want new users to see the profile template
  // rather than an empty canvas, so call `ensureDefaultApp` to create the
  // profile doc if needed and return that data. Otherwise fall back to an
  // empty payload to avoid inheriting another app's UI.
  if (!doc) {
    try {
      const ensured = await ensureDefaultApp(session.user.email);
      if (ensured?.profileDoc) {
        const profileSlug = String(ensured.profileDoc.slug || "");
        const legacy = getLegacyProfileDocSlugs(ensured.defaultApp?.slug);
        if (profileSlug === slug || legacy.includes(slug || "")) {
          const docJson: any =
            typeof ensured.profileDoc?.toObject === 'function'
              ? ensured.profileDoc.toObject()
              : typeof ensured.profileDoc?.toJSON === 'function'
              ? ensured.profileDoc.toJSON()
              : ensured.profileDoc ?? {};
          const data = docJson?.data && docJson.data.root ? docJson.data : cloneProfileTemplateData();
          return NextResponse.json({ data, status: docJson?.status || 'published', updatedAt: docJson?.updatedAt || null });
        }
      }
    } catch (err) {
      console.warn('ensureDefaultApp failed in /api/puck GET fallback', err);
    }

    const parts = String(slug || "").split("/");
    const last = parts[parts.length - 1] || slug;
    const emptyData = { root: { props: { title: last, viewport: "fluid", allowCustomJS: "true", slug } }, content: [] };
    return NextResponse.json({ data: emptyData, status: "draft", updatedAt: null });
  }

  return NextResponse.json({ data: doc.data || {}, status: doc.status || "draft", updatedAt: doc.updatedAt || null });
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

  try {
    const slugStr = String(slug || "");
    const appSlug = slugStr.split("/")[0] || slugStr;
    if (appSlug) {
      await AppModel.updateOne(
        { ownerEmail: session.user.email, slug: appSlug, isTemplate: true },
        { $inc: { templateVersion: 1 }, $set: { templateUpdatedAt: new Date() } }
      );
    }
  } catch (err) {
    console.error("Failed to bump template version", err);
  }
  return NextResponse.json({ ok: true, data: doc?.data || {}, status: doc?.status });
}
