import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { CustomComponentModel } from "@/lib/models/CustomComponent";
import { GroupModel } from "@/lib/models/Group";
import { GroupSubscriptionModel } from "@/lib/models/GroupSubscription";
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
    // Show all public templates, including user's own
    const templates = await AppModel.find({ isTemplate: true, visibility: "public" }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ templates });
  }
  const apps = await AppModel.find({ ownerEmail: session.user.email }).sort({ updatedAt: -1 }).lean();
  const myTemplates = apps.filter((a: any) => a.isTemplate === true);
  const myApps = apps.filter((a: any) => a.isTemplate !== true);

  const templateSourceIds = Array.from(
    new Set(
      myApps
        .map((app: any) => (app?.templateSource ? String(app.templateSource) : null))
        .filter((id): id is string => !!id)
    )
  );

  let templateLookup: Record<string, any> = {};
  if (templateSourceIds.length) {
    const templates = await AppModel.find({ _id: { $in: templateSourceIds } })
      .select("name slug templateVersion templateUpdatedAt updatedAt ownerEmail visibility")
      .lean();
    templateLookup = Object.fromEntries(
      templates.map((tpl: any) => [String(tpl._id), tpl])
    );
  }

  const decoratedApps = myApps.map((app: any) => {
    const sourceId = app?.templateSource ? String(app.templateSource) : null;
    if (!sourceId || !templateLookup[sourceId]) return app;
    const tpl = templateLookup[sourceId];
    const remoteVersion = Number(tpl?.templateVersion || 0);
    const localVersion = Number(app?.templateVersion || 0);
    return {
      ...app,
      templateVersionLocal: localVersion,
      templateVersionRemote: remoteVersion,
      templateHasUpdate: remoteVersion > localVersion,
      templateSourceInfo: {
        _id: tpl._id,
        name: tpl.name,
        slug: tpl.slug,
        visibility: tpl.visibility,
        ownerEmail: tpl.ownerEmail,
        version: remoteVersion,
        updatedAt: tpl.templateUpdatedAt || tpl.updatedAt,
      },
    };
  });

  return NextResponse.json({ apps: decoratedApps, myTemplates });
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
  const confirmAutoAccept = Boolean(body?.confirmAutoAccept);
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
        // 1) Load all template docs for scanning and cloning later
        const templateSlug = (template as any).slug as string;
        const regex = new RegExp(`^${templateSlug}/?.*`);
        const docs = await PuckDocModel.find({ ownerEmail: (template as any).ownerEmail, slug: regex }).lean();

        // 2) Scan referenced groups in template docs (type: "Group_<id>")
        const referencedGroupIds = new Set<string>();
        for (const doc of docs as any[]) {
          try {
            const jsonStr = JSON.stringify(doc.data || {});
            const matches = jsonStr.match(/"type"\s*:\s*"Group_([a-f\d]{24})"/gi) || [];
            for (const m of matches) {
              const id = (m.match(/Group_([a-f\d]{24})/i) || [])[1];
              if (id) referencedGroupIds.add(id);
            }
          } catch {}
        }

        // 3) Build mapping from source group id -> user-owned group id (existing or clone)
        const ownerEmail = session.user.email as string;
        const idReplacementMap = new Map<string, string>();
        const missingGroups: { id: string; name: string }[] = [];

        if (referencedGroupIds.size) {
          // Find any of user's groups that already match _id or sourceGroupId
          const ids = Array.from(referencedGroupIds);
          const existingOwned = await GroupModel.find({ ownerEmail, $or: [{ _id: { $in: ids } }, { sourceGroupId: { $in: ids } }] }).lean();
          for (const srcId of ids) {
            const exact = existingOwned.find((g: any) => String(g._id) === srcId);
            if (exact) { idReplacementMap.set(srcId, String(exact._id)); continue; }
            const clone = existingOwned.find((g: any) => String(g.sourceGroupId) === srcId);
            if (clone) { idReplacementMap.set(srcId, String(clone._id)); continue; }
            // Not found: verify source group exists and public, collect for consent
            const source = await GroupModel.findOne({ _id: srcId, public: true }).lean();
            if (source) missingGroups.push({ id: srcId, name: source.name });
          }
        }

        // 4) If missing groups and no confirmation flag, abort with details for consent
        if (missingGroups.length && !confirmAutoAccept) {
          // throw to break out of transaction before any write
          throw { code: "MISSING_GROUPS", payload: missingGroups };
        }

        // 5) Auto-accept/clone any missing groups
        for (const mg of missingGroups) {
          const source = await GroupModel.findOne({ _id: mg.id, public: true }).lean();
          if (!source) continue;
          // Ensure unique name per owner
          let baseName = source.name;
          let attempt = baseName;
          let suffix = 2;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const exists = await GroupModel.findOne({ ownerEmail, name: attempt }).session(sessionDb);
            if (!exists) break;
            attempt = `${baseName} (${suffix++})`;
          }
          const cloned = await GroupModel.create([
            {
              ownerEmail,
              name: attempt,
              tree: JSON.parse(JSON.stringify((source as any).tree ?? {})),
              public: false,
              autoInclude: (source as any).autoInclude,
              description: (source as any).description,
              version: 1,
              sourceGroupId: (source as any)._id,
              sourceOwnerEmail: (source as any).ownerEmail,
            },
          ], { session: sessionDb });
          const clonedDoc = Array.isArray(cloned) ? cloned[0] : cloned;
          idReplacementMap.set(mg.id, String(clonedDoc._id));
          // Upsert subscription as accepted
          const sub = await GroupSubscriptionModel.findOneAndUpdate(
            { userEmail: ownerEmail, groupId: mg.id },
            { $set: { status: "accepted", clonedGroupId: clonedDoc._id } },
            { upsert: true, new: true, session: sessionDb }
          );
        }

        // 6) Create the new App
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
            lastTemplateSyncAt: new Date(),
            clonedAt: new Date(),
          },
        ], { session: sessionDb });
        for (const doc of docs as any[]) {
          // Derive relative page slug and ensure "home" maps to `${slug}/home`
          const isHome = doc.slug === templateSlug || doc.slug === `${templateSlug}/home`;
          let pagePart: string;
          if (isHome) pagePart = "home";
          else if (doc.slug.startsWith(templateSlug + "/")) pagePart = doc.slug.slice(templateSlug.length + 1);
          else pagePart = "home";
          const newDocSlug = pagePart === "home" ? `${slug}/home` : `${slug}/${pagePart}`;
          // Rewrite doc data to reference user-owned group ids
          let clonedData: any = JSON.parse(JSON.stringify(doc.data || {}));
          if (idReplacementMap.size && clonedData) {
            try {
              let s = JSON.stringify(clonedData);
              for (const [srcId, dstId] of idReplacementMap.entries()) {
                const re = new RegExp(`"type"\s*:\s*"Group_${srcId}"`, "g");
                s = s.replace(re, `"type":"Group_${dstId}"`);
              }
              clonedData = JSON.parse(s);
            } catch {}
          }
          await PuckDocModel.create([
            {
              ownerEmail: session.user.email,
              slug: newDocSlug,
              status: "draft",
              data: clonedData,
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
      if (e && e.code === "MISSING_GROUPS" && Array.isArray(e.payload)) {
        return NextResponse.json({ error: "missing_groups", missing: e.payload }, { status: 409 });
      }
      console.error("Clone transaction failed", e);
      return NextResponse.json({ error: "clone_failed" }, { status: 500 });
    } finally {
      await sessionDb.endSession();
    }
  }

  // Normal creation (possibly a template itself)
  const now = new Date();
  const payload: any = { ownerEmail: session.user.email, name, slug, description, icon, isTemplate, visibility };
  if (isTemplate) {
    payload.templateVersion = 1;
    payload.templateUpdatedAt = now;
  } else {
    payload.templateVersion = 0;
  }
  const app = await AppModel.create(payload);
  return NextResponse.json({ ok: true, app });
}
