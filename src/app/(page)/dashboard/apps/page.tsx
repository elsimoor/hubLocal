"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type AppItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  updatedAt?: string;
};

export default function AppsDashboardPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "" });

  async function loadApps() {
    setLoading(true);
    try {
      const res = await fetch("/api/apps", { cache: "no-store" });
      const json = await res.json();
      setApps(json.apps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApps(); }, []);

  async function createApp() {
    try {
      setCreating(true);
      const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Create failed");
      setForm({ name: "", slug: "", description: "", icon: "" });
      await loadApps();
    } catch (e) {
      console.error(e);
    } finally { setCreating(false); }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-6xl py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Apps</h1>
          <Link href="/dashboard/puck" className="text-sm text-indigo-600 hover:underline">Open Puck editor</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow mb-8">
          <h2 className="text-lg font-medium mb-3">Create a new app</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Icon URL (optional)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3">
            <button onClick={createApp} disabled={creating} className="inline-flex items-center rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{creating ? "Creating…" : "Create App"}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : apps.length === 0 ? (
            <div className="text-sm text-gray-600">No apps yet.</div>
          ) : (
            apps.map((app) => (
              <div key={app._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {app.icon ? <img src={app.icon} alt="" className="w-10 h-10 rounded" /> : <div className="w-10 h-10 rounded bg-gray-100" />}
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="text-xs text-gray-500">/{app.slug}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">{app.description || ""}</div>
                <div className="mt-auto flex items-center gap-2">
                  <Link href={`/dashboard/apps/${app._id}`} className="text-sm text-gray-700 hover:underline">Manage pages</Link>
                  <span className="text-gray-300">•</span>
                  <Link href={`/dashboard/puck?slug=${encodeURIComponent(app.slug + "/home")}`} className="text-sm text-indigo-600 hover:underline">Edit Home</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
