"use client";
import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/profile")
        .then((res) => res.ok ? res.json() : Promise.reject(res))
        .then((data) => {
          setFirstName(data.firstName ?? "");
          setLastName(data.lastName ?? "");
          setIsPro(!!data.isPro);
        })
        .catch(() => { /* ignore errors */ })
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (res.ok) {
        setMessage("Profil mis à jour.");
      } else {
        setMessage("Erreur lors de la mise à jour.");
      }
    } catch {
      setMessage("Erreur réseau.");
    }
  }

  async function handleTogglePro() {
    setMessage(null);
    try {
      const newPro = !isPro;
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPro: newPro }),
      });
      if (res.ok) {
        setIsPro(newPro);
        setMessage(newPro ? "Votre compte est maintenant PRO." : "Votre compte est repassé en version gratuite.");
      } else {
        setMessage("Erreur lors de la mise à jour du plan.");
      }
    } catch {
      setMessage("Erreur réseau.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-[60dvh] grid place-items-center">
        <div className="w-full max-w-2xl animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </main>
    );
  }
  if (!session) {
    return <main className="min-h-[60dvh] grid place-items-center">Tu dois être connecté pour modifier ton profil.</main>;
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Mon profil</h1>

      <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow">
        <div className="flex items-center gap-4 mb-4">
          {session.user?.image ? (
            <img src={session.user.image} alt="avatar" className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 grid place-items-center text-gray-600 font-semibold">
              {String(session.user?.name || "").charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div>
            <div className="font-medium">{session.user?.name || "Utilisateur"}</div>
            <div className="text-xs text-gray-600">{session.user?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-800">Prénom</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-800">Nom</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-black"
            >
              Enregistrer
            </button>
            {message && <p className="text-sm text-gray-700">{message}</p>}
          </div>
        </form>
      </section>

      <section className="mt-6 bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow">
        <h2 className="text-lg font-semibold mb-1">Abonnement</h2>
        <p className="text-sm mb-3">Plan actuel : <strong>{isPro ? 'PRO' : 'Gratuit'}</strong></p>
        <button
          onClick={handleTogglePro}
          className="inline-flex items-center px-4 py-2 border border-purple-700 text-sm font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800"
        >
          {isPro ? 'Revenir à la version gratuite' : 'Passer en PRO'}
        </button>
        <p className="text-xs text-gray-500 mt-2">Cette action simule l’activation ou la désactivation de l’abonnement PRO. Aucune facturation réelle n’est effectuée.</p>
      </section>
    </main>
  );
}