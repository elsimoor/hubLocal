// "use client";

// import React, { Suspense } from "react";
// import { Puck, createUsePuck } from "@measured/puck";
// import "@measured/puck/puck.css";
// import { useState, useEffect } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { puckConfig as config } from "@/lib/puck/config.fixed";
// import { selectionStore, useSelectedPaths } from "@/lib/puck/selectionStore";
// import { useDashboardUI } from "../../dashboard/ui-context";
// import { Maximize2, Minimize2 } from "lucide-react";

// /**
//  * PuckPage renders a simple visual editor powered by the open‑source Puck
//  * library. This page exists alongside the traditional hub editor and is a
//  * playground for experimenting with Puck. Users can drag and drop
//  * pre‑configured components (heading, paragraph, button and image) and
//  * publish the resulting JSON to the console. In a real application you
//  * would persist the data to your database and restore it on page load.
//  */
// export default function PuckPage() {
//   return (
//     <Suspense fallback={<div className="min-h-[100dvh] bg-gray-50"><div className="mx-auto max-w-8xl py-8 px-4"><div className="text-sm text-gray-600">Loading…</div></div></div>}>
//       <PuckEditor />
//     </Suspense>
//   );
// }

// function PuckEditor() {
//   const usePuck = createUsePuck();
//   const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useDashboardUI();


//   // Local state to store the current Puck document. Normally this would be
//   // persisted via an API and loaded on page mount. For the demo the
//   // initial state is empty. When the user publishes, we update state and
//   // log to the console.
//   const [data, setData] = useState<Record<string, any>>({});
//   const [loading, setLoading] = useState<boolean>(false);
//   const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");
//   const search = useSearchParams();
//   const router = useRouter();
//   const [slug, setSlug] = useState<string>(search?.get("slug") || "default");

//   // Sync fullscreen state from query (?fs=1)
//   useEffect(() => {
//     const fs = search?.get("fs");
//     if (fs === "1") setSidebarCollapsed(true);
//   }, [search]);

//   // Load existing draft on mount
//   useEffect(() => {
//     let active = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
//         if (!res.ok) throw new Error("Failed to load");
//         const json = await res.json();
//         if (active) setData(json?.data ?? {});
//       } catch (e) {
//         console.warn("Failed to load Puck doc:", e);
//         if (active) setData({});
//       } finally {
//         if (active) setLoading(false);
//       }
//     })();
//     return () => {
//       active = false;
//     };
//   }, [slug]);

//   async function saveDoc(nextData: any, status: "draft" | "published") {
//     try {
//       setSaving(status);
//       const res = await fetch("/api/puck", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ slug, data: nextData, status }),
//       });
//       if (!res.ok) throw new Error("Save failed");
//       const json = await res.json();
//       setData(json.data || nextData);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setSaving("idle");
//     }
//   }

