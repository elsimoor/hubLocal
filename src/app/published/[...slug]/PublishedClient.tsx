// "use client";

// import React, { useEffect, useState } from "react";
// import { Render } from "@measured/puck";
// import { puckConfig as publishedConfig } from "@/lib/puck/config.fixed";

// export default function PublishedClient({ slugParts }: { slugParts: string[] }) {
//   const [data, setData] = useState<any>(null);

//   useEffect(() => {
//     let active = true;
//     (async () => {
//       try {
//         const url = "/api/puck/published/" + slugParts.map(encodeURIComponent).join("/");
//         const res = await fetch(url, { cache: "no-store" });
//         if (!res.ok) throw new Error("not found");
//         const json = await res.json();
//         // Ensure custom JS actions are allowed in published pages
//         try {
//           if (json && json.data) {
//             json.data.root = json.data.root || {};
//             json.data.root.props = json.data.root.props || {};
//             json.data.root.props.allowCustomJS = "true";
//           }
//         } catch {}
//         if (!active) return;
//         setData(json.data || {});
//       } catch (e) {
//         // On failure, still allow JS in case of fallback rendering
//         setData({ root: { props: { allowCustomJS: "true" } } } as any);
//       }
//     })();
//     return () => { active = false; };
//   }, [JSON.stringify(slugParts)]);

//   let frameWidth: number | "100%" = "100%";
//   try {
//     const v = data?.root?.props?.viewport;
//     if (v && v !== "fluid") frameWidth = Number(v);
//   } catch {}

//   // Debug: show resolved viewport and width in console to verify runtime value
//   useEffect(() => {
//     try {
//       // eslint-disable-next-line no-console
//       console.debug("[Published] viewport:", data?.root?.props?.viewport, "resolved width:", frameWidth);
//     } catch {}
//   }, [JSON.stringify(data?.root?.props?.viewport), frameWidth]);

//   return (
//     <div className="min-h-[100dvh] bg-gray-50">
//       <div
//         className={typeof frameWidth === "number" ? "mx-auto py-6" : "mx-auto py-6 px-4"}
//         style={typeof frameWidth === "number" ? { width: frameWidth } : undefined}
//       >
//         {data ? (
//           <Render config={(publishedConfig as any)} data={data} />
//         ) : (
//           <div className="text-sm text-gray-600">Chargement…</div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Render } from "@measured/puck";
//
// ### CORRECTION ICI ###
// Nous importons 'config' au lieu de 'puckConfig'
//
import { config as publishedConfig } from "@/lib/puck/config.fixed";

export default function PublishedClient({ slugParts }: { slugParts: string[] }) {
  const [data, setData] = useState<any>(null);
  // Hold any custom components loaded from the API.
  const [customComponents, setCustomComponents] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const url = "/api/puck/published/" + slugParts.map(encodeURIComponent).join("/");
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("not found");
        const json = await res.json();
        // Ensure custom JS actions are allowed in published pages
        try {
          if (json && json.data) {
            json.data.root = json.data.root || {};
            json.data.root.props = json.data.root.props || {};
            json.data.root.props.allowCustomJS = "true";
          }
        } catch {}
        if (!active) return;
        setData(json.data || {});
      } catch (e) {
        // On failure, still allow JS in case of fallback rendering
        setData({ root: { props: { allowCustomJS: "true" } } } as any);
      }
    })();
    return () => { active = false; };
  }, [JSON.stringify(slugParts)]);

  // Load public and user‑specific custom components on mount.  These
  // definitions are merged into the static Puck configuration
  // below via the `mergedConfig` memo.
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/custom-components", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load custom components");
        const json = await res.json();
        if (!isCancelled) {
          setCustomComponents(Array.isArray(json?.components) ? json.components : []);
        }
      } catch (e) {
        console.error("Error fetching custom components", e);
        if (!isCancelled) setCustomComponents([]);
      }
    })();
    return () => { isCancelled = true; };
  }, []);

  // Build a merged configuration that includes any custom components.
  const mergedConfig = useMemo(() => {
    const nextConfig: any = {
      ...publishedConfig,
      categories: { ...(publishedConfig as any).categories },
      components: { ...(publishedConfig as any).components },
    };
    if (!Array.isArray(customComponents) || customComponents.length === 0) {
      return nextConfig;
    }
    if (!nextConfig.categories.custom) {
      nextConfig.categories.custom = { title: "Personnalisé", components: [] };
    }
    customComponents.forEach((comp: any) => {
      const compName = String(comp.name || "Unnamed");
      if (!nextConfig.components[compName]) {
        if (!nextConfig.categories.custom.components.includes(compName)) {
          nextConfig.categories.custom.components.push(compName);
        }
        const renderFn = () => {
          return (
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: comp.code || "" }}
            />
          );
        };
        nextConfig.components[compName] = {
          label: compName,
          fields: {},
          ...(comp.config || {}),
          render: renderFn,
        };
      }
    });
    return nextConfig;
  }, [customComponents]);

  let frameWidth: number | "100%" = "100%";
  try {
    const v = data?.root?.props?.viewport;
    if (v && v !== "fluid") frameWidth = Number(v);
  } catch {}

  // Debug: show resolved viewport and width in console to verify runtime value
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug("[Published] viewport:", data?.root?.props?.viewport, "resolved width:", frameWidth);
    } catch {}
  }, [JSON.stringify(data?.root?.props?.viewport), frameWidth]);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div
        className={typeof frameWidth === "number" ? "mx-auto py-6" : "mx-auto py-6 px-4"}
        style={typeof frameWidth === "number" ? { width: frameWidth } : undefined}
      >
        {data ? (
          <Render config={(mergedConfig as any)} data={data} />
        ) : (
          <div className="text-sm text-gray-600">Chargement…</div>
        )}
      </div>
    </div>
  );
}