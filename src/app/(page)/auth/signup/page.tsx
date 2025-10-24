"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React from "react";

export default function SignUpPage() {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Erreur d'inscription.");
      } else {
        setSuccess(true);
        // auto sign in after registration
        await signIn("credentials", {
          email,
          password,
          // Redirect to the hubs dashboard after registration and login.
          callbackUrl: "/dashboard/hub",
        });
      }
    } catch (err: any) {
      setError("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-[radial-gradient(1200px_500px_at_30%_-10%,rgba(99,102,241,0.10),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(16,185,129,0.08),transparent)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 backdrop-blur-md p-6">
        <h1 className="text-center text-xl font-semibold text-gray-900 mb-4">Créer un compte</h1>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Inscription réussie ! Redirection…</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Prénom"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nom"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="ton.email@exemple.com"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="••••••"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99] transition px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            {loading ? "Création…" : "Créer un compte"}
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-gray-600">
          Déjà inscrit ? <Link href="/auth/signin" className="underline hover:text-gray-700">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}