//   return (
//     <div className="min-h-[100dvh] bg-gray-50">
//       <div className="mx-auto max-w-8xl py-8 px-4">
//         <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">Éditeur Puck</h1>
//             <p className="text-sm text-gray-600">Glissez-déposez des composants, ajustez leurs propriétés, sauvegardez et publiez.</p>
//           </div>
//           <a
//             href="/dashboard/apps"
//             className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//           >
//             Retour aux apps
//           </a>
//         </div>
//         <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow min-h-[240px]">
//           {loading ? (
//             <div className="text-sm text-gray-600">Loading…</div>
//           ) : (
//           <Puck
//             key={slug}
//             config={config as any}
//             data={data}
//             onChange={(d: any) => setData(d)}
//             viewports={[
//               { width: 360, height: "auto", label: "Mobile" },
//               { width: 768, height: "auto", label: "Tablet" },
//               { width: 1280, height: "auto", label: "Desktop" },
//               { width: 1440, height: "auto", label: "Wide" },
//             ]}
//             overrides={{
//               headerActions: ({ children }) => {
//                 const appState = usePuck((s) => s.appState);
//                 const current = appState?.data;
//                 const selected = useSelectedPaths();
//                 const isFs = sidebarCollapsed;
//                 const onToggleFs = () => {
//                   const next = !isFs;
//                   setSidebarCollapsed(next);
//                   try {
//                     const usp = new URLSearchParams(search?.toString() || "");
//                     if (next) usp.set("fs", "1");
//                     else usp.delete("fs");
//                     const base = "/dashboard/puck";
//                     const slugParam = usp.get("slug") ?? slug;
//                     if (!usp.get("slug") && slugParam) usp.set("slug", slugParam);
//                     router.replace(`${base}?${usp.toString()}`, { scroll: false });
//                   } catch {}
//                 };
//                 // Ensure the saved document stores the currently selected preview viewport
//                 // width into root.props.viewport so the published page can render at the
//                 // intended device size. We try a few likely locations in Puck state to
//                 // find the active viewport width and fall back to the existing value.
//                 const withSyncedViewport = (doc: any) => {
//                   try {
//                     const s: any = appState || {};
//                     let w: number | undefined;
//                     const candidates: any[] = [
//                       s?.viewport,
//                       s?.previewSize,
//                       s?.selectedViewport,
//                       s?.renderer?.viewport,
//                       s?.editor?.viewport,
//                       s?.canvas?.viewport,
//                     ];
//                     for (const c of candidates) {
//                       if (c == null) continue;
//                       if (typeof c === "number") { w = c; break; }
//                       if (typeof c === "string" && /^\d+$/.test(c)) { w = Number(c); break; }
//                       if (typeof c === "object") {
//                         const cw = (c as any).width;
//                         if (typeof cw === "number") { w = cw; break; }
//                         if (typeof cw === "string" && /^\d+$/.test(cw)) { w = Number(cw); break; }
//                       }
//                     }
//                     const nextViewport = (w && w > 0) ? String(w) : (doc?.root?.props?.viewport ?? "fluid");
//                     return {
//                       ...doc,
//                       root: {
//                         ...(doc?.root || {}),
//                         props: { ...((doc?.root || {}).props || {}), viewport: nextViewport },
//                       },
//                     };
//                   } catch {
//                     return doc;
//                   }
//                 };
//                 // Auto-save removed per request; manual save only
//                 // Grouping helpers working on the Puck data structure: { root, content: Node[] }
//                 function getParentArrayByPath(doc: any, parentPath: string): any[] | null {
//                   try {
//                     if (!parentPath) return null;
//                     const parts = parentPath.split(".");
//                     let ptr: any = doc;
//                     for (let i = 0; i < parts.length; i++) {
//                       const seg = parts[i];
//                       if (seg === "content") {
//                         if (!Array.isArray(ptr.content)) return null;
//                         if (i === parts.length - 1) return ptr.content as any[];
//                         const idx = Number(parts[++i]);
//                         if (!Number.isFinite(idx)) return null;
//                         ptr = (ptr.content as any[])[idx];
//                         if (!ptr) return null;
//                       } else {
//                         // Unexpected segment; abort
//                         return null;
//                       }
//                     }
//                     return null;
//                   } catch { return null; }
//                 }
//                 function getParentPath(path: string): string { const p = path.split("."); p.pop(); return p.join("."); }
//                 function getIndex(path: string): number { const last = path.split(".").pop()!; return Number(last); }
//                 function sortPathsByIndex(paths: string[]): string[] { return [...paths].sort((a,b)=>getIndex(a)-getIndex(b)); }
//                 function groupSelectedInto(doc: any, paths: string[]): any {
//                   if (!Array.isArray(paths) || paths.length < 2) return doc;
//                   const parentPath = getParentPath(paths[0]);
//                   const sameParent = paths.every((p) => getParentPath(p) === parentPath);
//                   if (!sameParent) return doc;
//                   const parentArr = getParentArrayByPath(doc, parentPath);
//                   if (!parentArr) return doc;
//                   // Clone the doc shallowly enough to replace arrays
//                   const next = JSON.parse(JSON.stringify(doc));
//                   const arr = getParentArrayByPath(next, parentPath);
//                   if (!arr) return doc;
//                   const sorted = sortPathsByIndex(paths);
//                   const indices = sorted.map(getIndex);
//                   const firstIndex = Math.min(...indices);
//                   // Extract nodes in order
//                   const extracted: any[] = [];
//                   // Remove from highest index to lowest to keep indices valid
//                   const desc = [...indices].sort((a,b)=>b-a);
//                   for (const i of desc) {
//                     const [removed] = (arr as any[]).splice(i, 1);
//                     extracted.unshift(removed);
//                   }
//                   const groupNode = { type: "Group", props: { display: "block" }, content: extracted } as any;
//                   (arr as any[]).splice(firstIndex, 0, groupNode);
//                   return next;
//                 }
//                 function ungroupSelected(doc: any, path: string): any {
//                   const parentPath = getParentPath(path);
//                   const idx = getIndex(path);
//                   const next = JSON.parse(JSON.stringify(doc));
//                   const arr = getParentArrayByPath(next, parentPath);
//                   if (!arr) return doc;
//                   const node = arr[idx];
//                   if (!node || node.type !== "Group" || !Array.isArray(node.content)) return doc;
//                   // Replace the group with its children
//                   (arr as any[]).splice(idx, 1, ...node.content);
//                   return next;
//                 }

