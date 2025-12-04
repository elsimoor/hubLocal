"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Plus, ExternalLink, Pencil, Contact, Loader2, Power } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ENV_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export default function VCardDashboard() {
    const { data: vcards, isLoading } = useSWR("/api/vcards", fetcher);
    const [siteBase, setSiteBase] = useState(ENV_SITE_URL);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        if (!siteBase && typeof window !== "undefined") {
            setSiteBase(window.location.origin.replace(/\/$/, ""));
        }
    }, [siteBase]);

    const toggleActive = async (vcardId: string, currentActive: boolean) => {
        setTogglingId(vcardId);
        try {
            const res = await fetch(`/api/vcards/${vcardId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentActive }),
            });
            if (res.ok) {
                mutate("/api/vcards");
            }
        } catch (error) {
            console.error("Error toggling vCard active status:", error);
        } finally {
            setTogglingId(null);
        }
    };

    const buildQrUrl = (vcard: any) => {
        if (!vcard.isActive) {
            const path404 = "/card-not-found";
            return siteBase ? `${siteBase}${path404}` : path404;
        }
        // Priority 1: manual website
        const cleanWebsite = typeof vcard.website === "string" ? vcard.website.trim() : "";
        if (cleanWebsite) {
            const withProto = /^https?:\/\//i.test(cleanWebsite) ? cleanWebsite : `https://${cleanWebsite}`;
            return withProto;
        }
        // Priority 2: linked hub published page
        if (vcard.hub && vcard.hub.slug) {
            const pageSlug = vcard.pageSlug || "home";
            const path = `/published/${vcard.hub.slug}/${pageSlug}`;
            return siteBase ? `${siteBase}${path}` : path;
        }
        // Fallback: QR redirector route
        const path = `/qr/${vcard.slug}`;
        return siteBase ? `${siteBase}${path}` : path;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes vCards</h1>
                    <p className="text-sm text-gray-500">
                        Gérez vos cartes de visite numériques.
                    </p>
                </div>
                <Link
                    href="/dashboard/vCard/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 hover:shadow-md"
                >
                    <Plus size={18} />
                    Créer une vCard
                </Link>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : vcards?.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <Contact size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Aucune vCard
                        </h3>
                        <p className="text-sm text-gray-500">
                            Commencez par créer votre première carte de visite numérique.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/vCard/create"
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        Créer maintenant &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {vcards?.map((vcard: any) => (
                        <div
                            key={vcard._id}
                            className="relative flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
                        >
                            <div className="flex flex-1 flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">vCard</p>
                                        
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                                            vcard.isActive
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-gray-200 bg-gray-50 text-gray-500"
                                        }`}>
                                            {vcard.isActive ? "Actif" : "Inactif"}
                                        </span>
                                        <button
                                            onClick={() => toggleActive(vcard._id, vcard.isActive)}
                                            disabled={togglingId === vcard._id}
                                            className={`rounded-lg p-1.5 transition ${
                                                vcard.isActive
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            } disabled:opacity-50`}
                                            title={vcard.isActive ? "Désactiver" : "Activer"}
                                        >
                                            {togglingId === vcard._id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Power size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                                    <div className="rounded-2xl bg-white p-2 shadow-inner">
                                        <QRCode value={buildQrUrl(vcard)} size={94} />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p className="text-base font-semibold text-gray-900">{vcard.name}</p>
                                        <p className="text-xs uppercase tracking-widest text-gray-400">{vcard.title || "Professionnel"}</p>
                                        <p className="mt-2 text-[11px] text-gray-500">
                                            {new Intl.DateTimeFormat("fr-FR", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            }).format(new Date(vcard.createdAt))}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium truncate max-w-[140px] text-right">{vcard.email || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Téléphone</span>
                                        <span className="font-medium">{vcard.phone || "—"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Créé le</span>
                                        <span className="text-gray-500">
                                            {new Intl.DateTimeFormat("fr-FR", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            }).format(new Date(vcard.createdAt))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-2 print:hidden">
                                <Link
                                    href={`/dashboard/vCard/${vcard._id}/edit`}
                                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                                >
                                    <Pencil size={14} />
                                    <span className="ml-2">Éditer</span>
                                </Link>
                                <a
                                    href={vcard.viewUrl || `/vcard/${vcard.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black"
                                >
                                    Voir la page
                                    <ExternalLink size={14} className="ml-2" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
