"use client";

import React, { Suspense } from "react";
// Importez Puck, mais PAS createUsePuck
import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Importez la configuration
import { config } from "@/lib/puck/config";
import { useDashboardUI } from "../../dashboard/ui-context";
import { Maximize2, Minimize2 } from "lucide-react";
// Importez le hook usePuck partagé
import { usePuck } from "@/lib/puck/puck-context";
import { ActionStateProvider } from "@/lib/puck/actions";

/**
 * PuckPage renders a simple visual editor powered by the open‑source Puck
 * library. This page exists alongside the traditional hub editor and is a
 * playground for experimenting with Puck. Users can drag and drop
 * pre‑configured components (heading, paragraph, button and image) and
 * publish the resulting JSON to the console. In a real application you
 * would persist the data to your database and restore it on page load.
 */
export default function PuckPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-gray-50"><div className="mx-auto max-w-8xl py-8 px-4"><div className="text-sm text-gray-600">Loading…</div></div></div>}>
      <PuckEditor />
    </Suspense>
  );
}

function PuckEditor() {
  // N'utilisez PAS createUsePuck() ici. Utilisez le hook importé.
  const usePuckHook = usePuck; 
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useDashboardUI();


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

  // Dynamically loaded custom components and editor ref
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // State and handlers for the multi‑step modal used to create custom components
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalMode, setModalMode] = useState<"create" | "modify">("create");
  const [modalTargetName, setModalTargetName] = useState<string>("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalPublic, setModalPublic] = useState(false);
  const [modalUseAI, setModalUseAI] = useState(true);
  // Option fields for defaults
  // Default values for the custom component creation form.  Platform selection
  // has been removed, so optPlatform is initialised but unused.  A single URL
  // field (optHref) replaces the previous optPhone/optHref distinction.
  const [optPlatform, setOptPlatform] = useState<string>("button");
  const [optLabel, setOptLabel] = useState<string>("");
  // Removed optPhone; all link information is stored in optHref.
  const [optHref, setOptHref] = useState<string>("");
  const [optTheme, setOptTheme] = useState<"brand" | "light" | "dark">("brand");
  const [optVariant, setOptVariant] = useState<"solid" | "outline" | "ghost">("solid");
  const [optSize, setOptSize] = useState<"sm" | "md" | "lg">("md");
  const [optShape, setOptShape] = useState<"rounded" | "full">("rounded");
  const [optIcon, setOptIcon] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Docs modal state for "How to use" guide per custom component
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Simple toast system
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: 'success' | 'error' }[]>([]);
  const toastId = useRef(0);
  function showToast(text: string, type: 'success' | 'error' = 'success') {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  // Client-side preview builder mirroring server defaults
  function buildPreviewFromOptions(opts: any) {
    const theme = opts.theme || 'brand';
    const variant = opts.variant || 'solid';
    const size = opts.size || 'md';
    const shape = opts.shape || 'rounded';
    const icon = opts.icon !== false;
    const pad = size === 'sm' ? '0.375rem 0.75rem' : size === 'lg' ? '0.75rem 1.25rem' : '0.5rem 1rem';
    const radius = shape === 'full' ? '9999px' : '0.5rem';
    const font = size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.9375rem';
    // Use a generic brand colour.  Platform-specific colours have been removed now that
    // users no longer choose between WhatsApp, Telegram, etc.
    const brand = '#111827';
    const bg = theme === 'brand' ? brand : theme === 'dark' ? '#111827' : '#ffffff';
    const fg = theme === 'light' ? '#111827' : '#ffffff';
    const border = variant === 'outline' ? `1px solid ${brand}` : 'none';
    const finalBg = variant === 'ghost' ? 'transparent' : bg;
    const finalFg = variant === 'outline' ? brand : fg;
    const label = opts.label || 'Click me';
    // Generic icons are not used in the preview; leave the prefix empty.  You can
    // customise this if you wish to display an icon whenever opts.icon is true.
    const iconHtml = '';
    return `<a href="${opts.href || '#'}" style="display:inline-flex;align-items:center;gap:0.5rem;padding:${pad};border:${border};border-radius:${radius};background:${finalBg};color:${finalFg};font-weight:600;font-size:${font};text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.06)">${iconHtml}${label}</a>`;
  }

  // Open the modal and reset fields
  const openModal = () => {
    setModalDescription("");
    setModalName("");
    setModalPublic(false);
    setModalUseAI(true);
    setModalMode("create");
    setModalTargetName("");
    // Reset to the default platform value (no UI selection)
    setOptPlatform("button");
    setOptLabel("");
    setOptHref("");
    setOptTheme("brand");
    setOptVariant("solid");
    setOptSize("md");
    setOptShape("rounded");
    setOptIcon(true);
    setModalStep(0);
    setShowModal(true);
  };
  // Close the modal
  const closeModal = () => setShowModal(false);
  // Submit the custom component to the API and update local state
  const handleSubmitCustomComponent = async () => {
    setModalSubmitting(true);
    try {
      const res = await fetch("/api/custom-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalMode,
          prompt: modalDescription,
          name: modalName,
          targetName: modalTargetName,
          public: modalPublic,
          useAI: modalUseAI,
          // Include options only when not using AI.  When using AI the
          // `options` property is intentionally left empty; the API will
          // generate an appropriate component based solely on the prompt.
          options: modalUseAI ? {} : {
            label: optLabel,
            href: optHref,
            theme: optTheme,
            variant: optVariant,
            size: optSize,
            shape: optShape,
            icon: optIcon,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Échec de la création du composant");
      }
      const json = await res.json();
      if (json?.component) {
        setCustomComponents((prev) => {
          const others = prev.filter((c: any) => c._id !== json.component._id);
          return [...others, json.component];
        });
        setShowModal(false);
        showToast(
          modalMode === "modify"
            ? `Le composant "${json.component.name}" a été modifié avec succès.`
            : `Le composant "${json.component.name}" a été créé avec succès.`,
          'success'
        );
      }
    } catch (e: any) {
      console.error(e);
      showToast(String(e?.message || e), 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

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
  }, [slug]);

  const mergedConfig = useMemo(() => {
    const nextConfig: any = {
      ...config,
      categories: { ...(config as any).categories },
      components: { ...(config as any).components },
    };
    // Ensure categories exist for AI‑generated and manually authored components.
    if (!nextConfig.categories.ai) {
      nextConfig.categories.ai = { title: "Généré IA", components: [] };
    }
    if (!nextConfig.categories.manual) {
      nextConfig.categories.manual = { title: "Personnalisé", components: [] };
    }
    if (!Array.isArray(customComponents) || customComponents.length === 0) {
      return nextConfig;
    }
    customComponents.forEach((comp: any) => {
      const compName = String(comp.name || "Unnamed");
      // Choose the destination category based on whether AI generated the component
      const cat = comp?.ai ? 'ai' : 'manual';
      // Only register the component once per session
      if (!nextConfig.categories[cat].components.includes(compName)) {
        nextConfig.categories[cat].components.push(compName);
      }
      // Do not overwrite if the component is already defined in the config
      if (!nextConfig.components[compName]) {
        // Define a render function that applies responsive style fields in addition
        // to injecting placeholder replacements. These style fields give users
        // standard options like margin, padding, background, border radius and box shadow.
        const renderFn = (props: any) => {
          // Begin with the stored HTML for this custom component
          let html: string = comp.code || "";
          try {
            if (props && typeof props === 'object') {
              // Replace the label text between the first opening and closing tag
              if (typeof props.label === 'string' && props.label) {
                html = html.replace(/>([^<]*)</, `>${props.label}<`);
              }
              // Replace any href attribute with the provided URL
              if (typeof props.href === 'string' && props.href) {
                html = html.replace(/href="[^"]*"/, `href="${props.href}"`);
              }
              // Generic placeholder replacement: any {{key}} in the HTML
              // will be replaced by the corresponding prop value.  For
              // special fields like "links", split comma‑separated values
              // into anchor tags when the placeholder exists.
              Object.keys(props).forEach((key) => {
                const val: any = (props as any)[key];
                if (val == null) return;
                const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}}`, 'g');
                // Handle arrays such as navigation items or slides
                if (Array.isArray(val)) {
                  if (key === 'links' || key === 'items') {
                    const itemsHtml = val
                      .map((item: any) => {
                        if (typeof item === 'string') {
                          return `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${item}</a>`;
                        }
                        const label = item.label || '';
                        const href = item.href || '#';
                        const target = item.target || '_self';
                        return `<a href="${href}" target="${target}" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`;
                      })
                      .join('');
                    html = html.replace(re, itemsHtml);
                    return;
                  }
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
                  // Fallback: join array items with spaces
                  const joined = val.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
                  html = html.replace(re, joined);
                  return;
                }
                if (typeof val === 'string') {
                  if (key === 'links') {
                    const linkLabels = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
                    const linksHtml = linkLabels
                      .map((label: string) => `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`)
                      .join('');
                    html = html.replace(re, linksHtml);
                    return;
                  }
                  if (key === 'images') {
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
            // ignore any errors in string replacement
          }
          const hasHtml = (html || '').trim().length > 0;
          const fallback = `<div style="padding:12px;border:1px dashed #e5e7eb;border-radius:8px;color:#6b7280;font-size:12px;background:#fafafa">No HTML stored for ${compName}. Use “Modifier” in custom components to add code.</div>`;
          // Apply responsive fields to the wrapper style. When the user edits
          // margin, padding, background, borderRadius or boxShadow in the right
          // panel these values are reflected in the rendered output.
          const style: React.CSSProperties = {
            display: 'block',
            width: '100%',
            ...(props?.margin != null ? { margin: `${props.margin}px` } : {}),
            ...(props?.padding != null ? { padding: `${props.padding}px` } : {}),
            ...(props?.background ? { background: props.background } : {}),
            ...(props?.borderRadius != null ? { borderRadius: `${props.borderRadius}px` } : {}),
            ...(props?.boxShadow ? { boxShadow: props.boxShadow } : {}),
          };
          const onClick = (e: any) => { if ((props as any)?.puck?.isEditing) { e.preventDefault(); e.stopPropagation(); } };
          return (
            <div
              ref={(props as any)?.puck?.dragRef}
              data-puck-component={compName}
              style={style}
              onClick={onClick}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: hasHtml ? html : fallback }}
            />
          );
        };
        // Base responsive fields available on every custom component. These ensure
        // a consistent editing experience across AI‑generated and manual widgets.
        const responsiveFields = {
          margin: { type: 'number', label: 'Margin (px)', defaultValue: 0 },
          padding: { type: 'number', label: 'Padding (px)', defaultValue: 0 },
          background: { type: 'text', label: 'Background', defaultValue: '' },
          borderRadius: { type: 'number', label: 'Radius (px)', defaultValue: 0 },
          boxShadow: { type: 'text', label: 'Shadow', defaultValue: '' },
        } as const;
        // Preserve any field definitions provided by the component's config. When no
        // config is present we fall back to a simple set of controls for links and labels.
        const fallbackFields = {
          label: { type: 'text', label: 'Label' },
          href: { type: 'text', label: 'URL' },
          theme: {
            type: 'select',
            label: 'Theme',
            options: [
              { label: 'Brand', value: 'brand' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ],
          },
          variant: {
            type: 'select',
            label: 'Variant',
            options: [
              { label: 'Solid', value: 'solid' },
              { label: 'Outline', value: 'outline' },
              { label: 'Ghost', value: 'ghost' },
            ],
          },
          size: {
            type: 'select',
            label: 'Size',
            options: [
              { label: 'Small', value: 'sm' },
              { label: 'Medium', value: 'md' },
              { label: 'Large', value: 'lg' },
            ],
          },
          shape: {
            type: 'select',
            label: 'Shape',
            options: [
              { label: 'Rounded', value: 'rounded' },
              { label: 'Pill', value: 'full' },
            ],
          },
          icon: {
            type: 'select',
            label: 'Show icon',
            options: [
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ],
            // Default to false so the icon is hidden unless explicitly enabled.
            defaultValue: 'false',
          },
        } as const;
        const compConfig = (comp.config || {}) as any;
        const mergedFields = {
          ...responsiveFields,
          ...(compConfig.fields || fallbackFields),
        };
        nextConfig.components[compName] = {
          label: compName,
          inline: true,
          fields: mergedFields,
          ...compConfig,
          render: renderFn,
        };
      }
    });
    return nextConfig;
  }, [customComponents]);

  // Helper to render a preview of a custom component example using the same
  // placeholder replacement logic as the runtime renderer.
  const renderCustomExampleHtml = (comp: any, exampleProps: any): string => {
    try {
      let html: string = comp.code || "";
      const props = exampleProps || {};
      Object.keys(props).forEach((key) => {
        const val: any = (props as any)[key];
        const re = new RegExp(`\\\\{\\\\{\\\\s*${key}\\\\s*\\\\}}`, 'g');
        // Support array values for navigation items and slides
        if (Array.isArray(val)) {
          if (key === 'links' || key === 'items') {
            const itemsHtml = val
              .map((item: any) => {
                if (typeof item === 'string') {
                  return `<a href="#" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${item}</a>`;
                }
                const label = item.label || '';
                const href = item.href || '#';
                const target = item.target || '_self';
                return `<a href="${href}" target="${target}" style="color:#ffffff;text-decoration:none;margin-left:1rem;">${label}</a>`;
              })
              .join('');
            html = html.replace(re, itemsHtml);
            return;
          }
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
          const joined = val.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
          html = html.replace(re, joined);
          return;
        }
        if (typeof val === 'string') {
          if (key === 'links') {
            const linkLabels = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
            const linksHtml = linkLabels
              .map((label: string) => `<a href=\"#\" style=\"color:#ffffff;text-decoration:none;margin-left:1rem;\">${label}</a>`)
              .join('');
            html = html.replace(re, linksHtml);
          } else if (key === 'images') {
            const urls = val.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
            const imagesHtml = urls
              .map((url: string) => `<div style=\"flex:0 0 100%;\"><img src=\"${url}\" style=\"width:100%;height:auto;object-fit:cover;\"/></div>`)
              .join('');
            html = html.replace(re, imagesHtml);
          } else {
            html = html.replace(re, val);
          }
        }
      });
      return html;
    } catch {
      return comp.code || '';
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const node = editorRef.current;
    if (node) {
      node.addEventListener("click", handler, true);
    }
    return () => {
      if (node) node.removeEventListener("click", handler, true);
    };
  }, []);


  // Sync fullscreen state from query (?fs=1)
  useEffect(() => {
    const fs = search?.get("fs");
    if (fs === "1") setSidebarCollapsed(true);
  }, [search]);

  // Load existing draft on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (active) setData(json?.data ?? {});
      } catch (e) {
        console.warn("Failed to load Puck doc:", e);
        if (active) setData({});
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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Éditeur Puck</h1>
            <p className="text-sm text-gray-600">Glissez-déposez des composants, ajustez leurs propriétés, sauvegardez et publiez.</p>
          </div>
          <a
            href="/dashboard/apps"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Retour aux apps
          </a>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <div className="animate-spin rounded-full h-5 w-5 border-4 border-gray-300 border-t-gray-700 mr-3"></div>
              <span className="text-sm text-gray-600">Chargement…</span>
            </div>
          ) : (
          <ActionStateProvider>
          <div ref={editorRef}>
          <Puck
            key={`${slug}:${customComponents?.length ?? 0}`}
            config={mergedConfig as any}
            data={data}
            viewports={[
              { width: 360, height: "auto", label: "Mobile" },
              { width: 768, height: "auto", label: "Tablet" },
              { width: 1280, height: "auto", label: "Desktop" },
              { width: 1440, height: "auto", label: "Wide" },
            ]}
            overrides={{
              // Customize the Puck Drawer to include an outline above the component list.
              // This outline displays the current component hierarchy alongside the component palette,
              // making it easier to find and insert layouts and widgets from a single place.
              drawer: ({ children }) => (
                <div className="flex flex-col h-full">
                  {/* Show the outline of the current document at the top */}
                  <div className="border-b border-gray-200 max-h-[40vh] overflow-auto">
                    <Puck.Outline />
                  </div>
                  {/* Show the default component list below */}
                  <div className="flex-1 overflow-auto">{children}</div>
                </div>
              ),

              headerActions: ({ children }) => {
                const appState = usePuckHook((s) => s.appState);
                const current = appState?.data;
                const isFs = sidebarCollapsed;
                const onToggleFs = () => {
                  const next = !isFs;
                  setSidebarCollapsed(next);
                  try {
                    const usp = new URLSearchParams(search?.toString() || "");
                    if (next) usp.set("fs", "1");
                    else usp.delete("fs");
                    const base = "/dashboard/puck";
                    const slugParam = usp.get("slug") ?? slug;
                    if (!usp.get("slug") && slugParam) usp.set("slug", slugParam);
                    router.replace(`${base}?${usp.toString()}`, { scroll: false });
                  } catch {}
                };
                // Ensure the saved document stores the currently selected preview viewport
                // width into root.props.viewport so the published page can render at the
                // intended device size. We try a few likely locations in Puck state to
                // find the active viewport width and fall back to the existing value.
                const withSyncedViewport = (doc: any) => {
                  try {
                    const s: any = appState || {};
                    let w: number | undefined;
                    const candidates: any[] = [
                      s?.viewport,
                      s?.previewSize,
                      s?.selectedViewport,
                      s?.renderer?.viewport,
                      s?.editor?.viewport,
                      s?.canvas?.viewport,
                    ];
                    for (const c of candidates) {
                      if (c == null) continue;
                      if (typeof c === "number") { w = c; break; }
                      if (typeof c === "string" && /^\d+$/.test(c)) { w = Number(c); break; }
                      if (typeof c === "object") {
                        const cw = (c as any).width;
                        if (typeof cw === "number") { w = cw; break; }
                        if (typeof cw === "string" && /^\d+$/.test(cw)) { w = Number(cw); break; }
                      }
                    }
                    const nextViewport = (w && w > 0) ? String(w) : (doc?.root?.props?.viewport ?? "fluid");
                    return {
                      ...doc,
                      root: {
                        ...(doc?.root || {}),
                        props: { ...((doc?.root || {}).props || {}), viewport: nextViewport },
                      },
                    };
                  } catch {
                    return doc;
                  }
                };
                // Auto-save removed per request; manual save only
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={onToggleFs}
                        title={isFs ? "Exit full page" : "Full page"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-transform duration-150 active:scale-95"
                      >
                        {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                      <input
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                        onClick={() => current && saveDoc(withSyncedViewport(current), "draft")}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        {saving === "draft" ? "Saving…" : "Save draft"}
                      </button>
                      <button
                        type="button"
                        disabled={saving !== "idle"}
                        onClick={() => current && saveDoc(withSyncedViewport(current), "published")}
                        className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50"
                      >
                        {saving === "published" ? "Publishing…" : "Publish"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // slug is like "appSlug/page"; we resolve appId by listing user's apps
                          const parts = (slug || '').split('/');
                          const appSlug = parts[0] || '';
                          const pagePart = parts.slice(1).join('/') || 'home';
                          let url = `/published/${parts.map(encodeURIComponent).join('/')}`; // fallback
                          if (appSlug) {
                            try {
                              const res = await fetch('/api/apps', { cache: 'no-store' });
                              const json = await res.json();
                              const list = Array.isArray(json?.apps) ? json.apps : [];
                              const mine = list.find((a: any) => a?.slug === appSlug);
                              if (mine?._id) {
                                url = `/published/app/${encodeURIComponent(mine._id)}/${pagePart.split('/').map(encodeURIComponent).join('/')}`;
                              }
                            } catch {}
                          }
                          try { window.open(url, '_blank'); } catch { router.push(url); }
                        } catch {
                          const url = `/published/${slug.split('/').map(encodeURIComponent).join('/')}`;
                          try { window.open(url, '_blank'); } catch { router.push(url); }
                        }
                      }}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Open published
                    </button>
                    <a
                      href="/dashboard/apps"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Apps
                    </a>
                    {children}
                    <button
                      type="button"
                      onClick={openModal}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Nouveau composant
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDocsModal(true)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      How to use
                    </button>
          </>
          );
        },
            }}
            onPublish={(newData) => {
              // Persist and mark as published
              saveDoc(newData, "published");
            }}
          />
          </div>
          </ActionStateProvider>
          )}
          {/* Inline mode is now used for all components so we no longer need to override
              default wrapper behaviour. The previous global CSS overrides have been
              removed to allow flex and grid items to size themselves naturally. */}
        </div>
      </div>
  {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* The modal container is relative so we can overlay a spinner when generating a component */}
          <div className="bg-white relative rounded-lg w-full max-w-xl p-5">
            {/* Display a spinner overlay while the custom component is being generated or modified */}
            {modalSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
                <span className="sr-only">Génération en cours…</span>
              </div>
            )}
            {modalStep === 0 && (
              <>
                <h2 className="text-lg font-semibold mb-3">Créer ou modifier</h2>
                <div className="flex items-center gap-6 mb-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="mode" value="create" checked={modalMode === 'create'} onChange={() => setModalMode('create')} />
                    <span>Créer</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="mode" value="modify" checked={modalMode === 'modify'} onChange={() => setModalMode('modify')} />
                    <span>Modifier</span>
                  </label>
                </div>
                {modalMode === 'modify' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Composant à modifier</label>
                    <select className="w-full border border-gray-300 rounded-md p-2" value={modalTargetName} onChange={(e) => setModalTargetName(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {customComponents.map((c: any) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
  )}

      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">How to use custom components</h2>
              <button onClick={() => setShowDocsModal(false)} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
            </div>
            {customComponents.length === 0 ? (
              <div className="text-sm text-gray-600">No custom components yet.</div>
            ) : (
              <div className="space-y-8">
                {customComponents.map((c: any) => (
                  <div key={c._id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      <div className="flex items-center gap-2">
                        {c.ai ? (
                          <span className="text-xs text-green-600 font-medium">AI</span>
                        ) : (
                          <span className="text-xs text-blue-600 font-medium">Manual</span>
                        )}
                        {c.public ? (
                          <span className="text-xs text-gray-500">Public</span>
                        ) : (
                          <span className="text-xs text-gray-500">Private</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{c?.docs?.summary || 'No summary available.'}</p>
                    {c?.docs?.fields && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Fields</div>
                        <ul className="list-disc pl-5 text-sm text-gray-700">
                          {Object.entries(c.docs.fields as any).map(([k, v]: any) => (
                            <li key={k}><span className="font-mono">{String(k)}</span>: {String(v)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Examples</div>
                      {Array.isArray(c?.docs?.examples) && c.docs.examples.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {c.docs.examples.map((ex: any, idx: number) => {
                            const html = renderCustomExampleHtml(c, ex?.props || {});
                            const json = JSON.stringify(ex?.props || {}, null, 2);
                            return (
                              <div key={idx} className="border border-gray-200 rounded p-3">
                                <div className="font-medium mb-1">{ex?.title || `Example ${idx+1}`}</div>
                                <div className="text-sm text-gray-600 mb-2">{ex?.description || ''}</div>
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">Preview</div>
                                  <div className="border rounded p-2">
                                    <div dangerouslySetInnerHTML={{ __html: html }} />
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">Props JSON</div>
                                  <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto max-h-40"><code>{json}</code></pre>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { try { navigator.clipboard.writeText(json); } catch {} }}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                  >
                                    Copy props
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">No examples provided.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows={3}
                  placeholder={modalMode === 'create' ? "Ex: bouton WhatsApp vert arrondi avec texte blanc" : "Ex: changer la couleur en noir et rendre le bouton plus grand"}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />
                <label className="inline-flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={modalUseAI} onChange={(e) => setModalUseAI(e.target.checked)} />
                  <span>Utiliser l’IA (sinon utiliser des modèles par défaut)</span>
                </label>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Annuler</button>
                  <button type="button" disabled={modalMode === 'modify' ? !modalTargetName || !modalDescription.trim() : !modalDescription.trim()} onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">Suivant</button>
                </div>
              </>
            )}

            {modalStep === 1 && (
              <>
                {modalUseAI ? (
                  // When using AI, skip manual options.  The AI will infer any
                  // necessary properties from the description, and the resulting
                  // component fields will be provided in the custom component’s
                  // configuration.  Show only a message and navigation.
                  <>
                    <h2 className="text-lg font-semibold mb-3">Options générées automatiquement</h2>
                    <p className="text-sm text-gray-600 mb-4">Les paramètres de ce composant seront déterminés par l’IA selon votre description. Vous pourrez les modifier plus tard via le panneau de propriétés.</p>
                    <div className="flex justify-between gap-2 mt-4">
                      <button type="button" onClick={() => setModalStep(0)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" onClick={() => setModalStep(2)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Suivant</button>
                    </div>
                  </>
                ) : (
                  // When AI is disabled, expose manual options for the fallback
                  // template builder and show a live preview.
                  <>
                    <h2 className="text-lg font-semibold mb-3">Options</h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <input className="w-full border border-gray-300 rounded-md p-2" value={optLabel} onChange={(e) => setOptLabel(e.target.value)} placeholder="Label du bouton" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input className="w-full border border-gray-300 rounded-md p-2" value={optHref} onChange={(e) => setOptHref(e.target.value)} placeholder="https://…" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Thème</label>
                        <select className="w-full border border-gray-300 rounded-md p-2" value={optTheme} onChange={(e) => setOptTheme(e.target.value as any)}>
                          <option value="brand">Marque</option>
                          <option value="light">Clair</option>
                          <option value="dark">Sombre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Variant</label>
                        <select className="w-full border border-gray-300 rounded-md p-2" value={optVariant} onChange={(e) => setOptVariant(e.target.value as any)}>
                          <option value="solid">Plein</option>
                          <option value="outline">Contour</option>
                          <option value="ghost">Fantôme</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Taille</label>
                        <select className="w-full border border-gray-300 rounded-md p-2" value={optSize} onChange={(e) => setOptSize(e.target.value as any)}>
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Forme</label>
                        <select className="w-full border border-gray-300 rounded-md p-2" value={optShape} onChange={(e) => setOptShape(e.target.value as any)}>
                          <option value="rounded">Arrondie</option>
                          <option value="full">Pill</option>
                        </select>
                      </div>
                      <label className="inline-flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={optIcon} onChange={(e) => setOptIcon(e.target.checked)} />
                        <span>Afficher l’icône</span>
                      </label>
                    </div>
                    {/* Live preview */}
                    <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                      <div className="text-xs text-gray-500 mb-2">Aperçu</div>
                      <div
                        className="inline-block"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: buildPreviewFromOptions({
                          label: optLabel,
                          href: optHref,
                          theme: optTheme,
                          variant: optVariant,
                          size: optSize,
                          shape: optShape,
                          icon: optIcon,
                        }) }}
                      />
                    </div>
                    <div className="flex justify-between gap-2 mt-4">
                      <button type="button" onClick={() => setModalStep(0)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" onClick={() => setModalStep(2)} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Suivant</button>
                    </div>
                  </>
                )}
              </>
            )}

            {modalStep === 2 && (
              <>
                {modalMode === 'create' ? (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Nom & visibilité</h2>
                    <input className="w-full border border-gray-300 rounded-md p-2 mb-4" placeholder="Nom unique du composant" value={modalName} onChange={(e) => setModalName(e.target.value)} />
                    <div className="flex items-center gap-4 mb-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="visibility" value="private" checked={!modalPublic} onChange={() => setModalPublic(false)} /><span>Privé</span></label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="visibility" value="public" checked={modalPublic} onChange={() => setModalPublic(true)} /><span>Public</span></label>
                    </div>
                    <div className="flex justify-between gap-2">
                      <button type="button" onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" disabled={modalSubmitting || !modalName.trim()} onClick={handleSubmitCustomComponent} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{modalSubmitting ? 'Création…' : 'Créer'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Confirmer la modification</h2>
                    <p className="text-sm text-gray-600 mb-4">Le composant « {modalTargetName || '—'} » sera modifié selon la description et les options choisies.</p>
                    <div className="flex justify-between gap-2">
                      <button type="button" onClick={() => setModalStep(1)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Précédent</button>
                      <button type="button" disabled={modalSubmitting || !modalTargetName} onClick={handleSubmitCustomComponent} className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">{modalSubmitting ? 'Modification…' : 'Modifier'}</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded-md text-sm shadow ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
