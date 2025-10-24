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
    return <main className="min-h-[60dvh] grid place-items-center">Chargement…</main>;
  }
  if (!session) {
    return <main className="min-h-[60dvh] grid place-items-center">Tu dois être connecté pour modifier ton profil.</main>;
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold mb-4">Mon profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-800">Prénom</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-800">Nom</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Enregistrer
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>

      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Abonnement</h2>
        <p className="text-sm mb-3">Plan actuel : <strong>{isPro ? 'PRO' : 'Gratuit'}</strong></p>
        <button
          onClick={handleTogglePro}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {isPro ? 'Revenir à la version gratuite' : 'Passer en PRO'}
        </button>
        <p className="text-xs text-gray-500 mt-2">Cette action simule l’activation ou la désactivation de l’abonnement PRO. Aucune facturation réelle n’est effectuée.</p>
      </div>
    </main>
  );
}