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

type TemplateItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  updatedAt?: string;
};

export default function AppsDashboardPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", visibility: 'private' as 'private' | 'public' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makePublicTemplate, setMakePublicTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'templates'>('apps');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTemplateData, setCloneTemplateData] = useState<TemplateItem | null>(null);
  const [cloneForm, setCloneForm] = useState({ name: '', slug: '', description: '', icon: '', visibility: 'private' as 'private' | 'public' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAppData, setEditAppData] = useState<AppItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '', visibility: 'private' as 'private' | 'public' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAppData, setDeleteAppData] = useState<AppItem | null>(null);

  function slugify(input: string) {
    return (input || "").toLowerCase().trim().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  }

  async function loadApps() {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/apps", { cache: "no-store" });
      const json = await res.json();
      setApps(json.apps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApps(false);
    }
  }

  function openEdit(app: AppItem) {
    setEditAppData(app);
    setEditForm({ name: app.name, description: app.description || '', icon: app.icon || '', visibility: 'private' }); // visibility not stored per app card yet
    setShowEditModal(true);
  }

  async function submitEdit() {
    if (!editAppData) return;
    try {
      setCreating(true);
      setError(null);
      const body: any = { name: editForm.name.trim(), description: editForm.description, icon: editForm.icon, visibility: editForm.visibility };
      const res = await fetch(`/api/apps/${editAppData._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Update failed');
      setShowEditModal(false);
      setEditAppData(null);
      await loadApps();
    } catch (e) {
      console.error(e);
      setError('Échec de la mise à jour.');
    } finally {
      setCreating(false);
    }
  }

  function openDelete(app: AppItem) {
    setDeleteAppData(app);
    setShowDeleteConfirm(true);
  }

  async function submitDelete() {
    if (!deleteAppData) return;
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(`/api/apps/${deleteAppData._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteConfirm(false);
      setDeleteAppData(null);
      await loadApps();
    } catch (e) {
      console.error(e);
      setError('Échec de la suppression.');
    } finally {
      setCreating(false);
    }
  }

  async function loadTemplates() {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/apps?templates=public", { cache: "no-store" });
      const json = await res.json();
      setTemplates(json.templates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTemplates(false);
    }
  }

  useEffect(() => { loadApps(); loadTemplates(); }, []);

  // Auto-suggest slug from name until user manually edits slug
  useEffect(() => {
    if (!slugTouched) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  async function createApp(fromTemplateId?: string) {
    try {
      setCreating(true);
      setError(null);
      const name = form.name.trim();
      const slug = slugify(form.slug);
      if (!name) { setError("Le nom est requis."); return; }
      if (!slug) { setError("Le slug est requis."); return; }
      const body: any = { ...form, slug };
      if (makePublicTemplate && !fromTemplateId) {
        body.isTemplate = true;
        body.visibility = 'public';
      }
      if (fromTemplateId) {
        body.fromTemplateId = fromTemplateId;
        body.visibility = form.visibility; // ensure user selection respected
      } else {
        // regular app creation, allow visibility choice
        body.visibility = form.visibility;
      }
      const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
      setForm({ name: "", slug: "", description: "", icon: "" });
      setSlugTouched(false);
      await loadApps();
      await loadTemplates();
    } catch (e) {
      console.error(e);
      setError("Échec de la création. Vérifiez que le slug n'existe pas déjà.");
    } finally { setCreating(false); }
  }

  async function cloneTemplate(tpl: TemplateItem) {
    // Open modal to confirm details & choose visibility
    const baseSlug = slugify(tpl.slug);
    const derivedSlug = slugify(baseSlug + "-" + Math.random().toString(36).slice(2, 5));
    const baseName = tpl.name || 'Template';
    const derivedName = baseName + ' Copy';
    setCloneTemplateData(tpl);
    setCloneForm({ name: derivedName, slug: derivedSlug, description: tpl.description || '', icon: tpl.icon || '', visibility: 'private' });
    setShowCloneModal(true);
  }

  async function submitClone() {
    if (!cloneTemplateData) return;
    try {
      setCreating(true);
      setError(null);
      const name = cloneForm.name.trim();
      const slug = slugify(cloneForm.slug);
      if (!name || !slug) { setError('Nom et slug requis'); return; }
      const body = {
        name,
        slug,
        description: cloneForm.description,
        icon: cloneForm.icon,
        fromTemplateId: cloneTemplateData._id,
        visibility: cloneForm.visibility,
      } as any;
      const res = await fetch('/api/apps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Clone failed');
      setShowCloneModal(false);
      setCloneTemplateData(null);
      await loadApps();
    } catch (e) {
      console.error(e);
      setError('Échec du clonage.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-6xl py-8 px-4">
        <div className="mb-6 flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Apps & Templates</h1>
            <p className="text-sm text-gray-600 mt-1">Gérez vos applications ou démarrez à partir d’un modèle public.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setActiveTab('apps')} className={`px-3 py-1.5 rounded-md border ${activeTab==='apps' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>Mes Apps</button>
            <button onClick={() => setActiveTab('templates')} className={`px-3 py-1.5 rounded-md border ${activeTab==='templates' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>Templates Publics</button>
          </div>
        </div>

        {activeTab === 'apps' && (
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
          <div className="mt-3 flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={makePublicTemplate} onChange={(e) => setMakePublicTemplate(e.target.checked)} />
              Rendre cette app un template public
            </label>
            {!makePublicTemplate && (
              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                Visibilité:
                <select value={form.visibility} onChange={(e)=> setForm(f=>({...f, visibility: e.target.value as 'private' | 'public'}))} className="border rounded px-1 py-0.5 text-xs">
                  <option value="private">Privée</option>
                  <option value="public">Publique</option>
                </select>
              </label>
            )}
          </div>
          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => createApp()} disabled={creating} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{creating ? "Création…" : makePublicTemplate ? "Créer le template" : "Créer l’app"}</button>
            <Link href="/dashboard/puck" className="text-sm text-gray-700 underline decoration-gray-300 hover:decoration-gray-500">Ouvrir l’éditeur Puck</Link>
          </div>
        </div>
        )}

        {activeTab === 'apps' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadingApps ? (
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
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/apps/${app._id}`} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">Pages</Link>
                  <Link href={`/dashboard/puck?slug=${encodeURIComponent(app.slug + "/home")}`} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-black">Home</Link>
                  <button onClick={() => openEdit(app)} className="inline-flex items-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700">Éditer</button>
                  <button onClick={() => openDelete(app)} className="inline-flex items-center rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700">Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
        )}

        {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadingTemplates ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow animate-pulse">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-full bg-gray-200 rounded" />
              </div>
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full">
              <div className="border border-dashed rounded-xl p-8 bg-white text-center text-sm text-gray-600">
                Aucun template public pour le moment.
              </div>
            </div>
          ) : (
            templates.map((tpl) => (
              <div key={tpl._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {tpl.icon ? <img src={tpl.icon} alt="" className="w-10 h-10 rounded" /> : <div className="w-10 h-10 rounded bg-gray-100" />}
                  <div>
                    <div className="font-medium">{tpl.name}</div>
                    <div className="text-xs text-gray-500">/{tpl.slug}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 min-h-[2rem]">{tpl.description || ""}</div>
                <div className="mt-auto flex items-center gap-2">
                  <button disabled={creating} onClick={() => cloneTemplate(tpl)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{creating ? 'Clonage…' : 'Utiliser ce template'}</button>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>
      {showCloneModal && cloneTemplateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !creating && setShowCloneModal(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Cloner le template: {cloneTemplateData.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nom</label>
                <input value={cloneForm.name} onChange={(e)=> setCloneForm(f=>({...f,name:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Slug</label>
                <input value={cloneForm.slug} onChange={(e)=> setCloneForm(f=>({...f,slug:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" />
                <p className="mt-1 text-[11px] text-gray-500">URL: /published/<span className="font-mono">{slugify(cloneForm.slug) || 'nouveau'}</span>/...</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea value={cloneForm.description} onChange={(e)=> setCloneForm(f=>({...f,description:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Icône (URL)</label>
                <input value={cloneForm.icon} onChange={(e)=> setCloneForm(f=>({...f,icon:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Visibilité</label>
                <select value={cloneForm.visibility} onChange={(e)=> setCloneForm(f=>({...f,visibility:e.target.value as 'private' | 'public'}))} className="mt-1 border rounded px-3 py-2 w-full text-sm">
                  <option value="private">Privée (seulement vous)</option>
                  <option value="public">Publique (visible)</option>
                </select>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={()=> setShowCloneModal(false)} disabled={creating} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Annuler</button>
              <button onClick={submitClone} disabled={creating} className="px-4 py-1.5 text-sm rounded-md border border-gray-900 bg-gray-900 text-white hover:bg-black disabled:opacity-50">{creating? 'Clonage…':'Cloner le template'}</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && editAppData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !creating && setShowEditModal(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Modifier l’app: {editAppData.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nom</label>
                <input value={editForm.name} onChange={(e)=> setEditForm(f=>({...f,name:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Icône (URL)</label>
                <input value={editForm.icon} onChange={(e)=> setEditForm(f=>({...f,icon:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea value={editForm.description} onChange={(e)=> setEditForm(f=>({...f,description:e.target.value}))} className="mt-1 border rounded px-3 py-2 w-full text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Visibilité</label>
                <select value={editForm.visibility} onChange={(e)=> setEditForm(f=>({...f,visibility:e.target.value as 'private' | 'public'}))} className="mt-1 border rounded px-3 py-2 w-full text-sm">
                  <option value="private">Privée</option>
                  <option value="public">Publique</option>
                </select>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={()=> setShowEditModal(false)} disabled={creating} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Annuler</button>
              <button onClick={submitEdit} disabled={creating} className="px-4 py-1.5 text-sm rounded-md border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{creating? 'Sauvegarde…':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && deleteAppData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !creating && setShowDeleteConfirm(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">Supprimer l’app</h3>
            <p className="text-sm text-gray-600">Êtes-vous sûr de vouloir supprimer <span className="font-medium">{deleteAppData.name}</span>? Cette action supprimera aussi ses pages.</p>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={()=> setShowDeleteConfirm(false)} disabled={creating} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Annuler</button>
              <button onClick={submitDelete} disabled={creating} className="px-4 py-1.5 text-sm rounded-md border border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{creating? 'Suppression…':'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
