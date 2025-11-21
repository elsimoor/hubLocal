"use client";
import Selecto from "react-selecto";

import React, { Suspense } from "react";
// Importez Puck, mais PAS createUsePuck
// Import both the editor (Puck) and the runtime renderer (Render).  Render is
// required so that we can display the latest version of a saved group within
// the editor without copying its tree into every page.  See the dynamic
// group registration below for details.
import { createPortal } from 'react-dom';
import { Puck, Render } from "@measured/puck";
import "@measured/puck/puck.css";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Importez la configuration
import { config } from "@/lib/puck/config";
import { useDashboardUI } from "../../dashboard/ui-context";
import { Maximize2, Minimize2 } from "lucide-react";
// Importez le hook usePuck partagé
import { usePuck } from "@/lib/puck/puck-context";
import { ActionStateProvider } from "@/lib/puck/actions";
import { selectionStore } from "@/lib/puck/selectionStore";
import { parseIndexFromPath } from "@/lib/puck/selectionStore";
import { hydrateGroupProps, normalizeGroupTree, summarizeGroupTree } from "@/lib/puck/group-helpers";

function extractGroupComponentIds(doc: any): string[] {
  const ids = new Set<string>();
  const seen = new WeakSet();
  const visit = (value: any) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    const type = typeof (value as any)?.type === "string" ? String((value as any).type) : "";
    if (type.startsWith("Group_")) {
      const id = type.slice(6);
      if (id) ids.add(id);
    }
    visit((value as any).content);
    visit((value as any).children);
    visit((value as any).root);
    if ((value as any).props) visit((value as any).props);
    if ((value as any).slots && typeof (value as any).slots === "object") {
      Object.values((value as any).slots).forEach(visit);
    }
    if ((value as any).zones && typeof (value as any).zones === "object") {
      Object.values((value as any).zones).forEach(visit);
    }
  };
  visit(doc);
  return Array.from(ids);
}

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
  // Portal helper to render overlays at the document body level.
  const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // In a client component, `document` should be available; render immediately.
    if (typeof document !== 'undefined' && document?.body) {
      return createPortal(children as any, document.body);
    }
    // Fallback (very rare): render inline so content is still visible.
    return <>{children}</> as any;
  };
  // N'utilisez PAS createUsePuck() ici. Utilisez le hook importé.
  const usePuckHook = usePuck; 
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useDashboardUI();
  const isFullscreen = sidebarCollapsed;


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
  const [groups, setGroups] = useState<any[]>([]);
  const [pendingSharedGroups, setPendingSharedGroups] = useState<any[]>([]);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [manageGroupsMode, setManageGroupsMode] = useState<'all' | 'pending'>('all');
  const [selectoActive, setSelectoActive] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState<string | null>(null);
  const [groupsInjectedForSlug, setGroupsInjectedForSlug] = useState<string>("");
  const [pendingPromptVisible, setPendingPromptVisible] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastPuckPathRef = useRef<string | null>(null);
  // Track the last non-empty selection set so that clicking the header (which may clear selection)
  // still allows Save-as-Group to recover a meaningful path list.
  const lastNonEmptySelectionRef = useRef<string[] | null>(null);
  // Track last hovered path so that outline / hover without click still provides a fallback.
  const lastHoverPathRef = useRef<string | null>(null);
  const lastPointerRef = useRef<{x:number;y:number}>({x:0,y:0});
  // Track stamped paths so we know we applied fallback attributes
  const stampedPathsRef = useRef<string[]>([]);

  const fetchGroups = useCallback(async () => {
    const res = await fetch("/api/groups", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load groups");
    return res.json();
  }, []);

  const applyGroupResponse = useCallback((json: any, label: string) => {
    const list = Array.isArray(json?.groups) ? json.groups : [];
    setGroups(list);
    const pending = Array.isArray(json?.pendingSharedGroups) ? json.pendingSharedGroups : [];
    setPendingSharedGroups(pending);
    try {
      const summaries = list.map((g: any) => {
        const { contentCount, childTypes } = summarizeGroupTree(g?.tree);
        return {
          id: g?._id,
          name: g?.name,
          contentCount,
          childTypes,
          public: !!g?.public,
          sourceGroupId: g?.sourceGroupId,
        };
      });
      console.log('[GroupDebug]', label, { ownedCount: list.length, pendingCount: pending.length, summaries });
    } catch {}
  }, []);

  const refreshGroups = useCallback(async () => {
    try {
      const json = await fetchGroups();
      applyGroupResponse(json, 'Refreshed groups');
    } catch (e) {
      console.error('Error refreshing groups', e);
      setGroups([]);
      setPendingSharedGroups([]);
    }
  }, [fetchGroups, applyGroupResponse]);

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
  // Default values for the custom component creation form.  Platform selection
  // has been removed, so optPlatform is initialised but unused.  A single URL
  // field (optHref) replaces the previous optPhone/optHref distinction.
  const [optPlatform, setOptPlatform] = useState<string>("button");
  const [optLabel, setOptLabel] = useState<string>("");
  // Removed optPhone; all link information is stored in optHref.
  const [optHref, setOptHref] = useState<string>("");
  const [optTheme, setOptTheme] = useState<"brand" | "light" | "dark">("brand");
  const [optVariant, setOptVariant] = useState<"solid" | "outline" | "ghost">("solid");
  const [optSize, setOptSize] = useState<"sm" | "md" | "lg">("md");
  const [optShape, setOptShape] = useState<"rounded" | "full">("rounded");
  const [optIcon, setOptIcon] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Docs modal state for "How to use" guide per custom component
  const [showDocsModal, setShowDocsModal] = useState(false);
  // Flag to avoid repeatedly upgrading legacy group references.  Once a page
  // has been upgraded for a given slug we won’t attempt to upgrade again.
  const [groupsUpgraded, setGroupsUpgraded] = useState(false);

  // -----------------------------------------------------------------------------
  // Global click fallback for selection
  // -----------------------------------------------------------------------------
  // Some components defined in the Puck config do not attach their own
  // onMouseDown handler to update the selectionStore.  When those blocks are
  // clicked, the selectionStore remains empty, which breaks the "Save as
  // Group" feature.  To capture clicks on any block, we listen for the
  // mousedown event on the document.  When a user clicks somewhere in the
  // preview, we find the nearest ancestor with a `data-puck-path` attribute
  // and store that path as the last clicked element.  This value is saved
  // both in a React ref (lastPuckPathRef) and in a global variable
  // (window.__LAST_PUCK_PATH__) so that the save handler can fall back to it
  // when the selection store returns no items.
  useEffect(() => {
    const handler = (e: any) => {
      try {
        // Find the nearest element with a data-puck-path attribute
        const el = (e.target as HTMLElement)?.closest?.('[data-puck-path]');
        const path = el?.getAttribute?.('data-puck-path');
        if (path) {
          // Ascend to nearest group wrapper so user intention (whole group) is honoured.
          let ascended = path;
          try {
            ascended = findNearestGroupPath(data, path) || path;
          } catch {}
          lastPuckPathRef.current = ascended;
          if (typeof window !== 'undefined') {
            (window as any).__LAST_PUCK_PATH__ = ascended;
          }
          try { console.log('[PuckDebug] Global mousedown captured path:', path, 'ascended:', ascended); } catch {}
          // Always set selection to ascended path unless doing multi-select (modifier keys)
          try {
            const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
            if (isMulti) {
              selectionStore.toggle(ascended, true);
            } else {
              selectionStore.set([ascended]);
            }
            const selNow = selectionStore.get();
            if (selNow && selNow.length) lastNonEmptySelectionRef.current = selNow.slice();
          } catch {}
        }
      } catch {
        // Do nothing if the target isn’t an HTMLElement
      }
    };
    // Use capture phase so we run before Puck’s own event handlers
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, []);

  // Global hover tracker (pointermove) to capture last hovered block path even if not clicked.
  useEffect(() => {
    const hoverHandler = (e: any) => {
      try {
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
        const el = (e.target as HTMLElement)?.closest?.('[data-puck-path]');
        const path = el?.getAttribute?.('data-puck-path');
        if (path) {
          lastHoverPathRef.current = path;
          (window as any).__LAST_HOVER_PATH__ = path;
        }
      } catch {}
    };
    document.addEventListener('pointermove', hoverHandler, { passive: true });
    return () => document.removeEventListener('pointermove', hoverHandler);
  }, []);

  // Poll selectionStore to keep lastNonEmptySelectionRef in sync even if selection
  // changes via internal Puck mechanisms we did not intercept.
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const sel = selectionStore.get();
        if (sel && sel.length) {
          lastNonEmptySelectionRef.current = sel.slice();
        }
        // Active node polling fallback – record active node path even if wrapper missing
        try {
          const s: any = (usePuckHook as any)?._store?.getState?.() || null; // attempt to access store internals if exposed
          const active = s?.appState?.activeNode?.path;
          let activePath: string | undefined;
          if (Array.isArray(active)) activePath = active.join('.'); else if (typeof active === 'string') activePath = active;
          if (activePath && !selectionStore.has(activePath)) {
            lastPuckPathRef.current = activePath;
            (window as any).__LAST_ACTIVE_NODE_PATH__ = activePath;
          }
        } catch {}
      } catch {}
    }, 500);
    return () => clearInterval(id);
  }, []);

  // DOM path stamping: when Puck fails to render data-puck-path attributes we attempt to infer and stamp them.
  const stampDomPaths = useCallback(() => {
    try {
      const root = editorRef.current;
      if (!root || !data || !data.root || !Array.isArray(data.root.content)) return;
      const items = data.root.content;
      // Collect candidate elements: those with data-puck-component but lacking data-puck-path
      const candidates = Array.from(root.querySelectorAll('[data-puck-component]')) as HTMLElement[];
      const stamped: string[] = [];
      candidates.forEach((el) => {
        if (el.getAttribute('data-puck-path')) return;
        // Attempt to match by order if number of candidates equals items length or greater
        const parent = el.parentElement;
        // Determine index by walking up until we find an ancestor already stamped or root
        let idx = -1;
        // Simple heuristic: use position in candidates list
        idx = candidates.indexOf(el);
        if (idx >= 0 && idx < items.length) {
          const path = `root.content.${idx}`;
          el.setAttribute('data-puck-path', path);
          el.setAttribute('data-puck-autostamp', 'true');
          stamped.push(path);
        }
      });
      if (stamped.length) {
        stampedPathsRef.current = stamped;
        console.log('[StampDebug] Applied fallback stamping to elements:', stamped);
      } else {
        console.log('[StampDebug] No elements stamped (either paths present or no candidates).');
      }
    } catch (err) {
      console.warn('[StampDebug] Error stamping DOM paths', err);
    }
  }, [data]);

  // Invoke stamping after data changes (layout phase to ensure DOM rendered)
  useEffect(() => {
    const t = setTimeout(() => stampDomPaths(), 100); // slight delay to allow Puck render
    return () => clearTimeout(t);
  }, [stampDomPaths, data]);

  // Install global diagnostic helper
  useEffect(() => {
    (window as any).___PUCK_DIAG = (label: string = 'manual') => {
      try {
        const sel = selectionStore.get();
        const last = lastPuckPathRef.current;
        const hover = lastHoverPathRef.current;
        const active = (window as any).__LAST_ACTIVE_NODE_PATH__;
        const pointer = lastPointerRef?.current;
        const nodes = Array.from(document.querySelectorAll('[data-puck-path]')) as HTMLElement[];
        const paths = nodes.map(n => n.getAttribute('data-puck-path')).filter(Boolean) as string[];
        const groupPaths = paths.map(p => findNearestGroupPath(data, p));
        const uniqueGroups = Array.from(new Set(groupPaths));
        console.groupCollapsed(`[GroupDebug Diagnostics] ${label}`);
        console.log('selectionStore.get()', sel);
        console.log('lastPuckPathRef', last);
        console.log('lastHoverPathRef', hover);
        console.log('__LAST_ACTIVE_NODE_PATH__', active);
        console.log('pointer', pointer);
        console.log('DOM total data-puck-path elements', nodes.length);
        if (nodes.length === 0) {
          const rootEl = document.querySelector('[data-puck-editor-root]') || document.body;
          console.log('No data-puck-path elements found. Inline rendering may hide path metadata. Root child count:', rootEl?.children?.length);
        }
        console.log('First 20 DOM paths', paths.slice(0,20));
        console.log('Unique group wrapper candidates', uniqueGroups);
        // For each candidate group output child count if resolvable
        const doc = data;
        const groupSummaries = uniqueGroups.map(gp => {
          const node = getValueAtPath(doc, gp);
          let childCount = 0;
            if (node && typeof node === 'object' && Array.isArray((node as any).content)) childCount = (node as any).content.length;
          return { path: gp, childCount, type: node && (node as any).type };
        });
        console.table(groupSummaries);
        console.groupEnd();
      } catch (err) {
        console.warn('Diagnostics error', err);
      }
    };
    return () => { try { delete (window as any).___PUCK_DIAG; } catch {} };
  }, [data]);

  // Active node sync moved inside Puck overrides to avoid using usePuck outside <Puck>.

  // Debug key handler: press "g" to force selection of last hovered or active path.
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g') {
        try {
          const hovered = lastHoverPathRef.current;
          const active = (window as any).__LAST_ACTIVE_NODE_PATH__ as string | undefined;
          const candidate = hovered || active || lastPuckPathRef.current;
          if (candidate) {
            const ascended = findNearestGroupPath(data, candidate) || candidate;
            selectionStore.set([ascended]);
            lastPuckPathRef.current = ascended;
            (window as any).__LAST_PUCK_PATH__ = ascended;
            const selNow = selectionStore.get();
            if (selNow && selNow.length) lastNonEmptySelectionRef.current = selNow.slice();
            console.log('[PuckDebug] (g) forced selection of', ascended);
          } else {
            console.log('[PuckDebug] (g) no candidate path to force-select');
          }
        } catch (err) {
          console.warn('Force select error', err);
        }
      }
    };
    window.addEventListener('keydown', keyHandler, true);
    return () => window.removeEventListener('keydown', keyHandler, true);
  }, [data]);

  // Only enable the Selecto marquee while Shift is held so normal drags don't show the selection overlay.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setSelectoActive(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setSelectoActive(false);
    };
    const reset = () => setSelectoActive(false);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', reset);
    window.addEventListener('mouseup', reset, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', reset);
      window.removeEventListener('mouseup', reset, true);
    };
  }, []);

  // Removed aggressive fallback that auto-sets last path on data change.
  // It caused saving the last top-level block instead of the intended one.

  // Simple toast system
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: 'success' | 'error' }[]>([]);
  const toastId = useRef(0);
  function showToast(text: string, type: 'success' | 'error' = 'success') {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (!groupId) return;
    const confirmRemove = typeof window === 'undefined' ? true : window.confirm('Supprimer ce groupe enregistré ?');
    if (!confirmRemove) return;
    setGroupActionLoading(`delete:${groupId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Impossible de supprimer le groupe');
      }
      showToast('Groupe supprimé');
      await refreshGroups();
    } catch (e: any) {
      console.error(e);
      showToast(String(e?.message || e), 'error');
    } finally {
      setGroupActionLoading(null);
    }
  }, [refreshGroups]);

  const handleAcceptSharedGroup = useCallback(async (groupId: string) => {
    if (!groupId) return;
    setGroupActionLoading(`accept:${groupId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}/accept`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Impossible d\'accepter ce groupe partagé');
      }
      showToast('Groupe partagé ajouté', 'success');
      setPendingSharedGroups((prev) => prev.filter((g: any) => String(g?._id) !== groupId));
      await refreshGroups();
    } catch (e: any) {
      console.error(e);
      showToast(String(e?.message || e), 'error');
    } finally {
      setGroupActionLoading(null);
    }
  }, [refreshGroups]);

  const handleDeclineSharedGroup = useCallback(async (groupId: string) => {
    if (!groupId) return;
    setGroupActionLoading(`decline:${groupId}`);
    try {
      const res = await fetch(`/api/groups/${groupId}/decline`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Impossible de refuser ce groupe');
      }
      showToast('Invitation ignorée');
      setPendingSharedGroups((prev) => prev.filter((g: any) => String(g?._id) !== groupId));
      await refreshGroups();
    } catch (e: any) {
      console.error(e);
      showToast(String(e?.message || e), 'error');
    } finally {
      setGroupActionLoading(null);
    }
  }, [refreshGroups]);

  const openPendingInvitesModal = useCallback(() => {
    setManageGroupsMode('pending');
    setManageGroupsOpen(true);
  }, []);

  const openAllGroupsModal = useCallback(() => {
    setManageGroupsMode('all');
    setManageGroupsOpen(true);
  }, []);

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
    // Use a generic brand colour.  Platform-specific colours have been removed now that
    // users no longer choose between WhatsApp, Telegram, etc.
    const brand = '#111827';
    const bg = theme === 'brand' ? brand : theme === 'dark' ? '#111827' : '#ffffff';
    const fg = theme === 'light' ? '#111827' : '#ffffff';
    const border = variant === 'outline' ? `1px solid ${brand}` : 'none';
    const finalBg = variant === 'ghost' ? 'transparent' : bg;
    const finalFg = variant === 'outline' ? brand : fg;
    const label = opts.label || 'Click me';
    // Generic icons are not used in the preview; leave the prefix empty.  You can
    // customise this if you wish to display an icon whenever opts.icon is true.
    const iconHtml = '';
    return `<a href="${opts.href || '#'}" style="display:inline-flex;align-items:center;gap:0.5rem;padding:${pad};border:${border};border-radius:${radius};background:${finalBg};color:${finalFg};font-weight:600;font-size:${font};text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.06)">${iconHtml}${label}</a>`;
  }

  // Open the modal and reset fields
  const openModal = () => {
    setModalDescription("");
    setModalName("");
    setModalPublic(false);
    setModalUseAI(true);
    setModalMode("create");
    setModalTargetName("");
    // Reset to the default platform value (no UI selection)
    setOptPlatform("button");
    setOptLabel("");
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
          // Include options only when not using AI.  When using AI the
          // `options` property is intentionally left empty; the API will
          // generate an appropriate component based solely on the prompt.
          options: modalUseAI ? {} : {
            label: optLabel,
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

  // Fetch groups (public + mine)
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const json = await fetchGroups();
        if (!isCancelled) {
          applyGroupResponse(json, 'Initial load');
        }
      } catch (e) {
        console.error("Error fetching groups", e);
        if (!isCancelled) {
          setGroups([]);
          setPendingSharedGroups([]);
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [slug, fetchGroups, applyGroupResponse]);

  useEffect(() => {
    if (pendingSharedGroups.length > 0) {
      setPendingPromptVisible(true);
    } else {
      setPendingPromptVisible(false);
    }
  }, [pendingSharedGroups]);

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
    // Ensure categories exist for AI‑generated and manually authored components.
    if (!nextConfig.categories.ai) {
      nextConfig.categories.ai = { title: "Généré IA", components: [] };
    }
    if (!nextConfig.categories.manual) {
      nextConfig.categories.manual = { title: "Personnalisé", components: [] };
    }
    // Ensure a category for saved groups exists
    if (!nextConfig.categories.groups) {
      nextConfig.categories.groups = { title: "Saved Groups", components: [], defaultExpanded: true };
    }

    // Register dynamic Group palette items – one per saved group
    if (Array.isArray(groups)) {
      groups.forEach((g: any) => {
        const key = `Group_${String(g._id)}`;
        if (!nextConfig.categories.groups.components.includes(key)) {
          nextConfig.categories.groups.components.push(key);
        }
        if (!nextConfig.components[key]) {
          const hydrateProps = (props: any = {}) =>
            hydrateGroupProps(g?.tree, props, { title: g?.name, groupId: String(g?._id || '') });
          nextConfig.components[key] = {
            label: String(g.name || 'Group'),
            // Use non-inline so Puck supplies a wrapper with path metadata.
            inline: false,
            fields: {
              title: { type: 'text', label: 'Title', defaultValue: g?.name || 'Group' },
              background: { type: 'text', label: 'Background', defaultValue: '' },
              padding: { type: 'number', label: 'Padding (px)', defaultValue: 16 },
              borderRadius: { type: 'number', label: 'Radius (px)', defaultValue: 12 },
              content: { type: 'slot', label: 'Content' },
            },
            defaultProps: {
              title: g?.name || 'Group',
              background: '',
              padding: 16,
              borderRadius: 12,
              content: [],
            },
            resolveData: async ({ props }: { props: any }) => {
              const nextProps = hydrateProps(props);
              try {
                console.log('[PuckDebug] resolveData for group', g?._id || '', 'content nodes:', nextProps?.content?.length || 0);
              } catch {}
              return { props: nextProps };
            },
            render: ({ title, background, padding, borderRadius, content: ContentSlot, puck }: any) => {
              const baseStyle: React.CSSProperties = {
                width: '100%',
                background: background || undefined,
                padding: typeof padding === 'number' ? `${padding}px` : undefined,
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : undefined,
                border: '1px solid #e5e7eb',
              };
              let path: string | undefined;
              try {
                const p: any = puck || {};
                if (Array.isArray(p.path)) path = p.path.join('.');
                else if (typeof p.path === 'string') path = p.path;
                else if (Array.isArray(p.node?.path)) path = p.node.path.join('.');
                else if (typeof p.node?.path === 'string') path = p.node.path;
              } catch { path = undefined; }
              if (!path) {
                try {
                  const idx = (puck as any)?.node?.index;
                  if (typeof idx === 'number') path = `root.content.${idx}`;
                } catch {}
              }
              if (!path) {
                try { console.warn('[GroupDebug] Group render missing path for group', g?._id); } catch {}
              } else {
                try { console.log('[GroupDebug] Group render path resolved:', path); } catch {}
              }
              const isSelected = selectionStore.has(path);
              const isEditing = !!puck?.isEditing;
              const outlineStyle: React.CSSProperties = isSelected
                ? { outline: '2px solid #6366f1', outlineOffset: 2 }
                : {};
              const onMouseDown = (e: any) => {
                e.stopPropagation();
                if (!path) { try { console.warn('[GroupDebug] onMouseDown with missing path'); } catch {}; return; }
                if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true);
                else selectionStore.toggle(path, false);
                lastPuckPathRef.current = path;
                try {
                  (window as any).__LAST_PUCK_PATH__ = path;
                  const selNow = selectionStore.get();
                  if (selNow && selNow.length) lastNonEmptySelectionRef.current = selNow.slice();
                } catch {}
              };
              const contentCount = Array.isArray((puck as any)?.node?.props?.content)
                ? (puck as any).node.props.content.length
                : 0;
              try {
                console.log('[GroupDebug] Rendering group', String(g?._id || ''), {
                  name: g?.name,
                  version: g?.version,
                  contentCount,
                });
              } catch {}
              return (
                <div
                  // When inline:false Puck wraps our component; we still add path for redundancy.
                  ref={puck?.dragRef}
                  data-puck-path={path || undefined}
                  data-puck-component={`Group:${g?.name || ''}`}
                  data-group-child-count={contentCount}
                  style={{ ...baseStyle, ...outlineStyle }}
                  onMouseDown={onMouseDown}
                >
                  <div style={{ paddingBottom: 8, fontWeight: 700 }}>
                    {title || g?.name || 'Group'}
                  </div>
                  <div
                    style={
                      isEditing
                        ? {
                            minHeight: 80,
                            background: '#fff',
                            border: '1px dashed #c7d2fe',
                            padding: 12,
                            borderRadius: 8,
                          }
                        : {}
                    }
                  >
                    {typeof ContentSlot === 'function' ? (
                      <ContentSlot />
                    ) : (
                      <div
                        style={{
                          minHeight: 60,
                          display: 'grid',
                          placeItems: 'center',
                          color: '#6b7280',
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      >
                        Drop components here
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          };
        }
      });
    }

    if (!Array.isArray(customComponents) || customComponents.length === 0) {
      return nextConfig;
    }
    customComponents.forEach((comp: any) => {
      const compName = String(comp.name || "Unnamed");
      // Choose the destination category based on whether AI generated the component
      const cat = comp?.ai ? 'ai' : 'manual';
      // Only register the component once per session
      if (!nextConfig.categories[cat].components.includes(compName)) {
        nextConfig.categories[cat].components.push(compName);
      }
      // Do not overwrite if the component is already defined in the config
      if (!nextConfig.components[compName]) {
        // Define a render function that applies responsive style fields in addition
        // to injecting placeholder replacements. These style fields give users
        // standard options like margin, padding, background, border radius and box shadow.
        const renderFn = (props: any) => {
          // Begin with the stored HTML for this custom component
          let html: string = comp.code || "";
          try {
            if (props && typeof props === 'object') {
              // Replace the label text between the first opening and closing tag
              if (typeof props.label === 'string' && props.label) {
                html = html.replace(/>([^<]*)</, `>${props.label}<`);
              }
              // Replace any href attribute with the provided URL
              if (typeof props.href === 'string' && props.href) {
                html = html.replace(/href="[^"]*"/, `href="${props.href}"`);
              }
              // Generic placeholder replacement: any {{key}} in the HTML
              // will be replaced by the corresponding prop value.  For
              // special fields like "links", split comma‑separated values
              // into anchor tags when the placeholder exists.
              Object.keys(props).forEach((key) => {
                const val: any = (props as any)[key];
                if (val == null) return;
                const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}}`, 'g');
                // Handle arrays such as navigation items or slides
                if (Array.isArray(val)) {
                  if (key === 'links' || key === 'items') {
                    const itemsHtml = val
                      .map((item: any) => {
                        if (typeof item === 'string') {
                          return `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${item}</a>`;
                        }
                        const label = item.label || '';
                        const href = item.href || '#';
                        const target = item.target || '_self';
                        return `<a href="${href}" target="${target}" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`;
                      })
                      .join('');
                    html = html.replace(re, itemsHtml);
                    return;
                  }
                  if (key === 'slides') {
                    const slidesHtml = val
                      .map((slide: any) => {
                        const src = slide.src || '';
                        const alt = slide.alt || '';
                        const width = slide.width || '';
                        const height = slide.height || '';
                        const href = slide.href || '';
                        const target = slide.target || '_self';
                        const imgTag = `<img src="${src}" alt="${alt}" style="width:${width ? width + 'px' : '100%'};height:${height ? height + 'px' : 'auto'};object-fit:cover;"/>`;
                        if (href) {
                          return `<div style="flex:0 0 100%;"><a href="${href}" target="${target}">${imgTag}</a></div>`;
                        }
                        return `<div style="flex:0 0 100%;">${imgTag}</div>`;
                      })
                      .join('');
                    html = html.replace(re, slidesHtml);
                    return;
                  }
                  // Fallback: join array items with spaces
                  const joined = val.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
                  html = html.replace(re, joined);
                  return;
                }
                if (typeof val === 'string') {
                  if (key === 'links') {
                    const linkLabels = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    const linksHtml = linkLabels
                      .map((label: string) => `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`)
                      .join('');
                    html = html.replace(re, linksHtml);
                    return;
                  }
                  if (key === 'images') {
                    const urls = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    const imagesHtml = urls
                      .map((url: string) => `<div style="flex:0 0 100%;"><img src="${url}" style="width:100%;height:auto;object-fit:cover;"/></div>`)
                      .join('');
                    html = html.replace(re, imagesHtml);
                    return;
                  }
                  html = html.replace(re, val);
                }
              });
            }
          } catch (e) {
            // ignore any errors in string replacement
          }
          const hasHtml = (html || '').trim().length > 0;
          const fallback = `<div style="padding:12px;border:1px dashed #e5e7eb;border-radius:8px;color:#6b7280;font-size:12px;background:#fafafa">No HTML stored for ${compName}. Use “Modifier” in custom components to add code.</div>`;
          // Apply responsive fields to the wrapper style. When the user edits
          // margin, padding, background, borderRadius or boxShadow in the right
          // panel these values are reflected in the rendered output.
          const style: React.CSSProperties = {
            display: 'block',
            width: '100%',
            ...(props?.margin != null ? { margin: `${props.margin}px` } : {}),
            ...(props?.padding != null ? { padding: `${props.padding}px` } : {}),
            ...(props?.background ? { background: props.background } : {}),
            ...(props?.borderRadius != null ? { borderRadius: `${props.borderRadius}px` } : {}),
            ...(props?.boxShadow ? { boxShadow: props.boxShadow } : {}),
          };
          const onClick = (e: any) => { if ((props as any)?.puck?.isEditing) { e.preventDefault(); e.stopPropagation(); } };
          // Derive puck path so custom components participate in selection & grouping
          let path: string | undefined;
          try {
            const p: any = (props as any)?.puck || {};
            if (Array.isArray(p.path)) path = p.path.join('.');
            else if (typeof p.path === 'string') path = p.path;
            else if (Array.isArray(p.node?.path)) path = p.node.path.join('.');
            else if (typeof p.node?.path === 'string') path = p.node.path;
          } catch {
            path = undefined;
          }
          if (!path) {
            try {
              const idx = (props as any)?.puck?.node?.index;
              if (typeof idx === 'number') path = `root.content.${idx}`;
            } catch {}
          }
          if (!path) {
            try { console.warn('[CustomDebug] Missing path for custom component', compName); } catch {}
          } else {
            try { console.log('[CustomDebug] Component render path resolved:', compName, path); } catch {}
          }
          const isSelected = !!path && selectionStore.has(path);
          const outlineStyle: React.CSSProperties = isSelected ? { outline: '2px solid #6366f1', outlineOffset: 2 } : {};
          const onMouseDown = (e: any) => {
            if (!path) { try { console.warn('[CustomDebug] onMouseDown missing path', compName); } catch {}; return; }
            // Prevent interfering with anchor navigation while editing
            if ((props as any)?.puck?.isEditing) {
              e.preventDefault();
            }
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true);
            else selectionStore.toggle(path, false);
            try { lastPuckPathRef.current = path; if (typeof window !== 'undefined') (window as any).__LAST_PUCK_PATH__ = path; } catch {}
            try {
              const selNow = selectionStore.get();
              if (selNow && selNow.length) lastNonEmptySelectionRef.current = selNow.slice();
            } catch {}
          };
          return (
            <div
              ref={(props as any)?.puck?.dragRef}
              data-puck-component={compName}
              data-puck-path={path || undefined}
              style={{ ...style, ...outlineStyle }}
              onClick={onClick}
              onMouseDown={onMouseDown}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: hasHtml ? html : fallback }}
            />
          );
        };
        // Base responsive fields available on every custom component. These ensure
        // a consistent editing experience across AI‑generated and manual widgets.
        const responsiveFields = {
          margin: { type: 'number', label: 'Margin (px)', defaultValue: 0 },
          padding: { type: 'number', label: 'Padding (px)', defaultValue: 0 },
          background: { type: 'text', label: 'Background', defaultValue: '' },
          borderRadius: { type: 'number', label: 'Radius (px)', defaultValue: 0 },
          boxShadow: { type: 'text', label: 'Shadow', defaultValue: '' },
        } as const;
        // Preserve any field definitions provided by the component's config. When no
        // config is present we fall back to a simple set of controls for links and labels.
        const fallbackFields = {
          label: { type: 'text', label: 'Label' },
          href: { type: 'text', label: 'URL' },
          theme: {
            type: 'select',
            label: 'Theme',
            options: [
              { label: 'Brand', value: 'brand' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ],
          },
          variant: {
            type: 'select',
            label: 'Variant',
            options: [
              { label: 'Solid', value: 'solid' },
              { label: 'Outline', value: 'outline' },
              { label: 'Ghost', value: 'ghost' },
            ],
          },
          size: {
            type: 'select',
            label: 'Size',
            options: [
              { label: 'Small', value: 'sm' },
              { label: 'Medium', value: 'md' },
              { label: 'Large', value: 'lg' },
            ],
          },
          shape: {
            type: 'select',
            label: 'Shape',
            options: [
              { label: 'Rounded', value: 'rounded' },
              { label: 'Pill', value: 'full' },
            ],
          },
          icon: {
            type: 'select',
            label: 'Show icon',
            options: [
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
            // Default to false so the icon is hidden unless explicitly enabled.
            defaultValue: 'false',
          },
        } as const;
        const compConfig = (comp.config || {}) as any;
        const mergedFields = {
          ...responsiveFields,
          ...(compConfig.fields || fallbackFields),
        };
        nextConfig.components[compName] = {
          label: compName,
          inline: false,
          fields: mergedFields,
          ...compConfig,
          render: renderFn,
        };
      }
    });
    return nextConfig;
  }, [customComponents, groups]);

  // Helper to render a preview of a custom component example using the same
  // placeholder replacement logic as the runtime renderer.
  const renderCustomExampleHtml = (comp: any, exampleProps: any): string => {
    try {
      let html: string = comp.code || "";
      const props = exampleProps || {};
      Object.keys(props).forEach((key) => {
        const val: any = (props as any)[key];
        const re = new RegExp(`\\\\{\\\\{\\\\s*${key}\\\\s*\\\\}}`, 'g');
        // Support array values for navigation items and slides
        if (Array.isArray(val)) {
          if (key === 'links' || key === 'items') {
            const itemsHtml = val
              .map((item: any) => {
                if (typeof item === 'string') {
                  return `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${item}</a>`;
                }
                const label = item.label || '';
                const href = item.href || '#';
                const target = item.target || '_self';
                return `<a href="${href}" target="${target}" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`;
              })
              .join('');
            html = html.replace(re, itemsHtml);
            return;
          }
          if (key === 'slides') {
            const slidesHtml = val
              .map((slide: any) => {
                const src = slide.src || '';
                const alt = slide.alt || '';
                const width = slide.width || '';
                const height = slide.height || '';
                const href = slide.href || '';
                const target = slide.target || '_self';
                const imgTag = `<img src="${src}" alt="${alt}" style="width:${width ? width + 'px' : '100%'};height:${height ? height + 'px' : 'auto'};object-fit:cover;"/>`;
                if (href) {
                  return `<div style="flex:0 0 100%;"><a href="${href}" target="${target}">${imgTag}</a></div>`;
                }
                return `<div style="flex:0 0 100%;">${imgTag}</div>`;
              })
              .join('');
            html = html.replace(re, slidesHtml);
            return;
          }
          const joined = val.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
          html = html.replace(re, joined);
          return;
        }
        if (typeof val === 'string') {
          if (key === 'links') {
            const linkLabels = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
            const linksHtml = linkLabels
              .map((label: string) => `<a href=\"#\" style=\"color:#ffffff;text-decoration:none;margin-left:1rem;\">${label}</a>`)
              .join('');
            html = html.replace(re, linksHtml);
          } else if (key === 'images') {
            const urls = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
            const imagesHtml = urls
              .map((url: string) => `<div style=\"flex:0 0 100%;\"><img src=\"${url}\" style=\"width:100%;height:auto;object-fit:cover;\"/></div>`)
              .join('');
            html = html.replace(re, imagesHtml);
          } else {
            html = html.replace(re, val);
          }
        }
      });
      return html;
    } catch {
      return comp.code || '';
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Track last clicked puck path to support Save-as-Group fallback
      const el = target?.closest?.('[data-puck-path]') as HTMLElement | null;
      if (el) {
        const p = el.getAttribute('data-puck-path');
        if (p) lastPuckPathRef.current = p;
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
    const shouldCollapse = search?.get("fs") === "1";
    setSidebarCollapsed(shouldCollapse);
  }, [search, setSidebarCollapsed]);

  // Ensure fullscreen is cleared when navigating away from this editor
  useEffect(() => {
    return () => setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  // Add a body class so global styles can adjust overflow when fullscreen
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('puck-editor-fullscreen', isFullscreen);
    return () => {
      document.body.classList.remove('puck-editor-fullscreen');
    };
  }, [isFullscreen]);

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

  // Helper: get value at path from Puck data (e.g. "root.content.2")
  const getValueAtPath = (rootData: any, path: string) => {
    try {
      const parts = String(path || "").split(".").filter(Boolean);
      let current: any = rootData;
      for (const p of parts) {
        if (current == null) return undefined;
        const idx = Number(p);
        if (Number.isFinite(idx) && Array.isArray(current)) {
          current = current[idx];
        } else {
          current = current[p as any];
        }
      }
      return current;
    } catch {
      return undefined;
    }
  };

  // Helper: given a path inside the document, walk upwards until we find a node
  // whose type is a Group wrapper ("Group" or dynamic "Group_<id>"). Returns
  // the path of that group or the original path if none found.
  const findNearestGroupPath = (rootData: any, path: string): string => {
    if (!path) return path;
    const segments = path.split('.');
    for (let i = segments.length; i > 0; i--) {
      const candidate = segments.slice(0, i).join('.');
      const node = getValueAtPath(rootData, candidate);
      if (node && typeof node === 'object') {
        const t = String((node as any).type || '');
        if (t === 'Group' || t.startsWith('Group_')) return candidate;
      }
    }
    return path;
  };

  // Normalise a set of selection paths so each points at a group wrapper if
  // the user clicked inside a group. This avoids accidentally saving only a
  // child block when the intention is to save the entire group.
  const normalizeSelectionPathsToGroups = (rootData: any, paths: string[]): string[] => {
    const out = new Set<string>();
    for (const p of paths) {
      out.add(findNearestGroupPath(rootData, p));
    }
    return Array.from(out);
  };

  // Helper: shallow clone of data with a node appended to root.content if not present
  const appendNodeToRoot = (doc: any, node: any) => {
    const next = { ...(doc || {}) };
    const root = { ...(next.root || {}) };
    const content = Array.isArray(root.content) ? [...root.content] : [];
    content.push(node);
    root.content = content;
    next.root = root;
    return next;
  };

  // Helper: immutable set by path (dot-notation)
  const setValueAtPath = (rootData: any, path: string, value: any) => {
    try {
      const parts = String(path || "").split('.').filter(Boolean);
      if (!parts.length) return rootData;
      const next = { ...(rootData || {}) } as any;
      let current = next as any;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const idx = Number(p);
        if (Number.isFinite(idx) && Array.isArray(current)) {
          current[idx] = Array.isArray(current[idx]) ? [...current[idx]] : { ...(current[idx] || {}) };
          current = current[idx];
        } else {
          const v = current[p];
          current[p] = Array.isArray(v) ? [...v] : { ...(v || {}) };
          current = current[p];
        }
      }
      const last = parts[parts.length - 1];
      const lastIdx = Number(last);
      if (Number.isFinite(lastIdx) && Array.isArray(current)) {
        const arr = [...current];
        arr[lastIdx] = value;
        return setValueAtPath(rootData, parts.slice(0, -1).join('.'), arr);
      }
      current[last] = value;
      return next;
    } catch {
      return rootData;
    }
  };

  // Group selected sibling nodes under a single Group wrapper and return new doc
  const groupSelectedIntoNode = (doc: any, paths: string[], name: string) => {
    if (!paths?.length) return doc;
    const { ok, parent } = selectionStore.sameParent(paths);
    if (!ok || !parent) return doc;
    const parentArray = getValueAtPath(doc, parent);
    if (!Array.isArray(parentArray)) return doc;
    const indices = paths
      .map((p) => parseIndexFromPath(p))
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);
    if (!indices.length) return doc;
    const nodes = indices.map((i) => parentArray[i]);
    const groupNode: any = {
      type: 'Group',
      props: { title: name, showTitle: 'false', padding: 16, borderRadius: 12 },
      content: nodes,
    };
    const remaining = parentArray.filter((_: any, idx: number) => !indices.includes(idx));
    const insertAt = indices[0];
    const newParent = [...remaining.slice(0, insertAt), groupNode, ...remaining.slice(insertAt)];
    const next = setValueAtPath(doc, parent, newParent);
    return next;
  };

  // Auto-inject autoInclude groups into current document once per slug
  useEffect(() => {
    if (!data || !groups || groupsInjectedForSlug === slug) return;
    const auto = groups.filter((g: any) => !!g.autoInclude);
    if (!auto.length) {
      setGroupsInjectedForSlug(slug);
      return;
    }
    try {
      let next = data;
      const existingList: any[] = Array.isArray(next?.root?.content) ? next.root.content : [];
      for (const g of auto) {
        // Do not duplicate group auto inclusion.  If a node with a matching
        // __groupId exists we skip it.  Otherwise insert a lightweight
        // reference node that uses the dynamic component defined in
        // mergedConfig (`Group_<id>`).  The node stores the group id on
        // `__groupId` so legacy pages can still be upgraded.
        const already = existingList.some(
          (n: any) => n && typeof n === 'object' && n.__groupId === String(g._id)
        );
        if (!already) {
          const node = {
            type: `Group_${String(g._id)}`,
            props: {},
            __groupId: String(g._id),
          };
          next = appendNodeToRoot(next, node);
        }
      }
      if (next !== data) {
        setData(next);
      }
      setGroupsInjectedForSlug(slug);
    } catch (e) {
      console.warn('Failed to auto-inject groups', e);
    }
  }, [data, groups, slug, groupsInjectedForSlug]);

  // Upgrade legacy group nodes in the document.  Older versions of the
  // application stored groups by copying the group tree directly into the
  // page and setting the `__groupId` property.  This effect converts such
  // nodes into lightweight references (type: `Group_<id>`) so that they use
  // the dynamic Group component defined in mergedConfig.  The upgrade is
  // performed once per document per slug.
  useEffect(() => {
    if (!data || !groups || groupsUpgraded) return;
    try {
      // Deep clone the data to avoid mutating state directly
      const clone = JSON.parse(JSON.stringify(data));
      let changed = false;
      function traverse(node: any) {
        if (!node || typeof node !== 'object') return;
        // If the node has a __groupId and its type does not already refer to
        // a dynamic group component, convert it into a reference and remove
        // its content to avoid duplication.
        if (node.__groupId && (!node.type || !String(node.type).startsWith('Group_'))) {
          node.type = `Group_${String(node.__groupId)}`;
          delete node.content;
          changed = true;
        }
        // Traverse children recursively
        const content = node.content;
        if (Array.isArray(content)) {
          content.forEach((child) => traverse(child));
        } else if (content && typeof content === 'object') {
          traverse(content);
        }
      }
      if (clone && clone.root) {
        traverse(clone.root);
      }
      if (changed) {
        setData(clone);
      }
    } catch (e) {
      console.warn('Failed to upgrade group references', e);
    } finally {
      setGroupsUpgraded(true);
    }
  }, [data, groups, groupsUpgraded]);

  // Rewrite legacy shared group references so they target the user's cloned copy.
  // When a user accepts a shared group we clone it, which means previously
  // inserted nodes that referenced the original owner id now fail to render
  // (`Group_<sourceId>` has no config).  This effect scans the current doc for
  // unknown ids and swaps them to the corresponding clone id (matching on
  // `sourceGroupId`).
  useEffect(() => {
    if (!data || !Array.isArray(groups) || groups.length === 0) return;
    try {
      const ids = extractGroupComponentIds(data);
      if (!ids.length) return;
      const replacementMap = new Map<string, string>();
      for (const id of ids) {
        const owned = groups.find((g: any) => String(g?._id) === id);
        if (owned) continue;
        const clone = groups.find((g: any) => String(g?.sourceGroupId) === id);
        if (clone) {
          replacementMap.set(id, String(clone._id));
        }
      }
      if (replacementMap.size === 0) return;

      const cloneDoc = JSON.parse(JSON.stringify(data));
      let changed = false;
      const visit = (node: any) => {
        if (!node || typeof node !== 'object') return;
        const type = typeof node.type === 'string' ? node.type : '';
        if (type.startsWith('Group_')) {
          const oldId = type.slice(6);
          const newId = replacementMap.get(oldId);
          if (newId) {
            node.type = `Group_${newId}`;
            node.__groupId = newId;
            changed = true;
          }
        }
        if (Array.isArray(node.content)) {
          node.content.forEach(visit);
        } else if (node.content && typeof node.content === 'object') {
          visit(node.content);
        }
        if (node.slots && typeof node.slots === 'object') {
          Object.values(node.slots).forEach(visit);
        }
        if (node.zones && typeof node.zones === 'object') {
          Object.values(node.zones).forEach(visit);
        }
        if (node.children && typeof node.children === 'object') {
          visit(node.children);
        }
      };
      visit(cloneDoc?.root);
      if (changed) {
        setData(cloneDoc);
      }
    } catch (err) {
      console.warn('Failed to rewrite shared group references', err);
    }
  }, [data, groups]);

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

  const outerClass = isFullscreen ? "min-h-[100dvh] bg-white" : "min-h-[100dvh] bg-gray-50";
  const innerClass = isFullscreen ? "mx-auto w-full max-w-none py-4 px-4 md:px-8" : "mx-auto max-w-8xl py-8 px-4";
  const editorContainerClass = isFullscreen ? "min-h-[calc(100vh-140px)]" : "";

  return (
    <div className={outerClass}>
      <div className={innerClass}>
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
        {pendingSharedGroups.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {pendingSharedGroups.length === 1
                  ? "Un nouveau groupe partagé est disponible."
                  : `${pendingSharedGroups.length} nouveaux groupes partagés sont disponibles.`}
              </div>
              <button
                type="button"
                onClick={() => {
                  try { /* noop */ } catch {}
                  setManageGroupsMode('pending');
                  setManageGroupsOpen(true);
                  showToast('Examiner cliqué (modal ouvert)', 'success');
                }}
                className="inline-flex items-center rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                Examiner
              </button>
            </div>
            
          </div>
        )}
          {loading ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <div className="animate-spin rounded-full h-5 w-5 border-4 border-gray-300 border-t-gray-700 mr-3"></div>
              <span className="text-sm text-gray-600">Chargement…</span>
            </div>
          ) : (
          <ActionStateProvider>
          <div ref={editorRef} className={editorContainerClass}>
          <Puck
            key={`${slug}:${customComponents?.length ?? 0}`}
            config={mergedConfig as any}
            data={data}
            onChange={(d: any) => {
              // Ensure the editor data is always defined to avoid errors
              // when Puck.Outline tries to read `data` on undefined.
              setData(d || {});
              // Attempt immediate stamping after change
              try { stampDomPaths(); } catch {}
            }}
            viewports={[
              { width: 360, height: "auto", label: "Mobile" },
              { width: 768, height: "auto", label: "Tablet" },
              { width: 1280, height: "auto", label: "Desktop" },
              { width: 1440, height: "auto", label: "Wide" },
            ]}
            overrides={{
              // Customize the Puck Drawer to include an outline above the component list.
              // This outline displays the current component hierarchy alongside the component palette,
              // making it easier to find and insert layouts and widgets from a single place.
              drawer: ({ children }) => (
                <div className="flex flex-col h-full">
                  {/* Show the outline of the current document at the top */}
                  <div className="border-b border-gray-200 max-h-[40vh] overflow-auto">
                    <Puck.Outline />
                  </div>
                  {/* Show the default component list below */}
                  <div className="flex-1 overflow-auto">{children}</div>
                </div>
              ),

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
                // Active node sync component (inside Puck context to avoid hook error)
                const ActiveNodeSync: React.FC = () => {
                  const localAppState = usePuckHook((s: any) => s.appState);
                  useEffect(() => {
                    try {
                      const active = localAppState?.activeNode?.path;
                      let activePath: string | undefined;
                      if (Array.isArray(active)) activePath = active.join('.');
                      else if (typeof active === 'string') activePath = active;
                      if (activePath) {
                        const ascended = findNearestGroupPath(data, activePath) || activePath;
                        lastPuckPathRef.current = ascended;
                        (window as any).__LAST_ACTIVE_NODE_PATH__ = ascended;
                        if (!selectionStore.has(ascended)) {
                          selectionStore.set([ascended]);
                        }
                        const selNow = selectionStore.get();
                        if (selNow && selNow.length) lastNonEmptySelectionRef.current = selNow.slice();
                        try { console.log('[PuckDebug] ActiveNodeSync set selection to', ascended); } catch {}
                      }
                    } catch {}
                  }, [localAppState?.activeNode]);
                  return null;
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
                    <ActiveNodeSync />
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
                      {/* Selection debug panel */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-gray-300 bg-white text-[10px] text-gray-600">
                        <span className="font-semibold">Sel:</span>
                        <span>{(() => { try { const s = selectionStore.get(); return s && s.length ? s.join(',') : 'none'; } catch { return 'err'; } })()}</span>
                        <span className="font-semibold ml-1">Last:</span>
                        <span>{lastPuckPathRef.current || 'none'}</span>
                        <span className="font-semibold ml-1">Hover:</span>
                        <span>{lastHoverPathRef.current || 'none'}</span>
                        <button
                          type="button"
                          onClick={() => { try { if (lastPuckPathRef.current) { selectionStore.set([lastPuckPathRef.current]); console.log('[PuckDebug] Force selected last path:', lastPuckPathRef.current); } } catch {} }}
                          className="ml-2 px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >Force</button>
                        <button
                          type="button"
                          onClick={() => { try { if ((window as any).___PUCK_DIAG) (window as any).___PUCK_DIAG('manual'); } catch {} }}
                          className="ml-1 px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >Diag</button>
                      </div>
                    </div>
                    {/* Groups controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Save selection as Group"
                        onClick={async () => {
                          try {
                            // Debug: log the current state of selectionStore and related
                            // references before computing the selected paths.
                            try {
                              console.log('[PuckDebug] Save as Group invoked');
                              console.log('[PuckDebug] selectionStore.get():', selectionStore.get());
                              console.log('[PuckDebug] lastPuckPathRef.current:', lastPuckPathRef.current);
                              if (typeof window !== 'undefined') {
                                console.log('[PuckDebug] window.__LAST_PUCK_PATH__:', (window as any).__LAST_PUCK_PATH__);
                              }
                              console.log('[PuckDebug] current document (appState.data):', current);
                              console.log('[PuckDebug] fallback document (state data):', data);
                              console.log('[PuckDebug] lastNonEmptySelectionRef.current:', lastNonEmptySelectionRef.current);
                              console.log('[PuckDebug] lastHoverPathRef.current:', lastHoverPathRef.current);
                            } catch {}
                            const doc = current || data || {};
                            const sel = selectionStore.get();
                            let paths = Array.isArray(sel) ? sel.slice() : [];
                            try { console.log('[PuckDebug] initial raw selection paths:', paths); } catch {}
                            // Minimal fallback: use last clicked element only (no doc scan)
                            if (!paths.length) {
                              let last = lastPuckPathRef.current;
                              try { if (!last && typeof window !== 'undefined') last = (window as any).__LAST_PUCK_PATH__ || null; } catch {}
                              if (last) paths = [String(last)];
                            }
                            // Hover fallback if still empty
                            if (!paths.length && lastHoverPathRef.current) {
                              paths = [String(lastHoverPathRef.current)];
                              try { console.log('[PuckDebug] Using hover fallback path:', paths); } catch {}
                            }
                            // If still empty, try last non-empty selection snapshot
                            if (!paths.length && lastNonEmptySelectionRef.current && lastNonEmptySelectionRef.current.length) {
                              paths = lastNonEmptySelectionRef.current.slice();
                              try { console.log('[PuckDebug] Using lastNonEmptySelectionRef fallback:', paths); } catch {}
                            }
                            // Filter out empty strings then resolve each path up to its nearest group wrapper.
                            paths = normalizeSelectionPathsToGroups(doc, paths.filter(p => !!p));
                            try { console.log('[PuckDebug] normalized group selection paths (post-filter):', paths); } catch {}
                            // Secondary fallback: if still empty try last clicked path ascended to group wrapper.
                            if (!paths.length) {
                              let last = lastPuckPathRef.current;
                              try { if (!last && typeof window !== 'undefined') last = (window as any).__LAST_PUCK_PATH__ || null; } catch {}
                              if (last) {
                                const gp = findNearestGroupPath(doc, String(last));
                                if (gp) {
                                  paths = [gp];
                                  try { console.log('[PuckDebug] Fallback ascended last path to group:', gp); } catch {}
                                }
                              }
                            }
                            // Final attempt: if still empty and we have a last non-empty snapshot, ascend each.
                            if (!paths.length && lastNonEmptySelectionRef.current && lastNonEmptySelectionRef.current.length) {
                              const ascended = lastNonEmptySelectionRef.current.map(p => findNearestGroupPath(doc, p));
                              if (ascended.length) {
                                paths = Array.from(new Set(ascended));
                                try { console.log('[PuckDebug] Ascended lastNonEmptySelectionRef paths:', paths); } catch {}
                              }
                            }
                            if (!paths.length) {
                              try { console.log('[PuckDebug] NO PATHS FINAL – will show toast.'); } catch {}
                              // DOM scan fallback: attempt to pick an outlined or pointer-under block
                              try {
                                const pointer = lastPointerRef.current;
                                const all = Array.from(document.querySelectorAll('[data-puck-path]')) as HTMLElement[];
                                let chosen: HTMLElement | null = null;
                                if (all.length === 0) {
                                  console.log('[PuckDebug] No data-puck-path elements prior to scan; invoking stampDomPaths().');
                                  stampDomPaths();
                                }
                                const allAfterStamp = all.length === 0 ? Array.from(document.querySelectorAll('[data-puck-path]')) as HTMLElement[] : all;
                                // Prefer elements whose style outline matches selection color
                                for (const el of allAfterStamp) {
                                  const cs = getComputedStyle(el);
                                  if (cs.outlineStyle !== 'none' && cs.outlineColor.includes('102') /* rough match for #6366f1 */) {
                                    chosen = el; break;
                                  }
                                }
                                if (!chosen) {
                                  // Fallback: element under pointer coordinates
                                  for (const el of allAfterStamp) {
                                    const r = el.getBoundingClientRect();
                                    if (pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom) {
                                      chosen = el; break;
                                    }
                                  }
                                }
                                if (chosen) {
                                  const p = chosen.getAttribute('data-puck-path');
                                  if (p) {
                                    const gp = findNearestGroupPath(doc, p);
                                    paths = [gp];
                                    console.log('[PuckDebug] DOM scan fallback selected path:', p, 'group ascended:', gp);
                                  }
                                }
                                // If still empty attempt candidate group enumeration
                                if (!paths.length) {
                                  const uniqGroups = new Set<string>();
                                  for (const el of allAfterStamp) {
                                    const p = el.getAttribute('data-puck-path');
                                    if (!p) continue;
                                    const gp = findNearestGroupPath(doc, p);
                                    if (gp) uniqGroups.add(gp);
                                  }
                                  const candidates = Array.from(uniqGroups);
                                  if (candidates.length === 1) {
                                    paths = [candidates[0]];
                                    console.log('[PuckDebug] Single candidate group auto-selected:', candidates[0]);
                                  } else if (candidates.length > 1) {
                                    console.log('[PuckDebug] Multiple candidate groups found:', candidates);
                                    const pick = prompt('Multiple groups found. Enter index to save:\n' + candidates.map((c,i)=>`${i}: ${c}`).join('\n'));
                                    const idx = pick != null ? Number(pick) : -1;
                                    if (Number.isFinite(idx) && idx >=0 && idx < candidates.length) {
                                      paths = [candidates[idx]];
                                      console.log('[PuckDebug] User selected candidate index', idx, 'path', candidates[idx]);
                                    }
                                  }
                                }
                              } catch {}
                            }
                            if (!paths.length) {
                              // Data-driven fallback: enumerate doc.root.content or doc.content
                              try {
                                const contentArray = Array.isArray(doc?.root?.content)
                                  ? { arr: doc.root.content, prefix: 'root.content' }
                                  : Array.isArray(doc?.content)
                                    ? { arr: doc.content, prefix: 'content' }
                                    : null;
                                if (contentArray) {
                                  const { arr, prefix } = contentArray;
                                  type Candidate = { path: string; type: string; label: string };
                                  const groupCandidates: Candidate[] = [];
                                  const allCandidates: Candidate[] = [];
                                  const describeNode = (node: any): string => {
                                    if (!node || typeof node !== 'object') return '';
                                    const props = (node as any).props || {};
                                    const hint = props?.name || props?.title || props?.label || props?.heading || props?.text || '';
                                    return hint ? String(hint) : '';
                                  };
                                  arr.forEach((node: any, i: number) => {
                                    const path = `${prefix}.${i}`;
                                    const type = node && typeof node === 'object' ? String(node.type || 'Node') : 'Node';
                                    const entry: Candidate = { path, type, label: describeNode(node) };
                                    if (type === 'Group' || type.startsWith('Group_')) groupCandidates.push(entry);
                                    allCandidates.push(entry);
                                  });
                                  const prioritized = groupCandidates.length ? groupCandidates : allCandidates;
                                  if (prioritized.length === 1) {
                                    paths = [prioritized[0].path];
                                    console.log('[PuckDebug] Data fallback auto-selected single candidate:', prioritized[0]);
                                  } else if (prioritized.length > 1) {
                                    const menu = prioritized.map((c, idx) => `${idx}: ${c.path} – ${c.type}${c.label ? ` (${c.label})` : ''}`).join('\n');
                                    console.log('[PuckDebug] Data fallback requires manual selection. Candidates:', prioritized);
                                    const pick = prompt('Multiple blocks found. Enter index to save:\n' + menu);
                                    const idx = pick != null ? Number(pick) : NaN;
                                    if (Number.isFinite(idx) && idx >= 0 && idx < prioritized.length) {
                                      paths = [prioritized[idx].path];
                                      console.log('[PuckDebug] Data fallback user selected candidate:', prioritized[idx]);
                                    } else {
                                      console.warn('[PuckDebug] Data fallback selection cancelled or invalid');
                                    }
                                  } else {
                                    console.log('[PuckDebug] Data fallback found array but no candidates; prefix', prefix);
                                  }
                                } else {
                                  console.log('[PuckDebug] Data fallback: no root.content or content array present');
                                }
                              } catch (err) {
                                console.warn('[PuckDebug] Data fallback enumeration error', err);
                              }
                            }
                            if (!paths.length) {
                              try { if ((window as any).___PUCK_DIAG) (window as any).___PUCK_DIAG('auto'); } catch {}
                              showToast('Click a block first, then Save as Group', 'error');
                              return;
                            }
                            try {
                              console.log('[PuckDebug] Final resolved paths:', paths);
                            } catch {}
                            // If multiple, ensure same parent
                            if (paths.length > 1) {
                              const { ok } = selectionStore.sameParent(paths);
                              if (!ok) {
                                showToast('Selections must share the same parent', 'error');
                                return;
                              }
                            }
                            // Fetch nodes; if any path no longer resolves to a node, filter it out.
                            let selectedNodes = paths.map((p) => getValueAtPath(doc, p)).filter((n, idx) => {
                              if (!n || typeof n !== 'object') return false;
                              // Exclude root doc object (no type) unless explicitly a group wrapper
                              const t = String((n as any).type || '');
                              if (!t && paths[idx] === '') return false;
                              return true;
                            });
                            // If multiple paths collapsed onto the same group wrapper, deduplicate the node list.
                            const seen = new Set<any>();
                            selectedNodes = selectedNodes.filter((n) => { if (seen.has(n)) return false; seen.add(n); return true; });
                            try {
                              console.log('[PuckDebug] Selected nodes for grouping:', selectedNodes);
                            } catch {}
                            if (!selectedNodes.length) {
                              showToast('Unsupported selection', 'error');
                              return;
                            }
                            const name = prompt('Group name');
                            if (!name) return;
                            const vis = confirm('Make this group public and auto-include across all apps? Click OK for Yes, Cancel for No.');
                            let groupTree: any;
                            /*
                             * Build the group tree.  When only a single node is selected
                             * and that node contains its own `content` array (for example,
                             * when the user selects a Group wrapper), we flatten the
                             * selection by saving the children of that node directly.
                             * Otherwise we save the selected node(s) as is.  The saved
                             * structure always includes a `root` object so that Puck’s
                             * internals can reliably find `data.root.content`.  Without
                             * the root property Puck may throw a runtime error when
                             * reading `data` on undefined.
                             */
                            if (paths.length === 1) {
                              const node = selectedNodes[0];
                              let savedContent: any[] = [];
                              // If the selected node is a dynamic group reference
                              // (type starts with "Group_" and no inline content),
                              // dereference it to the actual saved group's tree so we
                              // capture a stable snapshot instead of a reference.
                              const t = node && typeof node === 'object' ? String((node as any).type || '') : '';
                              if (t.startsWith('Group_') && !(Array.isArray((node as any).content) && (node as any).content.length)) {
                                const gid = t.slice(6);
                                const found = Array.isArray(groups) ? groups.find((gg: any) => String(gg?._id) === gid) : null;
                                if (found && found.tree) {
                                  const summary = summarizeGroupTree(found.tree);
                                  savedContent = Array.isArray(summary.normalized?.root?.content) ? summary.normalized.root.content : [];
                                }
                              }
                              if (!savedContent.length) {
                                if (node && typeof node === 'object' && Array.isArray((node as any).content)) {
                                  // Use the node's children directly
                                  savedContent = (node as any).content;
                                } else {
                                  // Otherwise wrap the node in an array
                                  savedContent = [node];
                                }
                              }
                              groupTree = { root: { content: savedContent } };
                            } else {
                              groupTree = { root: { content: selectedNodes } };
                            }
                            // Debug: log the computed group tree before saving
                            try {
                              console.log('[PuckDebug] groupTree ready to save:', groupTree);
                            } catch {}
                            const res = await fetch('/api/groups', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name, tree: groupTree, public: vis, autoInclude: vis }),
                            });
                            // Debug: log the raw response status
                            try {
                              console.log('[PuckDebug] POST /api/groups status:', res.status, res.ok);
                            } catch {}
                            let createdGroup: any = null;
                            if (!res.ok) {
                              const j = await res.json().catch(() => ({}));
                              throw new Error(j?.error || 'Failed to save group');
                            } else {
                              try {
                                const json = await res.json().catch(() => ({}));
                                createdGroup = json?.group || null;
                                console.log('[PuckDebug] Saved group response:', json);
                              } catch {}
                            }
                            showToast('Group saved', 'success');
                            // Optionally replace current selection by a single Group node in the document
                            const shouldReplace = confirm('Replace current selection in the page with the grouped block?');
                            if (shouldReplace) {
                              const nextDoc = groupSelectedIntoNode(doc, paths, name);
                              setData(nextDoc);
                            }
                            // Refresh groups list
                            try {
                              const g = await fetch('/api/groups', { cache: 'no-store' }).then((r) => r.json());
                              setGroups(Array.isArray(g?.groups) ? g.groups : []);
                              // Debug: log groups after refresh
                              try {
                                console.log('[PuckDebug] Fetched groups after saving:', g);
                              } catch {}
                            } catch {}
                          } catch (e: any) {
                            console.error(e);
                            try { if ((window as any).___PUCK_DIAG) (window as any).___PUCK_DIAG('exception:' + (e?.message || 'unknown')); } catch {}
                            showToast(String(e?.message || e), 'error');
                          }
                        }}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Save as Group
                      </button>
                      <button
                        type="button"
                        onClick={openAllGroupsModal}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Gérer les groupes
                      </button>
                      <div className="relative group">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          title="Insert a saved Group at the end"
                        >
                          Insert Group ▾
                        </button>
                        <div className="absolute hidden group-hover:block right-0 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-md z-10 max-h-80 overflow-auto">
                          {groups.length === 0 ? (
                            <div className="p-3 text-sm text-gray-600">No groups yet.</div>
                          ) : (
                            groups.map((g: any) => {
                              const summary = summarizeGroupTree(g?.tree);
                              const blockLabel = `${summary.contentCount} block${summary.contentCount === 1 ? '' : 's'}`;
                              return (
                                <button
                                  key={g._id}
                                  type="button"
                                  onClick={() => {
                                    try {
                                      try {
                                        console.log('[GroupDebug] Inserting group', String(g?._id || ''), {
                                          name: g?.name,
                                          contentCount: summary.contentCount,
                                          childTypes: summary.childTypes,
                                        });
                                      } catch {}
                                      // Insert a lightweight reference node instead of copying the tree.
                                      const node = {
                                        type: `Group_${String(g._id)}`,
                                        props: {},
                                        __groupId: String(g._id),
                                      };
                                      const next = appendNodeToRoot(current, node);
                                      setData(next);
                                      showToast('Inserted group');
                                    } catch (e: any) {
                                      console.error(e);
                                      showToast('Failed to insert group', 'error');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  {g.name}
                                  <span className="ml-2 text-xs text-gray-500">{blockLabel}</span>
                                  <span
                                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      g.public
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {g.public ? 'Public' : 'Privé'}
                                  </span>
                                  {g.sourceGroupId ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                      Copie partagée
                                    </span>
                                  ) : null}
                                  {g.autoInclude ? <span className="ml-2 text-xs text-gray-500">auto</span> : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // slug is like "appSlug/page"; we resolve appId by listing user's apps
                          const parts = (slug || '').split('/');
                          const appSlug = parts[0] || '';
                          const pagePart = parts.slice(1).join('/') || 'home';
                          let url = `/published/${parts.map(encodeURIComponent).join('/')}`; // fallback
                          if (appSlug) {
                            try {
                              const res = await fetch('/api/apps', { cache: 'no-store' });
                              const json = await res.json();
                              const list = Array.isArray(json?.apps) ? json.apps : [];
                              const mine = list.find((a: any) => a?.slug === appSlug);
                              if (mine?._id) {
                                url = `/published/app/${encodeURIComponent(mine._id)}/${pagePart.split('/').map(encodeURIComponent).join('/')}`;
                              }
                            } catch {}
                          }
                          try { window.open(url, '_blank'); } catch { router.push(url); }
                        } catch {
                          const url = `/published/${slug.split('/').map(encodeURIComponent).join('/')}`;
                          try { window.open(url, '_blank'); } catch { router.push(url); }
                        }
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
                    <button
                      type="button"
                      onClick={() => setShowDocsModal(true)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      How to use
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
          {/* Selecto integration for drag multi-select of blocks (Shift+drag) */}
          {selectoActive && (
            <Selecto
              selectableTargets={[".puck-canvas [data-puck-path]", "[data-puck-path]"]}
              selectByClick={true}
              selectFromInside={true}
              toggleContinueSelect={["shift", "ctrl", "meta"]}
              hitRate={0}
              ratio={0}
              onSelect={(e: any) => {
                try {
                  const picked = e.selected.filter((el: any) => el?.getAttribute).map((el: HTMLElement) => el.getAttribute('data-puck-path')).filter((p: any) => !!p) as string[];
                  if (picked.length) {
                    const asc = normalizeSelectionPathsToGroups(data, picked);
                    selectionStore.set(asc);
                    lastNonEmptySelectionRef.current = asc.slice();
                    lastPuckPathRef.current = asc[asc.length - 1];
                    (window as any).__LAST_PUCK_PATH__ = lastPuckPathRef.current;
                    console.log('[PuckDebug] Selecto selected paths:', picked, 'ascended groups:', asc);
                  }
                } catch (err) { console.warn('Selecto selection error', err); }
              }}
            />
          )}
          </div>
          </ActionStateProvider>
          )}
          {/* Inline mode is now used for all components so we no longer need to override
              default wrapper behaviour. The previous global CSS overrides have been
              removed to allow flex and grid items to size themselves naturally. */}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            {/* The modal container is relative so we can overlay a spinner when generating a component */}
            <div className="bg-white relative rounded-lg w-full max-w-xl p-5">
              {/* Display a spinner overlay while the custom component is being generated or modified */}
              {modalSubmitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
                  <span className="sr-only">Génération en cours…</span>
                </div>
              )}
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
                  {modalUseAI ? (
                    <>
                      <h2 className="text-lg font-semibold mb-3">Options générées automatiquement</h2>
                      <p className="text-sm text-gray-600 mb-4">Les paramètres de ce composant seront déterminés par l’IA selon votre description. Vous pourrez les modifier plus tard via le panneau de propriétés.</p>
                      <div className="flex justify-between gap-2 mt-4">
                        <button type="button" onClick={() => setModalStep(0)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                        <button type="button" onClick={() => setModalStep(2)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Suivant</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold mb-3">Options</h2>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Label</label>
                          <input className="w-full border border-gray-300 rounded-md p-2" value={optLabel} onChange={(e) => setOptLabel(e.target.value)} placeholder="Label du bouton" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">URL</label>
                          <input className="w-full border border-gray-300 rounded-md p-2" value={optHref} onChange={(e) => setOptHref(e.target.value)} placeholder="https://…" />
                        </div>
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
                      <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="text-xs text-gray-500 mb-2">Aperçu</div>
                        <div
                          className="inline-block"
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: buildPreviewFromOptions({
                            label: optLabel,
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

        {manageGroupsOpen && (
          <Portal>
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
              style={{ zIndex: 2147483647 }}
            >
              {(() => {
                try {
                  console.log('[GroupDebug] Rendering manage groups modal, mode:', manageGroupsMode, 'pendingSharedGroups:', pendingSharedGroups);
                } catch {}
                return null;
              })()}
              <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-200 px-5 py-4 gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {manageGroupsMode === 'pending' ? 'Groupes partagés à examiner' : 'Groupes enregistrés'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {manageGroupsMode === 'pending'
                      ? 'Acceptez ou ignorez les groupes partagés. Les groupes acceptés seront ajoutés à votre palette.'
                      : 'Supprimez vos groupes et consultez les invitations partagées.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {manageGroupsMode === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => setManageGroupsMode('all')}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Mes groupes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setManageGroupsMode('pending')}
                      className="inline-flex items-center rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                    >
                      Invitations
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setManageGroupsOpen(false)}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                {manageGroupsMode === 'pending' ? (
                  <div>
                    {pendingSharedGroups.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                        Aucune invitation en attente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingSharedGroups.map((g: any) => (
                          <div key={g._id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-amber-900">{g.name || 'Groupe partagé'}</div>
                                <p className="text-xs text-amber-800">{g.description || 'Partagé sans description.'}</p>
                                <p className="text-[11px] text-amber-700 mt-1">Proposé par {g.ownerEmail || 'un créateur'}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `decline:${g._id}`}
                                  onClick={() => handleDeclineSharedGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  {groupActionLoading === `decline:${g._id}` ? 'Patientez…' : 'Ignorer'}
                                </button>
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `accept:${g._id}`}
                                  onClick={() => handleAcceptSharedGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {groupActionLoading === `accept:${g._id}` ? 'Ajout…' : 'Accepter'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Mes groupes</h3>
                      {groups.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          Aucun groupe pour le moment.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groups.map((g: any) => (
                            <div key={g._id} className="rounded-lg border border-gray-200 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    {g.name || 'Sans titre'}
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        g.public ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {g.public ? 'Public' : 'Privé'}
                                    </span>
                                    {g.sourceGroupId ? (
                                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                        Copie partagée
                                      </span>
                                    ) : null}
                                    {g.autoInclude ? (
                                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                        Auto include
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">{g.description || 'Aucune description'}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `delete:${g._id}`}
                                  onClick={() => handleDeleteGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-red-500 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {groupActionLoading === `delete:${g._id}` ? 'Suppression…' : 'Supprimer'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Invitations partagées</h3>
                      {pendingSharedGroups.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          Aucune invitation en attente.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingSharedGroups.map((g: any) => (
                            <div key={g._id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-amber-900">{g.name || 'Groupe partagé'}</div>
                                  <p className="text-xs text-amber-800">{g.description || 'Partagé sans description.'}</p>
                                  <p className="text-[11px] text-amber-700 mt-1">Proposé par {g.ownerEmail || 'un créateur'}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={groupActionLoading === `decline:${g._id}`}
                                    onClick={() => handleDeclineSharedGroup(String(g._id))}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    {groupActionLoading === `decline:${g._id}` ? 'Patientez…' : 'Ignorer'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={groupActionLoading === `accept:${g._id}`}
                                    onClick={() => handleAcceptSharedGroup(String(g._id))}
                                    className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {groupActionLoading === `accept:${g._id}` ? 'Ajout…' : 'Accepter'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              </div>
            </div>
          </Portal>
        )}

        {manageGroupsOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
            style={{ zIndex: 2147483647, width: '100vw', height: '100vh', top: 0, left: 0 }}
          >
            {/* Fallback inline render in case the Portal fails */}
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-200 px-5 py-4 gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {manageGroupsMode === 'pending' ? 'Groupes partagés à examiner' : 'Groupes enregistrés'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {manageGroupsMode === 'pending'
                      ? 'Acceptez ou ignorez les groupes partagés. Les groupes acceptés seront ajoutés à votre palette.'
                      : 'Supprimez vos groupes et consultez les invitations partagées.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {manageGroupsMode === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => setManageGroupsMode('all')}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Mes groupes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setManageGroupsMode('pending')}
                      className="inline-flex items-center rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                    >
                      Invitations
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setManageGroupsOpen(false)}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                {manageGroupsMode === 'pending' ? (
                  <div>
                    {pendingSharedGroups.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                        Aucune invitation en attente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingSharedGroups.map((g: any) => (
                          <div key={g._id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-amber-900">{g.name || 'Groupe partagé'}</div>
                                <p className="text-xs text-amber-800">{g.description || 'Partagé sans description.'}</p>
                                <p className="text-[11px] text-amber-700 mt-1">Proposé par {g.ownerEmail || 'un créateur'}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `decline:${g._id}`}
                                  onClick={() => handleDeclineSharedGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  {groupActionLoading === `decline:${g._id}` ? 'Patientez…' : 'Ignorer'}
                                </button>
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `accept:${g._id}`}
                                  onClick={() => handleAcceptSharedGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {groupActionLoading === `accept:${g._id}` ? 'Ajout…' : 'Accepter'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Mes groupes</h3>
                      {groups.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          Aucun groupe pour le moment.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groups.map((g: any) => (
                            <div key={g._id} className="rounded-lg border border-gray-200 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    {g.name || 'Sans titre'}
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        g.public ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {g.public ? 'Public' : 'Privé'}
                                    </span>
                                    {g.sourceGroupId ? (
                                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                        Copie partagée
                                      </span>
                                    ) : null}
                                    {g.autoInclude ? (
                                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                        Auto include
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">{g.description || 'Aucune description'}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={groupActionLoading === `delete:${g._id}`}
                                  onClick={() => handleDeleteGroup(String(g._id))}
                                  className="inline-flex items-center rounded-md border border-red-500 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {groupActionLoading === `delete:${g._id}` ? 'Suppression…' : 'Supprimer'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Invitations partagées</h3>
                      {pendingSharedGroups.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          Aucune invitation en attente.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingSharedGroups.map((g: any) => (
                            <div key={g._id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-amber-900">{g.name || 'Groupe partagé'}</div>
                                  <p className="text-xs text-amber-800">{g.description || 'Partagé sans description.'}</p>
                                  <p className="text-[11px] text-amber-700 mt-1">Proposé par {g.ownerEmail || 'un créateur'}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={groupActionLoading === `decline:${g._id}`}
                                    onClick={() => handleDeclineSharedGroup(String(g._id))}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    {groupActionLoading === `decline:${g._id}` ? 'Patientez…' : 'Ignorer'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={groupActionLoading === `accept:${g._id}`}
                                    onClick={() => handleAcceptSharedGroup(String(g._id))}
                                    className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {groupActionLoading === `accept:${g._id}` ? 'Ajout…' : 'Accepter'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">How to use custom components</h2>
              <button onClick={() => setShowDocsModal(false)} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
            </div>
            {customComponents.length === 0 ? (
              <div className="text-sm text-gray-600">No custom components yet.</div>
            ) : (
              <div className="space-y-8">
                {customComponents.map((c: any) => (
                  <div key={c._id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      <div className="flex items-center gap-2">
                        {c.ai ? (
                          <span className="text-xs text-green-600 font-medium">AI</span>
                        ) : (
                          <span className="text-xs text-blue-600 font-medium">Manual</span>
                        )}
                        {c.public ? (
                          <span className="text-xs text-gray-500">Public</span>
                        ) : (
                          <span className="text-xs text-gray-500">Private</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{c?.docs?.summary || 'No summary available.'}</p>
                    {c?.docs?.fields && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Fields</div>
                        <ul className="list-disc pl-5 text-sm text-gray-700">
                          {Object.entries(c.docs.fields as any).map(([k, v]: any) => (
                            <li key={k}><span className="font-mono">{String(k)}</span>: {String(v)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Examples</div>
                      {Array.isArray(c?.docs?.examples) && c.docs.examples.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {c.docs.examples.map((ex: any, idx: number) => {
                            const html = renderCustomExampleHtml(c, ex?.props || {});
                            const json = JSON.stringify(ex?.props || {}, null, 2);
                            return (
                              <div key={idx} className="border border-gray-200 rounded p-3">
                                <div className="font-medium mb-1">{ex?.title || `Example ${idx+1}`}</div>
                                <div className="text-sm text-gray-600 mb-2">{ex?.description || ''}</div>
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">Preview</div>
                                  <div className="border rounded p-2">
                                    <div dangerouslySetInnerHTML={{ __html: html }} />
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">Props JSON</div>
                                  <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto max-h-40"><code>{json}</code></pre>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { try { navigator.clipboard.writeText(json); } catch {} }}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                  >
                                    Copy props
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">No examples provided.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
