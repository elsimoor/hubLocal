import React from "react";
import type { Metadata } from "next";
import PublishedServer from "../../../PublishedServer";
import PuckRenderWrapper from "../../../PuckRenderWrapper";

export default async function PublishedUUIDPage({ params, searchParams }: { params: Promise<{ id: string; slug: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id, slug } = await params;
  const sp = await searchParams;
  let initialData: any = null;
  let debugInfo: any = null;
  try {
    const debugOn = !!(sp && (sp["debug"] === "1" || sp["debug"] === "true"));
    const base = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
    const url = `${base}/api/puck/published/app/${encodeURIComponent(id)}/${(slug || []).map(encodeURIComponent).join("/")}${debugOn ? "?debug=1" : ""}`;
    let res = await fetch(url, { cache: "no-store" });
    console.log("Fetching published data from", url, "Status:", res.status);
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data ?? null;
      if (debugOn) debugInfo = { url, apiDebug: json?.debug };
    } else if (res.status === 404) {
      // Fallback: resolve via slug API in case the doc was saved
      // under a direct slug like "my-app/home" without app linkage.
      const slugPath = (slug || []).join("/");
      try {
        const errJson = await res.json().catch(() => null);
        const appSlug = errJson?.debug?.appSlug as string | undefined;
        // Try appSlug + slugPath first if we know appSlug
        if (appSlug) {
          const url2 = `${base}/api/puck/published/${encodeURIComponent(`${appSlug}/${slugPath}`)}${debugOn ? "?debug=1" : ""}`;
          const res2 = await fetch(url2, { cache: "no-store" });
          if (res2.ok) {
            const json2 = await res2.json();
            initialData = json2?.data ?? null;
            if (debugOn) debugInfo = { url, fallbackUrl: url2, apiDebug: json2?.debug };
          } else if (res2.status === 404) {
            // Second fallback: plain slugPath only
            const url3 = `${base}/api/puck/published/${encodeURIComponent(slugPath)}${debugOn ? "?debug=1" : ""}`;
            const res3 = await fetch(url3, { cache: "no-store" });
            if (res3.ok) {
              const json3 = await res3.json();
              initialData = json3?.data ?? null;
              if (debugOn) debugInfo = { url, fallbackUrl: url2, secondFallbackUrl: url3, apiDebug: json3?.debug };
            } else if (debugOn) {
              debugInfo = { url, fallbackUrl: url2, secondFallbackUrl: url3, apiDebug: errJson?.debug };
            }
          } else if (debugOn) {
            debugInfo = { url, fallbackUrl: url2, apiDebug: errJson?.debug };
          }
        } else {
          // No appSlug known: try plain slugPath
          const url2 = `${base}/api/puck/published/${encodeURIComponent(slugPath)}${debugOn ? "?debug=1" : ""}`;
          const res2 = await fetch(url2, { cache: "no-store" });
          if (res2.ok) {
            const json2 = await res2.json();
            initialData = json2?.data ?? null;
            if (debugOn) debugInfo = { url, fallbackUrl: url2, apiDebug: json2?.debug };
          } else if (debugOn) {
            debugInfo = { url, fallbackUrl: url2, apiDebug: errJson?.debug };
          }
        }
      } catch {}
    }
  } catch {}
  if (!initialData) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center text-gray-600">
        <div>
          {debugInfo ? (
            <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900 text-left">
              <div className="font-medium mb-1">Debug</div>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          ) : null}
          <div className="text-lg font-medium text-gray-900">Page not published</div>
          <div className="text-sm">This page has no published content yet.</div>
        </div>
      </div>
    );
  }
  const scriptBeforeBody = initialData?.root?.props?.scriptBeforeBody;
  const scriptAfterBody = initialData?.root?.props?.scriptAfterBody;
  return (
    <>
      {debugInfo ? (
        <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
          <div className="font-medium mb-1">Debug</div>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      ) : null}
      {scriptBeforeBody ? <div dangerouslySetInnerHTML={{ __html: scriptBeforeBody }} /> : null}
      { (sp && (sp["debug"] === "1" || sp["debug"] === "true"))
        ? <PublishedServer data={initialData} showTypes={true} />
        : <PuckRenderWrapper data={initialData} /> }
      {scriptAfterBody ? <div dangerouslySetInnerHTML={{ __html: scriptAfterBody }} /> : null}
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string[] }> }): Promise<Metadata> {
  try {
    const { id, slug } = await params;
    const base = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
    const url = `${base}/api/puck/published/app/${encodeURIComponent(id)}/${(slug || []).map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const description = json?.data?.root?.props?.description;
      if (typeof description === "string" && description.trim()) {
        const title = json?.data?.root?.props?.title;
        return { description, title };
      }
    }
  } catch {}
  return {};
}
