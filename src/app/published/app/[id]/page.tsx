import React from "react";
import type { Metadata } from "next";
import PublishedClient from "../../[...slug]/PublishedClient";

export default async function PublishedUUIDHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialData: any = null;
  try {
    const url = `/api/puck/published/app/${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data ?? null;
    }
  } catch {}
  return <PublishedClient slugParts={["app", id]} initialData={initialData} />;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const url = `/api/puck/published/app/${encodeURIComponent(id)}`;
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
