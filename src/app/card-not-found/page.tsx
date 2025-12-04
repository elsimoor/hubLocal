import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function CardNotFoundPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="rounded-3xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-12 shadow-2xl">
                    <div className="mx-auto w-20 h-20 rounded-full bg-slate-700/30 flex items-center justify-center mb-6">
                        <FileQuestion size={40} className="text-slate-400" />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Card Not Found
                    </h1>
                    
                    <p className="text-white/70 mb-8">
                        The card you're looking for doesn't exist or may have been removed.
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
