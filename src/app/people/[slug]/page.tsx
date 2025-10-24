import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { HubModel } from "@/lib/models/Hub";
// Note: we no longer import rendererMap here; it is used only in the client side
// RenderTree component. Import RenderTree from a separate client module to
// avoid passing event handlers from server components. See RenderTree.tsx.
import RenderTree from "./RenderTree";

export const dynamic = "force-dynamic";

async function getHub(slug: string) {
  await connectDB();
  const hub = await HubModel.findOneAndUpdate(
    { slug },
    { $inc: { "stats.views": 1 } },
    { new: true }
  ).lean();
  return hub as any;
}

async function getHubRaw(slug: string) {
  await connectDB();
  const hub = await HubModel.findOne({ slug }).lean();
  return hub as any;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getHubRaw(slug);
  const save = hub?.data || {};
  const bucket = save["/"] || {};
  const meta = bucket.meta || {};
  const title = meta.title || hub?.title || "Hub";
  const description = meta.description || "";
  const keywords = meta.keywords ? String(meta.keywords).split(",").map((s: string) => s.trim()).filter(Boolean) : undefined;
  const icons = meta.favicon ? { icon: meta.favicon } : undefined;
  // Include the favicon if specified. Next.js will merge this into the page
  // metadata to set the <link rel="icon" ...> tag. When undefined, the
  // default favicon (from public/favicon.ico) will be used.
  return { title, description, keywords, icons };
}

// The RenderTree component is a client component defined in ./RenderTree.tsx.
// It handles traversing and rendering nodes and adds click tracking. It must
// be separated from the server page because event handlers cannot be
// defined inside server components.

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = await getHub(slug);
  if (!hub) return notFound();

  // pick mobile route if present
  const save = hub.data || {};
  const bucket = save["/"] || { mobile: [] };
  const nodes = Array.isArray(bucket.mobile) ? bucket.mobile : [];
  // attach hubId for click tracking
  nodes.forEach((n: any) => n.hubId = String(hub._id));

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-lg p-4">
        <RenderTree nodes={nodes} />
      </div>
    </main>
  );
}