//                 return (
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <button
//                       type="button"
//                       onClick={onToggleFs}
//                       title={isFs ? "Exit full page" : "Full page"}
//                       className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-transform duration-150 active:scale-95"
//                     >
//                       {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
//                     </button>
//                     <input
//                       className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
//                       placeholder="slug"
//                       value={slug}
//                       onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
//                       title="Slug"
//                       style={{ width: 160 }}
//                     />
//                     <button
//                       type="button"
//                       onClick={() => router.push(`/dashboard/puck?slug=${encodeURIComponent(slug)}`)}
//                       className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//                     >
//                       Load
//                     </button>
//                     <button
//                       type="button"
//                       disabled={saving !== "idle"}
//                       onClick={() => current && saveDoc(withSyncedViewport(current), "draft")}
//                       className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
//                     >
//                       {saving === "draft" ? "Saving…" : "Save draft"}
//                     </button>
//                     <button
//                       type="button"
//                       disabled={saving !== "idle"}
//                       onClick={() => current && saveDoc(withSyncedViewport(current), "published")}
//                       className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50"
//                     >
//                       {saving === "published" ? "Publishing…" : "Publish"}
//                     </button>
//                     <a
//                       href={`/published/${slug.split('/').map(encodeURIComponent).join('/')}`}
//                       target="_blank"
//                       className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//                     >
//                       Open published
//                     </a>
//                     <a
//                       href="/dashboard/apps"
//                       className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//                     >
//                       Apps
//                     </a>
//                     {selected.length > 0 ? (
//                       <span className="text-xs text-gray-500 ml-2">{selected.length} selected</span>
//                     ) : null}
//                     {selected.length >= 2 ? (
//                       <button
//                         type="button"
//                         onClick={() => {
//                           if (!current) return;
//                           const next = groupSelectedInto(current, selected);
//                           setData(next);
//                           // Select the new group at the first index
//                           try {
//                             const parentPath = (selected[0] || "").split(".");
//                             parentPath.pop();
//                             const firstIdx = Math.min(...selected.map((p) => Number(p.split(".").pop() || 0)));
//                             const groupPath = [...parentPath, String(firstIdx)].join(".");
//                             selectionStore.set([groupPath]);
//                           } catch {}
//                         }}
//                         className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//                         title="Grouper la sélection"
//                       >
//                         Group
//                       </button>
//                     ) : null}
//                     {selected.length === 1 ? (
//                       <button
//                         type="button"
//                         onClick={() => { if (!current) return; setData(ungroupSelected(current, selected[0]!)); selectionStore.set([]); }}
//                         className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
//                         title="Dégrouper"
//                       >
//                         Ungroup
//                       </button>
//                     ) : null}
//                     {children}
//                   </div>
//                 );
//               },
//             }}
//             onPublish={(newData) => {
//               // Persist and mark as published
//               saveDoc(newData, "published");
//             }}
//           />
//           )}
//           {/* Inline mode is now used for all components so we no longer need to override
//               default wrapper behaviour. The previous global CSS overrides have been
//               removed to allow flex and grid items to size themselves naturally. */}
//         </div>
//       </div>
//     </div>
//   );
// }





// test1

"use client";

import React, { Suspense } from "react";
// Importez Puck, mais PAS createUsePuck
import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Importez la configuration
import { config } from "@/lib/puck/config.fixed";
import { useDashboardUI } from "../../dashboard/ui-context";
import { Maximize2, Minimize2 } from "lucide-react";
// Importez le hook usePuck partagé
import { usePuck } from "@/lib/puck/puck-context";

/**
 * PuckPage renders a simple visual editor powered by the open‑source Puck
 * library. This page exists alongside the traditional hub editor and is a
 * playground for experimenting with Puck. Users can drag and drop
 * pre‑configured components (heading, paragraph, button and image) and
 * publish the resulting JSON to the console. In a real application you
 * would persist the data to your database and restore it on page load.
 */
export default function PuckPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-gray-50"><div className="mx-auto max-w-8xl py-8 px-4"><div className="text-sm text-gray-600">Loading…</div></div></div>}>
      <PuckEditor />
    </Suspense>
  );
}

