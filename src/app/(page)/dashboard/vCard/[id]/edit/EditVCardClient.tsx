"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Props = {
    id: string;
};

export default function EditVCardClient({ id }: Props) {
    const router = useRouter();
    const { data: vcard, isLoading: vcardLoading } = useSWR(id ? `/api/vcards/${id}` : null, fetcher);
    const { data: appsData, isLoading: appsLoading } = useSWR("/api/apps", fetcher);
    const apps = appsData?.apps;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedAppId, setSelectedAppId] = useState("");
    const [selectedPageSlug, setSelectedPageSlug] = useState("home");

    useEffect(() => {
        if (vcard) {
            const resolvedAppId = typeof vcard.appId === "string" ? vcard.appId : vcard.appId?.toString?.() || "";
            setSelectedAppId(resolvedAppId);
            setSelectedPageSlug(vcard.pageSlug || "home");
        }
    }, [vcard]);

    const { data: pagesData, isLoading: pagesLoading } = useSWR(
        selectedAppId ? `/api/apps/${selectedAppId}/pages` : null,
        fetcher
    );
    const pageOptions = useMemo(() => {
        const optionsMap = new Map<string, { slug: string; title: string }>();
        optionsMap.set("home", { slug: "home", title: "Page d'accueil" });
        const pages = pagesData?.pages || [];
        pages.forEach((page: any) => {
            const slug = typeof page?.pageSlug === "string" && page.pageSlug.trim() ? page.pageSlug : "home";
            if (!optionsMap.has(slug)) {
                optionsMap.set(slug, {
                    slug,
                    title: page?.title || (slug === "home" ? "Page d'accueil" : slug),
                });
            }
        });
        return Array.from(optionsMap.values());
    }, [pagesData]);
    useEffect(() => {
        if (!selectedAppId || pageOptions.length === 0) return;
        if (!pageOptions.some((page) => page.slug === selectedPageSlug)) {
            setSelectedPageSlug(pageOptions[0].slug);
        }
    }, [pageOptions, selectedAppId, selectedPageSlug]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            title: formData.get("title"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            website: formData.get("website"),
            slug: formData.get("slug"),
            appId: formData.get("appId"),
            bio: formData.get("bio"),
            pageSlug: formData.get("pageSlug"),
        };

        try {
            const res = await fetch(`/api/vcards/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Une erreur est survenue");
            }

            router.push("/dashboard/vCard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette vCard ?")) return;

        try {
            const res = await fetch(`/api/vcards/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Erreur lors de la suppression");
            }

            router.push("/dashboard/vCard");
        } catch (err: any) {
            alert(err.message);
        }
    }

    if (vcardLoading || appsLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!vcard) return <div>vCard introuvable</div>;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/vCard"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Éditer la vCard
                        </h1>
                        <p className="text-sm text-gray-500">
                            Modifiez les informations de votre carte de visite.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                    title="Supprimer"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Nom complet <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    defaultValue={vcard.name}
                                    required
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Titre / Poste
                                </label>
                                <input
                                    name="title"
                                    defaultValue={vcard.title}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={vcard.email}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Téléphone
                                </label>
                                <input
                                    name="phone"
                                    type="tel"
                                    defaultValue={vcard.phone}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Site web
                            </label>
                            <input
                                name="website"
                                type="url"
                                defaultValue={vcard.website}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Lier à une App <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="appId"
                                required
                                value={selectedAppId}
                                onChange={(e) => {
                                    setSelectedAppId(e.target.value);
                                    setSelectedPageSlug("home");
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            >
                                <option value="">Sélectionner une app...</option>
                                {apps?.map((app: any) => (
                                    <option key={app._id} value={app._id}>
                                        {app.name} ({app.slug})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedAppId && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Page de destination <span className="text-red-500">*</span>
                                </label>
                                {pagesLoading ? (
                                    <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                                ) : (
                                    <select
                                        name="pageSlug"
                                        required
                                        value={selectedPageSlug}
                                        onChange={(e) => setSelectedPageSlug(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        {pageOptions.map((page) => (
                                            <option key={page.slug} value={page.slug}>
                                                {page.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-500">
                                    Choisissez la page HubLocal qui sera ouverte via le QR code.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Slug URL <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
                                <span className="text-sm text-gray-500">hublocal.com/vcard/</span>
                                <input
                                    name="slug"
                                    defaultValue={vcard.slug}
                                    required
                                    className="w-full bg-transparent py-2.5 pl-1 text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Bio
                            </label>
                            <textarea
                                name="bio"
                                defaultValue={vcard.bio}
                                rows={3}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
}
