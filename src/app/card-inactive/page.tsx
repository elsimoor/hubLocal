import Link from "next/link";
import { Ban, Home } from "lucide-react";

export default async function CardInactivePage({
    searchParams,
}: {
    searchParams: Promise<{ name?: string }>;
}) {
    const params = await searchParams;
    const cardName = params.name || "This card";

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="rounded-3xl border border-red-500/20 bg-red-950/30 backdrop-blur-xl p-12 shadow-2xl">
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <Ban size={40} className="text-red-400" />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Card Inactive
                    </h1>
                    
                    <p className="text-white/70 mb-2">
                        <span className="font-semibold text-white">{cardName}</span> has been temporarily deactivated by its owner.
                    </p>
                    
                    <p className="text-sm text-white/50 mb-8">
                        If you believe this is an error, please contact the card owner directly.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                        <Home size={18} />
                        Return Home
                    </Link>
                </div>

                <p className="mt-6 text-xs text-white/40">
                    Powered by HubLocal — {new Date().getFullYear()}
                </p>
            </div>
        </main>
    );
}