function PuckEditor() {
  // N'utilisez PAS createUsePuck() ici. Utilisez le hook importé.
  const usePuckHook = usePuck; 
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useDashboardUI();


  // Local state to store the current Puck document. Normally this would be
  // persisted via an API and loaded on page mount. For the demo the
  // initial state is empty. When the user publishes, we update state and
  // log to the console.
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");
  const search = useSearchParams();
  const router = useRouter();
  const [slug, setSlug] = useState<string>(search?.get("slug") || "default");

  // Sync fullscreen state from query (?fs=1)
  useEffect(() => {
    const fs = search?.get("fs");
    if (fs === "1") setSidebarCollapsed(true);
  }, [search]);

  // Load existing draft on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (active) setData(json?.data ?? {});
      } catch (e) {
        console.warn("Failed to load Puck doc:", e);
        if (active) setData({});
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  async function saveDoc(nextData: any, status: "draft" | "published") {
    try {
      setSaving(status);
      const res = await fetch("/api/puck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data: nextData, status }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setData(json.data || nextData);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving("idle");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-8xl py-8 px-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Éditeur Puck</h1>
            <p className="text-sm text-gray-600">Glissez-déposez des composants, ajustez leurs propriétés, sauvegardez et publiez.</p>
          </div>
          <a
            href="/dashboard/apps"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Retour aux apps
          </a>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow min-h-[240px]">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
          <Puck
            key={slug}
            config={config as any}
            data={data}
            viewports={[
              { width: 360, height: "auto", label: "Mobile" },
              { width: 768, height: "auto", label: "Tablet" },
              { width: 1280, height: "auto", label: "Desktop" },
              { width: 1440, height: "auto", label: "Wide" },
            ]}
            overrides={{
              headerActions: ({ children }) => {
                const appState = usePuckHook((s) => s.appState);
                const current = appState?.data;
                const isFs = sidebarCollapsed;
                const onToggleFs = () => {
                  const next = !isFs;
                  setSidebarCollapsed(next);
                  try {
                    const usp = new URLSearchParams(search?.toString() || "");
                    if (next) usp.set("fs", "1");
                    else usp.delete("fs");
                    const base = "/dashboard/puck";
                    const slugParam = usp.get("slug") ?? slug;
                    if (!usp.get("slug") && slugParam) usp.set("slug", slugParam);
                    router.replace(`${base}?${usp.toString()}`, { scroll: false });
                  } catch {}
                };
                // Ensure the saved document stores the currently selected preview viewport
                // width into root.props.viewport so the published page can render at the
                // intended device size. We try a few likely locations in Puck state to
                // find the active viewport width and fall back to the existing value.
                const withSyncedViewport = (doc: any) => {
                  try {
                    const s: any = appState || {};
                    let w: number | undefined;
                    const candidates: any[] = [
                      s?.viewport,
                      s?.previewSize,
                      s?.selectedViewport,
                      s?.renderer?.viewport,
                      s?.editor?.viewport,
                      s?.canvas?.viewport,
                    ];
                    for (const c of candidates) {
                      if (c == null) continue;
                      if (typeof c === "number") { w = c; break; }
                      if (typeof c === "string" && /^\d+$/.test(c)) { w = Number(c); break; }
                      if (typeof c === "object") {
                        const cw = (c as any).width;
                        if (typeof cw === "number") { w = cw; break; }
                        if (typeof cw === "string" && /^\d+$/.test(cw)) { w = Number(cw); break; }
                      }
                    }
                    const nextViewport = (w && w > 0) ? String(w) : (doc?.root?.props?.viewport ?? "fluid");
                    return {
                      ...doc,
                      root: {
                        ...(doc?.root || {}),
                        props: { ...((doc?.root || {}).props || {}), viewport: nextViewport },
                      },
                    };
                  } catch {
                    return doc;
                  }
                };
                // Auto-save removed per request; manual save only
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={onToggleFs}
                      title={isFs ? "Exit full page" : "Full page"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-transform duration-150 active:scale-95"
                    >
                      {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <input
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      title="Slug"
                      style={{ width: 160 }}
                    />
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/puck?slug=${encodeURIComponent(slug)}`)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      disabled={saving !== "idle"}
                      onClick={() => current && saveDoc(withSyncedViewport(current), "draft")}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {saving === "draft" ? "Saving…" : "Save draft"}
                    </button>
                    <button
                      type="button"
                      disabled={saving !== "idle"}
                      onClick={() => current && saveDoc(withSyncedViewport(current), "published")}
                      className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50"
                    >
                      {saving === "published" ? "Publishing…" : "Publish"}
                    </button>
                    <a
                      href={`/published/${slug.split('/').map(encodeURIComponent).join('/')}`}
                      target="_blank"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Open published
                    </a>
                    <a
                      href="/dashboard/apps"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Apps
                    </a>
                    {children}
                  </div>
                );
              },
            }}
            onPublish={(newData) => {
              // Persist and mark as published
              saveDoc(newData, "published");
            }}
          />
          )}
          {/* Inline mode is now used for all components so we no longer need to override
              default wrapper behaviour. The previous global CSS overrides have been
              removed to allow flex and grid items to size themselves naturally. */}
        </div>
      </div>
    </div>
  );
}