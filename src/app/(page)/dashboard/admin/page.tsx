"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/*
 * AdminPage displays all users and hubs for administrative oversight. It is
 * restricted to the email defined in the ADMIN_EMAIL environment variable
 * (see auth session callback). Non‑admins are redirected to the dashboard.
 */
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      if (!(session as any).user?.isAdmin) {
        // redirect non‑admin users
        router.push("/dashboard");
        return;
      }
      const fetchData = async () => {
        try {
          const [uRes, hRes] = await Promise.all([
            fetch("/api/admin/users"),
            fetch("/api/admin/hubs"),
          ]);
          if (uRes.ok) setUsers(await uRes.json());
          if (hRes.ok) setHubs(await hRes.json());
        } catch {
          /* ignore network errors */
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session, router]);

  if (loading) {
    return <main className="min-h-[60dvh] grid place-items-center">Chargement…</main>;
  }
  if (!session) {
    return <main className="min-h-[60dvh] grid place-items-center">Vous devez être connecté.</main>;
  }
  if (!(session as any).user?.isAdmin) {
    return <main className="min-h-[60dvh] grid place-items-center">Accès refusé.</main>;
  }

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Back‑office Admin</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Utilisateurs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Prénom</th>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{u.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{u.firstName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{u.lastName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{u.isPro ? 'PRO' : 'Gratuit'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="px-3 py-2" colSpan={4}>Aucun utilisateur.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Hubs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Titre</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Propriétaire</th>
                <th className="px-3 py-2 text-left">Vues</th>
                <th className="px-3 py-2 text-left">Clics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hubs.map((h) => (
                <tr key={h.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{h.title}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{h.slug}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{h.ownerEmail}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{h.views}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{h.clicks}</td>
                </tr>
              ))}
              {hubs.length === 0 && (
                <tr><td className="px-3 py-2" colSpan={5}>Aucun hub.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}