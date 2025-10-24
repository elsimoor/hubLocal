"use client";
import { useMemo, useState, useRef, Fragment } from "react";
import type { CSSProperties } from "react";
import { rendererMap } from "@/lib/lab/renderers";
import type {
    IComponentProps,
    IComponentsStyleProps,
    ICondition,
    JSONNode,
    Path,
} from "@/lib/lab/types";

/* ---------- Props ---------- */
type SceneProps = {
    device: "desktop" | "tablet" | "mobile";
    nodes: JSONNode[];
    registry: Map<string, IComponentProps>;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onDropNewAt: (componentType: string, parentPath: Path, index: number) => void;
    onMoveNode: (fromPath: Path, toParentPath: Path, index: number) => void;
    onResize: (id: string, patch: Record<string, any>) => void;
    zoom?: number;
};

/* ---------- DnD payloads/MIME ---------- */
type DragPayloadNode = { kind: "node"; fromPath: Path };
type DragPayloadComp = { kind: "component"; id: string };
const MIME_NODE = "application/x-lab-node";
const MIME_COMP = "application/x-lab-component";

/* ---------- Conditions helpers (style) ---------- */
function valueExists(v: any) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
}
function matchOne(cond: ICondition, values: Record<string, any>): boolean {
    const val = values?.[cond.name];
    if (cond.exists !== undefined) return cond.exists ? valueExists(val) : !valueExists(val);
    if (cond.equal) return cond.equal.some((x) => x === val);
    if (cond.notEqual) return !cond.notEqual.some((x) => x === val);
    return true;
}
function matchAll(conds: ICondition[] | undefined, values: Record<string, any>): boolean {
    if (!conds || !conds.length) return true;
    return conds.every((c) => matchOne(c, values));
}
function isConditionallyVisible(def: IComponentsStyleProps, values: Record<string, any>): boolean {
    if (def.displayIf && !matchAll(def.displayIf, values)) return false;
    if (def.hiddenIf && matchAll(def.hiddenIf, values)) return false;
    return true;
}

/* ---------- Style helper ---------- */
function computeStyle(defs?: IComponentsStyleProps[], values: Record<string, any> = {}): CSSProperties {
    const css: Record<string, any> = {};
    const walk = (arr?: IComponentsStyleProps[]) => {
        if (!arr) return;
        for (const d of arr) {
            if (d.type === "group" && d.children) {
                walk(d.children);
                continue;
            }
            if (!isConditionallyVisible(d, values)) continue;

            const v = values[d.name] !== undefined ? values[d.name] : d.value;
            if (v === undefined) continue;

            if (d.type === "number") {
                const unit = (values?.[`${d.name}Unit`] ?? d.selectValue ?? "pixels") as string;
                css[d.name] = typeof v === "number" ? `${v}${unit === "pixels" ? "px" : unit}` : v;
            } else {
                css[d.name] = v;
            }
        }
    };
    walk(defs);

    if ((css as any).borderWidth || (css as any).borderStyle || (css as any).borderColor) {
        (css as any).border = `${css.borderWidth ?? 0} ${css.borderStyle ?? "solid"} ${css.borderColor ?? "transparent"}`;
    }
    return css as CSSProperties;
}

/* ---------- DropZone (barres auxiliaires, élargies) ---------- */
type DZProps = {
    parentPath: Path;
    index: number;
    kind: "between" | "inside";
    orientation: "horizontal" | "vertical";
    onDropNewAt: SceneProps["onDropNewAt"];
    onMoveNode: SceneProps["onMoveNode"];
};

