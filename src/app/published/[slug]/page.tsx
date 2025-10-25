"use client";

import React, { useEffect, useState } from "react";
import { Render } from "@measured/puck";
import { puckConfig as publishedConfig } from "@/lib/puck/config";

export default function PublishedPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/puck/published/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not found");
        const json = await res.json();
        if (!active) return;
        setData(json.data || {});
      } catch (e) {
        setData({});
      }
    })();
    return () => { active = false; };
  }, [slug]);

  // Read the intended viewport width from the saved root props.
  let frameWidth: number | "100%" = "100%";
  try {
    const v = data?.root?.props?.viewport;
    if (v && v !== "fluid") frameWidth = Number(v);
  } catch {}

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto py-6 px-4" style={{ maxWidth: typeof frameWidth === "number" ? frameWidth : undefined }}>
        {data ? (
          <Render config={(publishedConfig as any)} data={data} />
        ) : (
          <div className="text-sm text-gray-600">Chargement…</div>
        )}
      </div>
    </div>
  );
}
