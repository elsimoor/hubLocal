"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    ArrowLeft, Monitor, Tablet, Smartphone, Settings2, Plus, Download, Upload,
    Link2, Database, ChevronDown, Check, Pencil
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Sidebar from "./sidebar";
import Scene from "./scene";
import Inspector from "./inspector";
import components from "@/lib/lab/components";
import type {
    IComponentProps, IComponentPropertiesProps, JSONNode, Path
} from "@/lib/lab/types";

type Device = "desktop" | "tablet" | "mobile";

// Metadata associated with a single route. In addition to the usual title,
// description and keywords fields, we allow specifying a custom favicon.
// When provided, `favicon` should be a URL or data URI pointing to the
// desired icon. It is optional for backwards compatibility.
type RouteMeta = {
    title: string;
    description: string;
    keywords: string;
    favicon?: string;
};

type Bucket = {
    desktop: JSONNode[];
    tablet: JSONNode[];
    mobile: JSONNode[];
    meta: RouteMeta;
};

type SaveShape = Record<string, Bucket>;

const uid = () => "n_" + Math.random().toString(36).slice(2, 9);

const STYLE_DEFAULTS: Record<string, any> = {
    display: "block",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "stretch",
    flexWrap: "nowrap",
    gridTemplateColumns: "",
    gridTemplateRows: "",
    gap: 8, rowGap: 0, columnGap: 0,
    padding: 12, margin: 0,
    background: "",
    backgroundColor: "#ffffff", opacity: 1,
    borderWidth: 1, borderStyle: "solid", borderColor: "#e5e7eb", borderRadius: 6,
    overflow: "visible", position: "static",
    minHeight: 24,
};
const DEFAULT_UNITS: Record<string, string> = {
    gap: "pixels", rowGap: "pixels", columnGap: "pixels",
    padding: "pixels", margin: "pixels",
    borderWidth: "pixels", borderRadius: "pixels",
    width: "pixels", minWidth: "pixels", maxWidth: "pixels",
    height: "pixels", minHeight: "pixels", maxHeight: "pixels",
    top: "pixels", right: "pixels", bottom: "pixels", left: "pixels",
};
const styleDefaultsFromKeys = (keys: Set<string>) => {
    const out: Record<string, any> = {};
    for (const k of keys) {
        if (STYLE_DEFAULTS[k] !== undefined) out[k] = STYLE_DEFAULTS[k];
        if (DEFAULT_UNITS[k]) out[`${k}Unit`] = DEFAULT_UNITS[k];
    }
    return out;
};
const propsDefaults = (defs?: IComponentPropertiesProps[]) => {
    const out: Record<string, any> = {};
    if (!defs) return out;
    for (const d of defs) if (d.value !== undefined) out[d.name] = d.value;
    return out;
};
const styleKeysOf = (def?: IComponentProps | null) => {
    const arr = def?.style ? (Array.isArray(def.style) ? def.style : [def.style]) : [];
    return new Set((arr as any[]).map(x => (typeof x === "string" ? x : x?.name)).filter(Boolean));
};

const pathEq = (a: Path, b: Path) => a.length === b.length && a.every((v, i) => v === b[i]);
const pathStartsWith = (a: Path, prefix: Path) => prefix.every((v, i) => a[i] === v);
const getListAtPath = (tree: JSONNode[], parentPath: Path): JSONNode[] | null => {
    let list: JSONNode[] = tree;
    for (const idx of parentPath) {
        const parent = list[idx];
        if (!parent) return null;
        list = parent.children;
    }
    return list;
};
const insertAt = (tree: JSONNode[], parentPath: Path, index: number, node: JSONNode): JSONNode[] => {
    const cp = structuredClone(tree) as JSONNode[];
    const list = getListAtPath(cp, parentPath);
    if (!list) return tree;
    const i = Math.max(0, Math.min(index, list.length));
    list.splice(i, 0, node);
    return cp;
};
const removeAt = (tree: JSONNode[], path: Path): { tree: JSONNode[]; node: JSONNode | null } => {
    const cp = structuredClone(tree) as JSONNode[];
    if (!path.length) return { tree, node: null };
    const parentPath = path.slice(0, -1);
    const idx = path[path.length - 1];
    const list = getListAtPath(cp, parentPath);
    if (!list || !list[idx]) return { tree, node: null };
    const [node] = list.splice(idx, 1);
    return { tree: cp, node };
};
const isDroppingIntoOwnSubtree = (toParentPath: Path, fromPath: Path) =>
    toParentPath.length >= fromPath.length && pathStartsWith(toParentPath, fromPath);
