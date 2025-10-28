"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(input: string) {
    return (input || "").toLowerCase().trim().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  }

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

  // Auto-suggest slug from name until user manually edits slug
  useEffect(() => {
    if (!slugTouched) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  async function createApp() {
    try {
      setCreating(true);
      setError(null);
      const name = form.name.trim();
      const slug = slugify(form.slug);
      if (!name) { setError("Le nom est requis."); return; }
      if (!slug) { setError("Le slug est requis."); return; }
      const body = { ...form, slug };
      const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
      setForm({ name: "", slug: "", description: "", icon: "" });
      setSlugTouched(false);
      await loadApps();
    } catch (e) {
      console.error(e);
      setError("Échec de la création. Vérifiez que le slug n'existe pas déjà.");
    } finally { setCreating(false); }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-6xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Mes applications</h1>
          <p className="text-sm text-gray-600 mt-1">Créez et gérez vos apps. Chaque app possède son propre espace de pages et de publication.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow mb-8">
          <h2 className="text-lg font-medium mb-3">Créer une nouvelle app</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Nom</label>
              <input className="mt-1 border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="Ex: Byteforce" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Slug</label>
              <input className="mt-1 border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="ex: byteforce" value={form.slug} onChange={(e) => { setForm({ ...form, slug: e.target.value }); setSlugTouched(true); }} />
              <p className="mt-1 text-xs text-gray-500">URL : /published/<span className="font-mono">{form.slug || slugify(form.name) || 'mon-app'}</span>/...</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Icône (URL)</label>
              <input className="mt-1 border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="https://…/logo.png" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Description</label>
              <input className="mt-1 border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="Optionnel" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          <div className="mt-3 flex items-center gap-2">
            <button onClick={createApp} disabled={creating} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{creating ? "Création…" : "Créer l’app"}</button>
            <Link href="/dashboard/puck" className="text-sm text-gray-700 underline decoration-gray-300 hover:decoration-gray-500">Ouvrir l’éditeur Puck</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow animate-pulse">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-full bg-gray-200 rounded" />
              </div>
            ))
          ) : apps.length === 0 ? (
            <div className="col-span-full">
              <div className="border border-dashed rounded-xl p-8 bg-white text-center text-sm text-gray-600">
                Aucune app pour le moment. Utilisez le formulaire ci-dessus pour créer votre première application.
              </div>
            </div>
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
                <div className="text-sm text-gray-600 line-clamp-2 min-h-[2rem]">{app.description || ""}</div>
                <div className="mt-auto flex items-center gap-2">
                  <Link href={`/dashboard/apps/${app._id}`} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Gérer les pages</Link>
                  <Link href={`/dashboard/puck?slug=${encodeURIComponent(app.slug + "/home")}`} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Éditer la Home</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
