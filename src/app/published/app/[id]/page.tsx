import React from "react";
import type { Metadata } from "next";
import PublishedServer from "../../PublishedServer";
import PuckRenderWrapper from "../../PuckRenderWrapper";

export default async function PublishedUUIDHomePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  let initialData: any = null;
  let debugInfo: any = null;
  try {
    const debugOn = !!(sp && (sp["debug"] === "1" || sp["debug"] === "true"));
    const base = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
    const url = `${base}/api/puck/published/app/${encodeURIComponent(id)}${debugOn ? "?debug=1" : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data ?? null;
      if (debugOn) debugInfo = { url, apiDebug: json?.debug };
    } else if (res.status === 404 && debugOn) {
      // Surface API debug for home 404s too
      const errJson = await res.json().catch(() => null);
      debugInfo = { url, apiDebug: errJson?.debug };
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const base = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
    const apiUrl = `${base}/api/puck/published/app/${encodeURIComponent(id)}`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) return {};
    const json = await res.json();
    const rp = json?.data?.root?.props || {};
    const title = typeof rp.title === 'string' ? rp.title : undefined;
    const description = typeof rp.description === 'string' ? rp.description : undefined;
    const keywords = typeof rp.metaKeywords === 'string' && rp.metaKeywords.trim() ? rp.metaKeywords : undefined;
    const image = typeof rp.metaImage === 'string' && rp.metaImage.trim() ? rp.metaImage : undefined;
    const author = typeof rp.metaAuthor === 'string' && rp.metaAuthor.trim() ? rp.metaAuthor : undefined;
    const canonical = typeof rp.metaCanonical === 'string' && rp.metaCanonical.trim() ? rp.metaCanonical : `${base}/published/app/${encodeURIComponent(id)}`;
    const robots = typeof rp.metaRobots === 'string' ? rp.metaRobots : 'index,follow';
    const ogType = typeof rp.metaOgType === 'string' ? rp.metaOgType : 'website';

    const openGraph: Metadata['openGraph'] = {
      title: title,
      description: description,
      type: ogType as any,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    };
    const twitter: Metadata['twitter'] = {
      card: image ? 'summary_large_image' : 'summary',
      title: title,
      description: description,
      images: image ? [image] : undefined,
    };
    const robotsObj: Metadata['robots'] = robots
      ? {
          index: robots.includes('index'),
          follow: robots.includes('follow'),
        }
      : undefined;

    return {
      title,
      description,
      keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
      authors: author ? [{ name: author }] : undefined,
      alternates: { canonical },
      openGraph,
      twitter,
      robots: robotsObj,
    };
  } catch {}
  return {};
}
