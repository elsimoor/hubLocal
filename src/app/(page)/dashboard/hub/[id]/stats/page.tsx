"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/*
 * StatsPage displays simple metrics for a hub: total views and total clicks.
 * Data is fetched from the API using the hub ID. A lightweight bar chart is
 * rendered using divs with variable heights instead of a third‑party chart
 * library. If the user is not authenticated, they are redirected to the
 * sign‑in page.
 */
// In Next.js 15, the `params` prop for dynamic routes may be provided as a Promise.
// The React `use()` hook can be used to unwrap this promise in a client component.
// See: https://nextjs.org/docs/messages/sync-dynamic-apis#possible-ways-to-fix-it【354619373757140†L472-L523】

export default function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  // `params` is provided as a Promise in Next.js 15 for dynamic routes.  Use
  // React.use() to unwrap the promise in a client component【354619373757140†L472-L523】.
  const { id } = React.use(params);
  const hubId = id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [views, setViews] = useState<number | null>(null);
  const [clicks, setClicks] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch(`/api/hubs/${hubId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((hub) => {
          setViews(hub.stats?.views ?? 0);
          setClicks(hub.stats?.clicks ?? 0);
        })
        .catch(() => {
          // swallow errors (e.g. unauthorized or not found)
        })
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, hubId]);

  if (loading) {
    return <main className="min-h-[60dvh] grid place-items-center">Chargement…</main>;
  }
  if (!session) {
    // If the user is not signed in, redirect to sign-in using client router
    router.push("/auth/signin");
    return null;
  }
  if (views === null || clicks === null) {
    return <main className="min-h-[60dvh] grid place-items-center">Hub introuvable.</main>;
  }

  const max = Math.max(views, clicks, 1);
  const bars = [
    { label: "Vues", value: views, colorClass: "bg-blue-500" },
    { label: "Clics", value: clicks, colorClass: "bg-green-500" },
  ];

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Statistiques du hub</h1>
      <div className="flex justify-around items-end h-40 border-b pb-4 mb-6">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center w-20">
            <div
              className={`w-full rounded-t-md ${bar.colorClass}`}
              style={{ height: `${(bar.value / max) * 100}%` }}
            />
            <span className="mt-2 text-sm font-medium">{bar.value}</span>
            <span className="text-xs text-gray-600">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Les statistiques de vues sont incrémentées à chaque consultation de la page publique du hub. Les clics représentent le nombre de clics enregistrés via l'API de suivi.
      </p>
    </main>
  );
}