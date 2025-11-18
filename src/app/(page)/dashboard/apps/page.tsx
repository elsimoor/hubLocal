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
  visibility?: "private" | "public";
  isTemplate?: boolean;
  templateSource?: string;
  templateVersion?: number;
  templateVersionLocal?: number;
  templateVersionRemote?: number;
  templateHasUpdate?: boolean;
  templateSourceInfo?: {
    _id: string;
    name: string;
    slug: string;
    visibility?: "private" | "public";
    ownerEmail?: string;
    version?: number;
    updatedAt?: string;
  };
};

type TemplateItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  updatedAt?: string;
  visibility?: "private" | "public";
  isTemplate?: boolean;
  templateVersion?: number;
};

export default function AppsDashboardPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", visibility: "private" as "private" | "public" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makePublicTemplate, setMakePublicTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<"apps" | "templates" | "myTemplates">("apps");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTemplateData, setCloneTemplateData] = useState<TemplateItem | null>(null);
  const [cloneForm, setCloneForm] = useState({ name: "", slug: "", description: "", icon: "", visibility: "private" as "private" | "public" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAppData, setEditAppData] = useState<AppItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", icon: "", visibility: "private" as "private" | "public" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAppData, setDeleteAppData] = useState<AppItem | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncAppData, setSyncAppData] = useState<AppItem | null>(null);
  const [syncOverwrite, setSyncOverwrite] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [missingGroups, setMissingGroups] = useState<{ id: string; name: string }[] | null>(null);
  const [showMissingGroupsModal, setShowMissingGroupsModal] = useState(false);

  function slugify(input: string) {
    return (input || "").toLowerCase().trim().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  }

  async function loadApps() {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/apps", { cache: "no-store" });
      const json = await res.json();
      setApps(json.apps || []);
      if (Array.isArray(json.myTemplates)) {
        setMyTemplates(json.myTemplates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApps(false);
    }
  }

  async function loadMyTemplates() {
    // Load all of the current user's apps and then filter to any that are marked as templates.
    // This will include templates created before or after the new UI.
    try {
      const res = await fetch("/api/apps", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.myTemplates)) {
        setMyTemplates(json.myTemplates);
      } else {
        const allApps: AppItem[] = json.apps || [];
        setMyTemplates(allApps.filter((a) => a.isTemplate));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openEdit(app: AppItem) {
    setEditAppData(app);
    setEditForm({ name: app.name, description: app.description || '', icon: app.icon || '', visibility: (app.visibility || 'private') });
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

  useEffect(() => {
    loadApps();
    loadTemplates();
    loadMyTemplates();
  }, []);

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
        // Creating a template directly (use current visibility choice: private or public)
        body.isTemplate = true;
      }
      if (fromTemplateId) {
        body.fromTemplateId = fromTemplateId;
        body.visibility = form.visibility; // ensure user selection respected when cloning
      }
      const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
      setForm({ name: "", slug: "", description: "", icon: "", visibility: 'private' });
      setSlugTouched(false);
      await loadApps();
      await loadTemplates();
      await loadMyTemplates();
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
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}));
        if (json?.error === 'missing_groups' && Array.isArray(json?.missing)) {
          setMissingGroups(json.missing);
          setShowMissingGroupsModal(true);
          return; // pause flow until user confirms
        }
      }
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

  async function confirmCloneWithGroups() {
    if (!cloneTemplateData) return;
    try {
      setCreating(true);
      setError(null);
      const name = cloneForm.name.trim();
      const slug = slugify(cloneForm.slug);
      const body = {
        name,
        slug,
        description: cloneForm.description,
        icon: cloneForm.icon,
        fromTemplateId: cloneTemplateData._id,
        visibility: cloneForm.visibility,
        confirmAutoAccept: true,
      } as any;
      const res = await fetch('/api/apps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Clone failed');
      setShowMissingGroupsModal(false);
      setMissingGroups(null);
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

  function openSync(app: AppItem) {
    setSyncAppData(app);
    setSyncOverwrite(false);
    setSyncError(null);
    setShowSyncModal(true);
  }

  async function submitSync() {
    if (!syncAppData) return;
    try {
      setSyncing(true);
      setSyncError(null);
      const res = await fetch(`/api/apps/${syncAppData._id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteExisting: syncOverwrite }),
      });
      if (!res.ok) throw new Error('Sync failed');
      setShowSyncModal(false);
      setSyncAppData(null);
      setSyncError(null);
      await loadApps();
    } catch (e) {
      console.error(e);
      setSyncError('Échec de la synchronisation du template.');
    } finally {
      setSyncing(false);
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
            <button
              onClick={() => setActiveTab("apps")}
              className={`px-3 py-1.5 rounded-md border ${
                activeTab === "apps" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Mes Apps
            </button>
            <button
              onClick={() => setActiveTab("myTemplates")}
              className={`px-3 py-1.5 rounded-md border ${
                activeTab === "myTemplates" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Mes Templates
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-3 py-1.5 rounded-md border ${
                activeTab === "templates" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Templates Publics
            </button>
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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={makePublicTemplate} onChange={(e) => setMakePublicTemplate(e.target.checked)} />
              Créer en tant que template
            </label>
            <label className="inline-flex items-center gap-2">
              Visibilité:
              <select
                value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as "private" | "public" }))}
                className="border rounded px-1 py-0.5 text-xs"
              >
                <option value="private">Privée</option>
                <option value="public">Publique</option>
              </select>
            </label>
          </div>
          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => createApp()}
              disabled={creating}
              className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50"
            >
              {creating ? "Création…" : makePublicTemplate ? "Créer le template" : "Créer l’app"}
            </button>
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
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.visibility && (
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${
                            app.visibility === "public"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {app.visibility === "public" ? "Publique" : "Privée"}
                        </span>
                      )}
                      {app.isTemplate && (
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">Template</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 min-h-[2rem]">{app.description || ""}</div>
                {app.templateSourceInfo && (
                  <div className="text-xs text-gray-500">
                    Basé sur « {app.templateSourceInfo.name} » · version locale v{(app.templateVersionLocal ?? app.templateVersion ?? 0) || 0}
                    {typeof app.templateVersionRemote === "number" ? ` / source v${app.templateVersionRemote}` : ""}
                  </div>
                )}
                {app.templateSourceInfo && !app.isTemplate && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={() => openSync(app)}
                      className={`inline-flex items-center rounded-md border px-2 py-1 font-medium shadow-sm transition ${
                        app.templateHasUpdate
                          ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {app.templateHasUpdate ? "Mise à jour disponible" : "Synchroniser avec le template"}
                    </button>
                  </div>
                )}
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

        {activeTab === "myTemplates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadingTemplates ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow animate-pulse">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-full bg-gray-200 rounded" />
              </div>
            ))
          ) : myTemplates.length === 0 ? (
            <div className="col-span-full">
              <div className="border border-dashed rounded-xl p-8 bg-white text-center text-sm text-gray-600">
                Aucun template (privé ou public) pour le moment. Créez un template via l’onglet "Mes Apps".
              </div>
            </div>
          ) : (
            myTemplates.map((tpl) => (
              <div key={tpl._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {tpl.icon ? <img src={tpl.icon} alt="" className="w-10 h-10 rounded" /> : <div className="w-10 h-10 rounded bg-gray-100" />}
                  <div>
                    <div className="font-medium">{tpl.name}</div>
                    <div className="text-xs text-gray-500">/{tpl.slug}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tpl.visibility && (
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${
                            tpl.visibility === "public"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {tpl.visibility === "public" ? "Publique" : "Privée"}
                        </span>
                      )}
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                        Template
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 min-h-[2rem]">{tpl.description || ""}</div>
                <div className="text-xs text-gray-500">Version actuelle : v{tpl.templateVersion ?? 1}</div>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    disabled={creating}
                    onClick={() => cloneTemplate(tpl)}
                    className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50"
                  >
                    {creating ? "Clonage…" : "Utiliser ce template"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        )}

        {activeTab === "templates" && (
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
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">Template Public</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2 min-h-[2rem]">{tpl.description || ""}</div>
                <div className="text-xs text-gray-500">Version actuelle : v{tpl.templateVersion ?? 1}</div>
                <div className="mt-auto flex items-center gap-2">
                  <button disabled={creating} onClick={() => cloneTemplate(tpl)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{creating ? 'Clonage…' : 'Utiliser ce template'}</button>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>
      {showSyncModal && syncAppData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (syncing) return;
              setShowSyncModal(false);
              setSyncAppData(null);
              setSyncError(null);
            }}
          />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Synchroniser l’app : {syncAppData.name}</h3>
            <div className="text-sm text-gray-600 space-y-2">
              {syncAppData.templateSourceInfo ? (
                <p>
                  Basé sur le template « {syncAppData.templateSourceInfo.name} ». Version locale v{(syncAppData.templateVersionLocal ?? syncAppData.templateVersion ?? 0) || 0}
                  {typeof syncAppData.templateVersionRemote === "number" ? ` / source v${syncAppData.templateVersionRemote}` : ""}.
                </p>
              ) : (
                <p>Cette app ne référence plus son template source.</p>
              )}
              <p>La synchronisation ajoute toujours les nouvelles pages manquantes et peut, en option, écraser les pages existantes pour refléter la dernière version du template.</p>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={syncOverwrite}
                onChange={(e) => setSyncOverwrite(e.target.checked)}
                className="mt-1"
              />
              <span>
                Écraser aussi les pages qui existent déjà dans mon clone.
                <span className="block text-xs text-gray-500">Sans cette option, seules les nouvelles pages seront importées.</span>
              </span>
            </label>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncAppData(null);
                  setSyncError(null);
                }}
                disabled={syncing}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button onClick={submitSync} disabled={syncing} className="px-4 py-1.5 text-sm rounded-md border border-amber-500 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">
                {syncing ? 'Synchronisation…' : 'Synchroniser'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            {syncError && <div className="text-sm text-red-600">{syncError}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={()=> setShowCloneModal(false)} disabled={creating} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Annuler</button>
              <button onClick={submitClone} disabled={creating} className="px-4 py-1.5 text-sm rounded-md border border-gray-900 bg-gray-900 text-white hover:bg-black disabled:opacity-50">{creating? 'Clonage…':'Cloner le template'}</button>
            </div>
          </div>
        </div>
      )}
      {showMissingGroupsModal && missingGroups && cloneTemplateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !creating && setShowMissingGroupsModal(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Importer les groupes requis</h3>
            <p className="text-sm text-gray-600">Ce template utilise des groupes publics que vous n’avez pas encore. Nous allons les ajouter à votre éditeur avant de cloner.</p>
            <div className="max-h-40 overflow-auto border rounded p-2 bg-gray-50">
              <ul className="list-disc pl-5 text-sm text-gray-800">
                {missingGroups.map((g) => (
                  <li key={g.id}><span className="font-medium">{g.name}</span> <span className="text-xs text-gray-500">(#{g.id})</span></li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-gray-500">Les groupes seront ajoutés à vos éléments sauvegardés. Vous pourrez les gérer depuis « Gérer les groupes ».</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=> setShowMissingGroupsModal(false)} disabled={creating} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Annuler</button>
              <button onClick={confirmCloneWithGroups} disabled={creating} className="px-4 py-1.5 text-sm rounded-md border border-gray-900 bg-gray-900 text-white hover:bg-black disabled:opacity-50">{creating? 'Ajout…':'Accepter et cloner'}</button>
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
