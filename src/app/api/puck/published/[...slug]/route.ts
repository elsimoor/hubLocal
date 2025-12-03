import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { UserModel } from "@/lib/models/User";
import { getUserVariablesMap } from "@/lib/variables/service";
import { replaceVariablesInObject } from "@/lib/variables/service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: paramSlug } = await params;
  const slugArr = paramSlug || [];
  const fullSlug = Array.isArray(slugArr) ? slugArr.join("/") : String(slugArr || "");
  const url = new URL(req.url);
  const debugOn = url.searchParams.get("debug") === "1" || url.searchParams.get("debug") === "true";
  if (!fullSlug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  await connectDB();
  const debug: any = debugOn ? { fullSlug, tried: [] as any[] } : null;
  // Public endpoint: find any published document by slug regardless of session.
  if (debugOn) debug.tried.push({ query: { slug: fullSlug, status: "published" } });
  let doc = await PuckDocModel.findOne({ slug: fullSlug, status: "published" }).lean();
  // Fallback: if requesting just "/appSlug" and content lives at "/appSlug/home"
  if (!doc && !fullSlug.includes("/")) {
    const fb = `${fullSlug}/home`;
    if (debugOn) debug.tried.push({ query: { slug: fb, status: "published" } });
    doc = await PuckDocModel.findOne({ slug: fb, status: "published" }).lean();
  }
  if (!doc) {
    if (debugOn) return NextResponse.json({ error: "not found", debug }, { status: 404 });
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  
  // Apply variable replacement if the document has an owner
  const { data: rawData, ownerEmail, updatedAt } = doc as any;
  let processedData = rawData || {};
  if (ownerEmail) {
    try {
      // Get userId from ownerEmail
      const user: any = await UserModel.findOne({ email: ownerEmail }).lean();
      if (user?._id) {
        const variablesMap = await getUserVariablesMap(user._id);
        processedData = replaceVariablesInObject(processedData, variablesMap);
        if (debugOn && debug) {
          debug.variablesApplied = Object.keys(variablesMap).length;
          debug.userId = user._id.toString();
        }
      }
    } catch (err) {
      console.error('[Variables] Failed to apply variable replacement:', err);
      // Continue with unprocessed data on error
    }
  }
  
  const body: any = { data: processedData, updatedAt: updatedAt || null };
  if (debugOn) body.debug = { ...(debug || {}), matched: { slug: (doc as any).slug } };
  
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
