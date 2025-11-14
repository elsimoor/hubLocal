import React from "react";
import type { Metadata } from "next";
import PublishedClient from "../../../[...slug]/PublishedClient";

export default async function PublishedUUIDPage({ params }: { params: Promise<{ id: string; slug: string[] }> }) {
  const { id, slug } = await params;
  let initialData: any = null;
  try {
    const url = `/api/puck/published/app/${encodeURIComponent(id)}/${(slug || []).map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data ?? null;
    }
  } catch {}
  return <PublishedClient slugParts={["app", id, ...(slug || [])]} initialData={initialData} />;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string[] }> }): Promise<Metadata> {
  try {
    const { id, slug } = await params;
    const url = `/api/puck/published/app/${encodeURIComponent(id)}/${(slug || []).map(encodeURIComponent).join("/")}`;
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
