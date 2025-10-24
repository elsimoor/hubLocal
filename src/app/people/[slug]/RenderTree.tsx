"use client";
import { rendererMap } from "@/lib/lab/renderers";

/**
 * RenderTree is a client component that traverses a JSON tree and
 * delegates rendering to the appropriate component in the renderer map.
 * It attaches a click handler on each root element to record clicks via
 * the `/api/hubs/track` endpoint. This must be a client component because
 * it defines event handlers (onClick) and cannot run on the server.
 */
export default function RenderTree({ nodes }: { nodes: any[] }) {
  const renderNode = (n: any) => {
    const Renderer = rendererMap.get(n.type) as any;
    const children = n.children?.map((c: any, i: number) => (
      <div key={i}>{renderNode(c)}</div>
    ));
    if (!Renderer) return null;
    const rootProps: any = {
      onClick: async () => {
        // naive click tracking when clicking rendered elements
        try {
          await fetch("/api/hubs/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hubId: n.hubId }),
          });
        } catch {
          /* ignore network errors */
        }
      },
    };
    return (
      <Renderer node={n} rootProps={rootProps}>
        {children}
      </Renderer>
    );
  };
  return <>{nodes.map((n, i) => <div key={i}>{renderNode(n)}</div>)}</>;
}