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
//             config={mergedConfig as any}
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
import { useState, useEffect, useMemo, useRef } from "react";
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

  // Dynamically loaded custom components and editor ref
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // State and handlers for the multi‑step modal used to create custom components
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalMode, setModalMode] = useState<"create" | "modify">("create");
  const [modalTargetName, setModalTargetName] = useState<string>("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalPublic, setModalPublic] = useState(false);
  const [modalUseAI, setModalUseAI] = useState(true);
  // Option fields for defaults
  const [optPlatform, setOptPlatform] = useState<string>("whatsapp");
  const [optLabel, setOptLabel] = useState<string>("");
  const [optPhone, setOptPhone] = useState<string>("");
  const [optHref, setOptHref] = useState<string>("");
  const [optTheme, setOptTheme] = useState<"brand" | "light" | "dark">("brand");
  const [optVariant, setOptVariant] = useState<"solid" | "outline" | "ghost">("solid");
  const [optSize, setOptSize] = useState<"sm" | "md" | "lg">("md");
  const [optShape, setOptShape] = useState<"rounded" | "full">("rounded");
  const [optIcon, setOptIcon] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Simple toast system
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: 'success' | 'error' }[]>([]);
  const toastId = useRef(0);
  function showToast(text: string, type: 'success' | 'error' = 'success') {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  // Client-side preview builder mirroring server defaults
  function buildPreviewFromOptions(opts: any) {
    const theme = opts.theme || 'brand';
    const variant = opts.variant || 'solid';
    const size = opts.size || 'md';
    const shape = opts.shape || 'rounded';
    const icon = opts.icon !== false;
    const pad = size === 'sm' ? '0.375rem 0.75rem' : size === 'lg' ? '0.75rem 1.25rem' : '0.5rem 1rem';
    const radius = shape === 'full' ? '9999px' : '0.5rem';
    const font = size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.9375rem';
    let brand = '#111827';
    if (opts.platform === 'whatsapp') brand = '#25D366';
    else if (opts.platform === 'telegram') brand = '#229ED9';
    else if (opts.platform === 'messenger') brand = '#0084FF';
    else if (opts.platform === 'email') brand = '#EF4444';
    const bg = theme === 'brand' ? brand : theme === 'dark' ? '#111827' : '#ffffff';
    const fg = theme === 'light' ? '#111827' : '#ffffff';
    const border = variant === 'outline' ? `1px solid ${brand}` : 'none';
    const finalBg = variant === 'ghost' ? 'transparent' : bg;
    const finalFg = variant === 'outline' ? brand : fg;
    let label = opts.label || 'Click me';
    if (!opts.label) {
      if (opts.platform === 'whatsapp') label = 'Chat on WhatsApp';
      else if (opts.platform === 'telegram') label = 'Message on Telegram';
      else if (opts.platform === 'messenger') label = 'Message on Messenger';
      else if (opts.platform === 'email') label = 'Send Email';
    }
    const waSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem"><path d="M12 2C6.486 2 2 6.205 2 11.5c0 1.927.57 3.725 1.552 5.236L2 22l5.47-1.508A10.7 10.7 0 0 0 12 21c5.514 0 10-4.205 10-9.5S17.514 2 12 2Zm5.26 14.074c-.22.62-1.28 1.18-1.77 1.22-.48.04-1.09.06-1.74-.11-.4-.1-.92-.3-1.6-.6-2.82-1.23-4.66-4.15-4.8-4.35-.14-.2-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.35.26-.29.58-.36.77-.36.19 0 .38 0 .55.01.18.01.42-.07.66.5.24.58.82 2 .9 2.15.07.15.12.33.02.53-.1.2-.16.33-.31.5-.16.17-.33.38-.47.51-.16.16-.33.34-.14.68.19.34.84 1.38 1.8 2.24 1.25 1.08 2.3 1.42 2.66 1.58.36.16.57.13.78-.07.21-.2.9-1.04 1.14-1.39.24-.35.48-.29.8-.17.32.12 2.03.96 2.38 1.13.35.17.58.26.66.41.08.15.08.87-.12 1.47Z"/></svg>`;
    const tgSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem"><path d="M9.04 15.314 8.9 18.36c.36 0 .52-.155.71-.34l1.7-1.63 3.52 2.585c.646.356 1.11.17 1.29-.6l2.34-10.97c.21-.97-.37-1.35-1-.1L5.5 12.3c-.94.37-.92.9-.16 1.14l3.7 1.15 8.58-7.57c.4-.34.76-.15.46.19l-9.08 8.1Z"/></svg>`;
    const msSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem"><path d="M12 2c5.514 0 10 4.205 10 9.5S17.514 21 12 21a10.7 10.7 0 0 1-4.53-1.508L2 22l1.552-5.264C2.57 15.225 2 13.427 2 11.5 2 6.205 6.486 2 12 2Z"/></svg>`;
    const mailSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/></svg>`;
    let iconHtml = '';
    if (icon) {
      if (opts.platform === 'whatsapp') iconHtml = waSvg;
      else if (opts.platform === 'telegram') iconHtml = tgSvg;
      else if (opts.platform === 'messenger') iconHtml = msSvg;
      else if (opts.platform === 'email') iconHtml = mailSvg;
    }
    return `<a href="#" style="display:inline-flex;align-items:center;gap:0.5rem;padding:${pad};border:${border};border-radius:${radius};background:${finalBg};color:${finalFg};font-weight:600;font-size:${font};text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.06)">${iconHtml}${label}</a>`;
  }

  // Open the modal and reset fields
  const openModal = () => {
    setModalDescription("");
    setModalName("");
    setModalPublic(false);
    setModalUseAI(true);
    setModalMode("create");
    setModalTargetName("");
    setOptPlatform("whatsapp");
    setOptLabel("");
    setOptPhone("");
    setOptHref("");
    setOptTheme("brand");
    setOptVariant("solid");
    setOptSize("md");
    setOptShape("rounded");
    setOptIcon(true);
    setModalStep(0);
    setShowModal(true);
  };
  // Close the modal
  const closeModal = () => setShowModal(false);
  // Submit the custom component to the API and update local state
  const handleSubmitCustomComponent = async () => {
    setModalSubmitting(true);
    try {
      const res = await fetch("/api/custom-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalMode,
          prompt: modalDescription,
          name: modalName,
          targetName: modalTargetName,
          public: modalPublic,
          useAI: modalUseAI,
          options: {
            platform: optPlatform,
            label: optLabel,
            phone: optPhone,
            href: optHref,
            theme: optTheme,
            variant: optVariant,
            size: optSize,
            shape: optShape,
            icon: optIcon,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Échec de la création du composant");
      }
      const json = await res.json();
      if (json?.component) {
        setCustomComponents((prev) => {
          const others = prev.filter((c: any) => c._id !== json.component._id);
          return [...others, json.component];
        });
        setShowModal(false);
        showToast(
          modalMode === "modify"
            ? `Le composant "${json.component.name}" a été modifié avec succès.`
            : `Le composant "${json.component.name}" a été créé avec succès.`,
          'success'
        );
      }
    } catch (e: any) {
      console.error(e);
      showToast(String(e?.message || e), 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/custom-components", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load custom components");
        const json = await res.json();
        if (!isCancelled) {
          setCustomComponents(Array.isArray(json?.components) ? json.components : []);
        }
      } catch (e) {
        console.error("Error fetching custom components", e);
        if (!isCancelled) setCustomComponents([]);
      }
    })();
    return () => { isCancelled = true; };
  }, [slug]);

  const mergedConfig = useMemo(() => {
    const nextConfig: any = {
      ...config,
      categories: { ...(config as any).categories },
      components: { ...(config as any).components },
    };
    if (!Array.isArray(customComponents) || customComponents.length === 0) {
      return nextConfig;
    }
    if (!nextConfig.categories.custom) {
      nextConfig.categories.custom = { title: "Personnalisé", components: [] };
    }
    customComponents.forEach((comp: any) => {
      const compName = String(comp.name || "Unnamed");
      if (!nextConfig.components[compName]) {
        if (!nextConfig.categories.custom.components.includes(compName)) {
          nextConfig.categories.custom.components.push(compName);
        }
        const renderFn = () => {
          return (
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: comp.code || "" }}
            />
          );
        };
        const fallbackFields = {
          label: { type: "text", label: "Label" },
          href: { type: "text", label: "URL" },
          phone: { type: "text", label: "Phone" },
          theme: { type: "select", label: "Theme", options: [
            { label: "Brand", value: "brand" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ] },
          variant: { type: "select", label: "Variant", options: [
            { label: "Solid", value: "solid" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ] },
          size: { type: "select", label: "Size", options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ] },
          shape: { type: "select", label: "Shape", options: [
            { label: "Rounded", value: "rounded" },
            { label: "Pill", value: "full" },
          ] },
          icon: { type: "select", label: "Show icon", options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ], defaultValue: "true" },
        } as const;
        const compConfig = (comp.config || {}) as any;
        nextConfig.components[compName] = {
          label: compName,
          fields: compConfig.fields || (fallbackFields as any),
          ...compConfig,
          render: renderFn,
        };
      }
    });
    return nextConfig;
  }, [customComponents]);

  useEffect(() => {
    const handler = (e: any) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const node = editorRef.current;
    if (node) {
      node.addEventListener("click", handler, true);
    }
    return () => {
      if (node) node.removeEventListener("click", handler, true);
    };
  }, []);


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
          <div ref={editorRef}>
          <Puck
            key={slug}
            config={mergedConfig as any}
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
                  <>
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
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `/published/${slug.split('/').map(encodeURIComponent).join('/')}`;
                        try { window.open(url, '_blank'); } catch { router.push(url); }
                      }}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Open published
                    </button>
                    <a
                      href="/dashboard/apps"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Apps
                    </a>
                    {children}
                    <button
                      type="button"
                      onClick={openModal}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Nouveau composant
                    </button>
          </>
          );
        },
            }}
            onPublish={(newData) => {
              // Persist and mark as published
              saveDoc(newData, "published");
            }}
          />
          </div>
          )}
          {/* Inline mode is now used for all components so we no longer need to override
              default wrapper behaviour. The previous global CSS overrides have been
              removed to allow flex and grid items to size themselves naturally. */}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-5">
            {modalStep === 0 && (
              <>
                <h2 className="text-lg font-semibold mb-3">Créer ou modifier</h2>
                <div className="flex items-center gap-6 mb-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="mode" value="create" checked={modalMode === 'create'} onChange={() => setModalMode('create')} />
                    <span>Créer</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="mode" value="modify" checked={modalMode === 'modify'} onChange={() => setModalMode('modify')} />
                    <span>Modifier</span>
                  </label>
                </div>
                {modalMode === 'modify' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Composant à modifier</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={modalTargetName} onChange={(e) => setModalTargetName(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {customComponents.map((c: any) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows={3}
                  placeholder={modalMode === 'create' ? "Ex: bouton WhatsApp vert arrondi avec texte blanc" : "Ex: changer la couleur en noir et rendre le bouton plus grand"}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />
                <label className="inline-flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={modalUseAI} onChange={(e) => setModalUseAI(e.target.checked)} />
                  <span>Utiliser l’IA (sinon utiliser des modèles par défaut)</span>
                </label>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Annuler</button>
                  <button type="button" disabled={modalMode === 'modify' ? !modalTargetName || !modalDescription.trim() : !modalDescription.trim()} onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">Suivant</button>
                </div>
              </>
            )}

            {modalStep === 1 && (
              <>
                <h2 className="text-lg font-semibold mb-3">Options</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plateforme</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={optPlatform} onChange={(e) => setOptPlatform(e.target.value)}>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="button">Bouton</option>
                      <option value="link">Lien</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Label</label>
                    <input className="w-full border border-gray-300 rounded-md p-2" value={optLabel} onChange={(e) => setOptLabel(e.target.value)} placeholder="Label du bouton" />
                  </div>
                  {optPlatform === 'whatsapp' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Téléphone</label>
                      <input className="w-full border border-gray-300 rounded-md p-2" value={optPhone} onChange={(e) => setOptPhone(e.target.value)} placeholder="Ex: +212612345678" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">URL</label>
                      <input className="w-full border border-gray-300 rounded-md p-2" value={optHref} onChange={(e) => setOptHref(e.target.value)} placeholder="https://…" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Thème</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={optTheme} onChange={(e) => setOptTheme(e.target.value as any)}>
                      <option value="brand">Marque</option>
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Variant</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={optVariant} onChange={(e) => setOptVariant(e.target.value as any)}>
                      <option value="solid">Plein</option>
                      <option value="outline">Contour</option>
                      <option value="ghost">Fantôme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Taille</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={optSize} onChange={(e) => setOptSize(e.target.value as any)}>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Forme</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={optShape} onChange={(e) => setOptShape(e.target.value as any)}>
                      <option value="rounded">Arrondie</option>
                      <option value="full">Pill</option>
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={optIcon} onChange={(e) => setOptIcon(e.target.checked)} />
                    <span>Afficher l’icône</span>
                  </label>
                </div>
                {/* Live preview */}
                <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Aperçu</div>
                  <div
                    className="inline-block"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: buildPreviewFromOptions({
                      platform: optPlatform,
                      label: optLabel,
                      phone: optPhone,
                      href: optHref,
                      theme: optTheme,
                      variant: optVariant,
                      size: optSize,
                      shape: optShape,
                      icon: optIcon,
                    }) }}
                  />
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <button type="button" onClick={() => setModalStep(0)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                  <button type="button" onClick={() => setModalStep(2)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Suivant</button>
                </div>
              </>
            )}

            {modalStep === 2 && (
              <>
                {modalMode === 'create' ? (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Nom & visibilité</h2>
                    <input className="w-full border border-gray-300 rounded-md p-2 mb-4" placeholder="Nom unique du composant" value={modalName} onChange={(e) => setModalName(e.target.value)} />
                    <div className="flex items-center gap-4 mb-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="visibility" value="private" checked={!modalPublic} onChange={() => setModalPublic(false)} /><span>Privé</span></label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="visibility" value="public" checked={modalPublic} onChange={() => setModalPublic(true)} /><span>Public</span></label>
                    </div>
                    <div className="flex justify-between gap-2">
                      <button type="button" onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" disabled={modalSubmitting || !modalName.trim()} onClick={handleSubmitCustomComponent} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{modalSubmitting ? 'Création…' : 'Créer'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Confirmer la modification</h2>
                    <p className="text-sm text-gray-600 mb-4">Le composant « {modalTargetName || '—'} » sera modifié selon la description et les options choisies.</p>
                    <div className="flex justify-between gap-2">
                      <button type="button" onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" disabled={modalSubmitting || !modalTargetName} onClick={handleSubmitCustomComponent} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{modalSubmitting ? 'Modification…' : 'Modifier'}</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded-md text-sm shadow ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}