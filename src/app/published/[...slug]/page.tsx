import React from "react";
import type { Metadata } from "next";
import PublishedServer from "../PublishedServer";

// With Next.js 15, params is a Promise in RSC. Unwrap with React.use.
export default async function PublishedPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  let initialData: any = null;
  try {
    const url = `/api/puck/published/${(slug || []).map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data ?? null;
    }
  } catch {}
  if (!initialData) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center text-gray-600">
        <div>
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
      {scriptBeforeBody ? <div dangerouslySetInnerHTML={{ __html: scriptBeforeBody }} /> : null}
      <PublishedServer data={initialData} />
      {scriptAfterBody ? <div dangerouslySetInnerHTML={{ __html: scriptAfterBody }} /> : null}
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const url = `/api/puck/published/${(slug || []).map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const description = json?.data?.root?.props?.description;
      if (typeof description === "string" && description.trim()) {
        return { description };
      }
    }
  } catch {}
  return {};
}