function DropZone({ parentPath, index, kind, orientation, onDropNewAt, onMoveNode }: DZProps) {
    const [over, setOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);

        // Prefer our custom MIME, but fall back to text/plain for browsers that
        // strip custom types during drag across nested elements.
        const nodeRaw = e.dataTransfer.getData(MIME_NODE) || e.dataTransfer.getData("text/plain");
        if (nodeRaw) {
            try {
                const p = JSON.parse(nodeRaw) as DragPayloadNode;
                if (p.kind === "node") return onMoveNode(p.fromPath, parentPath, index);
            } catch {}
        }
        const compRaw = e.dataTransfer.getData(MIME_COMP) || e.dataTransfer.getData("text/plain");
        if (compRaw) {
            try {
                const p = JSON.parse(compRaw) as DragPayloadComp;
                if (p.kind === "component") return onDropNewAt(p.id, parentPath, index);
            } catch {}
        }
    };

    if (orientation === "horizontal") {
        return (
            <div className="relative h-0">
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOver(true);
                        const types = Array.from(e.dataTransfer?.types ?? []);
                        e.dataTransfer.dropEffect = types.includes(MIME_NODE) ? "move" : "copy";
                    }}
                    onDragLeave={(e) => {
                        e.stopPropagation();
                        setOver(false);
                    }}
                    onDrop={handleDrop}
                    className={[
                        "absolute left-0 right-0",
                        kind === "between" ? "-top-2 h-5" : "-top-3 h-8",
                        over ? "bg-blue-500/12" : "bg-transparent",
                    ].join(" ")}
                    style={{ pointerEvents: "auto" }}
                    title="Déposer ici"
                >
                    <div
                        className={[
                            "mx-1 rounded",
                            over ? "h-[3px] bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,.15)]" : "h-px bg-transparent",
                        ].join(" ")}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOver(true);
                    const types = Array.from(e.dataTransfer?.types ?? []);
                    e.dataTransfer.dropEffect = types.includes(MIME_NODE) ? "move" : "copy";
                }}
                onDragLeave={(e) => {
                    e.stopPropagation();
                    setOver(false);
                }}
                onDrop={handleDrop}
                className="absolute inset-y-1 -left-2 w-6"
                style={{ pointerEvents: "auto", cursor: "col-resize" }}
                title="Déposer ici"
            >
                <div
                    className={[
                        "mx-auto rounded",
                        over ? "w-[3px] h-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,.15)]" : "w-px h-full bg-transparent",
                    ].join(" ")}
                />
            </div>
        </div>
    );
}

/* ---------- Root list ---------- */
function RootList({
    items,
    renderItem,
    onDropNewAt,
    onMoveNode,
    fullHeight = false,
}: {
    items: JSONNode[];
    renderItem: (node: JSONNode, index: number, path: Path) => React.ReactNode;
    onDropNewAt: (compType: string, parentPath: Path, index: number) => void;
    onMoveNode: (fromPath: Path, toParentPath: Path, index: number) => void;
    fullHeight?: boolean;
}) {
    const firstIsRoot = items[0]?.type === "root";
    return (
        <div className={[fullHeight ? "h-full" : "", "w-full"].join(" ")}>
            {!firstIsRoot && (
                <DropZone
                    parentPath={[]}
                    index={0}
                    kind="between"
                    orientation="horizontal"
                    onDropNewAt={onDropNewAt}
                    onMoveNode={onMoveNode}
                />
            )}
            {items.map((n, i) => (
                <div key={n.id} className="w-full h-full">
                    {renderItem(n, i, [i])}
                    <DropZone
                        parentPath={[]}
                        index={i + 1}
                        kind="between"
                        orientation="horizontal"
                        onDropNewAt={onDropNewAt}
                        onMoveNode={onMoveNode}
                    />
                </div>
            ))}
        </div>
    );
}

