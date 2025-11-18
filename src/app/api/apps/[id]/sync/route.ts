import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import mongoose from "mongoose";

function derivePagePart(docSlug: string, templateSlug: string) {
  if (!docSlug) return "home";
  if (docSlug === templateSlug || docSlug === `${templateSlug}/home`) return "home";
  if (docSlug.startsWith(`${templateSlug}/`)) {
    return docSlug.slice(templateSlug.length + 1) || "home";
  }
  return "home";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session:any = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!id || !mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const overwriteExisting = Boolean(body?.overwriteExisting);

  await connectDB();
  const app:any = await AppModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!app.templateSource)
    return NextResponse.json({ error: "no_template_source" }, { status: 400 });

  const template:any = await AppModel.findOne({ _id: app.templateSource, isTemplate: true, visibility: "public" }).lean();
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  const templateSlug = (template as any).slug as string;
  const templateOwner = (template as any).ownerEmail as string;
  const regex = new RegExp(`^${templateSlug}/?.*`);
  const templateDocs = await PuckDocModel.find({ ownerEmail: templateOwner, slug: regex }).lean();

  const sessionDb = await mongoose.startSession();
  const stats = { created: 0, overwritten: 0, skipped: 0 };
  try {
    await sessionDb.withTransaction(async () => {
      for (const doc of templateDocs as any[]) {
        const rawPart = derivePagePart(doc.slug as string, templateSlug);
        const pagePart = rawPart === "home" ? "home" : rawPart.replace(/^\/+|\/+$/g, "");
        const targetSlug = pagePart === "home" ? `${(app as any).slug}/home` : `${(app as any).slug}/${pagePart}`;
        let existing = await PuckDocModel.findOne({ ownerEmail: session.user.email, slug: targetSlug }).session(sessionDb);
        if (!existing && pagePart === "home") {
          const legacySlug = targetSlug.replace(/\/home$/, "");
          const legacy = await PuckDocModel.findOne({ ownerEmail: session.user.email, slug: legacySlug }).session(sessionDb);
          if (legacy) {
            legacy.slug = targetSlug;
            await legacy.save({ session: sessionDb });
            existing = legacy;
          }
        }
        if (!existing) {
          await PuckDocModel.create([
            {
              ownerEmail: session.user.email,
              slug: targetSlug,
              status: "draft",
              data: JSON.parse(JSON.stringify(doc.data || {})),
              publishedAt: null,
            },
          ], { session: sessionDb });
          stats.created += 1;
          continue;
        }
        if (!overwriteExisting) {
          stats.skipped += 1;
          continue;
        }
        existing.set({
          data: JSON.parse(JSON.stringify(doc.data || {})),
          status: "draft",
          publishedAt: null,
        });
        await existing.save({ session: sessionDb });
        stats.overwritten += 1;
      }
      const shouldAdvanceVersion = overwriteExisting || stats.skipped === 0;
      const update: Record<string, any> = { lastTemplateSyncAt: new Date() };
      if (shouldAdvanceVersion) {
        update.templateVersion = template.templateVersion || 1;
      }
      await AppModel.updateOne(
        { _id: app._id },
        { $set: update },
        { session: sessionDb }
      );
    });
  } catch (err) {
    console.error("Template sync failed", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  } finally {
    await sessionDb.endSession();
  }

  const templateVersionApplied = overwriteExisting || stats.skipped === 0
    ? template.templateVersion || 1
    : app.templateVersion || 0;
  return NextResponse.json({ ok: true, stats, templateVersionApplied, overwrite: overwriteExisting });
}
