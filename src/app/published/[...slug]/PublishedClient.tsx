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
import { ActionStateProvider } from "@/lib/puck/actions";
//
// ### CORRECTION ICI ###
// Nous importons 'config' au lieu de 'puckConfig'
//
import { config as publishedConfig } from "@/lib/puck/config";

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
        const renderFn = (props: any) => {
          // Begin with the stored HTML for this custom component
          let html: string = comp.code || "";
          try {
            if (props && typeof props === 'object') {
              if (typeof props.label === 'string' && props.label) {
                html = html.replace(/>([^<]*)</, `>${props.label}<`);
              }
              if (typeof props.href === 'string' && props.href) {
                html = html.replace(/href="[^"]*"/, `href="${props.href}"`);
              }
              // Generic placeholder replacement: replace any {{key}} with the
              // corresponding prop value.  For a "links" field, split comma-
              // separated values into anchor tags when the placeholder is
              // present.
              Object.keys(props).forEach((key) => {
                const val: any = (props as any)[key];
                if (val == null) return;
                const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}}`, 'g');
                // Handle arrays: navigation items, links and slides
                if (Array.isArray(val)) {
                  // Navigation items (navbar, sidebar)
                  if (key === 'links' || key === 'items') {
                    const itemsHtml = val
                      .map((item: any) => {
                        // Accept both string and object forms
                        if (typeof item === 'string') {
                          return `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${item}</a>`;
                        }
                        const label = item.label || '';
                        const href = item.href || '#';
                        const target = item.target || '_self';
                        const classes = 'ml-4';
                        return `<a href="${href}" target="${target}" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`;
                      })
                      .join('');
                    html = html.replace(re, itemsHtml);
                    return;
                  }
                  // Slides for carousels
                  if (key === 'slides') {
                    const slidesHtml = val
                      .map((slide: any) => {
                        const src = slide.src || '';
                        const alt = slide.alt || '';
                        const width = slide.width || '';
                        const height = slide.height || '';
                        const href = slide.href || '';
                        const target = slide.target || '_self';
                        const imgTag = `<img src="${src}" alt="${alt}" style="width:${width ? width + 'px' : '100%'};height:${height ? height + 'px' : 'auto'};object-fit:cover;"/>`;
                        if (href) {
                          return `<div style="flex:0 0 100%;"><a href="${href}" target="${target}">${imgTag}</a></div>`;
                        }
                        return `<div style="flex:0 0 100%;">${imgTag}</div>`;
                      })
                      .join('');
                    html = html.replace(re, slidesHtml);
                    return;
                  }
                  // Generic arrays: join values with a space
                  const generic = val.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
                  html = html.replace(re, generic);
                  return;
                }
                if (typeof val === 'string') {
                  // For legacy comma-separated links
                  if (key === 'links') {
                    const linkLabels = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    const linksHtml = linkLabels
                      .map((label: string) => `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`)
                      .join('');
                    html = html.replace(re, linksHtml);
                    return;
                  }
                  if (key === 'images') {
                    // For legacy images field: create slides with default full width
                    const urls = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    const imagesHtml = urls
                      .map((url: string) => `<div style="flex:0 0 100%;"><img src="${url}" style="width:100%;height:auto;object-fit:cover;"/></div>`)
                      .join('');
                    html = html.replace(re, imagesHtml);
                    return;
                  }
                  html = html.replace(re, val);
                }
              });
            }
          } catch (e) {
            // ignore replacement errors
          }
          return (
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        };
        nextConfig.components[compName] = {
          label: compName,
          inline: true,
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
          <ActionStateProvider allowCustomJS={String(data?.root?.props?.allowCustomJS) === "true"}>
            <Render config={(mergedConfig as any)} data={data} />
          </ActionStateProvider>
        ) : (
          <div className="text-sm text-gray-600">Chargement…</div>
        )}
      </div>
    </div>
  );
}
