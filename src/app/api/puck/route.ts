import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { AppModel } from "@/lib/models/App";
import { ensureDocHasRootContent, ensureProfileTemplateContent } from "@/lib/puck/profileTemplate";
import { ensureDefaultApp } from "@/lib/apps/service";
import { getProfileDocSlug } from "@/lib/profile/docSlug";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "default";
  await connectDB();
  try {
    console.log("[PuckAPI] Requested slug", slug);
  } catch {}
  let ensured: Awaited<ReturnType<typeof ensureDefaultApp>> | null = null;
  try {
    ensured = await ensureDefaultApp(session.user.email);
  } catch (err) {
    console.warn("Failed to ensure default app before loading Puck doc", err);
  }
  const defaultProfileSlug =
    ensured?.defaultApp && typeof ensured.defaultApp.slug === "string"
      ? getProfileDocSlug(ensured.defaultApp.slug)
      : null;

  let doc: any = null;
  if (defaultProfileSlug && slug === defaultProfileSlug && ensured?.profileDoc) {
    const source = ensured.profileDoc;
    doc =
      typeof source.toObject === "function"
        ? source.toObject()
        : typeof source.toJSON === "function"
        ? source.toJSON()
        : source;
    if (doc?.data) ensureProfileTemplateContent(doc.data, { context: "api/puck#get(defaultProfileDoc)" });
  }
  if (!doc) {
    doc = (await PuckDocModel.findOne({ ownerEmail: session.user.email, slug }).lean()) as any;
  }

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

  // If no document exists for this slug, return a clean default payload without
  // cloning another app's content. This guarantees each app/page starts with its
  // own empty object instead of inheriting another app's UI.
  if (!doc) {
    const parts = String(slug || "").split("/");
    const last = parts[parts.length - 1] || slug;
    const emptyData = { root: { props: { title: last, viewport: "fluid", allowCustomJS: "true", slug }, content: [] }, content: [] };
    ensureDocHasRootContent(emptyData);
    return NextResponse.json({ data: emptyData, status: "draft", updatedAt: null });
  }

  if (doc.data) {
    ensureDocHasRootContent(doc.data);
    if (slug === defaultProfileSlug) {
      ensureProfileTemplateContent(doc.data, { context: "api/puck#get(existingProfileDoc)" });
    }
  }
  try {
    console.log("[PuckAPI] Responding with doc", {
      slug,
      hasDoc: !!doc,
      childCount: Array.isArray(doc?.data?.root?.content) ? doc.data.root.content.length : 0,
      defaultProfileSlug,
    });
  } catch {}

  return NextResponse.json({ data: doc.data || {}, status: doc.status || "draft", updatedAt: doc.updatedAt || null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { slug = "default", data = {}, status = "draft" } = body || {};
  if (data && typeof data === "object") ensureDocHasRootContent(data);
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
