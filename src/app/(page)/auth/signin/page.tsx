"use client";
import { signIn } from "next-auth/react";
import React from "react";
import { Link2 } from "lucide-react";
import {
    GiStrawberry,
    GiGrapes,
    GiKiwiFruit,
    GiLemon,
} from "react-icons/gi";

function FruitRain() {
    const sizeAlteration = 12;
    const FRUITS = [
        { left: "6%", size: 92 / sizeAlteration, dur: 18, delay: 0.0, opacity: .08, Icon: GiStrawberry },
        { left: "14%", size: 95 / sizeAlteration, dur: 20, delay: 2.5, opacity: .07, Icon: GiLemon },
        { left: "22%", size: 90 / sizeAlteration, dur: 19, delay: 5.0, opacity: .08, Icon: GiGrapes },
        { left: "30%", size: 94 / sizeAlteration, dur: 21, delay: 7.5, opacity: .07, Icon: GiKiwiFruit },
        { left: "38%", size: 88 / sizeAlteration, dur: 18, delay: 1.2, opacity: .07, Icon: GiStrawberry },
        { left: "46%", size: 92 / sizeAlteration, dur: 20, delay: 3.8, opacity: .08, Icon: GiLemon },
        { left: "54%", size: 90 / sizeAlteration, dur: 19, delay: 6.4, opacity: .07, Icon: GiGrapes },
        { left: "62%", size: 95 / sizeAlteration, dur: 22, delay: 9.0, opacity: .08, Icon: GiKiwiFruit },
        { left: "70%", size: 88 / sizeAlteration, dur: 18, delay: 1.8, opacity: .07, Icon: GiStrawberry },
        { left: "78%", size: 92 / sizeAlteration, dur: 19, delay: 4.6, opacity: .07, Icon: GiLemon },
        { left: "86%", size: 90 / sizeAlteration, dur: 20, delay: 8.2, opacity: .07, Icon: GiGrapes },
        { left: "92%", size: 95 / sizeAlteration, dur: 21, delay: 11.0, opacity: .08, Icon: GiKiwiFruit },
    ] as const;


    return (
        <>
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                {FRUITS.map((f, i) => (
                    <div
                        key={i}
                        className="absolute top-[-12%] will-change-transform"
                        style={
                            {
                                left: f.left,
                                opacity: f.opacity,
                                ["--dur" as any]: `${f.dur}s`,
                                ["--delay" as any]: `${f.delay}s`,
                                ["--size" as any]: `${f.size}px`,
                            } as React.CSSProperties
                        }
                    >
                        <div className="animate-fruit">
                            <div className="animate-spinfruit">
                                <f.Icon
                                    aria-hidden
                                    className="fruit-svg select-none"
                                    style={{ width: "clamp(64px, 12vw, var(--size))", height: "auto" }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
        @keyframes fall { 0% { transform: translateY(-12vh); } 100% { transform: translateY(112vh); } }
        @keyframes slowspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-fruit { animation: fall var(--dur) linear var(--delay) infinite; filter: blur(0.3px); }
        .animate-spinfruit { animation: slowspin calc(var(--dur) * 0.9) linear infinite; }
        .fruit-svg { display:block; color: #475569; } /* teinte grise très soft */
        @media (prefers-reduced-motion: reduce) {
          .animate-fruit, .animate-spinfruit { animation: none !important; }
        }
      `}</style>
        </>
    );
}

/* ---- Page ---- */
export default function SignInPage() {
    const [email, setEmail] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    // State for credentials login
    const [loginEmail, setLoginEmail] = React.useState("");
    const [loginPass, setLoginPass] = React.useState("");
    const [loginErr, setLoginErr] = React.useState<string | null>(null);
    const [loginSending, setLoginSending] = React.useState(false);

    const onGoogle = async () => {
        // After Google sign‑in, redirect to the apps dashboard. This avoids hitting
        // the nonexistent /dashboard route which produced a 404.
        await signIn("google", { callbackUrl: "/dashboard/apps" });
    };
    const onEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErr("Merci d'entrer un email valide.");
            return;
        }
        setSending(true);
        try {
        const res = await signIn("email", { email, callbackUrl: "/dashboard/apps", redirect: false });
            if (res?.ok) {
                setSent(true);
            } else if (res?.error) {
                setErr("Impossible d'envoyer le lien. Réessaie dans un instant.");
            }
        } catch (e) {
            setErr("Erreur inattendue. Réessaie.");
        } finally {
            setSending(false);
        }
    };

    // Handle credentials sign‑in via NextAuth. We intentionally do not redirect on
    // error so we can display a message to the user. On success we navigate
    // to the dashboard.
    const onCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginErr(null);
        if (!loginEmail || !loginPass) {
            setLoginErr("Email et mot de passe requis.");
            return;
        }
        setLoginSending(true);
        try {
            const res = await signIn("credentials", {
                email: loginEmail,
                password: loginPass,
                // Redirect to the apps dashboard after a successful login.
                callbackUrl: "/dashboard/apps",
                redirect: false,
            });
            if (res?.error) {
                setLoginErr("Identifiants incorrects.");
            } else if (res?.url) {
                window.location.href = res.url;
            }
        } catch (e) {
            setLoginErr("Erreur de connexion.");
        } finally {
            setLoginSending(false);
        }
    };

    return (
        <main className="relative min-h-[100dvh] grid place-items-center bg-[radial-gradient(1200px_500px_at_30%_-10%,rgba(99,102,241,0.10),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(16,185,129,0.08),transparent)]">
            <FruitRain />
            <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 backdrop-blur-md p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white">
                        <Link2 size={18} className="text-gray-700" />
                    </div>
                    <h1 className="mt-3 text-[20px] font-semibold text-gray-900">Connexion</h1>
                    <p className="mt-1 text-sm text-gray-700">Accéder ou créer ton espace HubLocal</p>
                </div>

                <button
                    onClick={onGoogle}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[.99] transition px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white">
                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.6 18.9 13.9 24 13.9c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 16.1 4 9.3 8.4 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.2-5.1c-2 1.4-4.6 2.4-7.2 2.4-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.6 16 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.7 5.9-7 7.2l6.2 5.1C36.1 41.7 40 38 42.3 33.3c1.1-2.4 1.7-5.1 1.7-8.3 0-1.2-.1-2.3-.4-3.5z" />
                        </svg>
                    </span>
                    Continuer avec Google
                </button>

                {/* Credentials sign‑in section */}
                <div className="mt-5 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 text-[11px] font-medium text-gray-600 bg-white/80 rounded-full border border-gray-200/70">
                            ou connexion par mot de passe
                        </span>
                    </div>
                </div>
                <form onSubmit={onCredentials} className="mt-5 grid grid-cols-1 gap-3">
                    <label className="text-sm font-medium text-gray-800" htmlFor="loginEmail">Adresse email</label>
                    <input
                        id="loginEmail"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ton.email@exemple.com"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        required
                    />
                    <label className="text-sm font-medium text-gray-800" htmlFor="loginPass">Mot de passe</label>
                    <input
                        id="loginPass"
                        type="password"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loginSending}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99] transition px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                        {loginSending ? "Connexion…" : "Se connecter"}
                    </button>
                    {loginErr && <p className="text-xs text-red-600">{loginErr}</p>}
                </form>

                <div className="mt-5 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 text-[11px] font-medium text-gray-600 bg-white/80 rounded-full border border-gray-200/70">
                            ou connexion par email
                        </span>
                    </div>
                </div>

                <form onSubmit={onEmail} className="mt-5 grid grid-cols-1 gap-3">
                    <label className="text-sm font-medium text-gray-800" htmlFor="email">Adresse email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ton.email@exemple.com"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        required
                    />
                    <button
                        type="submit"
                        disabled={sending || sent}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99] transition px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                        {sent ? "Lien envoyé — vérifie ta boîte mail" : (sending ? "Envoi du lien…" : "Recevoir un lien magique")}
                    </button>
                    {err && <p className="text-xs text-red-600">{err}</p>}
                </form>

                <p className="mt-4 text-xs leading-relaxed text-gray-600 text-center">
                    Pas encore de compte ?{' '}
                    <a href="/auth/signup" className="underline hover:text-gray-700">Créer un compte</a>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-600 text-center">
                    En continuant, tu acceptes nos{' '}
                    <a className="underline hover:text-gray-700" href="/legal/cgu">CGU</a> &{' '}
                    <a className="underline hover:text-gray-700" href="/legal/privacy">Politique de confidentialité</a>.
                </p>
            </div>
        </main>
    );
}