const adjustTargetParentAfterRemoval = (toParentPath: Path, fromPath: Path): Path => {
    const parentOfFrom = fromPath.slice(0, -1);
    if (toParentPath.length === parentOfFrom.length && pathEq(toParentPath, parentOfFrom)) return toParentPath;
    if (toParentPath.length > parentOfFrom.length && pathStartsWith(toParentPath, parentOfFrom)) {
        const lvl = parentOfFrom.length;
        if (toParentPath[lvl] > fromPath[lvl]) {
            const adj = toParentPath.slice();
            adj[lvl] = adj[lvl] - 1;
            return adj;
        }
    }
    if (toParentPath.length === parentOfFrom.length) {
        const lvl = parentOfFrom.length - 1;
        if (lvl >= 0 && toParentPath[lvl] > parentOfFrom[lvl]) {
            const adj = toParentPath.slice();
            adj[lvl] = adj[lvl] - 1;
            return adj;
        }
    }
    return toParentPath;
};
const updateById = (arr: JSONNode[], id: string, up: (n: JSONNode) => JSONNode): JSONNode[] => {
    const walk = (xs: JSONNode[]): JSONNode[] =>
        xs.map((n) => ({ ...(n.id === id ? up(n) : n), children: walk(n.children) }));
    return walk(arr);
};

function findPathById(tree: JSONNode[], id: string): Path | null {
    const walk = (arr: JSONNode[], prefix: Path): Path | null => {
        for (let i = 0; i < arr.length; i++) {
            const n = arr[i];
            const p = [...prefix, i];
            if (n.id === id) return p;
            const c = walk(n.children, p);
            if (c) return c;
        }
        return null;
    };
    return walk(tree, []);
}
function getNodeAtPath(tree: JSONNode[], path: Path): JSONNode | null {
    let list: JSONNode[] = tree;
    for (let i = 0; i < path.length - 1; i++) {
        const idx = path[i];
        if (!list[idx]) return null;
        list = list[idx].children;
    }
    const leafIdx = path[path.length - 1];
    return leafIdx !== undefined ? (list[leafIdx] ?? null) : null;
}
function cloneNodeDeep(n: JSONNode): JSONNode {
    const rec = (x: JSONNode): JSONNode => ({
        ...structuredClone(x),
        id: uid(),
        children: x.children.map(rec),
    });
    return rec(n);
}

function useNormalize(createNode: (t: string) => JSONNode | null) {
    return useCallback((arr: JSONNode[]): JSONNode[] => {
        if (!arr || arr.length === 0) {
            const r = createNode("root");
            return r ? [r] : [];
        }
        const [first, ...rest] = arr;
        if (first.type !== "root") {
            const r = createNode("root");
            if (!r) return arr;
            r.children = [first, ...rest];
            return [r];
        }
        if (rest.length > 0) {
            return [{ ...first, children: [...first.children, ...rest] }];
        }
        return arr;
    }, [createNode]);
}

function DeviceSwitch({ device, setDevice }: { device: Device; setDevice: (d: Device) => void }) {
    const items = [
        { id: "mobile", Icon: Smartphone, label: "Mobile (390px)" },
        { id: "tablet", Icon: Tablet, label: "Tablet (820px)" },
        { id: "desktop", Icon: Monitor, label: "Desktop (1200px)" },
    ] as const;
    return (
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/60 border border-white/70 shadow-sm">
            {items.map(({ id, Icon, label }) => {
                const active = device === id;
                return (
                    <button
                        key={id}
                        title={label}
                        aria-label={label}
                        aria-pressed={active}
                        onClick={() => setDevice(id as Device)}
                        className={[
                            "h-9 w-9 grid place-items-center rounded-xl transition",
                            active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:bg-white/70",
                        ].join(" ")}
                    >
                        <Icon size={16} />
                    </button>
                );
            })}
        </div>
    );
}

