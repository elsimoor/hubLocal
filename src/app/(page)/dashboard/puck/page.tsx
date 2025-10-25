"use client";

import React from "react";
import { Puck, createUsePuck } from "@measured/puck";
import "@measured/puck/puck.css";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { puckConfig as config } from "@/lib/puck/config";

/**
 * PuckPage renders a simple visual editor powered by the open‑source Puck
 * library. This page exists alongside the traditional hub editor and is a
 * playground for experimenting with Puck. Users can drag and drop
 * pre‑configured components (heading, paragraph, button and image) and
 * publish the resulting JSON to the console. In a real application you
 * would persist the data to your database and restore it on page load.
 */
export default function PuckPage() {
  const usePuck = createUsePuck();
  

  // Local state to store the current Puck document. Normally this would be
  // persisted via an API and loaded on page mount. For the demo the
  // initial state is empty. When the user publishes, we update state and
  // log to the console.
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");
  const search = useSearchParams();
  const router = useRouter();
  const [slug, setSlug] = useState<string>(search?.get("slug") || "default");

  // Load existing draft on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (active && json?.data) setData(json.data);
      } catch (e) {
        console.warn("Failed to load Puck doc:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  async function saveDoc(nextData: any, status: "draft" | "published") {
    try {
      setSaving(status);
      const res = await fetch("/api/puck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data: nextData, status }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setData(json.data || nextData);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving("idle");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-8xl py-8 px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Éditeur Puck
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Cette page est une démonstration de l’éditeur visuel Puck. Vous
          pouvez faire glisser et déposer les composants dans la scène, éditer
          leurs propriétés et publier le résultat. Les données sont stockées
          localement dans l’état de la page ; dans un contexte réel, elles
          seraient envoyées à votre API pour être persistées.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow">
          <Puck
            config={config as any}
            data={data}
            viewports={[
              { width: 360, height: "auto", label: "Mobile" },
              { width: 768, height: "auto", label: "Tablet" },
              { width: 1280, height: "auto", label: "Desktop" },
              { width: 1440, height: "auto", label: "Wide" },
            ]}
            overrides={{
              headerActions: ({ children }) => {
                const appState = usePuck((s) => s.appState);
                const current = appState?.data;
                return (
                  <div className="flex items-center gap-2">
                    <input
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none"
                      placeholder="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      title="Slug"
                      style={{ width: 160 }}
                    />
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/puck?slug=${encodeURIComponent(slug)}`)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      disabled={saving !== "idle"}
                      onClick={() => current && saveDoc(current, "draft")}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {saving === "draft" ? "Saving…" : "Save draft"}
                    </button>
                    <button
                      type="button"
                      disabled={saving !== "idle"}
                      onClick={() => current && saveDoc(current, "published")}
                      className="inline-flex items-center rounded-md border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving === "published" ? "Publishing…" : "Publish"}
                    </button>
                    <a
                      href={`/published/${encodeURIComponent(slug)}`}
                      target="_blank"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Open published
                    </a>
                    {children}
                  </div>
                );
              },
            }}
            onPublish={(newData) => {
              // Persist and mark as published
              saveDoc(newData, "published");
            }}
          />
          {/* Inline mode is now used for all components so we no longer need to override
              default wrapper behaviour. The previous global CSS overrides have been
              removed to allow flex and grid items to size themselves naturally. */}
        </div>
      </div>
    </div>
  );
}



