"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/app/(page)/lab/[id]/_content/index"), { ssr: false });

export default function EditHubPage() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [initial, setInitial] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/hubs/${id}`, { cache: "no-store" });
            const j = await res.json();
            setInitial(j);
            setLoading(false);
        })();
    }, [id]);

    if (loading) return <main className="min-h-[60dvh] grid place-items-center">Chargement…</main>;
    if (!initial) return <main className="min-h-[60dvh] grid place-items-center">Introuvable.</main>;

    return (
        // The parent layout provides the height via flexbox. Use a div with h-full
        // so the editor fills the available space. We avoid min-h-[100dvh]
        // here because that would overflow when wrapped in the dashboard layout.
        <div className="h-full">
            <Editor hubId={String(id)} initialSave={initial.data} initialTitle={initial.title} />
        </div>
    );
}