function useOnClickOutside(ref: React.RefObject<HTMLElement>, cb: () => void) {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) cb();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, cb]);
}

function Modal({
    open, onClose, title, children, footer,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl border bg-white shadow-2xl">
                <div className="px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                </div>
                <div className="p-4 max-h-[70vh] overflow-auto">{children}</div>
                {footer && <div className="px-4 py-3 border-t bg-gray-50">{footer}</div>}
            </div>
        </div>
    );
}

function RouteForm({
    initial, submitLabel, onSubmit, onCancel, disablePath,
}: {
    initial: { title: string; description: string; keywords: string; path: string; favicon?: string };
    submitLabel: string;
    onSubmit: (v: { title: string; description: string; keywords: string; path: string; favicon?: string }) => void;
    onCancel: () => void;
    disablePath?: boolean;
}) {
    const [title, setTitle] = useState(initial.title);
    const [description, setDescription] = useState(initial.description);
    const [keywords, setKeywords] = useState(initial.keywords);
    const [path, setPath] = useState(initial.path);
    const [favicon, setFavicon] = useState(initial.favicon ?? "");
    const [err, setErr] = useState<string | null>(null);

    const normalizePath = (p: string) => {
        const t = (p || "").trim();
        if (!t) return "/";
        return t.startsWith("/") ? t : `/${t}`;
    };

    const onOk = () => {
        const p = normalizePath(path);
        if (!title.trim()) { setErr("Le titre est requis."); return; }
        if (!p.match(/^\/[a-zA-Z0-9\-/_]*$/)) { setErr("Path invalide (caractères autorisés: a-z, 0-9, -, _, /)."); return; }
        // Pass through the favicon to the parent submit handler. Empty string
        // means no custom favicon.
        onSubmit({ title: title.trim(), description, keywords, path: p, favicon });
    };

    return (
        <div className="space-y-3">
            {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

            <div>
                <label className="text-xs font-medium text-gray-700">Titre de la page</label>
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Accueil"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Résumé de la page…"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-700">Mots-clé</label>
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Ex: agence, design, site"
                />
            </div>

            {/* Favicon selector. Users can upload an image or enter a URL. When a file is selected
               it is converted to a data URI so it can be serialized into JSON. */}
            <div>
                <label className="text-xs font-medium text-gray-700">Favicon</label>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const result = ev.target?.result;
                                    if (typeof result === "string") setFavicon(result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="text-xs max-w-[50%]"
                    />
                    <input
                        type="text"
                        value={favicon}
                        onChange={(e) => setFavicon(e.target.value)}
                        placeholder="URL de l'icône"
                        className="flex-1 rounded-lg border px-2 py-1 text-sm"
                    />
                    {favicon && (
                        <img src={favicon} alt="aperçu favicon" className="h-6 w-6 rounded-sm border" />
                    )}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">Optionnel : l'icône s'affichera comme favicon sur la page publiée.</p>
            </div>
            <div>
                <label className="text-xs font-medium text-gray-700">Path (URL)</label>
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="/"
                    disabled={!!disablePath}
                />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                    Annuler
                </button>
                <button onClick={onOk} className="rounded-lg px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700">
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}

function RoutePicker({
    routes, current, setRoute, onCreateClick, maxRoutes, metaByRoute,
}: {
    routes: string[]; current: string; setRoute: (p: string) => void;
    onCreateClick: () => void; maxRoutes: number;
    metaByRoute: Record<string, RouteMeta>;
}) {
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(boxRef as any, () => setOpen(false));

    const count = routes.length;
    const disabled = count >= maxRoutes;

    return (
        <div ref={boxRef} className="relative z-50">
            <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2 text-sm hover:bg-white"
                title="Changer de page"
            >
                <Link2 size={14} className="text-gray-500" />
                <span className="font-medium truncate max-w-[160px]">{current}</span>
                <ChevronDown size={14} className="text-gray-500" />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1 w-80 rounded-xl border bg-white shadow-lg ring-1 ring-black/5">
                    <div className="max-h-64 overflow-auto py-1">
                        {routes.map((r) => {
                            const active = r === current;
                            const meta = metaByRoute[r];
                            return (
                                <button
                                    key={r}
                                    onClick={() => { setRoute(r); setOpen(false); }}
                                    className={[
                                        "w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between",
                                        active ? "bg-blue-50/70 text-blue-800" : "hover:bg-gray-50",
                                    ].join(" ")}
                                    title={meta?.title || r}
                                >
                                    <div className="min-w-0">
                                        <div className="truncate">{meta?.title || r}</div>
                                        <div className="text-[11px] text-gray-500 truncate">{r}</div>
                                    </div>
                                    {active && <Check size={14} className="shrink-0" />}
                                </button>
                            );
                        })}
                        {routes.length === 0 && (
                            <div className="px-3 py-4 text-sm text-gray-500">Aucune page.</div>
                        )}
                    </div>

                    <div className="border-t px-2 pt-2 pb-2 bg-white sticky bottom-0">
                        <div className="px-1 pb-1 text-[11px] text-gray-500">
                            {count}/{maxRoutes} pages
                        </div>
                        <button
                            disabled={disabled}
                            onClick={() => { setOpen(false); onCreateClick(); }}
                            className={[
                                "w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm",
                                disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                            ].join(" ")}
                        >
                            <Plus size={14} /> Nouvelle page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===================== ÉDITEUR ===================== */
export default function Editor({ hubId, initialSave, initialTitle }: { hubId?: string; initialSave?: SaveShape; initialTitle?: string }) {
    const [device, setDevice] = useState<Device>("mobile");
    const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

    // Determine the maximum number of pages based on the user's subscription. Free
    // users are limited to 1 page, while PRO users can create more (e.g. 10). We
    // update the limit when the session changes.
    const { data: session } = useSession();
    const [routeLimit, setRouteLimit] = useState<number>(() => {
        const isPro = (session as any)?.user?.isPro;
        return isPro ? 10 : 1;
    });
    useEffect(() => {
        const isPro = (session as any)?.user?.isPro;
        setRouteLimit(isPro ? 10 : 1);
    }, [session]);

    const registry = useMemo(() => {
        const list = Array.isArray(components) ? components : [components];
        const m = new Map<string, IComponentProps>();
        for (const c of list) m.set(c.id, c);
        return m;
    }, []);

    const createNode = useCallback(
        (componentType: string): JSONNode | null => {
            const def = registry.get(componentType);
            if (!def) return null;
            const styleKeys = styleKeysOf(def);
            return {
                id: uid(),
                type: def.id,
                name: def.name,
                resize: !!def.resize,
                container: !!def.container,
                props: propsDefaults(Array.isArray(def.props) ? def.props : def.props ? [def.props] : []),
                style: styleDefaultsFromKeys(styleKeys),
                children: [],
            };
        },
        [registry]
    );

    const normalizeTopLevel = useNormalize(createNode);

    const createRouteBucket = useCallback((): Bucket => {
        const root = createNode("root");
        return {
            desktop: root ? [root] : [],
            tablet: root ? [cloneNodeDeep(root)] : [],
            mobile: root ? [cloneNodeDeep(root)] : [],
            // include favicon in the meta with empty string by default so the
            // editor can later assign a custom value. This preserves backward
            // compatibility for old save files where favicon is undefined.
            meta: { title: "Nouvelle page", description: "", keywords: "", favicon: "" },
        };
    }, [createNode]);

    const [route, setRoute] = useState<string>("/");
    const [save, setSave] = useState<SaveShape>(() => ({
        "/": { ...createRouteBucket(), meta: { title: "Accueil", description: "", keywords: "", favicon: "" } },
    }));
    const routes = useMemo(() => Object.keys(save), [save]);

    const [nodes, _setNodes] = useState<JSONNode[]>(save[route]?.[device] ?? []);

    // Hydrate from initialSave (server data)
    useEffect(() => {
        if (initialSave && Object.keys(initialSave).length > 0) {
            // restoreFromSchema is defined below
            const restored = restoreFromSchema(initialSave as any);
            setSave(restored);
            // Ensure current route exists
            if (!restored[route]) setRoute("/");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!save[route]) {
            setSave(prev => ({ ...prev, [route]: createRouteBucket() }));
        }
    }, [route, save, createRouteBucket]);

    useEffect(() => {
        const bucket = save[route];
        if (!bucket) return;
        _setNodes(normalizeTopLevel(bucket[device]));
    }, [route, device, save, normalizeTopLevel]);

    const syncNodesIntoSave = (ns: JSONNode[]) => {
        setSave(prev => ({
            ...prev,
            [route]: { ...(prev[route] ?? createRouteBucket()), [device]: ns },
        }));
    };

    // Debounced autosave to API
    const saveTimerRef = useRef<number | null>(null);
    const hydratedRef = useRef<boolean>(false);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    useEffect(() => {
        // Skip the very first run after hydration to avoid double-writing
        if (!hydratedRef.current) { hydratedRef.current = true; return; }
        if (!hubId) return;
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(async () => {
            try {
                setSaveState("saving");
                const res = await fetch(`/api/hubs/${hubId}`,
                    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: save }) });
                if (!res.ok) throw new Error("save_failed");
                setSaveState("saved");
                // brief success indicator
                window.setTimeout(() => setSaveState("idle"), 900);
            } catch {
                setSaveState("error");
            }
        }, 600);
        return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
    }, [save, hubId]);

    const SavingBadge = () => {
        const base = "inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs";
        if (saveState === "saving") return <span className={`${base} border-blue-200 bg-blue-50 text-blue-700`}>Sauvegarde…</span>;
        if (saveState === "saved") return <span className={`${base} border-green-200 bg-green-50 text-green-700`}>Enregistré</span>;
        if (saveState === "error") return <span className={`${base} border-red-200 bg-red-50 text-red-700`}>Erreur</span>;
        return null;
    };

    const historyRef = useRef<JSONNode[][]>([]);
    const futureRef = useRef<JSONNode[][]>([]);
    const setNodes = (next: JSONNode[] | ((p: JSONNode[]) => JSONNode[]), pushHistory = true) => {
        _setNodes(prev => {
            const val = typeof next === "function" ? (next as any)(prev) : next;
            const normalized = normalizeTopLevel(val);
            if (pushHistory) {
                historyRef.current.push(prev);
                futureRef.current = [];
            }
            syncNodesIntoSave(normalized);
            return normalized;
        });
    };
    const undo = () => {
        const prev = historyRef.current.pop();
        if (!prev) return;
        futureRef.current.push(nodes);
        const normalized = normalizeTopLevel(prev);
        _setNodes(normalized);
        syncNodesIntoSave(normalized);
    };
    const redo = () => {
        const nxt = futureRef.current.pop();
        if (!nxt) return;
        historyRef.current.push(nodes);
        const normalized = normalizeTopLevel(nxt);
        _setNodes(normalized);
        syncNodesIntoSave(normalized);
    };

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedPath = useMemo(() => (selectedId ? findPathById(nodes, selectedId) : null), [nodes, selectedId]);
    const selectedNode = useMemo(() => (selectedPath ? getNodeAtPath(nodes, selectedPath) : null), [nodes, selectedPath]);
    const selectedDef = useMemo(
        () => (selectedNode ? registry.get(selectedNode.type) || null : null),
        [registry, selectedNode]
    );

    const addFromComponentIdAt = useCallback(
        (componentType: string, parentPath: Path, index: number) => {
            const n = createNode(componentType);
            if (!n) return;
            setNodes(prev => insertAt(prev, parentPath, index, n));
            setSelectedId(n.id);
        },
        [createNode]
    );
    const moveNodePath = useCallback((fromPath: Path, toParentPath: Path, toIndex: number) => {
        setNodes(prev => {
            if (isDroppingIntoOwnSubtree(toParentPath, fromPath)) return prev;
            const { tree: t1, node } = removeAt(prev, fromPath);
            if (!node) return prev;
            let targetParent = adjustTargetParentAfterRemoval(toParentPath, fromPath);
            const sameParent = pathEq(targetParent, fromPath.slice(0, -1));
            let idx = toIndex;
            if (sameParent && idx > fromPath[fromPath.length - 1]) idx -= 1;
            const list = getListAtPath(t1, targetParent);
            if (!list) return prev;
            idx = Math.max(0, Math.min(idx, list.length));
            return insertAt(t1, targetParent, idx, node);
        });
    }, []);
    const updateNodeStyle = useCallback((id: string, patch: Record<string, any>) => {
        setNodes(prev => updateById(prev, id, (n) => ({ ...n, style: { ...n.style, ...patch } })));
    }, []);
    const updateNodeProps = useCallback((id: string, patch: Record<string, any>) => {
        setNodes(prev => updateById(prev, id, (n) => ({ ...n, props: { ...n.props, ...patch } })));
    }, []);

    const clipboardRef = useRef<JSONNode | null>(null);
    const deleteSelected = useCallback(() => {
        if (!selectedPath) return;
        if (selectedPath.length === 1 && selectedPath[0] === 0) return;
        setNodes(prev => removeAt(prev, selectedPath).tree);
        setSelectedId(null);
    }, [selectedPath]);
    const copySelected = useCallback(() => {
        if (!selectedPath) return;
        const list = getListAtPath(nodes, selectedPath.slice(0, -1));
        const idx = selectedPath[selectedPath.length - 1]!;
        if (!list || !list[idx]) return;
        clipboardRef.current = structuredClone(list[idx]);
    }, [nodes, selectedPath]);
    const cutSelected = useCallback(() => {
        if (!selectedPath) return;
        if (selectedPath.length === 1 && selectedPath[0] === 0) return;
        const list = getListAtPath(nodes, selectedPath.slice(0, - 1));
        const idx = selectedPath[selectedPath.length - 1]!;
        if (!list || !list[idx]) return;
        clipboardRef.current = structuredClone(list[idx]);
        deleteSelected();
    }, [nodes, selectedPath, deleteSelected]);
    const paste = useCallback(() => {
        const src = clipboardRef.current;
        if (!src) return;
        const newNode = cloneNodeDeep(src);
        let parentPath: Path = [];
        let index = nodes.length;
        if (selectedPath) {
            const listIn = getListAtPath(nodes, selectedPath);
            if (listIn) { parentPath = selectedPath; index = listIn.length; }
            else {
                parentPath = selectedPath.slice(0, -1);
                const list2 = getListAtPath(nodes, parentPath) || [];
                index = (selectedPath[selectedPath.length - 1] ?? -1) + 1;
                index = Math.max(0, Math.min(index, list2.length));
            }
        }
        setNodes(prev => insertAt(prev, parentPath, index, newNode));
        setSelectedId(newNode.id);
    }, [nodes, selectedPath]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const meta = e.ctrlKey || e.metaKey;
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            const isForm = tag === "input" || tag === "textarea" || tag === "select" || (e.target as HTMLElement)?.isContentEditable;
            if (meta && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
            if ((meta && e.shiftKey && e.key.toLowerCase() === "z") || (meta && e.key.toLowerCase() === "y")) { e.preventDefault(); redo(); return; }
            if (!isForm && meta && e.key.toLowerCase() === "c") { e.preventDefault(); copySelected(); return; }
            if (!isForm && meta && e.key.toLowerCase() === "x") { e.preventDefault(); cutSelected(); return; }
            if (!isForm && meta && e.key.toLowerCase() === "v") { e.preventDefault(); paste(); return; }
            if (!isForm && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); deleteSelected(); return; }
        };
        window.addEventListener("keydown", onKey, { capture: true });
        return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
    }, [copySelected, cutSelected, paste, deleteSelected]);

    const [exportPretty, setExportPretty] = useState<"pretty" | "draft">("pretty");
    const exportJSON = () => {
        const text = JSON.stringify(save, null, exportPretty === "pretty" ? 2 : 0);
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "lab-save.json"; a.click();
        URL.revokeObjectURL(url);
    };
    const importJSON = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result || "{}"));
                const restored = restoreFromSchema(data);
                setSave(restored);
                const bucket = restored[route] ?? createRouteBucket();
                _setNodes(normalizeTopLevel(bucket[device]));
            } catch { /* ignore */ }
        };
        reader.readAsText(file);
    };
    const restoreFromSchema = (obj: any): SaveShape => {
        const out: SaveShape = {};
        for (const k of Object.keys(obj || {})) {
            const bucket = obj[k] || {};
            const meta: RouteMeta = {
                title: bucket.meta?.title ?? "Sans titre",
                description: bucket.meta?.description ?? "",
                keywords: bucket.meta?.keywords ?? "",
                // Preserve custom favicon if present, otherwise default to empty string
                favicon: bucket.meta?.favicon ?? "",
            };
            out[k] = {
                desktop: Array.isArray(bucket.desktop) ? bucket.desktop : [],
                tablet: Array.isArray(bucket.tablet) ? bucket.tablet : [],
                mobile: Array.isArray(bucket.mobile) ? bucket.mobile : [],
                meta,
            };
        }
        if (!out["/"]) out["/"] = { ...createRouteBucket(), meta: { title: "Accueil", description: "", keywords: "", favicon: "" } };
        return out;
    };

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const handleCreateSubmit = (vals: { title: string; description: string; keywords: string; path: string; favicon?: string }) => {
        if (routes.length >= routeLimit) {
            alert(`Limite atteinte (${routes.length}/${routeLimit}).`);
            return;
        }
        if (save[vals.path]) {
            alert("Ce path existe déjà.");
            return;
        }
        const bucket = createRouteBucket();
        bucket.meta = {
            title: vals.title,
            description: vals.description,
            keywords: vals.keywords,
            // Preserve favicon if provided, otherwise default to empty string
            favicon: vals.favicon ?? "",
        };
        setSave(prev => ({ ...prev, [vals.path]: bucket }));
        setRoute(vals.path);
        setCreateOpen(false);
    };

    const handleEditSubmit = (vals: { title: string; description: string; keywords: string; path: string; favicon?: string }) => {
        const oldPath = route;
        const newPath = vals.path;
        setSave(prev => {
            const oldBucket = prev[oldPath] ?? createRouteBucket();
            const updated: Bucket = {
                ...oldBucket,
                meta: {
                    ...oldBucket.meta,
                    title: vals.title,
                    description: vals.description,
                    keywords: vals.keywords,
                    favicon: vals.favicon ?? oldBucket.meta.favicon ?? "",
                },
            };
            if (newPath === oldPath) {
                return { ...prev, [oldPath]: updated };
            }
            if (prev[newPath]) {
                alert("Ce nouveau path existe déjà.");
                return prev;
            }
            const { [oldPath]: _, ...rest } = prev;
            return { ...rest, [newPath]: updated };
        });
        setRoute(newPath);
        setEditOpen(false);
    };

    const effectiveNode = selectedId ? selectedNode : nodes[0] ?? null;
    const effectiveDef = effectiveNode ? registry.get(effectiveNode.type) || null : null;

    const currentMeta = save[route]?.meta ?? { title: "", description: "", keywords: "", favicon: "" };

    return (
        <main className="h-[100dvh] w-[100dvw] bg-[radial-gradient(1200px_500px_at_30%_-10%,rgba(99,102,241,0.12),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(16,185,129,0.10),transparent)]">
            <div className="h-full w-full flex flex-col">
                <header className="relative z-20 h-16 px-4 lg:px-6 flex items-center justify-between border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/45">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/70 active:scale-[.99] transition border border-white/60">
                        <ArrowLeft size={18} /> Retour
                    </button>

                    <div className="flex items-center gap-2">
                        <RoutePicker
                            routes={routes}
                            current={route}
                            setRoute={setRoute}
                            onCreateClick={() => setCreateOpen(true)}
                            maxRoutes={routeLimit}
                            metaByRoute={Object.fromEntries(Object.entries(save).map(([p, b]) => [p, b.meta]))}
                        />
                        <button
                            onClick={() => setEditOpen(true)}
                            className="rounded-lg border px-2 py-2 text-xs bg-white hover:bg-gray-50 inline-flex items-center gap-1"
                            title="Modifier la page"
                        >
                            <Pencil size={12} /> Modifier
                        </button>
                        <DeviceSwitch device={device} setDevice={setDevice} />
                    </div>

                    <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-2xl border bg-white/70 px-2 py-1.5">
                            <Database size={14} className="text-gray-500" />
                            <select
                                value={exportPretty}
                                onChange={(e) => setExportPretty(e.target.value as any)}
                                className="rounded-xl border px-2 py-1 text-xs bg-white"
                                title="Format d’export"
                            >
                                <option value="pretty">Lisible</option>
                                <option value="draft">draft</option>
                            </select>
                            <button onClick={exportJSON} className="rounded-lg border px-2 py-1 text-xs bg-white hover:bg-gray-50 inline-flex items-center gap-1">
                                <Download size={12} /> Exporter
                            </button>
                            <label className="rounded-lg border px-2 py-1 text-xs bg-white hover:bg-gray-50 inline-flex items-center gap-1 cursor-pointer">
                                <Upload size={12} /> Importer
                                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
                            </label>
                        </div>
                        {hubId && <SavingBadge />}
                    </div>
                </header>

                <section className="max-h-[calc(100dvh-4rem)] flex-1 p-3 md:p-4">
                    <PanelGroup direction="horizontal" className="h-full items-stretch">
                        <Panel defaultSize={22} minSize={16} maxSize={30}>
                            <div className="h-full rounded-3xl border border-white/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
                                <Sidebar />
                            </div>
                        </Panel>

                        <PanelResizeHandle className="relative mx-2 w-3 flex items-center justify-center cursor-col-resize group">
                            <div className="h-[72%] w-[2px] rounded-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 group-hover:from-blue-300 group-hover:via-blue-400 group-hover:to-blue-300 transition" />
                        </PanelResizeHandle>

                        <Panel defaultSize={57} minSize={34}>
                            <div className="relative h-full rounded-3xl border border-white/70 bg-white/60 backdrop-blur shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                                <Scene
                                    device={device}
                                    nodes={nodes}
                                    registry={registry}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    onDropNewAt={addFromComponentIdAt}
                                    onMoveNode={moveNodePath}
                                    onResize={(id, patch) => updateNodeStyle(id, patch)}
                                />

                                {inspectorCollapsed && (
                                    <button
                                        onClick={() => setInspectorCollapsed(false)}
                                        className="absolute top-3 right-3 z-20 rounded-2xl border border-white/70 bg-white/80 hover:bg-white text-gray-800 shadow px-3 py-2 text-xs font-medium inline-flex items-center gap-2"
                                        title="Ouvrir l’inspecteur"
                                    >
                                        <Settings2 size={14} />
                                        Inspecteur
                                    </button>
                                )}
                            </div>
                        </Panel>

                        <PanelResizeHandle className="relative mx-2 w-3 flex items-center justify-center cursor-col-resize group">
                            <div className="h-[72%] w-[2px] rounded-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 group-hover:from-blue-300 group-hover:via-blue-400 group-hover:to-blue-300 transition" />
                        </PanelResizeHandle>

                        {!inspectorCollapsed && (
                            <Panel defaultSize={25} minSize={20} maxSize={36}>
                                <div className="h-full rounded-3xl border border-white/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
                                    <Inspector
                                        collapsed={inspectorCollapsed}
                                        onToggle={() => setInspectorCollapsed((v) => !v)}
                                        node={selectedId ? selectedNode : nodes[0] ?? null}
                                        def={selectedId ? selectedDef : (nodes[0] ? registry.get(nodes[0].type) || null : null)}
                                        onChangeStyle={(patch) => (selectedId ? updateNodeStyle(selectedId, patch) : nodes[0] && updateNodeStyle(nodes[0].id, patch))}
                                        onChangeProps={(patch) => (selectedId ? updateNodeProps(selectedId, patch) : nodes[0] && updateNodeProps(nodes[0].id, patch))}
                                    />
                                </div>
                            </Panel>
                        )}
                    </PanelGroup>
                </section>
            </div>

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Créer une page"
                footer={null}
            >
                <RouteForm
                    initial={{ title: "", description: "", keywords: "", path: "/", favicon: "" }}
                    submitLabel="Créer la page"
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setCreateOpen(false)}
                />
            </Modal>

            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Modifier la page"
                footer={null}
            >
                <RouteForm
                    initial={{ title: currentMeta.title, description: currentMeta.description, keywords: currentMeta.keywords, path: route, favicon: currentMeta.favicon ?? "" }}
                    submitLabel="Enregistrer"
                    onSubmit={handleEditSubmit}
                    onCancel={() => setEditOpen(false)}
                />
            </Modal>
        </main>
    );
}