/* ---------- Scene ---------- */
export default function Scene({
    device,
    nodes,
    registry,
    selectedId,
    onSelect,
    onDropNewAt,
    onMoveNode,
    zoom = 1,
}: SceneProps) {
    const width = useMemo(() => (device === "mobile" ? 390 : device === "tablet" ? 820 : 1200), [device]);
    const rootMode = nodes[0]?.type === "root";

    const handleSceneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // This is a fallback for dropping on the scene background
        const compRaw = e.dataTransfer.getData(MIME_COMP) || e.dataTransfer.getData("text/plain");
        if (compRaw) {
            try {
                const p = JSON.parse(compRaw) as DragPayloadComp;
                if (p.kind === "component") {
                    // Add to the root, at the end
                    onDropNewAt(p.id, [], nodes.length);
                }
            } catch {}
        }
    };

    const handleSceneDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
    };

    return (
        <div
            className="h-full w-full flex items-stretch justify-center bg-[linear-gradient(transparent_23px,rgba(0,0,0,.04)_24px),linear-gradient(90deg,transparent_23px,rgba(0,0,0,.04)_24px)] bg-[length:24px_24px]"
            onDrop={handleSceneDrop}
            onDragOver={handleSceneDragOver}
        >
            <div
                className="relative bg-white rounded-2xl shadow-lg overflow-auto"
                style={{ width, height: "100%", transform: `scale(${zoom})`, transformOrigin: "top center" }}
                onClick={() => onSelect(null)}
            >
                <div className="p-5 h-full">
                    <RootList
                        items={nodes}
                        onDropNewAt={onDropNewAt}
                        onMoveNode={onMoveNode}
                        /* Force the root list to take the full available height. This improves
                           the drop target when dragging new components into an empty scene */
                        fullHeight={true}
                        renderItem={(node, _i, path) => (
                            <NodeItem
                                key={node.id}
                                node={node}
                                path={path}
                                registry={registry}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                onResize={() => { }}
                                onDropNewAt={onDropNewAt}
                                onMoveNode={onMoveNode}
                            />
                        )}
                    />
                    {!nodes.length && (
                        <div className="h-full w-full grid place-items-center text-sm text-gray-500">
                            Glisse un élément depuis la sidebar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Node ---------- */
function NodeItem({
    node,
    path,
    registry,
    selectedId,
    onSelect,
    onResize,
    onDropNewAt,
    onMoveNode,
    parentId,
}: {
    node: JSONNode;
    path: Path;
    registry: Map<string, IComponentProps>;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onResize: (id: string, patch: Record<string, any>) => void;
    onDropNewAt: (compType: string, parentPath: Path, index: number) => void;
    onMoveNode: (fromPath: Path, toParentPath: Path, index: number) => void;
    parentId?: string;
}) {
    const def = registry.get(node.type);
    useMemo(() => def, [def]);

    const Renderer =
        (rendererMap.get(node.type) as any) ||
        ((p: any) => (
            <div {...p.rootProps} style={p.style}>
                {p.children}
            </div>
        ));
    const isSelected = selectedId === node.id;

    const isFlex = node.style?.display === "flex";
    const dir = isFlex ? (node.style?.flexDirection || "row") : "column";
    const dzOrientation: "horizontal" | "vertical" =
        isFlex && dir === "row" ? "vertical" : "horizontal";

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [overContainer, setOverContainer] = useState(false);

    const [ghost, setGhost] = useState<{
        index: number;
        x: number;
        y: number;
        w: number;
        h: number;
        empty: boolean;
    } | null>(null);

    const computeIndexFromPointer = (e: React.DragEvent) => {
        if (!containerRef.current)
            return { index: node.children.length, x: 0, y: 0, w: 0, h: 0, empty: true };
        const host = containerRef.current;
        const hostRect = host.getBoundingClientRect();

        const els = Array.from(
            host.querySelectorAll<HTMLElement>(":scope > [data-node-id]")
        );
        const rects = els.map((el) => el.getBoundingClientRect());

        if (!rects.length) {
            const inset = 4;
            return {
                index: 0,
                x: inset,
                y: inset,
                w: Math.max(0, hostRect.width - inset * 2),
                h: Math.max(0, hostRect.height - inset * 2),
                empty: true,
            };
        }

        if (dzOrientation === "horizontal") {
            const y = e.clientY - hostRect.top;
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                const mid = r.top - hostRect.top + r.height / 2;
                if (y < mid) {
                    return {
                        index: i,
                        x: r.left - hostRect.left,
                        y: r.top - hostRect.top,
                        w: r.width,
                        h: r.height,
                        empty: false,
                    };
                }
            }
            const last = rects[rects.length - 1];
            return {
                index: rects.length,
                x: last.left - hostRect.left,
                y: last.top - hostRect.top,
                w: last.width,
                h: last.height,
                empty: false,
            };
        } else {
            const x = e.clientX - hostRect.left;
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                const mid = r.left - hostRect.left + r.width / 2;
                if (x < mid) {
                    return {
                        index: i,
                        x: r.left - hostRect.left,
                        y: r.top - hostRect.top,
                        w: r.width,
                        h: r.height,
                        empty: false,
                    };
                }
            }
            const last = rects[rects.length - 1];
            return {
                index: rects.length,
                x: last.left - hostRect.left,
                y: last.top - hostRect.top,
                w: last.width,
                h: last.height,
                empty: false,
            };
        }
    };

    const onContainerDragOver = (e: React.DragEvent) => {
        if (!node.container) return;
        e.preventDefault();
        e.stopPropagation();
        setOverContainer(true);
        const g = computeIndexFromPointer(e);
        setGhost(g);
        e.dataTransfer.dropEffect = Array.from(e.dataTransfer.types).includes(MIME_NODE)
            ? "move"
            : "copy";
    };
    const onContainerDragLeave = (e: React.DragEvent) => {
        if (!node.container) return;
        e.stopPropagation();
        setOverContainer(false);
        setGhost(null);
    };
    const onContainerDrop = (e: React.DragEvent) => {
        if (!node.container) return;
        e.preventDefault();
        e.stopPropagation();
        const idx = ghost?.index ?? node.children.length;

        // Prefer custom MIME but support text/plain fallback
        const nodeRaw = e.dataTransfer.getData(MIME_NODE) || e.dataTransfer.getData("text/plain");
        if (nodeRaw) {
            try {
                const p = JSON.parse(nodeRaw) as DragPayloadNode;
                if (p.kind === "node") onMoveNode(p.fromPath, path, idx);
            } catch {}
        }
        const compRaw = e.dataTransfer.getData(MIME_COMP) || e.dataTransfer.getData("text/plain");
        if (compRaw) {
            try {
                const p = JSON.parse(compRaw) as DragPayloadComp;
                if (p.kind === "component") onDropNewAt(p.id, path, idx);
            } catch {}
        }

        setOverContainer(false);
        setGhost(null);
    };

    return (
        <Renderer
            node={node}
            rootProps={{
                ref: containerRef as any,
                "data-node-id": node.id,
                "data-selected": isSelected,
                draggable: node.type !== "root",
                onDragStart: (e: React.DragEvent) => {
                    e.stopPropagation();
                    const payload: DragPayloadNode = { kind: "node", fromPath: path };
                    const raw = JSON.stringify(payload);
                    e.dataTransfer.setData(MIME_NODE, raw);
                    // Provide a fallback so drop handlers can parse even if custom MIME is lost
                    e.dataTransfer.setData("text/plain", raw);
                    e.dataTransfer.effectAllowed = "move";
                },
                onDrag: (e: React.DragEvent) => e.stopPropagation(),
                onDragEnd: (e: React.DragEvent) => e.stopPropagation(),
                onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if ((e as any).altKey && parentId) onSelect(parentId);
                    else onSelect(node.id);
                },
                onDragOver: onContainerDragOver,
                onDragLeave: onContainerDragLeave,
                onDrop: onContainerDrop,
                className: [
                    "relative",
                    overContainer && node.container ? "outline outline-2 outline-blue-300/40" : "",
                ].join(" "),
            } as any}
        >
            {node.container && overContainer && ghost && (
                <div
                    className="pointer-events-none absolute rounded-lg"
                    style={{
                        left: ghost.x,
                        top: ghost.y,
                        width: Math.max(1, ghost.w),
                        height: Math.max(1, ghost.h),
                        border: "2px solid rgba(59,130,246,0.95)",
                        boxShadow: "0 0 0 4px rgba(59,130,246,.12)",
                    }}
                />
            )}

            {node.children.map((child, i) => (
                <Fragment key={child.id}>
                    <NodeItem
                        node={child}
                        path={[...path, i]}
                        registry={registry}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onResize={onResize}
                        onDropNewAt={onDropNewAt}
                        onMoveNode={onMoveNode}
                        parentId={node.id}
                    />
                </Fragment>
            ))}

            {node.container && node.children.length === 0 && (
                <div
                    className="min-h-[56px] grid place-items-center text-[11px] rounded-md border border-dashed text-gray-500"
                    style={{ borderColor: "rgba(148,163,184,.6)", background: "rgba(248,250,252,.6)" }}
                >
                    Dépose ici
                </div>
            )}
        </Renderer>
    );
}

export type { JSONNode, Path };
