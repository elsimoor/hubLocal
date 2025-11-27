import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { VCardModel } from "@/lib/models/VCard";
import { AppModel } from "@/lib/models/App";
import { getSiteBaseUrl } from "@/lib/profile/urls";
import QRCode from "react-qr-code";
import {
    Phone,
    Mail,
    Globe,
    Download,
    Share2,
    Building2,
    MapPin,
    Sparkles,
} from "lucide-react";

async function getVCard(slug: string) {
    await connectDB();
    const vcard = await VCardModel.findOne({ slug }).lean<any>();
    if (!vcard) return null;

    const app = vcard.appId ? await AppModel.findById(vcard.appId).lean<any>() : null;
    return { ...vcard, app };
}

export default async function PublicVCardPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const vcard = await getVCard(slug);

    if (!vcard) {
        notFound();
    }

    const qrUrl = (() => {
        const cleanWebsite = typeof vcard.website === "string" ? vcard.website.trim() : "";
        if (cleanWebsite) return cleanWebsite;
        const base = getSiteBaseUrl();
        return `${base}/vcard/${vcard.slug}`;
    })();

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-10 px-4">
            <div className="mx-auto w-full max-w-4xl">
                <div className="mb-6 flex items-center justify-between text-white/80">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em]">Carte digitale</p>
                        <h1 className="text-3xl font-semibold text-white">{vcard.app?.name || "HubLocal"}</h1>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
                        <Share2 size={16} />
                        Partager
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
                    <section className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white backdrop-blur-xl shadow-2xl">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            <div className="mx-auto h-32 w-32 rounded-2xl border border-white/30 bg-white/10 p-1 shadow-xl">
                                <div className="h-full w-full overflow-hidden rounded-[1.2rem] bg-slate-900/40">
                                    {vcard.avatar ? (
                                        <img src={vcard.avatar} alt={vcard.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl font-semibold">
                                            {vcard.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                                    <Sparkles size={14} /> Verified Contact
                                </div>
                                <h2 className="mt-4 text-3xl font-semibold text-white">{vcard.name}</h2>
                                <p className="text-lg text-indigo-100">{vcard.title || "Professionnel"}</p>
                                {vcard.bio && <p className="mt-3 text-sm text-white/80 leading-relaxed">{vcard.bio}</p>}
                            </div>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {vcard.email && (
                                <a
                                    href={`mailto:${vcard.email}`}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30"
                                >
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                                        <Mail size={14} /> Email
                                    </p>
                                    <p className="mt-2 text-sm text-white">{vcard.email}</p>
                                </a>
                            )}
                            {vcard.phone && (
                                <a href={`tel:${vcard.phone}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                                        <Phone size={14} /> Téléphone
                                    </p>
                                    <p className="mt-2 text-sm text-white">{vcard.phone}</p>
                                </a>
                            )}
                            {vcard.website && (
                                <a
                                    href={vcard.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30"
                                >
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                                        <Globe size={14} /> Site web
                                    </p>
                                    <p className="mt-2 text-sm text-white/90">{vcard.website.replace(/^https?:\/\//, "")}</p>
                                </a>
                            )}
                            {vcard.app?.name && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                                        <Building2 size={14} /> Application
                                    </p>
                                    <p className="mt-2 text-sm text-white">{vcard.app.name}</p>
                                    {vcard.app.slug && <p className="text-xs text-white/60">{vcard.app.slug}</p>}
                                </div>
                            )}
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            <button className="flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 py-3 font-semibold shadow-lg shadow-black/20 transition hover:translate-y-0.5">
                                <Download size={18} />
                                Ajouter au carnet
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 py-3 font-semibold text-white transition hover:bg-white/10">
                                <Share2 size={18} />
                                Partager la carte
                            </button>
                        </div>
                    </section>

                    <aside className="rounded-3xl border border-white/10 bg-white text-slate-900 p-8 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-indigo-600/10 p-3 text-indigo-700">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">HubLocal QR</p>
                                <p className="text-sm text-slate-800">Scannez pour ouvrir la page complète.</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
                                <QRCode value={qrUrl} size={180} />
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">URL de destination</p>
                            <p className="truncate text-xs text-slate-500">{qrUrl}</p>
                        </div>

                        {vcard.app?.icon && (
                            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                                <div className="h-12 w-12 rounded-xl bg-white shadow-lg">
                                    <img src={vcard.app.icon} alt={vcard.app.name} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-slate-500">Propulsé par</p>
                                    <p className="text-sm font-semibold text-slate-900">{vcard.app.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 text-center text-xs text-slate-500">
                            Propulsé par HubLocal — {new Date().getFullYear()}
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
