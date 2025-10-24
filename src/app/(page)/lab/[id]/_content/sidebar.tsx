"use client";
import { useMemo, useState } from "react";
import { Search, LayoutTemplate, Puzzle, Info } from "lucide-react";
import componentsRaw from "@/lib/lab/components";
import type { IComponentProps } from "@/lib/lab/types";

type Tab = "layout" | "widget";
type WithType = IComponentProps & { type?: Tab };

export default function Sidebar() {
    const [q, setQ] = useState("");
    const [tab, setTab] = useState<Tab>("layout");

    const palette = useMemo<WithType[]>(
        () => (Array.isArray(componentsRaw) ? componentsRaw : [componentsRaw]) as WithType[],
        []
    );

    const list = palette.filter((c) => c.id !== "root");

    const detectType = (c: WithType): Tab => (c.type as Tab) ?? (c.container ? "layout" : "widget");

    const items = useMemo(() => {
        const filtered = list.filter(
            (c) =>
                c.name.toLowerCase().includes(q.toLowerCase()) ||
                c.id.toLowerCase().includes(q.toLowerCase())
        );
        return {
            layout: filtered.filter((c) => detectType(c) === "layout"),
            widget: filtered.filter((c) => detectType(c) === "widget"),
        };
    }, [list, q]);

    const data = tab === "layout" ? items.layout : items.widget;

    return (
        <div className="h-full flex flex-col">
            {/* Header sticky */}
            <div className="sticky top-0 z-10 p-3 border-b bg-white/80 backdrop-blur">
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/70 border border-white/70 shadow-sm p-1">
                    <button
                        onClick={() => setTab("layout")}
                        className={[
                            "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                            tab === "layout" ? "bg-white shadow-sm" : "hover:bg-white/70",
                        ].join(" ")}
                    >
                        <LayoutTemplate size={14} /> Éléments
                        <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px]">{items.layout.length}</span>
                    </button>
                    <button
                        onClick={() => setTab("widget")}
                        className={[
                            "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                            tab === "widget" ? "bg-white shadow-sm" : "hover:bg-white/70",
                        ].join(" ")}
                    >
                        <Puzzle size={14} /> Widgets
                        <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px]">{items.widget.length}</span>
                    </button>
                </div>

                <div className="mt-3 relative">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Rechercher…"
                        className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 pl-9 text-sm outline-none focus:ring-2 ring-blue-500"
                    />
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                    <Info size={12} /> Glisse-dépose un élément dans la scène.
                </div>
            </div>

            {/* Items */}
            <div className="p-3 overflow-auto grid grid-cols-2 gap-3">
                {data.map((c) => (
                    <button
                        key={c.id}
                        draggable
                        onDragStart={(e) => {
                            const raw = JSON.stringify({ kind: "component", id: c.id });
                            e.dataTransfer.setData("application/x-lab-component", raw);
                            e.dataTransfer.setData("text/plain", raw); // fallback
                            e.dataTransfer.effectAllowed = "copy";
                        }}
                        className="group relative border border-white/70 rounded-2xl p-3 text-left bg-white/70 hover:bg-white active:scale-[.99] transition shadow-sm"
                        title={c.name}
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-gray-50">
                                {(c as any).icon ?? "🔧"}
                            </span>
                            <div className="min-w-0">
                                <div className="text-xs font-semibold leading-4 line-clamp-1">{c.name}</div>
                                <div className="text-[10px] text-gray-500 line-clamp-1">{c.id}</div>
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-500">Glisser pour ajouter</div>
                        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-1 ring-blue-400/40" />
                    </button>
                ))}
                {!data.length && (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-10">Aucun élément</div>
                )}
            </div>
        </div>
    );
}
