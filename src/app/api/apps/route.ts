import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { CustomComponentModel } from "@/lib/models/CustomComponent";
import mongoose from "mongoose";

function slugify(input: string) {
  return (input || "").toLowerCase().trim().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const templatesParam = searchParams.get("templates");
  if (templatesParam === "public") {
    const templates = await AppModel.find({ isTemplate: true, visibility: "public" }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ templates });
  }
  const apps = await AppModel.find({ ownerEmail: session.user.email, isTemplate: { $ne: true } }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ apps });
}

export async function POST(req: Request) {
  const session:any = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").slice(0, 120);
  let slug = String(body?.slug || slugify(name));
  const description = String(body?.description || "");
  const icon = String(body?.icon || "");
  const isTemplate = Boolean(body?.isTemplate);
  const visibilityRaw = String(body?.visibility || "private").toLowerCase();
  const visibility = visibilityRaw === "public" ? "public" : "private"; // Allow choosing visibility for any app
  const fromTemplateIdRaw = String(body?.fromTemplateId || "").trim();
  if (!name || !slug) return NextResponse.json({ error: "missing name/slug" }, { status: 400 });
  slug = slugify(slug);
  await connectDB();
  // Prevent slug collision inside user's namespace
  const exists = await AppModel.findOne({ ownerEmail: session.user.email, slug }).lean();
  if (exists) return NextResponse.json({ error: "slug exists" }, { status: 409 });

  // If cloning from template, ignore isTemplate flag for new app
  if (fromTemplateIdRaw) {
    if (!mongoose.Types.ObjectId.isValid(fromTemplateIdRaw)) {
      return NextResponse.json({ error: "invalid template id" }, { status: 400 });
    }
    const template = await AppModel.findOne({ _id: fromTemplateIdRaw, isTemplate: true, visibility: "public" }).lean();
    if (!template) return NextResponse.json({ error: "template not found" }, { status: 404 });
    const sessionDb = await mongoose.startSession();
    try {
      let createdApp: any = null;
      await sessionDb.withTransaction(async () => {
        createdApp = await AppModel.create([
          {
            ownerEmail: session.user.email,
            name,
            slug,
            description: description || (template as any).description || "",
            icon: icon || (template as any).icon || "",
            isTemplate: false,
            visibility,
            templateSource: (template as any)._id,
            templateVersion: (template as any).templateVersion || 1,
            clonedAt: new Date(),
          },
        ], { session: sessionDb });
        const templateSlug = (template as any).slug as string;
        const regex = new RegExp(`^${templateSlug}/?.*`);
        const docs = await PuckDocModel.find({ ownerEmail: (template as any).ownerEmail, slug: regex }).lean();
        for (const doc of docs as any[]) {
          // Derive relative page slug
          let pagePart = doc.slug === templateSlug ? "home" : doc.slug.startsWith(templateSlug + "/") ? doc.slug.slice(templateSlug.length + 1) : "home";
          const newDocSlug = pagePart === "home" ? slug : `${slug}/${pagePart}`;
          await PuckDocModel.create([
            {
              ownerEmail: session.user.email,
              slug: newDocSlug,
              status: "draft",
              data: JSON.parse(JSON.stringify(doc.data || {})),
              publishedAt: null,
            },
          ], { session: sessionDb });
        }
        // Attempt to clone referenced custom components
        const componentNameSet = new Set<string>();
        for (const doc of docs as any[]) {
          try {
            const jsonStr = JSON.stringify(doc.data || {});
            // naive regex for component name in a property `type":"ComponentName` (adjust as needed)
            const matches = jsonStr.match(/"type":"([A-Za-z0-9_\-]+)"/g) || [];
            for (const m of matches) {
              const name = m.split(':"')[1].replace('"', '');
              if (name) componentNameSet.add(name);
            }
          } catch {}
        }
        if (componentNameSet.size) {
          const existingNames = new Set<string>(
            (await CustomComponentModel.find({ ownerEmail: session.user.email, name: { $in: Array.from(componentNameSet) } }).select('name').lean()).map((e: any) => e.name)
          );
          const sourceComponents = await CustomComponentModel.find({ ownerEmail: (template as any).ownerEmail, name: { $in: Array.from(componentNameSet) } }).lean();
          for (const comp of sourceComponents as any[]) {
            let newName = comp.name;
            if (existingNames.has(newName)) {
              // avoid duplicate, suffix -copy (iterate until unique)
              let i = 2;
              while (existingNames.has(newName + `-${i}`)) i++;
              newName = newName + `-${i}`;
            }
            existingNames.add(newName);
            await CustomComponentModel.create([
              {
                ownerEmail: session.user.email,
                name: newName,
                prompt: comp.prompt || "",
                code: comp.code || "",
                config: JSON.parse(JSON.stringify(comp.config || null)),
                docs: JSON.parse(JSON.stringify(comp.docs || null)),
                history: [],
                version: comp.version || 1,
                public: false,
                ai: comp.ai || false,
              },
            ], { session: sessionDb });
          }
        }
      });
      return NextResponse.json({ ok: true, app: Array.isArray(createdApp) ? createdApp[0] : createdApp, cloned: true });
    } catch (e: any) {
      console.error("Clone transaction failed", e);
      return NextResponse.json({ error: "clone_failed" }, { status: 500 });
    } finally {
      await sessionDb.endSession();
    }
  }

  // Normal creation (possibly a template itself)
  const app = await AppModel.create({ ownerEmail: session.user.email, name, slug, description, icon, isTemplate, visibility });
  return NextResponse.json({ ok: true, app });
}
