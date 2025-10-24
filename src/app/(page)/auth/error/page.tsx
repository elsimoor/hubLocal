"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";

const messages: Record<string, string> = {
    OAuthSignin: "Erreur OAuth.",
    OAuthCallback: "Erreur lors du retour d’authentification.",
    OAuthCreateAccount: "Impossible de créer le compte.",
    EmailCreateAccount: "Impossible de créer le compte.",
    Callback: "Erreur de callback.",
    OAuthAccountNotLinked: "Compte déjà lié à un autre fournisseur.",
    SessionRequired: "Session requise.",
    AccessDenied: "Accès refusé.",
    Configuration: "Mauvaise configuration côté serveur.",
    Default: "Une erreur est survenue.",
};

function AuthErrorInner() {
    const sp = useSearchParams();
    const code = sp.get("error") || "Default";
    const msg = messages[code] || messages.Default;

    return (
        <main className="min-h-[100dvh] grid place-items-center bg-slate-50">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center text-center">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white">
                        <AlertTriangle size={18} className="text-gray-700" />
                    </div>
                    <h1 className="mt-3 text-[20px] font-semibold text-gray-900">Erreur d’authentification</h1>
                    <p className="mt-2 text-sm text-gray-600">{msg}</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                        Code&nbsp;: <span className="font-mono">{code}</span>
                    </p>

                    <div className="mt-5 w-full space-y-2">
                        <a
                            href="/auth/signin"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
                        >
                            <LogIn size={16} /> Aller à la connexion
                        </a>
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw size={16} /> Réessayer avec Google
                        </button>
                    </div>

                    <a href="/" className="mt-4 text-xs text-gray-500 underline hover:text-gray-700">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        </main>
    );
}

export default function AuthError() {
    return (
        <Suspense fallback={<main className="min-h-[60dvh] grid place-items-center">Chargement…</main>}>
            <AuthErrorInner />
        </Suspense>
    );
}
