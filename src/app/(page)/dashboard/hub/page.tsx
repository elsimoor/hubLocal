"use client";

import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, BarChart3, Pencil } from "lucide-react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

export default function HubsPage() {
    const { data, mutate, isLoading } = useSWR("/api/hubs", fetcher);
    const router = useRouter();

    async function createHub() {
        const res = await fetch("/api/hubs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Nouveau hub" }),
        });
        if (!res.ok) return;
        const j = await res.json();
        router.push(`/dashboard/hub/${j._id}/edit`);
    }

    return (
        <main className="min-h-[100dvh] bg-[radial-gradient(1200px_500px_at_20%_-10%,rgba(99,102,241,0.12),transparent),radial-gradient(800px_400px_at_95%_10%,rgba(16,185,129,0.10),transparent)]">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Mes hubs</h1>
                    <button onClick={createHub} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:opacity-95">
                        <Plus size={16} /> Nouveau hub
                    </button>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-3">
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl border border-white/70 bg-white/60 backdrop-blur animate-pulse" />
                    ))}

                    {(data || []).map((h: any) => (
                        <div key={h._id} className="rounded-2xl border border-white/70 bg-white/70 backdrop-blur p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 truncate">{h.title}</div>
                                    <div className="text-xs text-gray-600 truncate">/{h.slug}</div>
                                </div>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${h.status === "published" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                    {h.status}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-700">
                                <div className="inline-flex items-center gap-1"><BarChart3 size={14} /> {h.stats?.views ?? 0} vues</div>
                                <div className="inline-flex items-center gap-1">{h.stats?.clicks ?? 0} clics</div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <Link href={`/dashboard/hub/${h._id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                                    <Pencil size={14} /> Éditer
                                </Link>
                                <a href={`/people/${h.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline">
                                    Voir la page <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}

                    {!isLoading && (!data || data.length === 0) && (
                        <div className="col-span-full rounded-2xl border border-white/70 bg-white/70 backdrop-blur p-8 text-center text-sm text-gray-600">
                            Aucun hub. Crée-en un !
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
