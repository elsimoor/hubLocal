import React from "react";
import type { Metadata } from "next";
import PublishedClient from "./PublishedClient";

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
  return <PublishedClient slugParts={slug || []} initialData={initialData} />;
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
