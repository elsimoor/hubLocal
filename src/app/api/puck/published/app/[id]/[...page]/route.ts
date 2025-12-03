import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { UserModel } from "@/lib/models/User";
import { getUserVariablesMap, replaceVariablesInObject } from "@/lib/variables/service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; page?: string[] }> }
) {
  const { id, page } = await params;
  if (!id) return NextResponse.json({ error: "missing app id" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
  await connectDB();
  const app = await AppModel.findById(id).lean();
  if (!app) return NextResponse.json({ error: "app not found" }, { status: 404 });

  const appSlug = (app as any).slug as string;
  const ownerEmail = (app as any).ownerEmail as string;
  const pageParts = Array.isArray(page) ? page : [];
  const resolvedSlug = pageParts.length === 0
    ? appSlug
    : `${appSlug}/${pageParts.map((p) => String(p)).join('/')}`;

  // Primary query including ownerEmail for isolation
  let doc = await PuckDocModel.findOne({ ownerEmail, slug: resolvedSlug, status: "published" }).lean();

  console.log('[PublishedApp] Query:', { ownerEmail, slug: resolvedSlug, status: "published" });
  console.log('[PublishedApp] Document found:', !!doc, doc ? `id: ${(doc as any)._id}` : 'none');

  // Build optional debug info
  const debugInfo: any = debug ? {
    id,
    appSlug,
    ownerEmail,
    pageParts,
    resolvedSlug,
    matchedWithOwner: !!doc,
  } : undefined;

  if (!doc) {
    // Secondary query by slug only to detect owner mismatch issues
    const alt = await PuckDocModel.findOne({ slug: resolvedSlug, status: "published" }).lean();
    if (debug) {
      debugInfo.matchedBySlugOnly = !!alt;
      debugInfo.note = !alt ? "No document found for resolved slug" : "Found by slug-only (owner mismatch?)";
    }
    if (alt) doc = alt;
  }

  if (!doc) return NextResponse.json({ error: "not found", debug: debug ? debugInfo : undefined }, { status: 404 });
  
  // Apply variable replacement if the document has an owner
  const { data: rawData, ownerEmail: docOwnerEmail, updatedAt } = doc as any;
  let processedData = rawData || {};
  
  console.log('[PublishedApp] Before replacement - data keys:', Object.keys(rawData || {}));
  
  if (docOwnerEmail) {
    try {
      // Get userId from ownerEmail
      const user: any = await UserModel.findOne({ email: docOwnerEmail }).lean();
      if (user?._id) {
        const variablesMap = await getUserVariablesMap(user._id);
        console.log('[PublishedApp] Variables map:', variablesMap);
        processedData = replaceVariablesInObject(processedData, variablesMap);
        console.log('[PublishedApp] After replacement - variables applied:', Object.keys(variablesMap).length);
        if (debug && debugInfo) {
          debugInfo.variablesApplied = Object.keys(variablesMap).length;
          debugInfo.userId = user._id.toString();
        }
      }
    } catch (err) {
      console.error('[Variables] Failed to apply variable replacement:', err);
      // Continue with unprocessed data on error
    }
  }
  
  return NextResponse.json(
    { data: processedData, updatedAt: updatedAt || null, debug: debug ? debugInfo : undefined },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
