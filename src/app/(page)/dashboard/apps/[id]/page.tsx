"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AppResp = { app: { _id: string; name: string; slug: string }; pages: Array<{ pageSlug: string; slug: string; status: string; updatedAt?: string; title?: string }>; };

export default function AppPagesPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [resp, setResp] = useState<AppResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pageSlug, setPageSlug] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/${id}/pages`, { cache: "no-store" });
      const json = await res.json();
      setResp(json);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function createPage() {
    try {
      setCreating(true);
      const res = await fetch(`/api/apps/${id}/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageSlug }) });
      if (!res.ok) throw new Error("Create failed");
      setPageSlug("");
      await load();
    } catch (e) { console.error(e); } finally { setCreating(false); }
  }

  const app = resp?.app;
  const pages = resp?.pages || [];

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-6xl py-8 px-4">
        <div className="mb-4">
          <Link href="/dashboard/apps" className="text-sm text-gray-600 hover:underline">← Back to Apps</Link>
        </div>
        {!app ? (
          loading ? <div className="text-sm text-gray-600">Loading…</div> : <div className="text-sm text-gray-600">Not found.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">{app.name} pages</h1>
              <Link href={`/dashboard/puck?slug=${encodeURIComponent(app.slug + "/home")}`} className="text-sm text-indigo-600 hover:underline">Edit Home</Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow mb-6">
              <h2 className="text-lg font-medium mb-2">Create a new page</h2>
              <div className="flex items-center gap-2">
                <input className="border rounded px-3 py-2" placeholder="page-slug" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} />
                <button onClick={createPage} disabled={creating} className="inline-flex items-center rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{creating ? "Creating…" : "Create Page"}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.length === 0 ? (
                <div className="text-sm text-gray-600">No pages yet.</div>
              ) : pages.map((p) => (
                <div key={p.slug} className="bg-white border border-gray-200 rounded-xl p-4 shadow flex flex-col gap-2">
                  <div className="text-sm text-gray-500">/{app.slug}/{p.pageSlug}</div>
                  <div className="font-medium">{p.title || p.pageSlug}</div>
                  <div className="text-xs text-gray-500">{p.status} • {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ""}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Link href={`/dashboard/puck?slug=${encodeURIComponent(app.slug + "/" + p.pageSlug)}`} className="text-sm text-indigo-600 hover:underline">Edit</Link>
                    <Link href={`/published/${app.slug}/${p.pageSlug}`} className="text-sm text-gray-700 hover:underline" target="_blank">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
