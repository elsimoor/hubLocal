// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { ActionStateProvider, runActions, ActionType, useActionState } from "./actions";
// import { selectionStore } from "./selectionStore";

// // Multi-select helpers
// const getPathFromPuck = (puck: any): string | null => {
//   try {
//     const p = (puck as any) || {};
//     if (Array.isArray(p.path)) return p.path.join(".");
//     if (typeof p.path === "string") return p.path as string;
//     if (typeof p.node?.path === "string") return p.node.path as string;
//     if (typeof p.key === "string") return p.key as string;
//     if (typeof p.id === "string") return p.id as string;
//   } catch {}
//   return null;
// };

// const isEditingFromPuck = (puck: any): boolean => {
//   try { return !!(puck as any)?.isEditing; } catch { return false; }
// };

// const outlineForSelected: React.CSSProperties = { outline: "2px solid #6366f1", outlineOffset: 2 };

// // Helper: get current pathname without requiring Next hooks (works in editor and published)
// const getPathname = () => (typeof window !== "undefined" ? window.location?.pathname || "/" : "/");
// // Determine if a route should be considered active.  To guard against passing
// // non-string values into String.prototype.replace(), always coerce inputs to
// // strings before normalising.  This prevents runtime errors when `href` or
// // other values are not strings.
// const routeIsActive = (href?: string, manual?: string) => {
//   if (!href) return String(manual) === "true";
//   const current = getPathname();
//   // Normalise paths by trimming trailing slashes.  Accept any input type and
//   // convert to string to avoid calling `.replace` on non-strings.
//   const normalize = (s: any) => String(s || "").replace(/\/+$/, "");
//   const a = normalize(current);
//   const b = normalize(href);
//   return String(manual) === "true" || a === b || a.startsWith(b + "/");
// };

// // Typing text used by TypingText block
// function TypingTextComponent({
//   text,
//   speed,
//   loop,
//   loopDelay,
//   cursor,
//   color,
//   fontSize,
//   fontFamily,
//   fontWeight,
//   textAlign,
// }: {
//   text?: string;
//   speed?: number;
//   loop?: boolean;
//   loopDelay?: number;
//   cursor?: boolean;
//   color?: string;
//   fontSize?: number;
//   fontFamily?: string;
//   fontWeight?: string;
//   textAlign?: string;
// }) {
//   const [displayed, setDisplayed] = useState("");
//   useEffect(() => {
//     let isCancelled = false;
//     let index = 0;
//     let timeout: NodeJS.Timeout;
//     function type() {
//       if (isCancelled) return;
//       if (!text) return;
//       setDisplayed(text.slice(0, index + 1));
//       if (index < text.length - 1) {
//         index++;
//         timeout = setTimeout(type, speed || 50);
//       } else if (loop) {
//         timeout = setTimeout(() => {
//           index = 0;
//           setDisplayed("");
//           type();
//         }, loopDelay || 500);
//       }
//     }
//     type();
//     return () => {
//       isCancelled = true;
//       clearTimeout(timeout);
//     };
//   }, [text, speed, loop, loopDelay]);
//   const style: React.CSSProperties = {
//     color: color || "#111827",
//     fontSize: fontSize ? `${fontSize}px` : undefined,
//     fontFamily: fontFamily || undefined,
//     fontWeight: fontWeight || undefined,
//     textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
//     display: "inline-block",
//   };
//   return (
//     <span style={style}>
//       {displayed}
//       {cursor ? <span style={{ animation: "blink 1s steps(2, start) infinite" }}>|</span> : null}
//       <style>{`@keyframes blink { from, to { opacity: 0 } 50% { opacity: 1 } }`}</style>
//     </span>
//   );
// }

// // Observe element width (for responsive in Navbar/Sidebar)
// function useElementWidth<T extends HTMLElement>() {
//   const ref = useRef<T | null>(null);
//   const [width, setWidth] = useState<number>(0);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     try { setWidth(el.getBoundingClientRect().width || 0); } catch {}
//     let ro: ResizeObserver | null = null;
//     try {
//       if (typeof ResizeObserver !== "undefined") {
//         ro = new ResizeObserver((entries) => {
//           for (const entry of entries) {
//             const w = entry.contentRect?.width ?? (entry.target as HTMLElement).clientWidth;
//             if (typeof w === "number") setWidth(w);
//           }
//         });
//         ro.observe(el);
//       } else {
//         const handler = () => setWidth(el.getBoundingClientRect().width || 0);
//         window.addEventListener("resize", handler);
//         return () => window.removeEventListener("resize", handler);
//       }
//     } catch {}
//     return () => { try { ro?.disconnect(); } catch {} };
//   }, []);
//   return { ref, width } as const;
// }

// export const puckConfig = {
//   categories: {
//     layout: { title: "Mise en page", components: ["Group", "Container", "Flex", "Grid", "Space"] },
//     typography: { title: "Typographie", components: ["Heading", "Text", "TypingText"] },
//     actions: { title: "Actions", components: ["Button"] },
//     media: { title: "Média", components: ["Image", "Video"] },
//     widgets: { title: "Widgets", components: ["QrCode", "SpotifyCard", "Testimonials", "LinksList", "ExternalPost", "ColorBox"] },
//     other: { title: "Autres", components: ["Card", "Hero", "Logos", "Navbar", "Sidebar", "Modal"] },
//   },
//   root: {
//     fields: {
//       title: { type: "text", label: "Titre de la page", defaultValue: "Titre" },
//       viewport: {
//         type: "select",
//         label: "Cible d’affichage",
//         options: [
//           { label: "Mobile (360)", value: "360" },
//           { label: "Tablet (768)", value: "768" },
//           { label: "Desktop (1280)", value: "1280" },
//           { label: "Wide (1440)", value: "1440" },
//           { label: "Fluid (100%)", value: "fluid" },
//         ],
//         defaultValue: "fluid",
//       },
//       // When true the ActionStateProvider will allow arbitrary JS execution from runJS actions.  When false
//       // any runJS actions will be ignored.  Exposing this as a field lets authors opt‑out per page.
//       allowCustomJS: { type: "select", label: "Autoriser JS personnalisé", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },
//       // Additional metadata for the page.  The slug is used when saving and publishing; description can be used
//       // for SEO or display in a header.  They don’t affect the visual render but are stored in the payload and
//       // exposed in the right panel like in the Puck example editor.
//       slug: { type: "text", label: "Slug", defaultValue: "default" },
//       description: { type: "textarea", label: "Description", defaultValue: "" },
//     },
//     render: ({ children, title, allowCustomJS }: any) => (
//       <ActionStateProvider allowCustomJS={String(allowCustomJS) === "true"}>
//         <div>
//           {title ? <h1 style={{ fontSize: "1.875rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h1> : null}
//           {children}
//         </div>
//       </ActionStateProvider>
//     ),
//   },
//   components: {
//     Group: {
//       label: "Groupe",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         display: { type: "select", label: "Affichage", options: [
//           { label: "Bloc", value: "block" },
//           { label: "Flex", value: "flex" },
//           { label: "Grille", value: "grid" },
//           { label: "Inline‑bloc", value: "inline-block" },
//         ], defaultValue: "block" },
//         gap: { type: "number", label: "Gap (px)", defaultValue: 0 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 0 },
//         margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
//         width: { type: "text", label: "Largeur", placeholder: "ex: 100% ou 800px" },
//         maxWidth: { type: "text", label: "Largeur max", placeholder: "ex: 1280px" },
//         height: { type: "text", label: "Hauteur", placeholder: "ex: auto ou 400px" },
//         minHeight: { type: "text", label: "Hauteur min", placeholder: "ex: 200px" },
//         background: { type: "text", label: "Background", placeholder: "couleur, gradient, image CSS" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
//         border: { type: "text", label: "Bordure", placeholder: "ex: 1px solid #e5e7eb" },
//         boxShadow: { type: "text", label: "Ombre", placeholder: "ex: 0 4px 12px rgba(0,0,0,.08)" },
//         opacity: { type: "number", label: "Opacité (0-1)", defaultValue: 1 },
//         position: { type: "select", label: "Position", options: [
//           { label: "Statique", value: "static" },
//           { label: "Relative", value: "relative" },
//           { label: "Absolue", value: "absolute" },
//           { label: "Fixe", value: "fixed" },
//           { label: "Collante", value: "sticky" },
//         ], defaultValue: "static" },
//         top: { type: "text", label: "Top" },
//         right: { type: "text", label: "Right" },
//         bottom: { type: "text", label: "Bottom" },
//         left: { type: "text", label: "Left" },
//         zIndex: { type: "number", label: "z-index", defaultValue: 0 },
//         // Flex specific
//         flexDirection: { type: "select", label: "Direction", options: [
//           { label: "Ligne", value: "row" }, { label: "Colonne", value: "column" }
//         ], defaultValue: "row" },
//         alignItems: { type: "select", label: "Align items", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" }
//         ], defaultValue: "stretch" },
//         justifyContent: { type: "select", label: "Justify", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Between", value: "space-between" }, { label: "Around", value: "space-around" }
//         ], defaultValue: "flex-start" },
//         // Grid specific
//         gridTemplateColumns: { type: "text", label: "Colonnes (template)", placeholder: "ex: repeat(3, 1fr)" },
//         gridTemplateRows: { type: "text", label: "Lignes (template)", placeholder: "ex: auto auto" },
//         gridAutoRows: { type: "text", label: "Lignes auto", defaultValue: "auto" },
//         gridAutoFlow: { type: "select", label: "Flux auto", options: [
//           { label: "Lignes", value: "row" }, { label: "Colonnes", value: "column" }, { label: "Dense (row)", value: "row dense" }, { label: "Dense (column)", value: "column dense" }
//         ], defaultValue: "row" },
//         alignContent: { type: "select", label: "Align content", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Between", value: "space-between" }, { label: "Around", value: "space-around" }, { label: "Stretch", value: "stretch" }
//         ], defaultValue: "stretch" },
//         justifyItems: { type: "select", label: "Justify items", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" }
//         ], defaultValue: "stretch" },
//       },
//       render: ({ children: Content, display, gap, padding, margin, width, maxWidth, height, minHeight, background, borderRadius, border, boxShadow, opacity, position, top, right, bottom, left, zIndex, flexDirection, alignItems, justifyContent, gridTemplateColumns, gridTemplateRows, gridAutoRows, gridAutoFlow, alignContent, justifyItems, puck }: any) => {
//         const base: React.CSSProperties = {
//           display: display || "block",
//           gap: gap ? `${gap}px` : undefined,
//           padding: padding ? `${padding}px` : undefined,
//           margin: margin ? `${margin}px` : undefined,
//           width: width || undefined,
//           maxWidth: maxWidth || undefined,
//           height: height || undefined,
//           minHeight: minHeight || undefined,
//           background: background || undefined,
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           border: border || undefined,
//           boxShadow: boxShadow || undefined,
//           opacity: typeof opacity === "number" ? opacity : undefined,
//           position: position || undefined,
//           top: top || undefined,
//           right: right || undefined,
//           bottom: bottom || undefined,
//           left: left || undefined,
//           zIndex: typeof zIndex === "number" ? zIndex : undefined,
//         };
//         if (display === "flex") {
//           (base as any).flexDirection = flexDirection || "row";
//           (base as any).alignItems = alignItems || undefined;
//           (base as any).justifyContent = justifyContent || undefined;
//         }
//         if (display === "grid") {
//           (base as any).gridTemplateColumns = gridTemplateColumns || undefined;
//           (base as any).gridTemplateRows = gridTemplateRows || undefined;
//           (base as any).gridAutoRows = gridAutoRows || undefined;
//           (base as any).gridAutoFlow = gridAutoFlow || undefined;
//           (base as any).alignContent = alignContent || undefined;
//           (base as any).justifyItems = justifyItems || undefined;
//         }
//         const path = getPathFromPuck(puck);
//         const isEditing = isEditingFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) {
//             e.preventDefault(); e.stopPropagation();
//             selectionStore.toggle(path, true);
//           } else {
//             selectionStore.toggle(path, false);
//           }
//         };
//         return (
//           <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
//             {typeof Content === "function" ? <Content /> : null}
//           </div>
//         );
//       },
//     },
//     FlagsDebug: {
//       label: "Flags Debug",
//       inline: true,
//       fields: {
//         showControls: { type: "select", label: "Show controls", options: [ { label: "Yes", value: "true" }, { label: "No", value: "false" } ], defaultValue: "true" },
//         note: { type: "text", label: "Note", defaultValue: "Use for wiring only; remove before publish." },
//       },
//       render: ({ showControls, note, puck }: any) => {
//         const { flags, setFlag, toggleFlag } = useActionState();
//         const [name, setName] = React.useState<string>("sidebarOpen");
//         const isEditing = (puck as any)?.isEditing;
//         return (
//           <div ref={puck?.dragRef} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace", fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 12, margin: "8px 0" }}>
//             <div style={{ marginBottom: 6, fontWeight: 600 }}>Flags Debug</div>
//             <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 8 }}>{JSON.stringify(flags, null, 2)}</div>
//             {String(showControls) === "true" ? (
//               <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                 <input value={name} onChange={(e) => setName(e.target.value)} placeholder="flag name" style={{ border: "1px solid #ddd", borderRadius: 6, padding: "4px 8px" }} />
//                 <button type="button" onClick={() => setFlag((name || "").trim(), true)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set true</button>
//                 <button type="button" onClick={() => setFlag((name || "").trim(), false)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set false</button>
//                 <button type="button" onClick={() => toggleFlag((name || "").trim())} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>toggle</button>
//                 {isEditing ? <span style={{ color: "#888" }}>(editor)</span> : null}
//               </div>
//             ) : null}
//             {note ? <div style={{ marginTop: 6, color: "#666" }}>{note}</div> : null}
//           </div>
//         );
//       },
//     },
//     Container: {
//       label: "Conteneur",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 8 },
//         margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
//         borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
//       },
//       inline: true,
//       render: ({ children: Content, padding, margin, backgroundColor, borderRadius, borderColor, borderWidth, puck }: any) => {
//         const base: React.CSSProperties = {
//           padding: `${padding || 0}px`,
//           margin: `${margin || 0}px`,
//           backgroundColor: backgroundColor || undefined,
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           borderWidth: borderWidth ? `${borderWidth}px` : undefined,
//           borderColor: borderColor || undefined,
//           borderStyle: borderWidth ? "solid" : undefined,
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>{typeof Content === "function" ? <Content /> : null}</div>;
//       },
//     },
//     Flex: {
//       label: "Flex",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         direction: { type: "select", label: "Direction", options: [{ label: "Ligne", value: "row" }, { label: "Colonne", value: "column" }], defaultValue: "row" },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         wrap: { type: "select", label: "Retour à la ligne", options: [
//           { label: "Pas de retour", value: "nowrap" },
//           { label: "Retour", value: "wrap" },
//           { label: "Retour inversé", value: "wrap-reverse" },
//         ], defaultValue: "nowrap" },
//         alignItems: { type: "select", label: "Alignement transversal", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "flex-start" },
//         justifyContent: { type: "select", label: "Justification", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
//         ], defaultValue: "flex-start" },
//         alignContent: { type: "select", label: "Alignement des lignes", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//       },
//       render: ({ children: Content, direction, gap, gapX, gapY, wrap, alignItems, justifyContent, alignContent, puck }: any) => {
//         const base: React.CSSProperties = {
//           display: "flex",
//           flexDirection: direction || "row",
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || undefined,
//           justifyContent: justifyContent || undefined,
//           alignContent: alignContent || undefined,
//           flexWrap: wrap || "nowrap",
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
//             {typeof Content === "function" ? <Content className="puck-flex-slot" /> : null}
//           </div>
//         );
//       },
//     },
//     Grid: {
//       label: "Grille",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         columns: { type: "number", label: "Colonnes", defaultValue: 2 },
//         rows: { type: "number", label: "Lignes", defaultValue: 1 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         autoRows: { type: "text", label: "Taille des lignes implicites", defaultValue: "auto" },
//         autoFlow: { type: "select", label: "Flux automatique", options: [
//           { label: "Lignes", value: "row" }, { label: "Colonnes", value: "column" }, { label: "Densité (row)", value: "row dense" }, { label: "Densité (column)", value: "column dense" },
//         ], defaultValue: "row" },
//         alignItems: { type: "select", label: "Alignement des éléments", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         justifyItems: { type: "select", label: "Justification des éléments", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         alignContent: { type: "select", label: "Alignement du contenu", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         justifyContent: { type: "select", label: "Justification du contenu", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         templateColumns: { type: "text", label: "Template colonnes (avancé)", placeholder: "ex: 200px 1fr auto" },
//         templateRows: { type: "text", label: "Template lignes (avancé)", placeholder: "ex: auto auto" },
//       },
//       render: ({ children: Content, columns, rows, gap, gapX, gapY, autoRows, autoFlow, alignItems, justifyItems, alignContent, justifyContent, templateColumns, templateRows, puck }: any) => {
//         // Coerce template strings to avoid calling `.trim()` on non-strings.  If the
//         // advanced template fields are provided and have non-empty string
//         // contents, use them verbatim; otherwise fall back to a computed
//         // `repeat()` template based on the numeric column/row count.
//         const colStr = typeof templateColumns === "string" ? templateColumns.trim() : String(templateColumns ?? "").trim();
//         const rowStr = typeof templateRows === "string" ? templateRows.trim() : String(templateRows ?? "").trim();
//         const gridTemplateColumns = colStr ? templateColumns : (columns ? `repeat(${columns}, 1fr)` : undefined);
//         const gridTemplateRows = rowStr ? templateRows : (rows ? `repeat(${rows}, auto)` : undefined);
//         const base: React.CSSProperties = {
//           display: "grid",
//           gridTemplateColumns,
//           gridTemplateRows,
//           gridAutoRows: autoRows || "auto",
//           gridAutoFlow: autoFlow || "row",
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || undefined,
//           justifyItems: justifyItems || undefined,
//           alignContent: alignContent || undefined,
//           justifyContent: justifyContent || undefined,
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
//             {typeof Content === "function" ? <Content className="puck-grid-slot" /> : null}
//           </div>
//         );
//       },
//     },
//     Space: {
//       label: "Espace",
//       inline: true,
//       fields: {
//         size: { type: "number", label: "Taille (px)", defaultValue: 16 },
//         orientation: { type: "select", label: "Orientation", options: [
//           { label: "Verticale", value: "vertical" },
//           { label: "Horizontale", value: "horizontal" },
//         ], defaultValue: "vertical" },
//       },
//       render: ({ size, orientation, puck }: any) => {
//         const base: React.CSSProperties = {
//           width: orientation === "horizontal" ? `${size || 0}px` : "100%",
//           height: orientation === "vertical" ? `${size || 0}px` : undefined,
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown} />;
//       },
//     },
//     Heading: {
//       label: "Titre",
//       inline: true,
//       fields: {
//         children: { type: "text", label: "Texte", placeholder: "Votre titre" },
//         level: {
//           type: "select",
//           label: "Niveau",
//           options: [
//             { label: "H1", value: "1" },
//             { label: "H2", value: "2" },
//             { label: "H3", value: "3" },
//             { label: "H4", value: "4" },
//             { label: "H5", value: "5" },
//             { label: "H6", value: "6" },
//           ],
//           defaultValue: "2",
//         },
//         color: { type: "text", label: "Couleur", defaultValue: "#111827" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 24 },
//         fontFamily: { type: "text", label: "Police", placeholder: "" },
//         fontWeight: {
//           type: "select",
//           label: "Graisse",
//           options: [
//             { label: "Normal", value: "400" },
//             { label: "Moyen", value: "500" },
//             { label: "Semi‑gras", value: "600" },
//             { label: "Gras", value: "700" },
//           ],
//           defaultValue: "600",
//         },
//       },
//       render: ({ children, level, color, fontSize, fontFamily, fontWeight, puck }: any) => {
//         const base: React.CSSProperties = {
//           color: color || "#111827",
//           fontSize: fontSize ? `${fontSize}px` : undefined,
//           fontFamily: fontFamily || undefined,
//           fontWeight: fontWeight || undefined,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const tag = `h${level || '2'}`;
//         const El: any = tag as any;
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return <El ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>{children}</El>;
//       },
//     },
//     Text: {
//       label: "Texte",
//       inline: true,
//       fields: {
//         children: { type: "textarea", label: "Contenu", placeholder: "Votre texte" },
//         color: { type: "text", label: "Couleur", defaultValue: "#374151" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 16 },
//         fontFamily: { type: "text", label: "Police", placeholder: "" },
//         fontWeight: { type: "select", label: "Graisse", options: [
//           { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
//         ], defaultValue: "400" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
//         ], defaultValue: "left" },
//       },
//       render: ({ children, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
//         const base: React.CSSProperties = {
//           color: color || "#374151",
//           fontSize: fontSize ? `${fontSize}px` : undefined,
//           fontFamily: fontFamily || undefined,
//           fontWeight: fontWeight || undefined,
//           textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return <p ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>{children}</p>;
//       },
//     },
//     Button: {
//       label: "Bouton",
//       inline: true,
//       fields: {
//         elId: { type: "text", label: "Element ID (cible)", defaultValue: "" },
//         label: { type: "text", label: "Libellé", placeholder: "Cliquez ici" },
//         href: { type: "text", label: "URL", placeholder: "#" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#7c3aed" },
//         color: { type: "text", label: "Couleur du texte", defaultValue: "#ffffff" },
//         paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
//         paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 8 },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         fontSize: { type: "number", label: "Taille texte (px)", defaultValue: 14 },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "scrollTo", value: "scrollTo" },
//               { label: "copy", value: "copy" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "navigate" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             targetElId: { type: "text", label: "targetElId", defaultValue: "" },
//             selector: { type: "text", label: "selector", defaultValue: "" },
//             offset: { type: "number", label: "offset", defaultValue: 0 },
//             smooth: { type: "select", label: "smooth", options: [ { label: "No", value: "false" }, { label: "Yes", value: "true" } ], defaultValue: "true" },
//             text: { type: "text", label: "text", defaultValue: "" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "" },
//             value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "navigate", url: "#", target: "_self" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ elId, actions = [], label, href, backgroundColor, color, paddingX, paddingY, borderRadius, fontSize, puck }: any) => {
//         const actionCtx = useActionState();
//         const base: React.CSSProperties = {
//           display: "inline-block",
//           backgroundColor: backgroundColor || "#7c3aed",
//           color: color || "#ffffff",
//           paddingLeft: `${paddingX || 0}px`,
//           paddingRight: `${paddingX || 0}px`,
//           paddingTop: `${paddingY || 0}px`,
//           paddingBottom: `${paddingY || 0}px`,
//           borderRadius: `${borderRadius || 0}px`,
//           textDecoration: "none",
//           fontSize: fontSize ? `${fontSize}px` : "0.875rem",
//           fontWeight: 500,
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const clickActs = list.filter((a) => a.event === "click");
//           if (clickActs.length > 0) {
//             e.preventDefault();
//             await runActions(clickActs, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//             return;
//           }
//           // In editor: never navigate away
//           if ((puck as any)?.isEditing) {
//             e.preventDefault();
//             return;
//           }
//         };
//         const handleEnter = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === "mouseenter");
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//         };
//         const handleLeave = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === "mouseleave");
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//         };
//         return (
//           <a id={elId || undefined} ref={puck?.dragRef} href={href || '#'} style={style} onMouseDown={onMouseDown} onClick={handleClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave} rel="noopener noreferrer">
//             {label || 'Cliquez ici'}
//           </a>
//         );
//       },
//     },
//     Image: {
//       label: "Image",
//       inline: true,
//       fields: {
//         src: { type: "text", label: "Source", placeholder: "/placeholder_light_gray_block.png" },
//         alt: { type: "text", label: "Texte alternatif", placeholder: "Image" },
//         width: { type: "number", label: "Largeur (px)", defaultValue: 0 },
//         height: { type: "number", label: "Hauteur (px)", defaultValue: 0 },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "setFlag" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
//             value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ src, alt, width, height, actions = [], puck }: any) => {
//         const actionCtx = useActionState();
//         const base: React.CSSProperties = {
//           width: width ? `${width}px` : "100%",
//           height: height ? `${height}px` : "auto",
//           display: "block",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//           cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === ev);
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
//         };
//         return (
//           <img
//             ref={puck?.dragRef}
//             src={src || "/placeholder_light_gray_block.png"}
//             alt={alt || "Image"}
//             style={style}
//             onMouseDown={onMouseDown}
//             onClick={(e) => runEvt("click", e.currentTarget)}
//             onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)}
//             onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}
//           />
//         );
//       },
//     },
//     Video: {
//       label: "Vidéo",
//       inline: true,
//       fields: { url: { type: "text", label: "URL", placeholder: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 315 } },
//       render: ({ url, height, puck }: any) => {
//         let embedUrl = url;
//         try {
//           const u = new URL(url);
//           if (u.hostname === "www.youtube.com" && u.searchParams.get("v")) {
//             embedUrl = `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
//           } else if (u.hostname === "youtu.be") {
//             embedUrl = `https://www.youtube.com/embed${u.pathname}`;
//           }
//         } catch {}
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { width: "100%", height: height || 315, marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             <iframe src={embedUrl || ""} width="100%" height={height || 315} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
//           </div>
//         );
//       },
//     },
//     QrCode: {
//       label: "QR Code",
//       inline: true,
//       fields: { url: { type: "text", label: "Lien à encoder", defaultValue: "https://hublocal.link" }, size: { type: "number", label: "Taille (px)", defaultValue: 128 } },
//       render: ({ url, size, puck }: any) => {
//         const s = size || 128;
//         const src = `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&data=${encodeURIComponent(url || "")}`;
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { width: s, height: s, marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             <img src={src} alt="QR Code" style={{ width: "100%", height: "100%" }} />
//           </div>
//         );
//       },
//     },
//     SpotifyCard: {
//       label: "Carte Spotify",
//       inline: true,
//       fields: { url: { type: "text", label: "URL Spotify", defaultValue: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 152 } },
//       render: ({ url, height, puck }: any) => {
//         let embedUrl = url || "";
//         try {
//           const u = new URL(url || "");
//           if (!u.pathname.startsWith("/embed")) u.pathname = "/embed" + u.pathname;
//           embedUrl = u.toString();
//         } catch {}
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { width: "100%", height: height || 152, marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             <iframe src={embedUrl} width="100%" height={height || 152} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
//           </div>
//         );
//       },
//     },
//     Testimonials: {
//       label: "Témoignages",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Témoignages (JSON)", defaultValue: JSON.stringify([{ quote: "Super service !", author: "Jean" }, { quote: "Incroyable expérience.", author: "Marie" }]) },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//       },
//       render: ({ items, backgroundColor, borderRadius, padding, puck }: any) => {
//   let parsed: unknown = [];
//   try { parsed = JSON.parse(items || "[]"); } catch { parsed = []; }
//   const normalized = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
//   const list = normalized.filter((entry): entry is { quote?: string; author?: string } => typeof entry === "object" && entry !== null);
//         const base: React.CSSProperties = { backgroundColor: backgroundColor || "#f9fafb", borderRadius: `${borderRadius || 0}px`, padding: `${padding || 0}px`, marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             {list.map((item, idx) => (
//               <blockquote key={idx} style={{ marginBottom: "1rem" }}>
//                 <p style={{ fontStyle: "italic" }}>{item.quote}</p>
//                 <footer style={{ marginTop: ".25rem", fontWeight: 500 }}>— {item.author}</footer>
//               </blockquote>
//             ))}
//           </div>
//         );
//       },
//     },
//     TypingText: {
//       label: "Texte animé",
//       inline: true,
//       fields: {
//         text: { type: "textarea", label: "Texte", defaultValue: "Bonjour 👋 Tape en direct…" },
//         speed: { type: "number", label: "Vitesse (ms/lettre)", defaultValue: 40 },
//         loop: { type: "select", label: "Boucle", options: [{ label: "Oui", value: "true" }, { label: "Non", value: "false" }], defaultValue: "true" },
//         loopDelay: { type: "number", label: "Pause avant relance (ms)", defaultValue: 500 },
//         cursor: { type: "select", label: "Curseur", options: [{ label: "Afficher", value: "true" }, { label: "Masquer", value: "false" }], defaultValue: "true" },
//         color: { type: "text", label: "Couleur", defaultValue: "#111827" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 18 },
//         fontFamily: { type: "text", label: "Police", defaultValue: "" },
//         fontWeight: { type: "select", label: "Graisse", options: [
//           { label: "300", value: "300" }, { label: "400", value: "400" }, { label: "500", value: "500" }, { label: "600", value: "600" }, { label: "700", value: "700" }, { label: "800", value: "800" }, { label: "900", value: "900" }, { label: "Bold", value: "bold" },
//         ], defaultValue: "600" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
//         ], defaultValue: "left" },
//       },
//       render: ({ text, speed, loop, loopDelay, cursor, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
//         const loopBool = String(loop) === "true";
//         const cursorBool = String(cursor) === "true";
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = {};
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <span ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             <TypingTextComponent text={text} speed={speed} loop={loopBool} loopDelay={loopDelay} cursor={cursorBool} color={color} fontSize={fontSize} fontFamily={fontFamily} fontWeight={fontWeight} textAlign={textAlign} />
//           </span>
//         );
//       },
//     },
//     // External data component that demonstrates integration with third‑party content.  It exposes an
//     // `external` field allowing the editor to pick from a list of posts.  The list is defined locally
//     // but could be fetched from an API.  Selecting an item triggers resolveData to inject the post’s
//     // title and body props into the component.  Authors can also provide fallback text when no
//     // external post is chosen.
//     ExternalPost: {
//       label: "Article externe",
//       inline: true,
//       fields: {
//         // The external post selection.  fetchList returns a list of options with id and label.  In a
//         // real implementation this might call your CMS or blog API【182405108990970†L125-L170】.  The value
//         // stored in the data payload will be the id of the chosen post.
//         post: {
//           type: "external",
//           label: "Sélectionner un article",
//           // Return a static list of posts.  In production this would call an API.
//           async fetchList() {
//             return [
//               { id: "1", label: "Premier article" },
//               { id: "2", label: "Deuxième article" },
//               { id: "3", label: "Troisième article" },
//             ];
//           },
//         },
//         fallbackTitle: { type: "text", label: "Titre par défaut", defaultValue: "Aucun article" },
//         fallbackBody: { type: "textarea", label: "Contenu par défaut", defaultValue: "Choisissez un article externe pour afficher son contenu." },
//       },
//       // When the external id changes, look up the static posts and return the title and body.  The
//       // changed parameter allows us to avoid reprocessing when unchanged【182405108990970†L179-L224】.
//       resolveData: async (args: any, ctx: any) => {
//         const { post, fallbackTitle, fallbackBody } = args || {};
//         const changed = (ctx && (ctx as any).changed) || {};
//         // Only recompute when the post id changes
//         if (!changed?.post) return undefined;
//         const posts = {
//           "1": { title: "Premier article", body: "Ceci est le corps du premier article." },
//           "2": { title: "Deuxième article", body: "Contenu du deuxième article avec plus de détails." },
//           "3": { title: "Troisième article", body: "Voici un autre article pour l’exemple." },
//         } as Record<string, { title: string; body: string }>;
//         const entry = post && posts[post as string];
//         return { props: { resolvedTitle: entry?.title || fallbackTitle, resolvedBody: entry?.body || fallbackBody } };
//       },
//       render: ({ resolvedTitle, resolvedBody, fallbackTitle, fallbackBody, puck }: any) => {
//         // resolvedTitle and resolvedBody are injected by resolveData.  Fallbacks provide defaults.
//         const title = resolvedTitle || fallbackTitle || "";
//         const body = resolvedBody || fallbackBody || "";
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <article ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
//             <p style={{ marginBottom: 0 }}>{body}</p>
//           </article>
//         );
//       },
//     },
//     // A simple component using a custom field to choose a colour.  This demonstrates how to
//     // implement your own field type via the `custom` field API【603904605376732†L115-L170】.  The
//     // `onChange` handler updates the data payload; the component uses the selected colour to
//     // render a square box.  Size is configurable via a number field.
//     ColorBox: {
//       label: "Boîte de couleur",
//       inline: true,
//       fields: {
//         color: {
//           type: "custom",
//           label: "Couleur",
//           defaultValue: "#2563eb",
//           render: ({ value, onChange }: any) => {
//             return (
//               <input
//                 type="color"
//                 value={value || "#2563eb"}
//                 onChange={(e) => onChange(e.target.value)}
//                 style={{ width: "100%", height: "2rem", padding: 0, border: "none", background: "transparent" }}
//               />
//             );
//           },
//         },
//         size: { type: "number", label: "Taille (px)", defaultValue: 64 },
//       },
//       render: ({ color, size, puck }: any) => {
//         const s = size || 64;
//         const c = color || "#2563eb";
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { width: s, height: s, backgroundColor: c, borderRadius: "0.25rem", marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown} />;
//       },
//     },
//     LinksList: {
//       label: "Liste de liens",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Liens (JSON)", defaultValue: JSON.stringify([{ label: "LinkedIn", url: "https://www.linkedin.com" }, { label: "YouTube", url: "https://www.youtube.com" }]) },
//         color: { type: "text", label: "Couleur du texte", defaultValue: "#2563eb" },
//         spacing: { type: "number", label: "Espacement (px)", defaultValue: 4 },
//       },
//       render: ({ items, color, spacing, puck }: any) => {
//         let list: Array<{ label: string; url: string }> = [];
//         try { list = JSON.parse(items || "[]"); } catch { list = []; }
//         const styleLink: React.CSSProperties = { color: color || "#2563eb", textDecoration: "underline", display: "block", marginBottom: `${spacing || 0}px` };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const base: React.CSSProperties = { marginTop: "0.5rem", marginBottom: "0.5rem" };
//         const style = isSelected ? { ...base, ...outlineForSelected } : base;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={style} onMouseDown={onMouseDown}>
//             {list.map((item, idx) => (
//               <a
//                 key={idx}
//                 href={item.url}
//                 style={styleLink}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={(e) => { if (isEditing) e.preventDefault(); }}
//               >
//                 {item.label}
//               </a>
//             ))}
//           </div>
//         );
//       },
//     },
//     Card: {
//       label: "Carte",
//       inline: true,
//       fields: {
//         elId: { type: "text", label: "Element ID", defaultValue: "" },
//         icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "📦" },
//         title: { type: "text", label: "Titre", defaultValue: "Titre" },
//         description: { type: "textarea", label: "Description", defaultValue: "Description" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#ffffff" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//         borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
//         align: { type: "select", label: "Alignement du texte", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//         layout: { type: "select", label: "Disposition", options: [
//           { label: "Verticale", value: "vertical" }, { label: "Horizontale", value: "horizontal" },
//         ], defaultValue: "vertical" },
//         href: { type: "text", label: "Lien (optionnel)", defaultValue: "" },
//         shadow: { type: "select", label: "Ombre", options: [
//           { label: "Avec ombre", value: "true" }, { label: "Sans ombre", value: "false" },
//         ], defaultValue: "true" },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "setFlag" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
//             value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ elId, icon, title, description, backgroundColor, borderRadius, padding, borderColor, borderWidth, align, layout, href, shadow, actions = [], puck }: any) => {
//         const actionCtx = useActionState();
//         const style: React.CSSProperties = {
//           backgroundColor: backgroundColor || "#ffffff",
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           padding: padding ? `${padding}px` : undefined,
//           boxShadow: String(shadow) === "true" ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : undefined,
//           borderWidth: borderWidth ? `${borderWidth}px` : undefined,
//           borderColor: borderColor || undefined,
//           borderStyle: borderWidth ? "solid" : undefined,
//           textAlign: (align as React.CSSProperties["textAlign"]) || "left",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//           cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
//         };
//         const isUrl = typeof icon === "string" && (icon.startsWith("http") || icon.startsWith("/"));
//         const inner = (
//           <div style={{ display: layout === "horizontal" ? "flex" : "block", gap: layout === "horizontal" ? 12 : undefined, alignItems: layout === "horizontal" ? "center" : undefined }}>
//             {icon && (
//               <div style={{ fontSize: "2rem", marginBottom: layout === "horizontal" ? 0 : "0.5rem" }}>
//                 {isUrl ? <img src={icon} alt="Icon" style={{ width: "2rem", height: "2rem", objectFit: "cover" }} /> : icon}
//               </div>
//             )}
//             <div>
//               <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>{title}</h3>
//               <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{description}</p>
//             </div>
//           </div>
//         );
//         const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === ev);
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const styleSel = isSelected ? { ...style, ...outlineForSelected } : style;
//         const onMouseDown = (e: any) => {
//           e.stopPropagation();
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         const cardEl = (
//           <div id={elId || undefined} ref={puck?.dragRef} style={styleSel} onMouseDown={onMouseDown} onClick={(e) => runEvt("click", e.currentTarget)} onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)} onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}>
//             {inner}
//           </div>
//         );
//         if (href) {
//           const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
//             const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//             const clickActs = list.filter((a) => a.event === "click");
//             if (clickActs.length > 0) {
//               e.preventDefault();
//               return; // handled by inner
//             }
//             // In editor, never navigate
//             if ((puck as any)?.isEditing) {
//               e.preventDefault();
//             }
//           };
//           return <a href={href} onClick={onClick} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{cardEl}</a>;
//         }
//         return cardEl;
//       },
//     },
//     Hero: {
//       label: "Héros",
//       inline: true,
//       fields: {
//         title: { type: "text", label: "Titre", defaultValue: "Titre" },
//         description: { type: "textarea", label: "Description", defaultValue: "Description du héros" },
//         image: { type: "text", label: "Image (URL)", defaultValue: "https://images.unsplash.com/photo-1606761569780-43b7311d8682?auto=format&fit=crop&w=800&q=80" },
//         imagePosition: { type: "select", label: "Position de l’image", options: [
//           { label: "Gauche", value: "left" }, { label: "Droite", value: "right" }, { label: "Haut", value: "top" }, { label: "Bas", value: "bottom" },
//         ], defaultValue: "right" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
//         textColor: { type: "text", label: "Couleur du texte", defaultValue: "#111827" },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 32 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
//         imageRadius: { type: "number", label: "Arrondi image (px)", defaultValue: 8 },
//         imageFit: { type: "select", label: "Ajustement image", options: [
//           { label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }, { label: "Fill", value: "fill" },
//         ], defaultValue: "cover" },
//         imageMaxHeight: { type: "number", label: "Hauteur max image (px)", defaultValue: 480 },
//         buttons: {
//           type: "array",
//           label: "buttons",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Button" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             variant: { type: "select", label: "variant", options: [
//               { label: "primary", value: "primary" },
//               { label: "secondary", value: "secondary" },
//               { label: "outline", value: "outline" },
//               { label: "ghost", value: "ghost" },
//             ], defaultValue: "primary" },
//             actionType: { type: "select", label: "action", options: [
//               { label: "none", value: "none" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "toggle", value: "toggle" },
//             ], defaultValue: "none" },
//             flag: { type: "text", label: "flag name", defaultValue: "" },
//             value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//           },
//           defaultItemProps: { label: "Learn more", href: "#", variant: "primary" },
//           getItemSummary: (item: any) => item?.label || "button",
//         },
//         align: { type: "select", label: "Alignement du texte", options: [
//           { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//       },
//       /*
//        * Dynamic data resolution.
//        * Puck expects `resolveData` to return an object with a `props` key.  Returning
//        * undefined here causes the editor to attempt destructuring `props` from
//        * undefined, which throws a runtime error.  Returning an empty `props` object
//        * avoids that issue and signals that no props are being modified.
//        */
//       resolveData: async () => {
//         return { props: {} };
//       },

//       /*
//        * Dynamically show or hide fields based on current props.  When the image
//        * position is vertical (top or bottom), the `imageFit` option isn’t
//        * relevant and is removed from the panel.  Use the `data` and `params`
//        * arguments provided by Puck to safely access props and fields.  If
//        * either argument is undefined, default to empty objects to avoid
//        * destructuring errors.
//        */
//       resolveFields: async (data: any = {}, params: any = {}) => {
//         const fields = (params && params.fields) || {};
//         const props = (data && data.props) || {};
//         if ((props.imagePosition === 'top' || props.imagePosition === 'bottom') && 'imageFit' in fields) {
//           const { imageFit, ...rest } = fields as any;
//           return rest;
//         }
//         return fields;
//       },
//       // Prevent users from deleting the hero component.  They can still drag and duplicate it.
//       permissions: { delete: false, drag: true, duplicate: true },
//       render: ({ title, description, image, imagePosition, backgroundColor, textColor, radius, padding, gap, imageRadius, imageFit, imageMaxHeight, buttons, align, puck }: any) => {
//         const actionCtx = useActionState();
//         let btns: Array<{ label?: string; href?: string; url?: string; variant?: string }> = [];
//         if (Array.isArray(buttons)) {
//           btns = buttons;
//         } else {
//           try {
//             const parsed = typeof buttons === "string" ? JSON.parse(buttons) : buttons;
//             if (Array.isArray(parsed)) btns = parsed.filter((x: any) => x && typeof x === "object");
//             else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).buttons)) btns = (parsed as any).buttons.filter((x: any) => x && typeof x === "object");
//             else if (parsed && typeof parsed === "object") btns = [parsed as any];
//           } catch { btns = []; }
//         }
//         // Determine if the layout is horizontal (image left/right) or vertical (image top/bottom)
//         const isHorizontal = imagePosition === "left" || imagePosition === "right";
//         const flexDirection = isHorizontal ? "row" : "column";
//         const orderImageFirst = imagePosition === "left" || imagePosition === "top";
//         // When horizontal use equal widths and allow wrapping so that on small viewports the image
//         // and text stack naturally. In vertical mode width is 100%.
//         const columnWidth = isHorizontal ? "50%" : "100%";
//         const containerStyle: React.CSSProperties = {
//           display: "flex",
//           flexDirection,
//           // Allow items to wrap on narrow screens when horizontal to avoid overflow
//           flexWrap: isHorizontal ? "wrap" : undefined,
//           alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
//           justifyContent: "space-between",
//           backgroundColor: backgroundColor || "#f9fafb",
//           color: textColor || "#111827",
//           padding: `${padding ?? 32}px`,
//           gap: `${gap ?? 16}px`,
//           borderRadius: `${radius ?? 8}px`,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const textStyle: React.CSSProperties = {
//           flex: isHorizontal ? "1 1 50%" : undefined,
//           width: columnWidth,
//           textAlign: (align as React.CSSProperties["textAlign"]) || "left",
//         };
//         // The image itself should always fill its container. Height is constrained via maxHeight.
//         const imageStyle: React.CSSProperties = {
//           width: "100%",
//           maxHeight: imageMaxHeight ? `${imageMaxHeight}px` : undefined,
//           height: "auto",
//           borderRadius: imageRadius ? `${imageRadius}px` : undefined,
//           objectFit: imageFit || "cover",
//         };
//         const left = (
//           <div style={textStyle}>
//             <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h2>
//             <p style={{ fontSize: "1rem", marginBottom: "1rem" }}>{description}</p>
//             <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
//               {btns.map((btn, idx) => {
//                 const href = (btn as any).href ?? (btn as any).url ?? "#";
//                 const variant = (btn as any).variant ?? "primary";
//                 const styleMap: Record<string, React.CSSProperties> = {
//                   primary: { backgroundColor: "#6366f1", color: "#ffffff", border: "1px solid #6366f1" },
//                   secondary: { backgroundColor: "#e5e7eb", color: "#111827", border: "1px solid #e5e7eb" },
//                   outline: { backgroundColor: "transparent", color: "#111827", border: "1px solid #d1d5db" },
//                   ghost: { backgroundColor: "transparent", color: "#6366f1", border: "1px solid transparent" },
//                 };
//                 const baseStyle: React.CSSProperties = { padding: "0.5rem 1rem", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", display: "inline-block" };
//                 const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const isEditing = (puck as any)?.isEditing;
//                   const actionType = (btn as any).actionType as string | undefined;
//                   // Ensure flag is a trimmed string when provided; convert non-string values
//                   // to strings before trimming to avoid runtime errors
//                   const rawFlag = (btn as any).flag as any;
//                   const flag = rawFlag != null ? String(rawFlag).trim() : undefined;
//                   const valueStr = (btn as any).value as string | undefined;
//                   if (actionType && actionType !== "none") {
//                     e.preventDefault();
//                     const actions: ActionType[] = [] as any;
//                     if (actionType === "setFlag" && flag) {
//                       actions.push({ event: "click", type: "setFlag", flag, value: valueStr === "true" });
//                     } else if (actionType === "toggle" && flag) {
//                       actions.push({ event: "click", type: "toggle", flag });
//                     }
//                     if (actions.length) {
//                       await runActions(actions, { isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//                       return;
//                     }
//                   }
//                   if (isEditing) {
//                     e.preventDefault();
//                     return;
//                   }
//                 };
//                 return <a key={idx} href={href} onClick={handleClick} style={{ ...baseStyle, ...(styleMap[variant] || styleMap.primary) }} rel="noopener noreferrer">{(btn.label as string) || "Button"}</a>;
//               })}
//             </div>
//           </div>
//         );
//         const right = (
//           <div
//             style={{
//               flex: isHorizontal ? "1 1 50%" : undefined,
//               width: columnWidth,
//               display: "flex",
//               justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
//             }}
//           >
//             {image && <img src={image} alt={title || "Image"} style={imageStyle} />}
//           </div>
//         );
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const containerStyleSel = isSelected ? { ...containerStyle, ...outlineForSelected } : containerStyle;
//         const onMouseDown = (e: any) => {
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={containerStyleSel} onMouseDown={onMouseDown}>
//             {orderImageFirst ? right : left}
//             {orderImageFirst ? left : right}
//           </div>
//         );
//       },
//     },
//     Logos: {
//       label: "Logos",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Logos (JSON)", defaultValue: JSON.stringify([
//           { src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg", alt: "React" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/4/47/Nodejs.svg", alt: "Node.js" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg", alt: "Node" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png", alt: "JavaScript" },
//         ]) },
//         columns: { type: "number", label: "Colonnes", defaultValue: 4 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         justifyContent: { type: "select", label: "Justification", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
//         ], defaultValue: "center" },
//         alignItems: { type: "select", label: "Alignement vertical", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "center" },
//         size: { type: "number", label: "Taille (px)", defaultValue: 64 },
//         grayscale: { type: "select", label: "Niveaux de gris", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//         hoverOpacity: { type: "number", label: "Opacité au survol (0-1)", defaultValue: 1 },
//         linkTarget: { type: "select", label: "Cible du lien", options: [ { label: "Nouvel onglet", value: "_blank" }, { label: "Même onglet", value: "_self" } ], defaultValue: "_blank" },
//       },
//       render: ({ items, columns, gap, gapX, gapY, justifyContent, alignItems, size, grayscale, hoverOpacity, linkTarget, puck }: any) => {
//         let logos: Array<{ src: string; alt?: string; url?: string }> = [];
//         try {
//           const parsed = typeof items === "string" ? JSON.parse(items) : items;
//           if (Array.isArray(parsed)) logos = parsed.map((it: any) => (typeof it === 'string' ? { src: it } : it)).filter((x: any) => x && typeof x === "object");
//           else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).items)) logos = (parsed as any).items.map((it: any) => (typeof it === 'string' ? { src: it } : it));
//         } catch { logos = []; }
//         const style: React.CSSProperties = {
//           display: "grid",
//           gridTemplateColumns: columns ? `repeat(${columns}, auto)` : undefined,
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || "center",
//           justifyContent: justifyContent || "center",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const path = getPathFromPuck(puck);
//         const isSelected = selectionStore.has(path);
//         const isEditing = isEditingFromPuck(puck);
//         const styleSel = isSelected ? { ...style, ...outlineForSelected } : style;
//         const onMouseDown = (e: any) => {
//           if (!isEditing) return;
//           if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); e.stopPropagation(); selectionStore.toggle(path, true); }
//           else { selectionStore.toggle(path, false); }
//         };
//         return (
//           <div ref={puck?.dragRef} style={styleSel} onMouseDown={onMouseDown}>
//             {logos.map((logo, idx) => {
//               const img = (
//                 <img key={idx} src={logo.src} alt={logo.alt || "Logo"} style={{ width: size ? `${size}px` : "64px", height: "auto", objectFit: "contain", filter: String(grayscale) === 'true' ? 'grayscale(100%)' : undefined, transition: 'opacity .15s ease-in-out' }}
//                   onMouseEnter={(e) => { const v = Number(hoverOpacity); if (!Number.isNaN(v) && v >= 0 && v <= 1) (e.currentTarget as HTMLImageElement).style.opacity = String(v); }}
//                   onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
//                 />
//               );
//               return logo.url ? (
//                 <a
//                   key={idx}
//                   href={logo.url}
//                   target={linkTarget || "_blank"}
//                   rel="noopener noreferrer"
//                   onClick={(e) => { if (isEditing) e.preventDefault(); }}
//                 >
//                   {img}
//                 </a>
//               ) : (
//                 img
//               );
//             })}
//           </div>
//         );
//       },
//     },
//     Navbar: {
//       label: "Navbar",
//       inline: true,
//       fields: {
//         brand: { type: "text", label: "Marque", defaultValue: "Brand" },
//         brandHref: { type: "text", label: "Lien marque", defaultValue: "/" },
//         brandImageSrc: { type: "text", label: "Logo (URL)", defaultValue: "" },
//         brandImageWidth: { type: "number", label: "Logo largeur (px)", defaultValue: 24 },
//         brandImageHeight: { type: "number", label: "Logo hauteur (px)", defaultValue: 24 },
//         brandGap: { type: "number", label: "Espace logo/texte (px)", defaultValue: 8 },
//         brandFontSize: { type: "number", label: "Taille marque (px)", defaultValue: 18 },
//         brandFontWeight: { type: "select", label: "Graisse marque", options: [
//           { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
//         ], defaultValue: "700" },
//         brandColor: { type: "text", label: "Couleur marque", defaultValue: "inherit" },

//         align: { type: "select", label: "Alignement liens", options: [ { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" } ], defaultValue: "right" },
//         paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
//         paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 12 },
//         gap: { type: "number", label: "Espace horizontal (px)", defaultValue: 12 },
//         containerMaxWidth: { type: "number", label: "Max width conteneur (px, 0=fluid)", defaultValue: 1280 },
//         centerContainer: { type: "select", label: "Centrer conteneur", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },

//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         borderBottom: { type: "select", label: "Bordure basse", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
//         shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

//         positionMode: { type: "select", label: "Position", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
//         top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
//         zIndex: { type: "number", label: "z-index", defaultValue: 50 },

//         linkGap: { type: "number", label: "Espace liens (px)", defaultValue: 12 },
//         linkPaddingX: { type: "number", label: "Padding lien X (px)", defaultValue: 8 },
//         linkPaddingY: { type: "number", label: "Padding lien Y (px)", defaultValue: 6 },
//         linkHoverUnderline: { type: "select", label: "Souligner au survol", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         linkHoverColor: { type: "text", label: "Couleur au survol", defaultValue: "" },

//         collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 768 },
//         mobileMenuPosition: { type: "select", label: "Menu mobile côté", options: [ { label: "Droite", value: "right" }, { label: "Gauche", value: "left" } ], defaultValue: "right" },
//         menuButtonLabel: { type: "text", label: "Texte bouton menu", defaultValue: "Menu" },

//         links: {
//           type: "array",
//           label: "Liens",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Link" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//           },
//           defaultItemProps: { label: "About", href: "#", target: "_self", active: "false" },
//           getItemSummary: (item: any) => item?.label || "link",
//         },
//       },
//       render: (props: any) => {
//         function NavBarView({ puck, ...p }: any) {
//           const { ref, width } = useElementWidth<HTMLDivElement>();
//           const [open, setOpen] = useState(false);
//           const path = getPathFromPuck(puck);
//           const isSelected = selectionStore.has(path);
//           const isEditing = isEditingFromPuck(puck);
//           const onMouseDown = (e: any) => {
//             e.stopPropagation();
//             if (!isEditing) return;
//             if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); selectionStore.toggle(path, true); }
//             else { selectionStore.toggle(path, false); }
//           };
//           const collapseAt = Number(p.collapseAt || 0) || 0;
//           const collapsed = collapseAt > 0 && width > 0 && width < collapseAt;
//           const justify = p.align === "center" ? "center" : p.align === "right" ? "flex-end" : "flex-start";
//           const containerStyle: React.CSSProperties = {
//             maxWidth: Number(p.containerMaxWidth) ? `${p.containerMaxWidth}px` : undefined,
//             margin: String(p.centerContainer) === "true" ? "0 auto" : undefined,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: p.gap ?? 12,
//           };
//           const navBase: React.CSSProperties = {
//             backgroundColor: p.backgroundColor || "#ffffff",
//             color: p.textColor || "#111827",
//             padding: `${p.paddingY ?? 12}px ${p.paddingX ?? 16}px`,
//             borderBottom: String(p.borderBottom) === "true" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
//             boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
//             position: p.positionMode || "static",
//             top: p.top ?? 0,
//             zIndex: p.zIndex ?? 50,
//           } as React.CSSProperties;
//           const navStyle = isSelected ? { ...navBase, ...outlineForSelected } : navBase;

//           const brandLinkStyle: React.CSSProperties = {
//             display: "inline-flex",
//             alignItems: "center",
//             gap: p.brandGap ?? 8,
//             fontSize: p.brandFontSize ? `${p.brandFontSize}px` : undefined,
//             fontWeight: p.brandFontWeight || 700,
//             color: p.brandColor && p.brandColor !== "inherit" ? p.brandColor : undefined,
//             textDecoration: "none",
//           };

//           const linkStyleBase: React.CSSProperties = {
//             textDecoration: "none",
//             color: "inherit",
//             padding: `${p.linkPaddingY ?? 6}px ${p.linkPaddingX ?? 8}px`,
//             borderRadius: 6,
//           };

//           const LinksInline = () => (
//             <div style={{ display: "flex", alignItems: "center", justifyContent: justify, gap: p.linkGap ?? 12, flex: 1, marginLeft: 12 }}>
//               {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => {
//                 const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const c = p.linkHoverColor as string;
//                   if (c) (e.currentTarget as HTMLAnchorElement).style.color = c;
//                   if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
//                 };
//                 const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   (e.currentTarget as HTMLAnchorElement).style.color = "inherit";
//                   if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
//                 };
//                 const active = routeIsActive(l?.href, l?.active);
//                 const style: React.CSSProperties = { ...linkStyleBase, opacity: active ? 1 : 0.9, fontWeight: active ? 600 : 500 };
//                 return (
//                   <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
//                      style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={(e) => { if (isEditing) e.preventDefault(); }}>
//                     {l?.label || "Link"}
//                   </a>
//                 );
//               })}
//             </div>
//           );

//           const LinksMobile = () => (
//             <div style={{ display: open ? "block" : "none", position: "absolute", [p.mobileMenuPosition === "left" ? "left" : "right"]: 0, top: "100%", background: p.backgroundColor || "#fff", border: `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}`, borderRadius: 8, padding: 8, boxShadow: "0 4px 12px rgba(0,0,0,.08)" } as React.CSSProperties}>
//               <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
//                 {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => (
//                   <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
//                      style={{ ...linkStyleBase }} onClick={(e) => { if (isEditing) e.preventDefault(); }}>{l?.label || "Link"}</a>
//                 ))}
//               </div>
//             </div>
//           );

//           return (
//             <nav ref={puck?.dragRef} style={navStyle} onMouseDown={onMouseDown}>
//               <div ref={ref} style={containerStyle}>
//                 <a href={p.brandHref || "/"} style={brandLinkStyle} onClick={(e) => { if (isEditing) e.preventDefault(); }}>
//                   {p.brandImageSrc ? (
//                     <img src={p.brandImageSrc} alt={p.brand || "Brand"} style={{ width: p.brandImageWidth || 24, height: p.brandImageHeight || 24 }} />
//                   ) : null}
//                   <span>{p.brand || "Brand"}</span>
//                 </a>
//                 {collapsed ? (
//                   <div style={{ marginLeft: "auto", position: "relative" }}>
//                     <button type="button" onClick={() => setOpen((v) => !v)}
//                       style={{ background: "transparent", color: "inherit", border: 0, padding: 8, borderRadius: 6, cursor: "pointer" }}>
//                       {p.menuButtonLabel || "Menu"}
//                     </button>
//                     <LinksMobile />
//                   </div>
//                 ) : (
//                   <LinksInline />
//                 )}
//               </div>
//             </nav>
//           );
//         }
//         return <NavBarView {...props} />;
//       },
//     },
//     Sidebar: {
//       label: "Sidebar",
//       inline: true,
//       fields: {
//         position: { type: "select", label: "Position", options: [ { label: "Gauche", value: "left" }, { label: "Droite", value: "right" } ], defaultValue: "left" },
//         stickyMode: { type: "select", label: "Positionnement", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
//         top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
//         zIndex: { type: "number", label: "z-index", defaultValue: 40 },

//         widthDesktop: { type: "number", label: "Largeur desktop (px)", defaultValue: 280 },
//         widthMobile: { type: "number", label: "Largeur mobile (px)", defaultValue: 280 },
//         collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 1024 },
//         // Hide internal open/close toggles by default. Users can still enable
//         // these buttons explicitly if desired by switching this value to "true".
//         showToggle: { type: "select", label: "Afficher bouton", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         // Desktop toggle buttons are opt-in only; by default they are not shown.
//         showDesktopToggle: { type: "select", label: "Boutons test (desktop)", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//         overlay: { type: "select", label: "Overlay mobile", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         controlFlag: { type: "text", label: "Flag de contrôle (ouvrir/fermer)", defaultValue: "" },
//         controlDefaultOpen: { type: "select", label: "Ouvert par défaut si flag non défini", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },

//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 12 },
//         borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
//         shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

//         itemGap: { type: "number", label: "Espacement éléments (px)", defaultValue: 8 },
//         itemPaddingX: { type: "number", label: "Padding X élément (px)", defaultValue: 8 },
//         itemPaddingY: { type: "number", label: "Padding Y élément (px)", defaultValue: 6 },
//         itemRadius: { type: "number", label: "Arrondi élément (px)", defaultValue: 6 },
//         itemHoverBg: { type: "text", label: "Fond au survol", defaultValue: "#f3f4f6" },
//         itemActiveBg: { type: "text", label: "Fond actif", defaultValue: "#e5e7eb" },
//         itemTextColor: { type: "text", label: "Couleur texte", defaultValue: "inherit" },
//         itemHoverTextColor: { type: "text", label: "Texte au survol", defaultValue: "inherit" },
//         itemActiveTextColor: { type: "text", label: "Texte actif", defaultValue: "inherit" },

//         items: {
//           type: "array",
//           label: "Éléments",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Item" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//           },
//           defaultItemProps: { label: "Dashboard", href: "#", icon: "", target: "_self", active: "false" },
//           getItemSummary: (it: any) => it?.label || "item",
//         },
//       },
//       render: (props: any) => {
//         function SidebarView({ puck, ...p }: any) {
//           const { ref, width } = useElementWidth<HTMLDivElement>();
//           const [open, setOpen] = useState(false);
//           const path = getPathFromPuck(puck);
//           const isSelected = selectionStore.has(path);
//           const isEditing = isEditingFromPuck(puck);
//           const onMouseDown = (e: any) => {
//             e.stopPropagation();
//             if (!isEditing) return;
//             if (e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); selectionStore.toggle(path, true); }
//             else { selectionStore.toggle(path, false); }
//           };
//           const actionState = useActionState();
//           const collapseAt = Number(p.collapseAt || 0) || 0;
//           // Determine whether we are in a collapsed/mobile state based on the measured width.
//           const measured = width > 0 ? width : (typeof window !== "undefined" ? window.innerWidth : 0);
//           const collapsed = collapseAt > 0 && measured > 0 && measured < collapseAt;
//           const side = p.position === "right" ? "right" : "left";
//           const desktopWidth = Number(p.widthDesktop || 280) || 280;
//           const mobileWidth = Number(p.widthMobile || 280) || 280;
//           // Always coerce controlFlag to a string before trimming to guard against
//           // non-string values (e.g. booleans or numbers).  Without this, calling
//           // `.trim()` on undefined or other types will throw a runtime error.
//           const flagName = String(p.controlFlag ?? "").trim();
//           // Pull the current flag value; undefined if not set.
//           const flagVal = flagName ? actionState.flags[flagName] : undefined;
//           const defaultOpen = String(p.controlDefaultOpen) === "true";

//           // Resolve whether the sidebar should be considered open. When a control flag
//           // is provided we use the flag if it's been set, otherwise we fall back to
//           // the controlDefaultOpen value. Without a control flag we use local state.
//           const resolvedOpen: boolean = flagName
//             ? (flagVal !== undefined ? !!flagVal : defaultOpen)
//             : open;

//           // Helpers to centralise sidebar open/close logic.
//           // When a controlFlag is provided we dispatch to the global flag state;
//           // otherwise we fall back to the component's internal open state.
//           const handleOpen = () => {
//             if (flagName) {
//               actionState.setFlag(flagName, true);
//             } else {
//               setOpen(true);
//             }
//           };
//           const handleClose = () => {
//             if (flagName) {
//               actionState.setFlag(flagName, false);
//             } else {
//               setOpen(false);
//             }
//           };
//           const handleToggle = () => {
//             if (flagName) {
//               actionState.toggleFlag(flagName);
//             } else {
//               setOpen((v) => !v);
//             }
//           };

//           // Common styling for the aside container
//           const commonAsideStyle: React.CSSProperties = {
//             backgroundColor: p.backgroundColor || "#ffffff",
//             color: p.textColor || "#111827",
//             borderRadius: p.radius ? `${p.radius}px` : undefined,
//             padding: `${p.padding || 0}px`,
//             border: String(p.borderWidth || 0) !== "0" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
//             boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
//           };
//           const itemBaseStyle: React.CSSProperties = {
//             textDecoration: "none",
//             color: p.itemTextColor && p.itemTextColor !== "inherit" ? p.itemTextColor : "inherit",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             padding: `${p.itemPaddingY ?? 6}px ${p.itemPaddingX ?? 8}px`,
//             borderRadius: p.itemRadius ? `${p.itemRadius}px` : "6px",
//           };

//           const ItemsList = () => (
//             <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: p.itemGap ?? 8 }}>
//               {(Array.isArray(p.items) ? p.items : []).map((it: any, i: number) => {
//                 const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const bg = p.itemHoverBg as string; const tc = p.itemHoverTextColor as string;
//                   if (bg) (e.currentTarget as HTMLAnchorElement).style.background = bg;
//                   if (tc) (e.currentTarget as HTMLAnchorElement).style.color = tc;
//                 };
//                 const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const active = routeIsActive(it?.href, it?.active);
//                   (e.currentTarget as HTMLAnchorElement).style.background = active ? (p.itemActiveBg as string) || "" : "transparent";
//                   (e.currentTarget as HTMLAnchorElement).style.color = active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit";
//                 };
//                 const active = routeIsActive(it?.href, it?.active);
//                 const style: React.CSSProperties = {
//                   ...itemBaseStyle,
//                   background: active ? (p.itemActiveBg as string) || "#e5e7eb" : "transparent",
//                   color: active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit",
//                 };
//                 const icon = it?.icon;
//                 const iconEl = icon ? (
//                   icon.startsWith("http") || icon.startsWith("/")
//                     ? <img src={icon} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
//                     : <span style={{ fontSize: 16 }}>{icon}</span>
//                 ) : null;
//                 return (
//                   <li key={i}>
//                     <a href={it?.href || "#"} target={it?.target || "_self"} rel={it?.target === "_blank" ? "noopener noreferrer" : undefined}
//                        style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={(e) => { if (isEditing) e.preventDefault(); }}>
//                       {iconEl}
//                       <span>{it?.label || "Item"}</span>
//                     </a>
//                   </li>
//                 );
//               })}
//             </ul>
//           );

//           // Render the mobile overlay drawer. We compute its visibility from
//           // `resolvedOpen` so that the drawer respects the control flag or the
//           // default open state when collapsed. When the overlay or close
//           // button is clicked, the sidebar is closed via handleClose().
//           const MobileDrawer = () => (
//             <div
//               style={{
//                 position: "fixed",
//                 inset: 0,
//                 display: (collapsed && resolvedOpen) ? "block" : "none",
//                 zIndex: (p.zIndex ?? 40) + 1,
//               }}
//             >
//               {String(p.overlay) === "true" ? (
//                 <div
//                   onClick={() => handleClose()}
//                   style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }}
//                 />
//               ) : null}
//               <aside
//                 style={{
//                   ...commonAsideStyle,
//                   position: "absolute",
//                   top: 0,
//                   bottom: 0,
//                   [side]: 0,
//                   width: mobileWidth,
//                   overflowY: "auto",
//                 } as React.CSSProperties}
//               >
//                 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
//                   <button
//                     type="button"
//                     onClick={() => handleClose()}
//                     style={{ background: "transparent", border: 0, padding: 8, cursor: "pointer" }}
//                   >
//                     Close
//                   </button>
//                 </div>
//                 <ItemsList />
//               </aside>
//             </div>
//           );

//           // Determine visibility for mobile and desktop views using the resolved open state.
//           const isOpenMobile = collapsed ? resolvedOpen : undefined;
//           const isVisibleDesktop = !collapsed ? resolvedOpen : true;

//           const baseWrapper: React.CSSProperties = { position: "relative" };
//           const wrapperStyle = isSelected ? { ...baseWrapper, ...outlineForSelected } : baseWrapper;
//           return (
//             <div ref={puck?.dragRef} style={wrapperStyle} onMouseDown={onMouseDown}>
//               {collapsed && String(p.showToggle) === "true" ? (
//                 <button
//                   type="button"
//                   onClick={() => handleOpen()}
//                   style={{
//                     background: "transparent",
//                     border: `1px solid ${p.borderColor || "#e5e7eb"}`,
//                     padding: "6px 10px",
//                     borderRadius: 6,
//                     cursor: "pointer",
//                     margin: "0.5rem 0",
//                   }}
//                 >
//                   Open sidebar
//                 </button>
//               ) : null}
//               <div ref={ref} style={{ width: "100%" }} />
//               {collapsed ? (
//                 isOpenMobile ? <MobileDrawer /> : null
//               ) : (
//                 isVisibleDesktop ? (
//                   <aside
//                     style={{
//                       ...commonAsideStyle,
//                       position: p.stickyMode || "static",
//                       top: p.top ?? 0,
//                       zIndex: p.zIndex ?? 40,
//                       width: desktopWidth,
//                       margin: "0.5rem 0",
//                     }}
//                   >
//                     {String(p.showDesktopToggle) === "true" ? (
//                       <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
//                         <button
//                           type="button"
//                           onClick={() => handleOpen()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Open
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleClose()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Close
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleToggle()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Toggle
//                         </button>
//                       </div>
//                     ) : null}
//                     <ItemsList />
//                   </aside>
//                 ) : null
//               )}
//             </div>
//           );
//         }
//         return <SidebarView {...props} />;
//       },
//     },
//     Modal: {
//       label: "Modal",
//       inline: true,
//       fields: {
//         flag: { type: "text", label: "Flag d'ouverture", defaultValue: "modalOpen" },
//         overlay: { type: "select", label: "Overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         closeOnOverlay: { type: "select", label: "Fermer sur overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         overlayColor: { type: "text", label: "Couleur overlay", defaultValue: "rgba(17,24,39,0.55)" },
//         overlayBlur: { type: "number", label: "Blur overlay (px)", defaultValue: 0 },
//         width: { type: "number", label: "Largeur (px)", defaultValue: 560 },
//         maxWidth: { type: "number", label: "Max width (px)", defaultValue: 720 },
//         maxHeight: { type: "number", label: "Hauteur max (px)", defaultValue: 640 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//         gap: { type: "number", label: "Espacement interne (px)", defaultValue: 16 },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 12 },
//         shadow: { type: "select", label: "Ombre", options: [
//           { label: "Légère", value: "sm" },
//           { label: "Moyenne", value: "md" },
//           { label: "Forte", value: "lg" },
//         ], defaultValue: "md" },
//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" },
//           { label: "Centré", value: "center" },
//           { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//         eyebrow: { type: "text", label: "Sur-titre", defaultValue: "" },
//         title: { type: "text", label: "Titre", defaultValue: "Titre du modal" },
//         description: { type: "textarea", label: "Description", defaultValue: "Ajoutez un texte introductif pour contextualiser votre contenu." },
//         bodyText: { type: "textarea", label: "Texte principal", defaultValue: "" },
//         showCloseButton: { type: "select", label: "Bouton fermer", options: [ { label: "Afficher", value: "true" }, { label: "Masquer", value: "false" } ], defaultValue: "true" },
//         closeLabel: { type: "text", label: "Label bouton fermer", defaultValue: "Fermer" },
//         primaryLabel: { type: "text", label: "Action principale", defaultValue: "Confirmer" },
//         primaryFlag: { type: "text", label: "Flag action principale", defaultValue: "" },
//         primaryCloses: { type: "select", label: "Fermer après action principale", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         secondaryLabel: { type: "text", label: "Action secondaire", defaultValue: "" },
//         secondaryFlag: { type: "text", label: "Flag action secondaire", defaultValue: "" },
//         secondaryCloses: { type: "select", label: "Fermer après action secondaire", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         actionsAlign: { type: "select", label: "Alignement actions", options: [
//           { label: "Aligné à gauche", value: "flex-start" },
//           { label: "Centré", value: "center" },
//           { label: "Aligné à droite", value: "flex-end" },
//           { label: "Espacées", value: "space-between" },
//         ], defaultValue: "flex-end" },
//         children: { type: "slot", label: "Contenu avancé (slot)" },
//       },
//       render: ({
//         flag,
//         overlay,
//         closeOnOverlay,
//         overlayColor,
//         overlayBlur,
//         width,
//         maxWidth,
//         maxHeight,
//         padding,
//         gap,
//         radius,
//         shadow,
//         backgroundColor,
//         textColor,
//         textAlign,
//         eyebrow,
//         title,
//         description,
//         bodyText,
//         showCloseButton,
//         closeLabel,
//         primaryLabel,
//         primaryFlag,
//         primaryCloses,
//         secondaryLabel,
//         secondaryFlag,
//         secondaryCloses,
//         actionsAlign,
//         children: Content,
//         puck,
//       }: any) => {
//         const { flags, setFlag } = useActionState();
//         // When looking up a flag, coerce the name to a trimmed string to avoid
//         // `.trim()` on non-strings (e.g. booleans).  Use "modalOpen" as the
//         // default flag name when none is provided.
//         const rawFlagName = flag ?? "modalOpen";
//         const flagName = String(rawFlagName).trim();
//         const isOpen = !!flags[flagName];
//         const isEditing = (puck as any)?.isEditing;
//         if (!isOpen && !isEditing) return null;
//   const parsedTextAlign = (textAlign || "left") as React.CSSProperties["textAlign"];
//         const overlayStyle: React.CSSProperties = {
//           position: "absolute",
//           inset: 0,
//           background: overlayColor || "rgba(17,24,39,0.55)",
//           backdropFilter: overlayBlur ? `blur(${overlayBlur}px)` : undefined,
//           transition: "opacity 0.2s ease",
//         };
//         const getShadow = (value?: string) => {
//           switch (value) {
//             case "sm":
//               return "0 10px 20px rgba(15,23,42,0.15)";
//             case "lg":
//               return "0 30px 60px rgba(15,23,42,0.35)";
//             default:
//               return "0 20px 40px rgba(15,23,42,0.22)";
//           }
//         };
//         const baseWidth = typeof width === "number" && width > 0 ? width : null;
//         const baseMaxWidth = typeof maxWidth === "number" && maxWidth > 0 ? maxWidth : null;
//         const safeWidth = baseWidth ? `min(${baseWidth}px, calc(100vw - 2.5rem))` : undefined;
//         const safeMaxWidth = baseMaxWidth ? `min(${baseMaxWidth}px, calc(100vw - 2rem))` : "calc(100vw - 2rem)";
//         const safeMaxHeight = typeof maxHeight === "number" && maxHeight > 0 ? `min(${maxHeight}px, calc(100vh - 3rem))` : "calc(100vh - 3rem)";
//         const handleAction = (targetFlag?: string, shouldClose?: string | boolean) => {
//           const trimmed = (targetFlag || "").toString().trim();
//           if (trimmed) {
//             setFlag(trimmed, true);
//           }
//           if (String(shouldClose) === "true") {
//             setFlag(flagName, false);
//           }
//         };
//         const headingId = `${flagName || "modal"}-heading`;
//         const descriptionId = `${flagName || "modal"}-description`;
//         const showClose = String(showCloseButton ?? "true") !== "false";
//         const hasSlotContent = typeof Content === "function";
//         const bodyParagraphs = (bodyText || "")
//           .split(/\n{2,}/)
//           .map((p: string) => p.trim())
//           .filter((p: string) => p.length > 0);
//         const actions: Array<{
//           variant: "primary" | "secondary";
//           label: string;
//           flag?: string;
//           closes?: string | boolean;
//         }> = [];
//         if ((primaryLabel || "").trim()) {
//           actions.push({ variant: "primary", label: primaryLabel, flag: primaryFlag, closes: primaryCloses });
//         }
//         if ((secondaryLabel || "").trim()) {
//           actions.push({ variant: "secondary", label: secondaryLabel, flag: secondaryFlag, closes: secondaryCloses });
//         }
//         const body = (
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby={title ? headingId : undefined}
//             aria-describedby={bodyParagraphs.length || description ? descriptionId : undefined}
//             style={{
//               background: backgroundColor || "#fff",
//               color: textColor || "#111827",
//               width: safeWidth,
//               maxWidth: safeMaxWidth,
//               maxHeight: safeMaxHeight,
//               padding: `${padding || 0}px`,
//               borderRadius: radius ? `${radius}px` : undefined,
//               boxShadow: getShadow(String(shadow)),
//               display: "flex",
//               flexDirection: "column",
//               gap: typeof gap === "number" ? gap : 16,
//               textAlign: parsedTextAlign,
//               overflow: "auto",
//               overflowX: "hidden",
//               scrollbarWidth: "thin",
//               scrollbarColor: "rgba(148,163,184,0.8) transparent",
//             }}
//           >
//             {showClose ? (
//               <div style={{ display: "flex", justifyContent: "flex-end" }}>
//                 <button
//                   type="button"
//                   onClick={() => setFlag(flagName, false)}
//                   aria-label={closeLabel || "Fermer le modal"}
//                   style={{
//                     background: "transparent",
//                     border: 0,
//                     padding: 8,
//                     cursor: "pointer",
//                     color: "inherit",
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
//             ) : null}
//             {(eyebrow || title || description) ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//                 {eyebrow ? <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{eyebrow}</span> : null}
//                 {title ? <h2 id={headingId} style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>{title}</h2> : null}
//                 {description ? <p id={descriptionId} style={{ margin: 0, color: "rgba(17,24,39,0.76)", lineHeight: 1.55 }}>{description}</p> : null}
//               </div>
//             ) : null}
//             {bodyParagraphs.length ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.6 }}>
//                 {bodyParagraphs.map((paragraph: string, idx: number) => (
//                   <p key={idx} style={{ margin: 0 }}>{paragraph}</p>
//                 ))}
//               </div>
//             ) : null}
//             {hasSlotContent ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                 <Content />
//               </div>
//             ) : null}
//             {actions.length ? (
//               <div style={{ display: "flex", justifyContent: (actionsAlign || "flex-end") as React.CSSProperties["justifyContent"], gap: 12, flexWrap: "wrap" }}>
//                 {actions.map((action, idx) => (
//                   <button
//                     key={idx}
//                     type="button"
//                     onClick={() => handleAction(action.flag, action.closes)}
//                     style={{
//                       minWidth: 120,
//                       padding: "0.6rem 1.25rem",
//                       borderRadius: 999,
//                       border: action.variant === "secondary" ? "1px solid rgba(15,23,42,0.18)" : "1px solid transparent",
//                       background: action.variant === "secondary" ? "transparent" : "#111827",
//                       color: action.variant === "secondary" ? "#111827" : "#f9fafb",
//                       fontWeight: 600,
//                       cursor: "pointer",
//                     }}
//                   >
//                     {action.label}
//                   </button>
//                 ))}
//               </div>
//             ) : null}
//           </div>
//         );
//         return (
//           <div
//             ref={puck?.dragRef}
//             style={{
//               position: "fixed",
//               inset: 0,
//               display: isOpen ? "grid" : (isEditing ? "grid" : "none"),
//               placeItems: "center",
//               zIndex: 1000,
//               padding: "2rem 1rem",
//               overflowY: "auto",
//               alignItems: "center",
//               justifyItems: "center",
//             }}
//           >
//             {String(overlay) === "true" ? (
//               <div
//                 onClick={() => {
//                   if (String(closeOnOverlay) === 'true') setFlag(flagName, false);
//                 }}
//                 style={overlayStyle}
//               />
//             ) : null}
//             <div style={{ position: "relative", zIndex: 1 }}>{body}</div>
//           </div>
//         );
//       },
//     },
//   },
// } as const;




// test1





// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { ActionStateProvider, runActions, ActionType, useActionState } from "./actions";

// // Helper: get current pathname without requiring Next hooks (works in editor and published)
// const getPathname = () => (typeof window !== "undefined" ? window.location?.pathname || "/" : "/");
// // Determine if a route should be considered active.  To guard against passing
// // non-string values into String.prototype.replace(), always coerce inputs to
// // strings before normalising.  This prevents runtime errors when `href` or
// // other values are not strings.
// const routeIsActive = (href?: string, manual?: string) => {
//   if (!href) return String(manual) === "true";
//   const current = getPathname();
//   // Normalise paths by trimming trailing slashes.  Accept any input type and
//   // convert to string to avoid calling `.replace` on non-strings.
//   const normalize = (s: any) => String(s || "").replace(/\/+$/, "");
//   const a = normalize(current);
//   const b = normalize(href);
//   return String(manual) === "true" || a === b || a.startsWith(b + "/");
// };

// // Typing text used by TypingText block
// function TypingTextComponent({
//   text,
//   speed,
//   loop,
//   loopDelay,
//   cursor,
//   color,
//   fontSize,
//   fontFamily,
//   fontWeight,
//   textAlign,
// }: {
//   text?: string;
//   speed?: number;
//   loop?: boolean;
//   loopDelay?: number;
//   cursor?: boolean;
//   color?: string;
//   fontSize?: number;
//   fontFamily?: string;
//   fontWeight?: string;
//   textAlign?: string;
// }) {
//   const [displayed, setDisplayed] = useState("");
//   useEffect(() => {
//     let isCancelled = false;
//     let index = 0;
//     let timeout: NodeJS.Timeout;
//     function type() {
//       if (isCancelled) return;
//       if (!text) return;
//       setDisplayed(text.slice(0, index + 1));
//       if (index < text.length - 1) {
//         index++;
//         timeout = setTimeout(type, speed || 50);
//       } else if (loop) {
//         timeout = setTimeout(() => {
//           index = 0;
//           setDisplayed("");
//           type();
//         }, loopDelay || 500);
//       }
//     }
//     type();
//     return () => {
//       isCancelled = true;
//       clearTimeout(timeout);
//     };
//   }, [text, speed, loop, loopDelay]);
//   const style: React.CSSProperties = {
//     color: color || "#111827",
//     fontSize: fontSize ? `${fontSize}px` : undefined,
//     fontFamily: fontFamily || undefined,
//     fontWeight: fontWeight || undefined,
//     textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
//     display: "inline-block",
//   };
//   return (
//     <span style={style}>
//       {displayed}
//       {cursor ? <span style={{ animation: "blink 1s steps(2, start) infinite" }}>|</span> : null}
//       <style>{`@keyframes blink { from, to { opacity: 0 } 50% { opacity: 1 } }`}</style>
//     </span>
//   );
// }

// // Observe element width (for responsive in Navbar/Sidebar)
// function useElementWidth<T extends HTMLElement>() {
//   const ref = useRef<T | null>(null);
//   const [width, setWidth] = useState<number>(0);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     try { setWidth(el.getBoundingClientRect().width || 0); } catch {}
//     let ro: ResizeObserver | null = null;
//     try {
//       if (typeof ResizeObserver !== "undefined") {
//         ro = new ResizeObserver((entries) => {
//           for (const entry of entries) {
//             const w = entry.contentRect?.width ?? (entry.target as HTMLElement).clientWidth;
//             if (typeof w === "number") setWidth(w);
//           }
//         });
//         ro.observe(el);
//       } else {
//         const handler = () => setWidth(el.getBoundingClientRect().width || 0);
//         window.addEventListener("resize", handler);
//         return () => window.removeEventListener("resize", handler);
//       }
//     } catch {}
//     return () => { try { ro?.disconnect(); } catch {} };
//   }, []);
//   return { ref, width } as const;
// }

// export const puckConfig = {
//   categories: {
//     //
//     // ### MODIFICATION ICI ###
//     // Ajout de "Group" à la catégorie "Mise en page"
//     //
//     layout: { title: "Mise en page", components: ["Container", "Flex", "Grid", "Group", "Space"] },
//     typography: { title: "Typographie", components: ["Heading", "Text", "TypingText"] },
//     actions: { title: "Actions", components: ["Button"] },
//     media: { title: "Média", components: ["Image", "Video"] },
//     widgets: { title: "Widgets", components: ["QrCode", "SpotifyCard", "Testimonials", "LinksList", "ExternalPost", "ColorBox"] },
//     other: { title: "Autres", components: ["Card", "Hero", "Logos", "Navbar", "Sidebar", "Modal"] },
//   },
//   root: {
//     fields: {
//       title: { type: "text", label: "Titre de la page", defaultValue: "Titre" },
//       viewport: {
//         type: "select",
//         label: "Cible d’affichage",
//         options: [
//           { label: "Mobile (360)", value: "360" },
//           { label: "Tablet (768)", value: "768" },
//           { label: "Desktop (1280)", value: "1280" },
//           { label: "Wide (1440)", value: "1440" },
//           { label: "Fluid (100%)", value: "fluid" },
//         ],
//         defaultValue: "fluid",
//       },
//       // When true the ActionStateProvider will allow arbitrary JS execution from runJS actions.  When false
//       // any runJS actions will be ignored.  Exposing this as a field lets authors opt‑out per page.
//       allowCustomJS: { type: "select", label: "Autoriser JS personnalisé", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },
//       // Additional metadata for the page.  The slug is used when saving and publishing; description can be used
//       // for SEO or display in a header.  They don’t affect the visual render but are stored in the payload and
//       // exposed in the right panel like in the Puck example editor.
//       slug: { type: "text", label: "Slug", defaultValue: "default" },
//       description: { type: "textarea", label: "Description", defaultValue: "" },
//     },
//     render: ({ children, title, allowCustomJS }: any) => (
//       <ActionStateProvider allowCustomJS={String(allowCustomJS) === "true"}>
//         <div>
//           {title ? <h1 style={{ fontSize: "1.875rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h1> : null}
//           {children}
//         </div>
//       </ActionStateProvider>
//     ),
//   },
//   components: {
//     FlagsDebug: {
//       label: "Flags Debug",
//       inline: true,
//       fields: {
//         showControls: { type: "select", label: "Show controls", options: [ { label: "Yes", value: "true" }, { label: "No", value: "false" } ], defaultValue: "true" },
//         note: { type: "text", label: "Note", defaultValue: "Use for wiring only; remove before publish." },
//       },
//       render: ({ showControls, note, puck }: any) => {
//         const { flags, setFlag, toggleFlag } = useActionState();
//         const [name, setName] = React.useState<string>("sidebarOpen");
//         const isEditing = (puck as any)?.isEditing;
//         return (
//           <div ref={puck?.dragRef} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace", fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 12, margin: "8px 0" }}>
//             <div style={{ marginBottom: 6, fontWeight: 600 }}>Flags Debug</div>
//             <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 8 }}>{JSON.stringify(flags, null, 2)}</div>
//             {String(showControls) === "true" ? (
//               <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                 <input value={name} onChange={(e) => setName(e.target.value)} placeholder="flag name" style={{ border: "1px solid #ddd", borderRadius: 6, padding: "4px 8px" }} />
//                 <button type="button" onClick={() => setFlag((name || "").trim(), true)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set true</button>
//                 <button type="button" onClick={() => setFlag((name || "").trim(), false)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set false</button>
//                 <button type="button" onClick={() => toggleFlag((name || "").trim())} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>toggle</button>
//                 {isEditing ? <span style={{ color: "#888" }}>(editor)</span> : null}
//               </div>
//             ) : null}
//             {note ? <div style={{ marginTop: 6, color: "#666" }}>{note}</div> : null}
//           </div>
//         );
//       },
//     },
//     Container: {
//       label: "Conteneur",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 8 },
//         margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
//         borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
//       },
//       inline: true,
//       render: ({ children: Content, padding, margin, backgroundColor, borderRadius, borderColor, borderWidth, puck }: any) => {
//         const style: React.CSSProperties = {
//           padding: `${padding || 0}px`,
//           margin: `${margin || 0}px`,
//           backgroundColor: backgroundColor || undefined,
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           borderWidth: borderWidth ? `${borderWidth}px` : undefined,
//           borderColor: borderColor || undefined,
//           borderStyle: borderWidth ? "solid" : undefined,
//           minHeight: "24px", // Assure la visibilité de la zone de dépôt
//         };
//         return <div ref={puck?.dragRef} style={style}>{typeof Content === "function" ? <Content /> : null}</div>;
//       },
//     },
//     Flex: {
//       label: "Flex",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         direction: { type: "select", label: "Direction", options: [{ label: "Ligne", value: "row" }, { label: "Colonne", value: "column" }], defaultValue: "row" },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         wrap: { type: "select", label: "Retour à la ligne", options: [
//           { label: "Pas de retour", value: "nowrap" },
//           { label: "Retour", value: "wrap" },
//           { label: "Retour inversé", value: "wrap-reverse" },
//         ], defaultValue: "nowrap" },
//         alignItems: { type: "select", label: "Alignement transversal", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "flex-start" },
//         justifyContent: { type: "select", label: "Justification", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
//         ], defaultValue: "flex-start" },
//         alignContent: { type: "select", label: "Alignement des lignes", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//       },
//       render: ({ children: Content, direction, gap, gapX, gapY, wrap, alignItems, justifyContent, alignContent }: any) => {
//         const style: React.CSSProperties = {
//           display: "flex",
//           flexDirection: direction || "row",
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || undefined,
//           justifyContent: justifyContent || undefined,
//           alignContent: alignContent || undefined,
//           flexWrap: wrap || "nowrap",
//           minHeight: "24px", // Assure la visibilité de la zone de dépôt
//         };
//         return typeof Content === "function" ? <Content style={style} className="puck-flex-slot" /> : null;
//       },
//     },
//     Grid: {
//       label: "Grille",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         columns: { type: "number", label: "Colonnes", defaultValue: 2 },
//         rows: { type: "number", label: "Lignes", defaultValue: 1 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         autoRows: { type: "text", label: "Taille des lignes implicites", defaultValue: "auto" },
//         autoFlow: { type: "select", label: "Flux automatique", options: [
//           { label: "Lignes", value: "row" }, { label: "Colonnes", value: "column" }, { label: "Densité (row)", value: "row dense" }, { label: "Densité (column)", value: "column dense" },
//         ], defaultValue: "row" },
//         alignItems: { type: "select", label: "Alignement des éléments", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         justifyItems: { type: "select", label: "Justification des éléments", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         alignContent: { type: "select", label: "Alignement du contenu", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         justifyContent: { type: "select", label: "Justification du contenu", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         templateColumns: { type: "text", label: "Template colonnes (avancé)", placeholder: "ex: 200px 1fr auto" },
//         templateRows: { type: "text", label: "Template lignes (avancé)", placeholder: "ex: auto auto" },
//       },
//       render: ({ children: Content, columns, rows, gap, gapX, gapY, autoRows, autoFlow, alignItems, justifyItems, alignContent, justifyContent, templateColumns, templateRows }: any) => {
//         // Coerce template strings to avoid calling `.trim()` on non-strings.  If the
//         // advanced template fields are provided and have non-empty string
//         // contents, use them verbatim; otherwise fall back to a computed
//         // `repeat()` template based on the numeric column/row count.
//         const colStr = typeof templateColumns === "string" ? templateColumns.trim() : String(templateColumns ?? "").trim();
//         const rowStr = typeof templateRows === "string" ? templateRows.trim() : String(templateRows ?? "").trim();
//         const gridTemplateColumns = colStr ? templateColumns : (columns ? `repeat(${columns}, 1fr)` : undefined);
//         const gridTemplateRows = rowStr ? templateRows : (rows ? `repeat(${rows}, auto)` : undefined);
//         const style: React.CSSProperties = {
//           display: "grid",
//           gridTemplateColumns,
//           gridTemplateRows,
//           gridAutoRows: autoRows || "auto",
//           gridAutoFlow: autoFlow || "row",
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || undefined,
//           justifyItems: justifyItems || undefined,
//           alignContent: alignContent || undefined,
//           justifyContent: justifyContent || undefined,
//           minHeight: "24px", // Assure la visibilité de la zone de dépôt
//         };
//         return typeof Content === "function" ? <Content style={style} className="puck-grid-slot" /> : null;
//       },
//     },

//     //
//     // ### NOUVEAU COMPOSANT "GROUP" ###
//     // Ce composant combine les propriétés de style de "Container"
//     // avec les propriétés de mise en page de "Flex".
//     //
//     Group: {
//       label: "Groupe",
//       fields: {
//         children: { type: "slot", label: "Contenu" },
//         // --- Champs de Flex (Mise en page) ---
//         direction: { type: "select", label: "Direction", options: [{ label: "Verticale", value: "column" }, { label: "Horizontale", value: "row" }], defaultValue: "column" },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         wrap: { type: "select", label: "Retour à la ligne", options: [
//           { label: "Pas de retour", value: "nowrap" }, { label: "Retour", value: "wrap" },
//         ], defaultValue: "nowrap" },
//         alignItems: { type: "select", label: "Alignement", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "stretch" },
//         justifyContent: { type: "select", label: "Justification", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" },
//         ], defaultValue: "flex-start" },
//         // --- Champs de Container (Style) ---
//         padding: { type: "number", label: "Padding (px)", defaultValue: 8 },
//         margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
//         borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "transparent" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
//         boxShadow: { type: "text", label: "Ombre (CSS)", placeholder: "0 2px 4px #0000001a" },
//       },
//       render: ({
//         children: Content,
//         direction, gap, gapX, gapY, wrap, alignItems, justifyContent,
//         padding, margin, backgroundColor, borderRadius, borderColor, borderWidth, boxShadow,
//         puck
//       }: any) => {
//         const style: React.CSSProperties = {
//           // Propriétés de Flex
//           display: "flex",
//           flexDirection: direction || "column",
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           flexWrap: wrap || "nowrap",
//           alignItems: alignItems || undefined,
//           justifyContent: justifyContent || undefined,
//           // Propriétés de Container
//           padding: `${padding || 0}px`,
//           margin: `${margin || 0}px`,
//           backgroundColor: backgroundColor || undefined,
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           borderWidth: borderWidth ? `${borderWidth}px` : undefined,
//           borderColor: borderColor || "transparent",
//           borderStyle: borderWidth ? "solid" : undefined,
//           boxShadow: boxShadow || undefined,
//           // Assure la visibilité de la zone de dépôt
//           minHeight: "24px",
//         };
//         // Le rendu est comme "Container" : un 'div' qui enveloppe le contenu
//         return <div ref={puck?.dragRef} style={style}>{typeof Content === "function" ? <Content /> : null}</div>;
//       },
//     },
//     // ### FIN DU NOUVEAU COMPOSANT ###
//     //

//     Space: {
//       label: "Espace",
//       inline: true,
//       fields: {
//         size: { type: "number", label: "Taille (px)", defaultValue: 16 },
//         orientation: { type: "select", label: "Orientation", options: [
//           { label: "Verticale", value: "vertical" },
//           { label: "Horizontale", value: "horizontal" },
//         ], defaultValue: "vertical" },
//       },
//       render: ({ size, orientation, puck }: any) => {
//         const style: React.CSSProperties = {
//           width: orientation === "horizontal" ? `${size || 0}px` : "100%",
//           height: orientation === "vertical" ? `${size || 0}px` : undefined,
//         };
//         return <div ref={puck?.dragRef} style={style} />;
//       },
//     },
//     Heading: {
//       label: "Titre",
//       inline: true,
//       fields: {
//         children: { type: "text", label: "Texte", placeholder: "Votre titre" },
//         level: {
//           type: "select",
//           label: "Niveau",
//           options: [
//             { label: "H1", value: "1" },
//             { label: "H2", value: "2" },
//             { label: "H3", value: "3" },
//             { label: "H4", value: "4" },
//             { label: "H5", value: "5" },
//             { label: "H6", value: "6" },
//           ],
//           defaultValue: "2",
//         },
//         color: { type: "text", label: "Couleur", defaultValue: "#111827" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 24 },
//         fontFamily: { type: "text", label: "Police", placeholder: "" },
//         fontWeight: {
//           type: "select",
//           label: "Graisse",
//           options: [
//             { label: "Normal", value: "400" },
//             { label: "Moyen", value: "500" },
//             { label: "Semi‑gras", value: "600" },
//             { label: "Gras", value: "700" },
//           ],
//           defaultValue: "600",
//         },
//       },
//       render: ({ children, level, color, fontSize, fontFamily, fontWeight, puck }: any) => {
//         const style: React.CSSProperties = {
//           color: color || "#111827",
//           fontSize: fontSize ? `${fontSize}px` : undefined,
//           fontFamily: fontFamily || undefined,
//           fontWeight: fontWeight || undefined,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const tag = `h${level || '2'}`;
//         const El: any = tag as any;
//         return <El ref={puck?.dragRef} style={style}>{children}</El>;
//       },
//     },
//     Text: {
//       label: "Texte",
//       inline: true,
//       fields: {
//         children: { type: "textarea", label: "Contenu", placeholder: "Votre texte" },
//         color: { type: "text", label: "Couleur", defaultValue: "#374151" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 16 },
//         fontFamily: { type: "text", label: "Police", placeholder: "" },
//         fontWeight: { type: "select", label: "Graisse", options: [
//           { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
//         ], defaultValue: "400" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
//         ], defaultValue: "left" },
//       },
//       render: ({ children, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
//         const style: React.CSSProperties = {
//           color: color || "#374151",
//           fontSize: fontSize ? `${fontSize}px` : undefined,
//           fontFamily: fontFamily || undefined,
//           fontWeight: fontWeight || undefined,
//           textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         return <p ref={puck?.dragRef} style={style}>{children}</p>;
//       },
//     },
//     Button: {
//       label: "Bouton",
//       inline: true,
//       fields: {
//         elId: { type: "text", label: "Element ID (cible)", defaultValue: "" },
//         label: { type: "text", label: "Libellé", placeholder: "Cliquez ici" },
//         href: { type: "text", label: "URL", placeholder: "#" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#7c3aed" },
//         color: { type: "text", label: "Couleur du texte", defaultValue: "#ffffff" },
//         paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
//         paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 8 },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         fontSize: { type: "number", label: "Taille texte (px)", defaultValue: 14 },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "scrollTo", value: "scrollTo" },
//               { label: "copy", value: "copy" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "navigate" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             targetElId: { type: "text", label: "targetElId", defaultValue: "" },
//             selector: { type: "text", label: "selector", defaultValue: "" },
//             offset: { type: "number", label: "offset", defaultValue: 0 },
//             smooth: { type: "select", label: "smooth", options: [ { label: "No", value: "false" }, { label: "Yes", value: "true" } ], defaultValue: "true" },
//             text: { type: "text", label: "text", defaultValue: "" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "" },
//             value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "navigate", url: "#", target: "_self" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ elId, actions = [], label, href, backgroundColor, color, paddingX, paddingY, borderRadius, fontSize, puck }: any) => {
//         const actionCtx = useActionState();
//         const style: React.CSSProperties = {
//           display: "inline-block",
//           backgroundColor: backgroundColor || "#7c3aed",
//           color: color || "#ffffff",
//           paddingLeft: `${paddingX || 0}px`,
//           paddingRight: `${paddingX || 0}px`,
//           paddingTop: `${paddingY || 0}px`,
//           paddingBottom: `${paddingY || 0}px`,
//           borderRadius: `${borderRadius || 0}px`,
//           textDecoration: "none",
//           fontSize: fontSize ? `${fontSize}px` : "0.875rem",
//           fontWeight: 500,
//         };
//         const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const clickActs = list.filter((a) => a.event === "click");
//           if (clickActs.length > 0) {
//             e.preventDefault();
//             await runActions(clickActs, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//             return;
//           }
//           if ((puck as any)?.isEditing && href) {
//             e.preventDefault();
//             try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
//           }
//         };
//         const handleEnter = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === "mouseenter");
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//         };
//         const handleLeave = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === "mouseleave");
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//         };
//         return (
//           <a id={elId || undefined} ref={puck?.dragRef} href={href || '#'} style={style} onClick={handleClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave} rel="noopener noreferrer">
//             {label || 'Cliquez ici'}
//           </a>
//         );
//       },
//     },
//     Image: {
//       label: "Image",
//       inline: true,
//       fields: {
//         src: { type: "text", label: "Source", placeholder: "/placeholder_light_gray_block.png" },
//         alt: { type: "text", label: "Texte alternatif", placeholder: "Image" },
//         width: { type: "number", label: "Largeur (px)", defaultValue: 0 },
//         height: { type: "number", label: "Hauteur (px)", defaultValue: 0 },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "setFlag" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
//             value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ src, alt, width, height, actions = [], puck }: any) => {
//         const actionCtx = useActionState();
//         const style: React.CSSProperties = {
//           width: width ? `${width}px` : "100%",
//           height: height ? `${height}px` : "auto",
//           display: "block",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//           cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
//         };
//         const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === ev);
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
//         };
//         return (
//           <img
//             ref={puck?.dragRef}
//             src={src || "/placeholder_light_gray_block.png"}
//             alt={alt || "Image"}
//             style={style}
//             onClick={(e) => runEvt("click", e.currentTarget)}
//             onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)}
//             onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}
//           />
//         );
//       },
//     },
//     Video: {
//       label: "Vidéo",
//       inline: true,
//       fields: { url: { type: "text", label: "URL", placeholder: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 315 } },
//       render: ({ url, height, puck }: any) => {
//         let embedUrl = url;
//         try {
//           const u = new URL(url);
//           if (u.hostname === "www.youtube.com" && u.searchParams.get("v")) {
//             embedUrl = `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
//           } else if (u.hostname === "youtu.be") {
//             embedUrl = `https://www.youtube.com/embed${u.pathname}`;
//           }
//         } catch {}
//         return (
//           <div ref={puck?.dragRef} style={{ width: "100%", height: height || 315, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
//             <iframe src={embedUrl || ""} width="100%" height={height || 315} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
//           </div>
//         );
//       },
//     },
//     QrCode: {
//       label: "QR Code",
//       inline: true,
//       fields: { url: { type: "text", label: "Lien à encoder", defaultValue: "https://hublocal.link" }, size: { type: "number", label: "Taille (px)", defaultValue: 128 } },
//       render: ({ url, size, puck }: any) => {
//         const s = size || 128;
//         const src = `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&data=${encodeURIComponent(url || "")}`;
//         return (
//           <div ref={puck?.dragRef} style={{ width: s, height: s, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
//             <img src={src} alt="QR Code" style={{ width: "100%", height: "100%" }} />
//           </div>
//         );
//       },
//     },
//     SpotifyCard: {
//       label: "Carte Spotify",
//       inline: true,
//       fields: { url: { type: "text", label: "URL Spotify", defaultValue: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 152 } },
//       render: ({ url, height, puck }: any) => {
//         let embedUrl = url || "";
//         try {
//           const u = new URL(url || "");
//           if (!u.pathname.startsWith("/embed")) u.pathname = "/embed" + u.pathname;
//           embedUrl = u.toString();
//         } catch {}
//         return (
//           <div ref={puck?.dragRef} style={{ width: "100%", height: height || 152, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
//             <iframe src={embedUrl} width="100%" height={height || 152} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
//           </div>
//         );
//       },
//     },
//     Testimonials: {
//       label: "Témoignages",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Témoignages (JSON)", defaultValue: JSON.stringify([{ quote: "Super service !", author: "Jean" }, { quote: "Incroyable expérience.", author: "Marie" }]) },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//       },
//       render: ({ items, backgroundColor, borderRadius, padding, puck }: any) => {
//   let parsed: unknown = [];
//   try { parsed = JSON.parse(items || "[]"); } catch { parsed = []; }
//   const normalized = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
//   const list = normalized.filter((entry): entry is { quote?: string; author?: string } => typeof entry === "object" && entry !== null);
//         const style: React.CSSProperties = { backgroundColor: backgroundColor || "#f9fafb", borderRadius: `${borderRadius || 0}px`, padding: `${padding || 0}px`, marginTop: "0.5rem", marginBottom: "0.5rem" };
//         return (
//           <div ref={puck?.dragRef} style={style}>
//             {list.map((item, idx) => (
//               <blockquote key={idx} style={{ marginBottom: "1rem" }}>
//                 <p style={{ fontStyle: "italic" }}>{item.quote}</p>
//                 <footer style={{ marginTop: ".25rem", fontWeight: 500 }}>— {item.author}</footer>
//               </blockquote>
//             ))}
//           </div>
//         );
//       },
//     },
//     TypingText: {
//       label: "Texte animé",
//       inline: true,
//       fields: {
//         text: { type: "textarea", label: "Texte", defaultValue: "Bonjour 👋 Tape en direct…" },
//         speed: { type: "number", label: "Vitesse (ms/lettre)", defaultValue: 40 },
//         loop: { type: "select", label: "Boucle", options: [{ label: "Oui", value: "true" }, { label: "Non", value: "false" }], defaultValue: "true" },
//         loopDelay: { type: "number", label: "Pause avant relance (ms)", defaultValue: 500 },
//         cursor: { type: "select", label: "Curseur", options: [{ label: "Afficher", value: "true" }, { label: "Masquer", value: "false" }], defaultValue: "true" },
//         color: { type: "text", label: "Couleur", defaultValue: "#111827" },
//         fontSize: { type: "number", label: "Taille (px)", defaultValue: 18 },
//         fontFamily: { type: "text", label: "Police", defaultValue: "" },
//         fontWeight: { type: "select", label: "Graisse", options: [
//           { label: "300", value: "300" }, { label: "400", value: "400" }, { label: "500", value: "500" }, { label: "600", value: "600" }, { label: "700", value: "700" }, { label: "800", value: "800" }, { label: "900", value: "900" }, { label: "Bold", value: "bold" },
//         ], defaultValue: "600" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
//         ], defaultValue: "left" },
//       },
//       render: ({ text, speed, loop, loopDelay, cursor, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
//         const loopBool = String(loop) === "true";
//         const cursorBool = String(cursor) === "true";
//         return (
//           <span ref={puck?.dragRef}>
//             <TypingTextComponent text={text} speed={speed} loop={loopBool} loopDelay={loopDelay} cursor={cursorBool} color={color} fontSize={fontSize} fontFamily={fontFamily} fontWeight={fontWeight} textAlign={textAlign} />
//           </span>
//         );
//       },
//     },
//     // External data component that demonstrates integration with third‑party content.  It exposes an
//     // `external` field allowing the editor to pick from a list of posts.  The list is defined locally
//     // but could be fetched from an API.  Selecting an item triggers resolveData to inject the post’s
//     // title and body props into the component.  Authors can also provide fallback text when no
//     // external post is chosen.
//     ExternalPost: {
//       label: "Article externe",
//       inline: true,
//       fields: {
//         // The external post selection.  fetchList returns a list of options with id and label.  In a
//         // real implementation this might call your CMS or blog API【182405108990970†L125-L170】.  The value
//         // stored in the data payload will be the id of the chosen post.
//         post: {
//           type: "external",
//           label: "Sélectionner un article",
//           // Return a static list of posts.  In production this would call an API.
//           async fetchList() {
//             return [
//               { id: "1", label: "Premier article" },
//               { id: "2", label: "Deuxième article" },
//               { id: "3D", label: "Troisième article" },
//             ];
//           },
//         },
//         fallbackTitle: { type: "text", label: "Titre par défaut", defaultValue: "Aucun article" },
//         fallbackBody: { type: "textarea", label: "Contenu par défaut", defaultValue: "Choisissez un article externe pour afficher son contenu." },
//       },
//       // When the external id changes, look up the static posts and return the title and body.  The
//       // changed parameter allows us to avoid reprocessing when unchanged【182405108990970†L179-L224】.
//       resolveData: async (args: any, ctx: any) => {
//         const { post, fallbackTitle, fallbackBody } = args || {};
//         const changed = (ctx && (ctx as any).changed) || {};
//         // Only recompute when the post id changes
//         if (!changed?.post) return undefined;
//         const posts = {
//           "1": { title: "Premier article", body: "Ceci est le corps du premier article." },
//           "2": { title: "Deuxième article", body: "Contenu du deuxième article avec plus de détails." },
//           "3": { title: "Troisième article", body: "Voici un autre article pour l’exemple." },
//         } as Record<string, { title: string; body: string }>;
//         const entry = post && posts[post as string];
//         return { props: { resolvedTitle: entry?.title || fallbackTitle, resolvedBody: entry?.body || fallbackBody } };
//       },
//       render: ({ resolvedTitle, resolvedBody, fallbackTitle, fallbackBody, puck }: any) => {
//         // resolvedTitle and resolvedBody are injected by resolveData.  Fallbacks provide defaults.
//         const title = resolvedTitle || fallbackTitle || "";
//         const body = resolvedBody || fallbackBody || "";
//         return (
//           <article ref={puck?.dragRef} style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
//             <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
//             <p style={{ marginBottom: 0 }}>{body}</p>
//           </article>
//         );
//       },
//     },
//     // A simple component using a custom field to choose a colour.  This demonstrates how to
//     // implement your own field type via the `custom` field API【603904605376732†L115-L170】.  The
//     // `onChange` handler updates the data payload; the component uses the selected colour to
//     // render a square box.  Size is configurable via a number field.
//     ColorBox: {
//       label: "Boîte de couleur",
//       inline: true,
//       fields: {
//         color: {
//           type: "custom",
//           label: "Couleur",
//           defaultValue: "#2563eb",
//           render: ({ value, onChange }: any) => {
//             return (
//               <input
//                 type="color"
//                 value={value || "#2563eb"}
//                 onChange={(e) => onChange(e.target.value)}
//                 style={{ width: "100%", height: "2rem", padding: 0, border: "none", background: "transparent" }}
//               />
//             );
//           },
//         },
//         size: { type: "number", label: "Taille (px)", defaultValue: 64 },
//       },
//       render: ({ color, size, puck }: any) => {
//         const s = size || 64;
//         const c = color || "#2563eb";
//         return (
//           <div
//             ref={puck?.dragRef}
//             style={{ width: s, height: s, backgroundColor: c, borderRadius: "0.25rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}
//           />
//         );
//       },
//     },
//     LinksList: {
//       label: "Liste de liens",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Liens (JSON)", defaultValue: JSON.stringify([{ label: "LinkedIn", url: "https://www.linkedin.com" }, { label: "YouTube", url: "https://www.youtube.com" }]) },
//         color: { type: "text", label: "Couleur du texte", defaultValue: "#2563eb" },
//         spacing: { type: "number", label: "Espacement (px)", defaultValue: 4 },
//       },
//       render: ({ items, color, spacing, puck }: any) => {
//         let list: Array<{ label: string; url: string }> = [];
//         try { list = JSON.parse(items || "[]"); } catch { list = []; }
//         const styleLink: React.CSSProperties = { color: color || "#2563eb", textDecoration: "underline", display: "block", marginBottom: `${spacing || 0}px` };
//         return (
//           <div ref={puck?.dragRef} style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
//             {list.map((item, idx) => (
//               <a key={idx} href={item.url} style={styleLink} target="_blank" rel="noopener noreferrer">{item.label}</a>
//             ))}
//           </div>
//         );
//       },
//     },
//     Card: {
//       label: "Carte",
//       inline: true,
//       fields: {
//         elId: { type: "text", label: "Element ID", defaultValue: "" },
//         icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "📦" },
//         title: { type: "text", label: "Titre", defaultValue: "Titre" },
//         description: { type: "textarea", label: "Description", defaultValue: "Description" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#ffffff" },
//         borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//         borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
//         align: { type: "select", label: "Alignement du texte", options: [
//           { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//         layout: { type: "select", label: "Disposition", options: [
//           { label: "Verticale", value: "vertical" }, { label: "Horizontale", value: "horizontal" },
//         ], defaultValue: "vertical" },
//         href: { type: "text", label: "Lien (optionnel)", defaultValue: "" },
//         shadow: { type: "select", label: "Ombre", options: [
//           { label: "Avec ombre", value: "true" }, { label: "Sans ombre", value: "false" },
//         ], defaultValue: "true" },
//         actions: {
//           type: "array",
//           label: "Actions",
//           arrayFields: {
//             event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
//             type: { type: "select", label: "type", options: [
//               { label: "navigate", value: "navigate" },
//               { label: "emit", value: "emit" },
//               { label: "toggle", value: "toggle" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "runJS", value: "runJS" },
//             ], defaultValue: "setFlag" },
//             url: { type: "text", label: "url", defaultValue: "#" },
//             name: { type: "text", label: "event name", defaultValue: "" },
//             detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
//             flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
//             value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//             code: { type: "textarea", label: "JS code", defaultValue: "" },
//           },
//           defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
//           getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
//         },
//       },
//       render: ({ elId, icon, title, description, backgroundColor, borderRadius, padding, borderColor, borderWidth, align, layout, href, shadow, actions = [], puck }: any) => {
//         const actionCtx = useActionState();
//         const style: React.CSSProperties = {
//           backgroundColor: backgroundColor || "#ffffff",
//           borderRadius: borderRadius ? `${borderRadius}px` : undefined,
//           padding: padding ? `${padding}px` : undefined,
//           boxShadow: String(shadow) === "true" ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : undefined,
//           borderWidth: borderWidth ? `${borderWidth}px` : undefined,
//           borderColor: borderColor || undefined,
//           borderStyle: borderWidth ? "solid" : undefined,
//           textAlign: (align as React.CSSProperties["textAlign"]) || "left",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//           cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
//         };
//         const isUrl = typeof icon === "string" && (icon.startsWith("http") || icon.startsWith("/"));
//         const inner = (
//           <div style={{ display: layout === "horizontal" ? "flex" : "block", gap: layout === "horizontal" ? 12 : undefined, alignItems: layout === "horizontal" ? "center" : undefined }}>
//             {icon && (
//               <div style={{ fontSize: "2rem", marginBottom: layout === "horizontal" ? 0 : "0.5rem" }}>
//                 {isUrl ? <img src={icon} alt="Icon" style={{ width: "2rem", height: "2rem", objectFit: "cover" }} /> : icon}
//               </div>
//             )}
//             <div>
//               <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>{title}</h3>
//               <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{description}</p>
//             </div>
//           </div>
//         );
//         const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
//           const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//           const acts = list.filter((a) => a.event === ev);
//           if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
//         };
//         const cardEl = (
//           <div id={elId || undefined} ref={puck?.dragRef} style={style} onClick={(e) => runEvt("click", e.currentTarget)} onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)} onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}>
//             {inner}
//           </div>
//         );
//         if (href) {
//           const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
//             const list = (Array.isArray(actions) ? actions : []) as ActionType[];
//             const clickActs = list.filter((a) => a.event === "click");
//             if (clickActs.length > 0) {
//               e.preventDefault();
//               return; // handled by inner
//             }
//             if ((puck as any)?.isEditing) {
//               e.preventDefault();
//               try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
//             }
//           };
//           return <a href={href} onClick={onClick} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{cardEl}</a>;
//         }
//         return cardEl;
//       },
//     },
//     Hero: {
//       label: "Héros",
//       inline: true,
//       fields: {
//         title: { type: "text", label: "Titre", defaultValue: "Titre" },
//         description: { type: "textarea", label: "Description", defaultValue: "Description du héros" },
//         image: { type: "text", label: "Image (URL)", defaultValue: "https://images.unsplash.com/photo-1606761569780-43b7311d8682?auto=format&fit=crop&w=800&q=80" },
//         imagePosition: { type: "select", label: "Position de l’image", options: [
//           { label: "Gauche", value: "left" }, { label: "Droite", value: "right" }, { label: "Haut", value: "top" }, { label: "Bas", value: "bottom" },
//         ], defaultValue: "right" },
//         backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
//         textColor: { type: "text", label: "Couleur du texte", defaultValue: "#111827" },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 32 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
//         imageRadius: { type: "number", label: "Arrondi image (px)", defaultValue: 8 },
//         imageFit: { type: "select", label: "Ajustement image", options: [
//           { label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }, { label: "Fill", value: "fill" },
//         ], defaultValue: "cover" },
//         imageMaxHeight: { type: "number", label: "Hauteur max image (px)", defaultValue: 480 },
//         buttons: {
//           type: "array",
//           label: "buttons",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Button" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             variant: { type: "select", label: "variant", options: [
//               { label: "primary", value: "primary" },
//               { label: "secondary", value: "secondary" },
//               { label: "outline", value: "outline" },
//               { label: "ghost", value: "ghost" },
//             ], defaultValue: "primary" },
//             actionType: { type: "select", label: "action", options: [
//               { label: "none", value: "none" },
//               { label: "setFlag", value: "setFlag" },
//               { label: "toggle", value: "toggle" },
//             ], defaultValue: "none" },
//             flag: { type: "text", label: "flag name", defaultValue: "" },
//             value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
//           },
//           defaultItemProps: { label: "Learn more", href: "#", variant: "primary" },
//           getItemSummary: (item: any) => item?.label || "button",
//         },
//         align: { type: "select", label: "Alignement du texte", options: [
//           { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//       },
//       /*
//        * Dynamic data resolution.
//        * Puck expects `resolveData` to return an object with a `props` key.  Returning
//        * undefined here causes the editor to attempt destructuring `props` from
//        * undefined, which throws a runtime error.  Returning an empty `props` object
//        * avoids that issue and signals that no props are being modified.
//        */
//       resolveData: async () => {
//         return { props: {} };
//       },

//       /*
//        * Dynamically show or hide fields based on current props.  When the image
//        * position is vertical (top or bottom), the `imageFit` option isn’t
//        * relevant and is removed from the panel.  Use the `data` and `params`
//        * arguments provided by Puck to safely access props and fields.  If
//        * either argument is undefined, default to empty objects to avoid
//        * destructuring errors.
//        */
//       resolveFields: async (data: any = {}, params: any = {}) => {
//         const fields = (params && params.fields) || {};
//         const props = (data && data.props) || {};
//         if ((props.imagePosition === 'top' || props.imagePosition === 'bottom') && 'imageFit' in fields) {
//           const { imageFit, ...rest } = fields as any;
//           return rest;
//         }
//         return fields;
//       },
//       // Prevent users from deleting the hero component.  They can still drag and duplicate it.
//       permissions: { delete: false, drag: true, duplicate: true },
//       render: ({ title, description, image, imagePosition, backgroundColor, textColor, radius, padding, gap, imageRadius, imageFit, imageMaxHeight, buttons, align, puck }: any) => {
//         const actionCtx = useActionState();
//         let btns: Array<{ label?: string; href?: string; url?: string; variant?: string }> = [];
//         if (Array.isArray(buttons)) {
//           btns = buttons;
//         } else {
//           try {
//             const parsed = typeof buttons === "string" ? JSON.parse(buttons) : buttons;
//             if (Array.isArray(parsed)) btns = parsed.filter((x: any) => x && typeof x === "object");
//             else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).buttons)) btns = (parsed as any).buttons.filter((x: any) => x && typeof x === "object");
//             else if (parsed && typeof parsed === "object") btns = [parsed as any];
//           } catch { btns = []; }
//         }
//         // Determine if the layout is horizontal (image left/right) or vertical (image top/bottom)
//         const isHorizontal = imagePosition === "left" || imagePosition === "right";
//         const flexDirection = isHorizontal ? "row" : "column";
//         const orderImageFirst = imagePosition === "left" || imagePosition === "top";
//         // When horizontal use equal widths and allow wrapping so that on small viewports the image
//         // and text stack naturally. In vertical mode width is 100%.
//         const columnWidth = isHorizontal ? "50%" : "100%";
//         const containerStyle: React.CSSProperties = {
//           display: "flex",
//           flexDirection,
//           // Allow items to wrap on narrow screens when horizontal to avoid overflow
//           flexWrap: isHorizontal ? "wrap" : undefined,
//           alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
//           justifyContent: "space-between",
//           backgroundColor: backgroundColor || "#f9fafb",
//           color: textColor || "#111827",
//           padding: `${padding ?? 32}px`,
//           gap: `${gap ?? 16}px`,
//           borderRadius: `${radius ?? 8}px`,
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         const textStyle: React.CSSProperties = {
//           flex: isHorizontal ? "1 1 50%" : undefined,
//           width: columnWidth,
//           textAlign: (align as React.CSSProperties["textAlign"]) || "left",
//         };
//         // The image itself should always fill its container. Height is constrained via maxHeight.
//         const imageStyle: React.CSSProperties = {
//           width: "100%",
//           maxHeight: imageMaxHeight ? `${imageMaxHeight}px` : undefined,
//           height: "auto",
//           borderRadius: imageRadius ? `${imageRadius}px` : undefined,
//           objectFit: imageFit || "cover",
//         };
//         const left = (
//           <div style={textStyle}>
//             <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h2>
//             <p style={{ fontSize: "1rem", marginBottom: "1rem" }}>{description}</p>
//             <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
//               {btns.map((btn, idx) => {
//                 const href = (btn as any).href ?? (btn as any).url ?? "#";
//                 const variant = (btn as any).variant ?? "primary";
//                 const styleMap: Record<string, React.CSSProperties> = {
//                   primary: { backgroundColor: "#6366f1", color: "#ffffff", border: "1px solid #6366f1" },
//                   secondary: { backgroundColor: "#e5e7eb", color: "#111827", border: "1px solid #e5e7eb" },
//                   outline: { backgroundColor: "transparent", color: "#111827", border: "1px solid #d1d5db" },
//                   ghost: { backgroundColor: "transparent", color: "#6366f1", border: "1px solid transparent" },
//                 };
//                 const baseStyle: React.CSSProperties = { padding: "0.5rem 1rem", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", display: "inline-block" };
//                 const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const isEditing = (puck as any)?.isEditing;
//                   const actionType = (btn as any).actionType as string | undefined;
//                   // Ensure flag is a trimmed string when provided; convert non-string values
//                   // to strings before trimming to avoid runtime errors
//                   const rawFlag = (btn as any).flag as any;
//                   const flag = rawFlag != null ? String(rawFlag).trim() : undefined;
//                   const valueStr = (btn as any).value as string | undefined;
//                   if (actionType && actionType !== "none") {
//                     e.preventDefault();
//                     const actions: ActionType[] = [] as any;
//                     if (actionType === "setFlag" && flag) {
//                       actions.push({ event: "click", type: "setFlag", flag, value: valueStr === "true" });
//                     } else if (actionType === "toggle" && flag) {
//                       actions.push({ event: "click", type: "toggle", flag });
//                     }
//                     if (actions.length) {
//                       await runActions(actions, { isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
//                       return;
//                     }
//                   }
//                   if (isEditing && href) {
//                     e.preventDefault();
//                     try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
//                   }
//                 };
//                 return <a key={idx} href={href} onClick={handleClick} style={{ ...baseStyle, ...(styleMap[variant] || styleMap.primary) }} rel="noopener noreferrer">{(btn.label as string) || "Button"}</a>;
//               })}
//             </div>
//           </div>
//         );
//         const right = (
//           <div
//             style={{
//               flex: isHorizontal ? "1 1 50%" : undefined,
//               width: columnWidth,
//               display: "flex",
//               justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
//             }}
//           >
//             {image && <img src={image} alt={title || "Image"} style={imageStyle} />}
//           </div>
//         );
//         return (
//           <div ref={puck?.dragRef} style={containerStyle}>
//             {orderImageFirst ? right : left}
//             {orderImageFirst ? left : right}
//           </div>
//         );
//       },
//     },
//     Logos: {
//       label: "Logos",
//       inline: true,
//       fields: {
//         items: { type: "textarea", label: "Logos (JSON)", defaultValue: JSON.stringify([
//           { src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg", alt: "React" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/4/47/Nodejs.svg", alt: "Node.js" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg", alt: "Node" },
//           { src: "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png", alt: "JavaScript" },
//         ]) },
//         columns: { type: "number", label: "Colonnes", defaultValue: 4 },
//         gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
//         gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
//         gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
//         justifyContent: { type: "select", label: "Justification", options: [
//           { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
//         ], defaultValue: "center" },
//         alignItems: { type: "select", label: "Alignement vertical", options: [
//           { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
//         ], defaultValue: "center" },
//         size: { type: "number", label: "Taille (px)", defaultValue: 64 },
//         grayscale: { type: "select", label: "Niveaux de gris", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//         hoverOpacity: { type: "number", label: "Opacité au survol (0-1)", defaultValue: 1 },
//         linkTarget: { type: "select", label: "Cible du lien", options: [ { label: "Nouvel onglet", value: "_blank" }, { label: "Même onglet", value: "_self" } ], defaultValue: "_blank" },
//       },
//       render: ({ items, columns, gap, gapX, gapY, justifyContent, alignItems, size, grayscale, hoverOpacity, linkTarget, puck }: any) => {
//         let logos: Array<{ src: string; alt?: string; url?: string }> = [];
//         try {
//           const parsed = typeof items === "string" ? JSON.parse(items) : items;
//           if (Array.isArray(parsed)) logos = parsed.map((it: any) => (typeof it === 'string' ? { src: it } : it)).filter((x: any) => x && typeof x === "object");
//           else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).items)) logos = (parsed as any).items.map((it: any) => (typeof it === 'string' ? { src: it } : it));
//         } catch { logos = []; }
//         const style: React.CSSProperties = {
//           display: "grid",
//           gridTemplateColumns: columns ? `repeat(${columns}, auto)` : undefined,
//           gap: gap ? `${gap}px` : undefined,
//           columnGap: gapX ? `${gapX}px` : undefined,
//           rowGap: gapY ? `${gapY}px` : undefined,
//           alignItems: alignItems || "center",
//           justifyContent: justifyContent || "center",
//           marginTop: "0.5rem",
//           marginBottom: "0.5rem",
//         };
//         return (
//           <div ref={puck?.dragRef} style={style}>
//             {logos.map((logo, idx) => {
//               const img = (
//                 <img key={idx} src={logo.src} alt={logo.alt || "Logo"} style={{ width: size ? `${size}px` : "64px", height: "auto", objectFit: "contain", filter: String(grayscale) === 'true' ? 'grayscale(100%)' : undefined, transition: 'opacity .15s ease-in-out' }}
//                   onMouseEnter={(e) => { const v = Number(hoverOpacity); if (!Number.isNaN(v) && v >= 0 && v <= 1) (e.currentTarget as HTMLImageElement).style.opacity = String(v); }}
//                   onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
//                 />
//               );
//               return logo.url ? (
//                 <a key={idx} href={logo.url} target={linkTarget || "_blank"} rel="noopener noreferrer">{img}</a>
//               ) : (
//                 img
//               );
//             })}
//           </div>
//         );
//       },
//     },
//     Navbar: {
//       label: "Navbar",
//       inline: true,
//       fields: {
//         brand: { type: "text", label: "Marque", defaultValue: "Brand" },
//         brandHref: { type: "text", label: "Lien marque", defaultValue: "/" },
//         brandImageSrc: { type: "text", label: "Logo (URL)", defaultValue: "" },
//         brandImageWidth: { type: "number", label: "Logo largeur (px)", defaultValue: 24 },
//         brandImageHeight: { type: "number", label: "Logo hauteur (px)", defaultValue: 24 },
//         brandGap: { type: "number", label: "Espace logo/texte (px)", defaultValue: 8 },
//         brandFontSize: { type: "number", label: "Taille marque (px)", defaultValue: 18 },
//         brandFontWeight: { type: "select", label: "Graisse marque", options: [
//           { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
//         ], defaultValue: "700" },
//         brandColor: { type: "text", label: "Couleur marque", defaultValue: "inherit" },

//         align: { type: "select", label: "Alignement liens", options: [ { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" } ], defaultValue: "right" },
//         paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
//         paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 12 },
//         gap: { type: "number", label: "Espace horizontal (px)", defaultValue: 12 },
//         containerMaxWidth: { type: "number", label: "Max width conteneur (px, 0=fluid)", defaultValue: 1280 },
//         centerContainer: { type: "select", label: "Centrer conteneur", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },

//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         borderBottom: { type: "select", label: "Bordure basse", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
//         shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

//         positionMode: { type: "select", label: "Position", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
//         top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
//         zIndex: { type: "number", label: "z-index", defaultValue: 50 },

//         linkGap: { type: "number", label: "Espace liens (px)", defaultValue: 12 },
//         linkPaddingX: { type: "number", label: "Padding lien X (px)", defaultValue: 8 },
//         linkPaddingY: { type: "number", label: "Padding lien Y (px)", defaultValue: 6 },
//         linkHoverUnderline: { type: "select", label: "Souligner au survol", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         linkHoverColor: { type: "text", label: "Couleur au survol", defaultValue: "" },

//         collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 768 },
//         mobileMenuPosition: { type: "select", label: "Menu mobile côté", options: [ { label: "Droite", value: "right" }, { label: "Gauche", value: "left" } ], defaultValue: "right" },
//         menuButtonLabel: { type: "text", label: "Texte bouton menu", defaultValue: "Menu" },

//         links: {
//           type: "array",
//           label: "Liens",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Link" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//           },
//           defaultItemProps: { label: "About", href: "#", target: "_self", active: "false" },
//           getItemSummary: (item: any) => item?.label || "link",
//         },
//       },
//       render: (props: any) => {
//         function NavBarView({ puck, ...p }: any) {
//           const { ref, width } = useElementWidth<HTMLDivElement>();
//           const [open, setOpen] = useState(false);
//           const collapseAt = Number(p.collapseAt || 0) || 0;
//           const collapsed = collapseAt > 0 && width > 0 && width < collapseAt;
//           const justify = p.align === "center" ? "center" : p.align === "right" ? "flex-end" : "flex-start";
//           const containerStyle: React.CSSProperties = {
//             maxWidth: Number(p.containerMaxWidth) ? `${p.containerMaxWidth}px` : undefined,
//             margin: String(p.centerContainer) === "true" ? "0 auto" : undefined,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: p.gap ?? 12,
//           };
//           const navStyle: React.CSSProperties = {
//             backgroundColor: p.backgroundColor || "#ffffff",
//             color: p.textColor || "#111827",
//             padding: `${p.paddingY ?? 12}px ${p.paddingX ?? 16}px`,
//             borderBottom: String(p.borderBottom) === "true" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
//             boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
//             position: p.positionMode || "static",
//             top: p.top ?? 0,
//             zIndex: p.zIndex ?? 50,
//           } as React.CSSProperties;

//           const brandLinkStyle: React.CSSProperties = {
//             display: "inline-flex",
//             alignItems: "center",
//             gap: p.brandGap ?? 8,
//             fontSize: p.brandFontSize ? `${p.brandFontSize}px` : undefined,
//             fontWeight: p.brandFontWeight || 700,
//             color: p.brandColor && p.brandColor !== "inherit" ? p.brandColor : undefined,
//             textDecoration: "none",
//           };

//           const linkStyleBase: React.CSSProperties = {
//             textDecoration: "none",
//             color: "inherit",
//             padding: `${p.linkPaddingY ?? 6}px ${p.linkPaddingX ?? 8}px`,
//             borderRadius: 6,
//           };

//           const LinksInline = () => (
//             <div style={{ display: "flex", alignItems: "center", justifyContent: justify, gap: p.linkGap ?? 12, flex: 1, marginLeft: 12 }}>
//               {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => {
//                 const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const c = p.linkHoverColor as string;
//                   if (c) (e.currentTarget as HTMLAnchorElement).style.color = c;
//                   if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
//                 };
//                 const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   (e.currentTarget as HTMLAnchorElement).style.color = "inherit";
//                   if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
//                 };
//                 const active = routeIsActive(l?.href, l?.active);
//                 const style: React.CSSProperties = { ...linkStyleBase, opacity: active ? 1 : 0.9, fontWeight: active ? 600 : 500 };
//                 return (
//                   <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
//                      style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
//                     {l?.label || "Link"}
//                   </a>
//                 );
//               })}
//             </div>
//           );

//           const LinksMobile = () => (
//             <div style={{ display: open ? "block" : "none", position: "absolute", [p.mobileMenuPosition === "left" ? "left" : "right"]: 0, top: "100%", background: p.backgroundColor || "#fff", border: `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}`, borderRadius: 8, padding: 8, boxShadow: "0 4px 12px rgba(0,0,0,.08)" } as React.CSSProperties}>
//               <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
//                 {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => (
//                   <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
//                      style={{ ...linkStyleBase }}>{l?.label || "Link"}</a>
//                 ))}
//               </div>
//             </div>
//           );

//           return (
//             <nav ref={puck?.dragRef} style={navStyle}>
//               <div ref={ref} style={containerStyle}>
//                 <a href={p.brandHref || "/"} style={brandLinkStyle}>
//                   {p.brandImageSrc ? (
//                     <img src={p.brandImageSrc} alt={p.brand || "Brand"} style={{ width: p.brandImageWidth || 24, height: p.brandImageHeight || 24 }} />
//                   ) : null}
//                   <span>{p.brand || "Brand"}</span>
//                 </a>
//                 {collapsed ? (
//                   <div style={{ marginLeft: "auto", position: "relative" }}>
//                     <button type="button" onClick={() => setOpen((v) => !v)}
//                       style={{ background: "transparent", color: "inherit", border: 0, padding: 8, borderRadius: 6, cursor: "pointer" }}>
//                       {p.menuButtonLabel || "Menu"}
//                     </button>
//                     <LinksMobile />
//                   </div>
//                 ) : (
//                   <LinksInline />
//                 )}
//               </div>
//             </nav>
//           );
//         }
//         return <NavBarView {...props} />;
//       },
//     },
//     Sidebar: {
//       label: "Sidebar",
//       inline: true,
//       fields: {
//         position: { type: "select", label: "Position", options: [ { label: "Gauche", value: "left" }, { label: "Droite", value: "right" } ], defaultValue: "left" },
//         stickyMode: { type: "select", label: "Positionnement", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
//         top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
//         zIndex: { type: "number", label: "z-index", defaultValue: 40 },

//         widthDesktop: { type: "number", label: "Largeur desktop (px)", defaultValue: 280 },
//         widthMobile: { type: "number", label: "Largeur mobile (px)", defaultValue: 280 },
//         collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 1024 },
//         // Hide internal open/close toggles by default. Users can still enable
//         // these buttons explicitly if desired by switching this value to "true".
//         showToggle: { type: "select", label: "Afficher bouton", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         // Desktop toggle buttons are opt-in only; by default they are not shown.
//         showDesktopToggle: { type: "select", label: "Boutons test (desktop)", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//         overlay: { type: "select", label: "Overlay mobile", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         controlFlag: { type: "text", label: "Flag de contrôle (ouvrir/fermer)", defaultValue: "" },
//         controlDefaultOpen: { type: "select", label: "Ouvert par défaut si flag non défini", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },

//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 12 },
//         borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
//         borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
//         shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

//         itemGap: { type: "number", label: "Espacement éléments (px)", defaultValue: 8 },
//         itemPaddingX: { type: "number", label: "Padding X élément (px)", defaultValue: 8 },
//         itemPaddingY: { type: "number", label: "Padding Y élément (px)", defaultValue: 6 },
//         itemRadius: { type: "number", label: "Arrondi élément (px)", defaultValue: 6 },
//         itemHoverBg: { type: "text", label: "Fond au survol", defaultValue: "#f3f4f6" },
//         itemActiveBg: { type: "text", label: "Fond actif", defaultValue: "#e5e7eb" },
//         itemTextColor: { type: "text", label: "Couleur texte", defaultValue: "inherit" },
//         itemHoverTextColor: { type: "text", label: "Texte au survol", defaultValue: "inherit" },
//         itemActiveTextColor: { type: "text", label: "Texte actif", defaultValue: "inherit" },

//         items: {
//           type: "array",
//           label: "Éléments",
//           arrayFields: {
//             label: { type: "text", label: "label", defaultValue: "Item" },
//             href: { type: "text", label: "href", defaultValue: "#" },
//             icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "" },
//             target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
//             active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
//           },
//           defaultItemProps: { label: "Dashboard", href: "#", icon: "", target: "_self", active: "false" },
//           getItemSummary: (it: any) => it?.label || "item",
//         },
//       },
//       render: (props: any) => {
//         function SidebarView({ puck, ...p }: any) {
//           const { ref, width } = useElementWidth<HTMLDivElement>();
//           const [open, setOpen] = useState(false);
//           const actionState = useActionState();
//           const collapseAt = Number(p.collapseAt || 0) || 0;
//           // Determine whether we are in a collapsed/mobile state based on the measured width.
//           const measured = width > 0 ? width : (typeof window !== "undefined" ? window.innerWidth : 0);
//           const collapsed = collapseAt > 0 && measured > 0 && measured < collapseAt;
//           const side = p.position === "right" ? "right" : "left";
//           const desktopWidth = Number(p.widthDesktop || 280) || 280;
//           const mobileWidth = Number(p.widthMobile || 280) || 280;
//           // Always coerce controlFlag to a string before trimming to guard against
//           // non-string values (e.g. booleans or numbers).  Without this, calling
//           // `.trim()` on undefined or other types will throw a runtime error.
//           const flagName = String(p.controlFlag ?? "").trim();
//           // Pull the current flag value; undefined if not set.
//           const flagVal = flagName ? actionState.flags[flagName] : undefined;
//           const defaultOpen = String(p.controlDefaultOpen) === "true";

//           // Resolve whether the sidebar should be considered open. When a control flag
//           // is provided we use the flag if it's been set, otherwise we fall back to
//           // the controlDefaultOpen value. Without a control flag we use local state.
//           const resolvedOpen: boolean = flagName
//             ? (flagVal !== undefined ? !!flagVal : defaultOpen)
//             : open;

//           // Helpers to centralise sidebar open/close logic.
//           // When a controlFlag is provided we dispatch to the global flag state;
//           // otherwise we fall back to the component's internal open state.
//           const handleOpen = () => {
//             if (flagName) {
//               actionState.setFlag(flagName, true);
//             } else {
//               setOpen(true);
//             }
//           };
//           const handleClose = () => {
//             if (flagName) {
//               actionState.setFlag(flagName, false);
//             } else {
//               setOpen(false);
//             }
//           };
//           const handleToggle = () => {
//             if (flagName) {
//               actionState.toggleFlag(flagName);
//             } else {
//               setOpen((v) => !v);
//             }
//           };

//           // Common styling for the aside container
//           const commonAsideStyle: React.CSSProperties = {
//             backgroundColor: p.backgroundColor || "#ffffff",
//             color: p.textColor || "#111827",
//             borderRadius: p.radius ? `${p.radius}px` : undefined,
//             padding: `${p.padding || 0}px`,
//             border: String(p.borderWidth || 0) !== "0" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
//             boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
//           };
//           const itemBaseStyle: React.CSSProperties = {
//             textDecoration: "none",
//             color: p.itemTextColor && p.itemTextColor !== "inherit" ? p.itemTextColor : "inherit",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             padding: `${p.itemPaddingY ?? 6}px ${p.itemPaddingX ?? 8}px`,
//             borderRadius: p.itemRadius ? `${p.itemRadius}px` : "6px",
//           };

//           const ItemsList = () => (
//             <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: p.itemGap ?? 8 }}>
//               {(Array.isArray(p.items) ? p.items : []).map((it: any, i: number) => {
//                 const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const bg = p.itemHoverBg as string; const tc = p.itemHoverTextColor as string;
//                   if (bg) (e.currentTarget as HTMLAnchorElement).style.background = bg;
//                   if (tc) (e.currentTarget as HTMLAnchorElement).style.color = tc;
//                 };
//                 const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
//                   const active = routeIsActive(it?.href, it?.active);
//                   (e.currentTarget as HTMLAnchorElement).style.background = active ? (p.itemActiveBg as string) || "" : "transparent";
//                   (e.currentTarget as HTMLAnchorElement).style.color = active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit";
//                 };
//                 const active = routeIsActive(it?.href, it?.active);
//                 const style: React.CSSProperties = {
//                   ...itemBaseStyle,
//                   background: active ? (p.itemActiveBg as string) || "#e5e7eb" : "transparent",
//                   color: active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit",
//                 };
//                 const icon = it?.icon;
//                 const iconEl = icon ? (
//                   icon.startsWith("http") || icon.startsWith("/")
//                     ? <img src={icon} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
//                     : <span style={{ fontSize: 16 }}>{icon}</span>
//                 ) : null;
//                 return (
//                   <li key={i}>
//                     <a href={it?.href || "#"} target={it?.target || "_self"} rel={it?.target === "_blank" ? "noopener noreferrer" : undefined}
//                        style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
//                       {iconEl}
//                       <span>{it?.label || "Item"}</span>
//                     </a>
//                   </li>
//                 );
//               })}
//             </ul>
//           );

//           // Render the mobile overlay drawer. We compute its visibility from
//           // `resolvedOpen` so that the drawer respects the control flag or the
//           // default open state when collapsed. When the overlay or close
//           // button is clicked, the sidebar is closed via handleClose().
//           const MobileDrawer = () => (
//             <div
//               style={{
//                 position: "fixed",
//                 inset: 0,
//                 display: (collapsed && resolvedOpen) ? "block" : "none",
//                 zIndex: (p.zIndex ?? 40) + 1,
//               }}
//             >
//               {String(p.overlay) === "true" ? (
//                 <div
//                   onClick={() => handleClose()}
//                   style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }}
//                 />
//               ) : null}
//               <aside
//                 style={{
//                   ...commonAsideStyle,
//                   position: "absolute",
//                   top: 0,
//                   bottom: 0,
//                   [side]: 0,
//                   width: mobileWidth,
//                   overflowY: "auto",
//                 } as React.CSSProperties}
//               >
//                 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
//                   <button
//                     type="button"
//                     onClick={() => handleClose()}
//                     style={{ background: "transparent", border: 0, padding: 8, cursor: "pointer" }}
//                   >
//                     Close
//                   </button>
//                 </div>
//                 <ItemsList />
//               </aside>
//             </div>
//           );

//           // Determine visibility for mobile and desktop views using the resolved open state.
//           const isOpenMobile = collapsed ? resolvedOpen : undefined;
//           const isVisibleDesktop = !collapsed ? resolvedOpen : true;

//           return (
//             <div ref={puck?.dragRef} style={{ position: "relative" }}>
//               {collapsed && String(p.showToggle) === "true" ? (
//                 <button
//                   type="button"
//                   onClick={() => handleOpen()}
//                   style={{
//                     background: "transparent",
//                     border: `1px solid ${p.borderColor || "#e5e7eb"}`,
//                     padding: "6px 10px",
//                     borderRadius: 6,
//                     cursor: "pointer",
//                     margin: "0.5rem 0",
//                   }}
//                 >
//                   Open sidebar
//                 </button>
//               ) : null}
//               <div ref={ref} style={{ width: "100%" }} />
//               {collapsed ? (
//                 isOpenMobile ? <MobileDrawer /> : null
//               ) : (
//                 isVisibleDesktop ? (
//                   <aside
//                     style={{
//                       ...commonAsideStyle,
//                       position: p.stickyMode || "static",
//                       top: p.top ?? 0,
//                       zIndex: p.zIndex ?? 40,
//                       width: desktopWidth,
//                       margin: "0.5rem 0",
//                     }}
//                   >
//                     {String(p.showDesktopToggle) === "true" ? (
//                       <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
//                         <button
//                           type="button"
//                           onClick={() => handleOpen()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Open
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleClose()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Close
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleToggle()}
//                           style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
//                         >
//                           Toggle
//                         </button>
//                       </div>
//                     ) : null}
//                     <ItemsList />
//                   </aside>
//                 ) : null
//               )}
//             </div>
//           );
//         }
//         return <SidebarView {...props} />;
//       },
//     },
//     Modal: {
//       label: "Modal",
//       inline: true,
//       fields: {
//         flag: { type: "text", label: "Flag d'ouverture", defaultValue: "modalOpen" },
//         overlay: { type: "select", label: "Overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         closeOnOverlay: { type: "select", label: "Fermer sur overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         overlayColor: { type: "text", label: "Couleur overlay", defaultValue: "rgba(17,24,39,0.55)" },
//         overlayBlur: { type: "number", label: "Blur overlay (px)", defaultValue: 0 },
//         width: { type: "number", label: "Largeur (px)", defaultValue: 560 },
//         maxWidth: { type: "number", label: "Max width (px)", defaultValue: 720 },
//         maxHeight: { type: "number", label: "Hauteur max (px)", defaultValue: 640 },
//         padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
//         gap: { type: "number", label: "Espacement interne (px)", defaultValue: 16 },
//         radius: { type: "number", label: "Arrondi (px)", defaultValue: 12 },
//         shadow: { type: "select", label: "Ombre", options: [
//           { label: "Légère", value: "sm" },
//           { label: "Moyenne", value: "md" },
//           { label: "Forte", value: "lg" },
//         ], defaultValue: "md" },
//         backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
//         textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
//         textAlign: { type: "select", label: "Alignement", options: [
//           { label: "Gauche", value: "left" },
//           { label: "Centré", value: "center" },
//           { label: "Droite", value: "right" },
//         ], defaultValue: "left" },
//         eyebrow: { type: "text", label: "Sur-titre", defaultValue: "" },
//         title: { type: "text", label: "Titre", defaultValue: "Titre du modal" },
//         description: { type: "textarea", label: "Description", defaultValue: "Ajoutez un texte introductif pour contextualiser votre contenu." },
//         bodyText: { type: "textarea", label: "Texte principal", defaultValue: "" },
//         showCloseButton: { type: "select", label: "Bouton fermer", options: [ { label: "Afficher", value: "true" }, { label: "Masquer", value: "false" } ], defaultValue: "true" },
//         closeLabel: { type: "text", label: "Label bouton fermer", defaultValue: "Fermer" },
//         primaryLabel: { type: "text", label: "Action principale", defaultValue: "Confirmer" },
//         primaryFlag: { type: "text", label: "Flag action principale", defaultValue: "" },
//         primaryCloses: { type: "select", label: "Fermer après action principale", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
//         secondaryLabel: { type: "text", label: "Action secondaire", defaultValue: "" },
//         secondaryFlag: { type: "text", label: "Flag action secondaire", defaultValue: "" },
//         secondaryCloses: { type: "select", label: "Fermer après action secondaire", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
//         actionsAlign: { type: "select", label: "Alignement actions", options: [
//           { label: "Aligné à gauche", value: "flex-start" },
//           { label: "Centré", value: "center" },
//           { label: "Aligné à droite", value: "flex-end" },
//           { label: "Espacées", value: "space-between" },
//         ], defaultValue: "flex-end" },
//         children: { type: "slot", label: "Contenu avancé (slot)" },
//       },
//       render: ({
//         flag,
//         overlay,
//         closeOnOverlay,
//         overlayColor,
//         overlayBlur,
//         width,
//         maxWidth,
//         maxHeight,
//         padding,
//         gap,
//         radius,
//         shadow,
//         backgroundColor,
//         textColor,
//         textAlign,
//         eyebrow,
//         title,
//         description,
//         bodyText,
//         showCloseButton,
//         closeLabel,
//         primaryLabel,
//         primaryFlag,
//         primaryCloses,
//         secondaryLabel,
//         secondaryFlag,
//         secondaryCloses,
//         actionsAlign,
//         children: Content,
//         puck,
//       }: any) => {
//         const { flags, setFlag } = useActionState();
//         // When looking up a flag, coerce the name to a trimmed string to avoid
//         // `.trim()` on non-strings (e.g. booleans).  Use "modalOpen" as the
//         // default flag name when none is provided.
//         const rawFlagName = flag ?? "modalOpen";
//         const flagName = String(rawFlagName).trim();
//         const isOpen = !!flags[flagName];
//         const isEditing = (puck as any)?.isEditing;
//         if (!isOpen && !isEditing) return null;
//   const parsedTextAlign = (textAlign || "left") as React.CSSProperties["textAlign"];
//         const overlayStyle: React.CSSProperties = {
//           position: "absolute",
//           inset: 0,
//           background: overlayColor || "rgba(17,24,39,0.55)",
//           backdropFilter: overlayBlur ? `blur(${overlayBlur}px)` : undefined,
//           transition: "opacity 0.2s ease",
//         };
//         const getShadow = (value?: string) => {
//           switch (value) {
//             case "sm":
//               return "0 10px 20px rgba(15,23,42,0.15)";
//             case "lg":
//               return "0 30px 60px rgba(15,23,42,0.35)";
//             default:
//               return "0 20px 40px rgba(15,23,42,0.22)";
//           }
//         };
//         const baseWidth = typeof width === "number" && width > 0 ? width : null;
//         const baseMaxWidth = typeof maxWidth === "number" && maxWidth > 0 ? maxWidth : null;
//         const safeWidth = baseWidth ? `min(${baseWidth}px, calc(100vw - 2.5rem))` : undefined;
//         const safeMaxWidth = baseMaxWidth ? `min(${baseMaxWidth}px, calc(100vw - 2rem))` : "calc(100vw - 2rem)";
//         const safeMaxHeight = typeof maxHeight === "number" && maxHeight > 0 ? `min(${maxHeight}px, calc(100vh - 3rem))` : "calc(100vh - 3rem)";
//         const handleAction = (targetFlag?: string, shouldClose?: string | boolean) => {
//           const trimmed = (targetFlag || "").toString().trim();
//           if (trimmed) {
//             setFlag(trimmed, true);
//           }
//           if (String(shouldClose) === "true") {
//             setFlag(flagName, false);
//           }
//         };
//         const headingId = `${flagName || "modal"}-heading`;
//         const descriptionId = `${flagName || "modal"}-description`;
//         const showClose = String(showCloseButton ?? "true") !== "false";
//         const hasSlotContent = typeof Content === "function";
//         const bodyParagraphs = (bodyText || "")
//           .split(/\n{2,}/)
//           .map((p: string) => p.trim())
//           .filter((p: string) => p.length > 0);
//         const actions: Array<{
//           variant: "primary" | "secondary";
//           label: string;
//           flag?: string;
//           closes?: string | boolean;
//         }> = [];
//         if ((primaryLabel || "").trim()) {
//           actions.push({ variant: "primary", label: primaryLabel, flag: primaryFlag, closes: primaryCloses });
//         }
//         if ((secondaryLabel || "").trim()) {
//           actions.push({ variant: "secondary", label: secondaryLabel, flag: secondaryFlag, closes: secondaryCloses });
//         }
//         const body = (
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby={title ? headingId : undefined}
//             aria-describedby={bodyParagraphs.length || description ? descriptionId : undefined}
//             style={{
//               background: backgroundColor || "#fff",
//               color: textColor || "#111827",
//               width: safeWidth,
//               maxWidth: safeMaxWidth,
//               maxHeight: safeMaxHeight,
//               padding: `${padding || 0}px`,
//               borderRadius: radius ? `${radius}px` : undefined,
//               boxShadow: getShadow(String(shadow)),
//               display: "flex",
//               flexDirection: "column",
//               gap: typeof gap === "number" ? gap : 16,
//               textAlign: parsedTextAlign,
//               overflow: "auto",
//               overflowX: "hidden",
//               scrollbarWidth: "thin",
//               scrollbarColor: "rgba(148,163,184,0.8) transparent",
//             }}
//           >
//             {showClose ? (
//               <div style={{ display: "flex", justifyContent: "flex-end" }}>
//                 <button
//                   type="button"
//                   onClick={() => setFlag(flagName, false)}
//                   aria-label={closeLabel || "Fermer le modal"}
//                   style={{
//                     background: "transparent",
//                     border: 0,
//                     padding: 8,
//                     cursor: "pointer",
//                     color: "inherit",
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
//             ) : null}
//             {(eyebrow || title || description) ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//                 {eyebrow ? <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{eyebrow}</span> : null}
//                 {title ? <h2 id={headingId} style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>{title}</h2> : null}
//                 {description ? <p id={descriptionId} style={{ margin: 0, color: "rgba(17,24,39,0.76)", lineHeight: 1.55 }}>{description}</p> : null}
//               </div>
//             ) : null}
//             {bodyParagraphs.length ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.6 }}>
//                 {bodyParagraphs.map((paragraph: string, idx: number) => (
//                   <p key={idx} style={{ margin: 0 }}>{paragraph}</p>
//                 ))}
//               </div>
//             ) : null}
//             {hasSlotContent ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                 <Content />
//               </div>
//             ) : null}
//             {actions.length ? (
//               <div style={{ display: "flex", justifyContent: (actionsAlign || "flex-end") as React.CSSProperties["justifyContent"], gap: 12, flexWrap: "wrap" }}>
//                 {actions.map((action, idx) => (
//                   <button
//                     key={idx}
//                     type="button"
//                     onClick={() => handleAction(action.flag, action.closes)}
//                     style={{
//                       minWidth: 120,
//                       padding: "0.6rem 1.25rem",
//                       borderRadius: 999,
//                       border: action.variant === "secondary" ? "1px solid rgba(15,23,42,0.18)" : "1px solid transparent",
//                       background: action.variant === "secondary" ? "transparent" : "#111827",
//                       color: action.variant === "secondary" ? "#111827" : "#f9fafb",
//                       fontWeight: 600,
//                       cursor: "pointer",
//                     }}
//                   >
//                     {action.label}
//                   </button>
//                 ))}
//               </div>
//             ) : null}
//           </div>
//         );
//         return (
//           <div
//             ref={puck?.dragRef}
//             style={{
//               position: "fixed",
//               inset: 0,
//               display: isOpen ? "grid" : (isEditing ? "grid" : "none"),
//               placeItems: "center",
//               zIndex: 1000,
//               padding: "2rem 1rem",
//               overflowY: "auto",
//               alignItems: "center",
//               justifyItems: "center",
//             }}
//           >
//             {String(overlay) === "true" ? (
//               <div
//                 onClick={() => {
//                   if (String(closeOnOverlay) === 'true') setFlag(flagName, false);
//                 }}
//                 style={overlayStyle}
//               />
//             ) : null}
//             <div style={{ position: "relative", zIndex: 1 }}>{body}</div>
//           </div>
//         );
//       },
//     },
//   },
// } as const;




// test2


"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { ActionStateProvider, runActions, ActionType, useActionState } from "./actions";
// Importer le hook ET le contexte
import { usePuck, PuckContext } from "./puck-context"; 

// Helper: get current pathname without requiring Next hooks (works in editor and published)
const getPathname = () => (typeof window !== "undefined" ? window.location?.pathname || "/" : "/");
// Determine if a route should be considered active.  To guard against passing
// non-string values into String.prototype.replace(), always coerce inputs to
// strings before normalising.  This prevents runtime errors when `href` or
// other values are not strings.
const routeIsActive = (href?: string, manual?: string) => {
  if (!href) return String(manual) === "true";
  const current = getPathname();
  // Normalise paths by trimming trailing slashes.  Accept any input type and
  // convert to string to avoid calling `.replace` on non-strings.
  const normalize = (s: any) => String(s || "").replace(/\/+$/, "");
  const a = normalize(current);
  const b = normalize(href);
  return String(manual) === "true" || a === b || a.startsWith(b + "/");
};

// Typing text used by TypingText block
function TypingTextComponent({
  text,
  speed,
  loop,
  loopDelay,
  cursor,
  color,
  fontSize,
  fontFamily,
  fontWeight,
  textAlign,
}: {
  text?: string;
  speed?: number;
  loop?: boolean;
  loopDelay?: number;
  cursor?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let isCancelled = false;
    let index = 0;
    let timeout: NodeJS.Timeout;
    function type() {
      if (isCancelled) return;
      if (!text) return;
      setDisplayed(text.slice(0, index + 1));
      if (index < text.length - 1) {
        index++;
        timeout = setTimeout(type, speed || 50);
      } else if (loop) {
        timeout = setTimeout(() => {
          index = 0;
          setDisplayed("");
          type();
        }, loopDelay || 500);
      }
    }
    type();
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [text, speed, loop, loopDelay]);
  const style: React.CSSProperties = {
    color: color || "#111827",
    fontSize: fontSize ? `${fontSize}px` : undefined,
    fontFamily: fontFamily || undefined,
    fontWeight: fontWeight || undefined,
    textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
    display: "inline-block",
  };
  return (
    <span style={style}>
      {displayed}
      {cursor ? <span style={{ animation: "blink 1s steps(2, start) infinite" }}>|</span> : null}
      <style>{`@keyframes blink { from, to { opacity: 0 } 50% { opacity: 1 } }`}</style>
    </span>
  );
}

// Observe element width (for responsive in Navbar/Sidebar)
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try { setWidth(el.getBoundingClientRect().width || 0); } catch {}
    let ro: ResizeObserver | null = null;
    try {
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = entry.contentRect?.width ?? (entry.target as HTMLElement).clientWidth;
            if (typeof w === "number") setWidth(w);
          }
        });
        ro.observe(el);
      } else {
        const handler = () => setWidth(el.getBoundingClientRect().width || 0);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
      }
    } catch {}
    return () => { try { ro?.disconnect(); } catch {} };
  }, []);
  return { ref, width } as const;
}

// ### HELPER RESPONSIVE MIS À JOUR ###
type Breakpoint = "mobile" | "tablet" | "desktop";

// Ce hook est maintenant "intelligent"
function useBreakpoint(): Breakpoint {
  // 1) Ne JAMAIS appeler useContext avec un contexte indéfini
  // Vérifions d'abord que PuckContext ressemble à un vrai contexte React
  const hasPuckContext = !!(
    PuckContext && typeof PuckContext === "object" &&
    ("Provider" in (PuckContext as any) || "$$typeof" in (PuckContext as any))
  );

  if (!hasPuckContext) {
    // Contexte non disponible (page publiée). Pas d'appel de hooks dépendants.
    return "desktop";
  }

  // 2) Ici PuckContext est valide; on peut demander la valeur du contexte.
  const puckStore = useContext(PuckContext as any);

  // 3) S'il n'y a pas de Provider au-dessus, la valeur peut être undefined → fallback
  if (!puckStore) return "desktop";

  // 4) Dans l'éditeur, utiliser la largeur de l'aperçu
  return useEditorBreakpoint();
}

// Ce hook ne doit être appelé QUE si le contexte existe
function useEditorBreakpoint(): Breakpoint {
  const appState = usePuck((s) => (s as any).appState as any);
  
  // Utilise la largeur de l'aperçu de l'éditeur. 1280 par défaut.
  const width = (appState as any)?.previewSize?.width || 1280; 

  if (width < 768) return "mobile";
  if (width < 1280) return "tablet";
  return "desktop";
}

// Helper pour résoudre les props responsives (inchangé)
function getResponsiveValue<T>(
  breakpoint: Breakpoint,
  mobile?: T,
  tablet?: T,
  desktop?: T,
  defaultValue?: T
): T {
  if (breakpoint === "desktop") {
    return desktop ?? tablet ?? mobile ?? defaultValue as T;
  }
  if (breakpoint === "tablet") {
    return tablet ?? mobile ?? defaultValue as T;
  }
  // Mobile
  return mobile ?? defaultValue as T;
}
// ### FIN DES MODIFICATIONS ###


export const config = {
  categories: {
    layout: { title: "Mise en page", components: ["Container", "Flex", "Grid", "Group", "Space"] },
    typography: { title: "Typographie", components: ["Heading", "Text", "TypingText"] },
    actions: { title: "Actions", components: ["Button"] },
    media: { title: "Média", components: ["Image", "Video"] },
    widgets: { title: "Widgets", components: ["QrCode", "SpotifyCard", "Testimonials", "LinksList", "ExternalPost", "ColorBox"] },
    other: { title: "Autres", components: ["Card", "Hero", "Logos", "Navbar", "Sidebar", "Modal"] },
  },
  root: {
    fields: {
      title: { type: "text", label: "Titre de la page", defaultValue: "Titre" },
      viewport: {
        type: "select",
        label: "Cible d’affichage",
        options: [
          { label: "Mobile (360)", value: "360" },
          { label: "Tablet (768)", value: "768" },
          { label: "Desktop (1280)", value: "1280" },
          { label: "Wide (1440)", value: "1440" },
          { label: "Fluid (100%)", value: "fluid" },
        ],
        defaultValue: "fluid",
      },
      allowCustomJS: { type: "select", label: "Autoriser JS personnalisé", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },
      slug: { type: "text", label: "Slug", defaultValue: "default" },
      description: { type: "textarea", label: "Description", defaultValue: "" },
    },
    render: ({ children, title, allowCustomJS }: any) => (
      <ActionStateProvider allowCustomJS={String(allowCustomJS) === "true"}>
        <div>
          {title ? <h1 style={{ fontSize: "1.875rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h1> : null}
          {children}
        </div>
      </ActionStateProvider>
    ),
  },
  components: {
    FlagsDebug: {
      label: "Flags Debug",
      inline: true,
      fields: {
        showControls: { type: "select", label: "Show controls", options: [ { label: "Yes", value: "true" }, { label: "No", value: "false" } ], defaultValue: "true" },
        note: { type: "text", label: "Note", defaultValue: "Use for wiring only; remove before publish." },
      },
      render: ({ showControls, note, puck }: any) => {
        const { flags, setFlag, toggleFlag } = useActionState();
        const [name, setName] = React.useState<string>("sidebarOpen");
        const isEditing = (puck as any)?.isEditing;
        return (
          <div ref={puck?.dragRef} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace", fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 12, margin: "8px 0" }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Flags Debug</div>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 8 }}>{JSON.stringify(flags, null, 2)}</div>
            {String(showControls) === "true" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="flag name" style={{ border: "1px solid #ddd", borderRadius: 6, padding: "4px 8px" }} />
                <button type="button" onClick={() => setFlag((name || "").trim(), true)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set true</button>
                <button type="button" onClick={() => setFlag((name || "").trim(), false)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>set false</button>
                <button type="button" onClick={() => toggleFlag((name || "").trim())} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>toggle</button>
                {isEditing ? <span style={{ color: "#888" }}>(editor)</span> : null}
              </div>
            ) : null}
            {note ? <div style={{ marginTop: 6, color: "#666" }}>{note}</div> : null}
          </div>
        );
      },
    },
    Container: {
      label: "Conteneur",
      fields: {
        children: { type: "slot", label: "Contenu" },
        paddingMobile: { type: "number", label: "Padding Mobile (px)", defaultValue: 8 },
        paddingTablet: { type: "number", label: "Padding Tablette (px)" },
        paddingDesktop: { type: "number", label: "Padding Desktop (px)" },
        marginMobile: { type: "number", label: "Margin Mobile (px)", defaultValue: 0 },
        marginTablet: { type: "number", label: "Margin Tablette (px)" },
        marginDesktop: { type: "number", label: "Margin Desktop (px)" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
        borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
      },
      inline: true,
      render: ({ 
        children: Content, 
        paddingMobile, paddingTablet, paddingDesktop,
        marginMobile, marginTablet, marginDesktop,
        backgroundColor, borderRadius, borderColor, borderWidth, puck 
      }: any) => {
        // useBreakpoint est maintenant sûr à appeler ici
        const breakpoint = useBreakpoint();
        const padding = getResponsiveValue(breakpoint, paddingMobile, paddingTablet, paddingDesktop, 8);
        const margin = getResponsiveValue(breakpoint, marginMobile, marginTablet, marginDesktop, 0);

        const style: React.CSSProperties = {
          padding: `${padding}px`,
          margin: `${margin}px`,
          backgroundColor: backgroundColor || undefined,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          borderWidth: borderWidth ? `${borderWidth}px` : undefined,
          borderColor: borderColor || undefined,
          borderStyle: borderWidth ? "solid" : undefined,
          minHeight: "24px", // Assure la visibilité de la zone de dépôt
        };
        return <div ref={puck?.dragRef} style={style}>{typeof Content === "function" ? <Content /> : null}</div>;
      },
    },
    Flex: {
      label: "Flex",
      fields: {
        children: { type: "slot", label: "Contenu" },
        directionMobile: { type: "select", label: "Direction Mobile", options: [{ label: "Colonne", value: "column" }, { label: "Ligne", value: "row" }], defaultValue: "column" },
        directionTablet: { type: "select", label: "Direction Tablette", options: [{ label: "Colonne", value: "column" }, { label: "Ligne", value: "row" }], defaultValue: "row" },
        directionDesktop: { type: "select", label: "Direction Desktop", options: [{ label: "Colonne", value: "column" }, { label: "Ligne", value: "row" }], defaultValue: "row" },
        gapMobile: { type: "number", label: "Espacement Mobile (px)", defaultValue: 8 },
        gapTablet: { type: "number", label: "Espacement Tablette (px)" },
        gapDesktop: { type: "number", label: "Espacement Desktop (px)" },
        gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
        gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
        wrap: { type: "select", label: "Retour à la ligne", options: [
          { label: "Pas de retour", value: "nowrap" },
          { label: "Retour", value: "wrap" },
          { label: "Retour inversé", value: "wrap-reverse" },
        ], defaultValue: "nowrap" },
        alignItems: { type: "select", label: "Alignement transversal", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "flex-start" },
        justifyContent: { type: "select", label: "Justification", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
        ], defaultValue: "flex-start" },
        alignContent: { type: "select", label: "Alignement des lignes", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
      },
      render: ({ 
        children: Content, 
        directionMobile, directionTablet, directionDesktop,
        gapMobile, gapTablet, gapDesktop,
        gapX, gapY, wrap, alignItems, justifyContent, alignContent, puck 
      }: any) => {
        const breakpoint = useBreakpoint();
        const direction = getResponsiveValue(breakpoint, directionMobile, directionTablet, directionDesktop, "column");
        const gap = getResponsiveValue(breakpoint, gapMobile, gapTablet, gapDesktop, 8);

        const style: React.CSSProperties = {
          display: "flex",
          flexDirection: direction,
          gap: gap ? `${gap}px` : undefined,
          columnGap: gapX ? `${gapX}px` : undefined,
          rowGap: gapY ? `${gapY}px` : undefined,
          alignItems: alignItems || undefined,
          justifyContent: justifyContent || undefined,
          alignContent: alignContent || undefined,
          flexWrap: wrap || "nowrap",
          minHeight: "24px",
        };
        return typeof Content === "function" ? <Content style={style} className="puck-flex-slot" /> : null;
      },
    },
    Grid: {
      label: "Grille",
      fields: {
        children: { type: "slot", label: "Contenu" },
        columnsMobile: { type: "number", label: "Colonnes Mobile", defaultValue: 1 },
        columnsTablet: { type: "number", label: "Colonnes Tablette", defaultValue: 2 },
        columnsDesktop: { type: "number", label: "Colonnes Desktop", defaultValue: 2 },
        rows: { type: "number", label: "Lignes", defaultValue: 1 },
        gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
        gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
        gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
        autoRows: { type: "text", label: "Taille des lignes implicites", defaultValue: "auto" },
        autoFlow: { type: "select", label: "Flux automatique", options: [
          { label: "Lignes", value: "row" }, { label: "Colonnes", value: "column" }, { label: "Densité (row)", value: "row dense" }, { label: "Densité (column)", value: "column dense" },
        ], defaultValue: "row" },
        alignItems: { type: "select", label: "Alignement des éléments", options: [
          { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
        justifyItems: { type: "select", label: "Justification des éléments", options: [
          { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
        alignContent: { type: "select", label: "Alignement du contenu", options: [
          { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
        justifyContent: { type: "select", label: "Justification du contenu", options: [
          { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
        templateColumns: { type: "text", label: "Template colonnes (avancé)", placeholder: "ex: 200px 1fr auto" },
        templateRows: { type: "text", label: "Template lignes (avancé)", placeholder: "ex: auto auto" },
      },
      render: ({ 
        children: Content, 
        columnsMobile, columnsTablet, columnsDesktop,
        rows, gap, gapX, gapY, autoRows, autoFlow, alignItems, justifyItems, alignContent, justifyContent, templateColumns, templateRows, puck 
      }: any) => {
        const breakpoint = useBreakpoint();
        const columns = getResponsiveValue(breakpoint, columnsMobile, columnsTablet, columnsDesktop, 1);

        const colStr = typeof templateColumns === "string" ? templateColumns.trim() : String(templateColumns ?? "").trim();
        const rowStr = typeof templateRows === "string" ? templateRows.trim() : String(templateRows ?? "").trim();
        const gridTemplateColumns = colStr ? templateColumns : (columns ? `repeat(${columns}, 1fr)` : undefined);
        const gridTemplateRows = rowStr ? templateRows : (rows ? `repeat(${rows}, auto)` : undefined);
        
        const style: React.CSSProperties = {
          display: "grid",
          gridTemplateColumns,
          gridTemplateRows,
          gridAutoRows: autoRows || "auto",
          gridAutoFlow: autoFlow || "row",
          gap: gap ? `${gap}px` : undefined,
          columnGap: gapX ? `${gapX}px` : undefined,
          rowGap: gapY ? `${gapY}px` : undefined,
          alignItems: alignItems || undefined,
          justifyItems: justifyItems || undefined,
          alignContent: alignContent || undefined,
          justifyContent: justifyContent || undefined,
          minHeight: "24px",
        };
        return typeof Content === "function" ? <Content style={style} className="puck-grid-slot" /> : null;
      },
    },
    Group: {
      label: "Groupe",
      fields: {
        children: { type: "slot", label: "Contenu" },
        // --- Champs de Flex (Mise en page) ---
        directionMobile: { type: "select", label: "Direction Mobile", options: [{ label: "Verticale", value: "column" }, { label: "Horizontale", value: "row" }], defaultValue: "column" },
        directionTablet: { type: "select", label: "Direction Tablette", options: [{ label: "Verticale", value: "column" }, { label: "Horizontale", value: "row" }] },
        directionDesktop: { type: "select", label: "Direction Desktop", options: [{ label: "Verticale", value: "column" }, { label: "Horizontale", value: "row" }] },
        gapMobile: { type: "number", label: "Espacement Mobile (px)", defaultValue: 8 },
        gapTablet: { type: "number", label: "Espacement Tablette (px)" },
        gapDesktop: { type: "number", label: "Espacement Desktop (px)" },
        wrap: { type: "select", label: "Retour à la ligne", options: [
          { label: "Pas de retour", value: "nowrap" }, { label: "Retour", value: "wrap" },
        ], defaultValue: "nowrap" },
        alignItems: { type: "select", label: "Alignement", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "stretch" },
        justifyContent: { type: "select", label: "Justification", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" },
        ], defaultValue: "flex-start" },
        // --- Champs de Container (Style) ---
        paddingMobile: { type: "number", label: "Padding Mobile (px)", defaultValue: 8 },
        paddingTablet: { type: "number", label: "Padding Tablette (px)" },
        paddingDesktop: { type: "number", label: "Padding Desktop (px)" },
        marginMobile: { type: "number", label: "Margin Mobile (px)", defaultValue: 0 },
        marginTablet: { type: "number", label: "Margin Tablette (px)" },
        marginDesktop: { type: "number", label: "Margin Desktop (px)" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
        borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "transparent" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
        boxShadow: { type: "text", label: "Ombre (CSS)", placeholder: "0 2px 4px #0000001a" },
      },
      render: ({
        children: Content,
        directionMobile, directionTablet, directionDesktop,
        gapMobile, gapTablet, gapDesktop,
        wrap, alignItems, justifyContent,
        paddingMobile, paddingTablet, paddingDesktop,
        marginMobile, marginTablet, marginDesktop,
        backgroundColor, borderRadius, borderColor, borderWidth, boxShadow,
        puck
      }: any) => {
        const breakpoint = useBreakpoint();
        const direction = getResponsiveValue(breakpoint, directionMobile, directionTablet, directionDesktop, "column");
        const gap = getResponsiveValue(breakpoint, gapMobile, gapTablet, gapDesktop, 8);
        const padding = getResponsiveValue(breakpoint, paddingMobile, paddingTablet, paddingDesktop, 8);
        const margin = getResponsiveValue(breakpoint, marginMobile, marginTablet, marginDesktop, 0);

        const style: React.CSSProperties = {
          // Propriétés de Flex
          display: "flex",
          flexDirection: direction,
          gap: gap ? `${gap}px` : undefined,
          flexWrap: wrap || "nowrap",
          alignItems: alignItems || undefined,
          justifyContent: justifyContent || undefined,
          // Propriétés de Container
          padding: `${padding}px`,
          margin: `${margin}px`,
          backgroundColor: backgroundColor || undefined,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          borderWidth: borderWidth ? `${borderWidth}px` : undefined,
          borderColor: borderColor || "transparent",
          borderStyle: borderWidth ? "solid" : undefined,
          boxShadow: boxShadow || undefined,
          // Assure la visibilité de la zone de dépôt
          minHeight: "24px",
        };
        return <div ref={puck?.dragRef} style={style}>{typeof Content === "function" ? <Content /> : null}</div>;
      },
    },
    Space: {
      label: "Espace",
      inline: true,
      fields: {
        sizeMobile: { type: "number", label: "Taille Mobile (px)", defaultValue: 16 },
        sizeTablet: { type: "number", label: "Taille Tablette (px)" },
        sizeDesktop: { type: "number", label: "Taille Desktop (px)" },
        orientation: { type: "select", label: "Orientation", options: [
          { label: "Verticale", value: "vertical" },
          { label: "Horizontale", value: "horizontal" },
        ], defaultValue: "vertical" },
      },
      render: ({ sizeMobile, sizeTablet, sizeDesktop, orientation, puck }: any) => {
        const breakpoint = useBreakpoint();
        const size = getResponsiveValue(breakpoint, sizeMobile, sizeTablet, sizeDesktop, 16);

        const style: React.CSSProperties = {
          width: orientation === "horizontal" ? `${size}px` : "100%",
          height: orientation === "vertical" ? `${size}px` : undefined,
        };
        return <div ref={puck?.dragRef} style={style} />;
      },
    },
    Heading: {
      label: "Titre",
      inline: true,
      fields: {
        children: { type: "text", label: "Texte", placeholder: "Votre titre" },
        level: {
          type: "select",
          label: "Niveau",
          options: [
            { label: "H1", value: "1" },
            { label: "H2", value: "2" },
            { label: "H3", value: "3" },
            { label: "H4", value: "4" },
            { label: "H5", value: "5" },
            { label: "H6", value: "6" },
          ],
          defaultValue: "2",
        },
        color: { type: "text", label: "Couleur", defaultValue: "#111827" },
        fontSizeMobile: { type: "number", label: "Taille Mobile (px)", defaultValue: 24 },
        fontSizeTablet: { type: "number", label: "Taille Tablette (px)" },
        fontSizeDesktop: { type: "number", label: "Taille Desktop (px)" },
        fontFamily: { type: "text", label: "Police", placeholder: "" },
        fontWeight: {
          type: "select",
          label: "Graisse",
          options: [
            { label: "Normal", value: "400" },
            { label: "Moyen", value: "500" },
            { label: "Semi‑gras", value: "600" },
            { label: "Gras", value: "700" },
          ],
          defaultValue: "600",
        },
      },
      render: ({ children, level, color, fontSizeMobile, fontSizeTablet, fontSizeDesktop, fontFamily, fontWeight, puck }: any) => {
        const breakpoint = useBreakpoint();
        const fontSize = getResponsiveValue(breakpoint, fontSizeMobile, fontSizeTablet, fontSizeDesktop, 24);

        const style: React.CSSProperties = {
          color: color || "#111827",
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily || undefined,
          fontWeight: fontWeight || undefined,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        const tag = `h${level || '2'}`;
        const El: any = tag as any;
        return <El ref={puck?.dragRef} style={style}>{children}</El>;
      },
    },
    Text: {
      label: "Texte",
      inline: true,
      fields: {
        children: { type: "textarea", label: "Contenu", placeholder: "Votre texte" },
        color: { type: "text", label: "Couleur", defaultValue: "#374151" },
        fontSizeMobile: { type: "number", label: "Taille Mobile (px)", defaultValue: 16 },
        fontSizeTablet: { type: "number", label: "Taille Tablette (px)" },
        fontSizeDesktop: { type: "number", label: "Taille Desktop (px)" },
        fontFamily: { type: "text", label: "Police", placeholder: "" },
        fontWeight: { type: "select", label: "Graisse", options: [
          { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
        ], defaultValue: "400" },
        textAlign: { type: "select", label: "Alignement", options: [
          { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
        ], defaultValue: "left" },
      },
      render: ({ children, color, fontSizeMobile, fontSizeTablet, fontSizeDesktop, fontFamily, fontWeight, textAlign, puck }: any) => {
        const breakpoint = useBreakpoint();
        const fontSize = getResponsiveValue(breakpoint, fontSizeMobile, fontSizeTablet, fontSizeDesktop, 16);

        const style: React.CSSProperties = {
          color: color || "#374151",
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily || undefined,
          fontWeight: fontWeight || undefined,
          textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        };
        return <p ref={puck?.dragRef} style={style}>{children}</p>;
      },
    },
    Button: {
      label: "Bouton",
      inline: true,
      fields: {
        elId: { type: "text", label: "Element ID (cible)", defaultValue: "" },
        label: { type: "text", label: "Libellé", placeholder: "Cliquez ici" },
        href: { type: "text", label: "URL", placeholder: "#" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#7c3aed" },
        color: { type: "text", label: "Couleur du texte", defaultValue: "#ffffff" },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 8 },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        fontSize: { type: "number", label: "Taille texte (px)", defaultValue: 14 },
        actions: {
          type: "array",
          label: "Actions",
          arrayFields: {
            event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
            type: { type: "select", label: "type", options: [
              { label: "navigate", value: "navigate" },
              { label: "scrollTo", value: "scrollTo" },
              { label: "copy", value: "copy" },
              { label: "emit", value: "emit" },
              { label: "toggle", value: "toggle" },
              { label: "setFlag", value: "setFlag" },
              { label: "runJS", value: "runJS" },
            ], defaultValue: "navigate" },
            url: { type: "text", label: "url", defaultValue: "#" },
            target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
            targetElId: { type: "text", label: "targetElId", defaultValue: "" },
            selector: { type: "text", label: "selector", defaultValue: "" },
            offset: { type: "number", label: "offset", defaultValue: 0 },
            smooth: { type: "select", label: "smooth", options: [ { label: "No", value: "false" }, { label: "Yes", value: "true" } ], defaultValue: "true" },
            text: { type: "text", label: "text", defaultValue: "" },
            name: { type: "text", label: "event name", defaultValue: "" },
            detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
            flag: { type: "text", label: "flag name", defaultValue: "" },
            value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
            code: { type: "textarea", label: "JS code", defaultValue: "" },
          },
          defaultItemProps: { event: "click", type: "navigate", url: "#", target: "_self" },
          getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
        },
      },
      render: ({ elId, actions = [], label, href, backgroundColor, color, paddingX, paddingY, borderRadius, fontSize, puck }: any) => {
        const actionCtx = useActionState();
        const style: React.CSSProperties = {
          display: "inline-block",
          backgroundColor: backgroundColor || "#7c3aed",
          color: color || "#ffffff",
          paddingLeft: `${paddingX || 0}px`,
          paddingRight: `${paddingX || 0}px`,
          paddingTop: `${paddingY || 0}px`,
          paddingBottom: `${paddingY || 0}px`,
          borderRadius: `${borderRadius || 0}px`,
          textDecoration: "none",
          fontSize: fontSize ? `${fontSize}px` : "0.875rem",
          fontWeight: 500,
        };
        const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
          const list = (Array.isArray(actions) ? actions : []) as ActionType[];
          const clickActs = list.filter((a) => a.event === "click");
          if (clickActs.length > 0) {
            e.preventDefault();
            await runActions(clickActs, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
            return;
          }
          if ((puck as any)?.isEditing && href) {
            e.preventDefault();
            try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
          }
        };
        const handleEnter = async (e: React.MouseEvent<HTMLAnchorElement>) => {
          const list = (Array.isArray(actions) ? actions : []) as ActionType[];
          const acts = list.filter((a) => a.event === "mouseenter");
          if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
        };
        const handleLeave = async (e: React.MouseEvent<HTMLAnchorElement>) => {
          const list = (Array.isArray(actions) ? actions : []) as ActionType[];
          const acts = list.filter((a) => a.event === "mouseleave");
          if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
        };
        return (
          <a id={elId || undefined} ref={puck?.dragRef} href={href || '#'} style={style} onClick={handleClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave} rel="noopener noreferrer">
            {label || 'Cliquez ici'}
          </a>
        );
      },
    },
    Image: {
      label: "Image",
      inline: true,
      fields: {
        src: { type: "text", label: "Source", placeholder: "/placeholder_light_gray_block.png" },
        alt: { type: "text", label: "Texte alternatif", placeholder: "Image" },
        width: { type: "number", label: "Largeur (px)", defaultValue: 0 },
        height: { type: "number", label: "Hauteur (px)", defaultValue: 0 },
        actions: {
          type: "array",
          label: "Actions",
          arrayFields: {
            event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
            type: { type: "select", label: "type", options: [
              { label: "navigate", value: "navigate" },
              { label: "emit", value: "emit" },
              { label: "toggle", value: "toggle" },
              { label: "setFlag", value: "setFlag" },
              { label: "runJS", value: "runJS" },
            ], defaultValue: "setFlag" },
            url: { type: "text", label: "url", defaultValue: "#" },
            name: { type: "text", label: "event name", defaultValue: "" },
            detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
            flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
            value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
            code: { type: "textarea", label: "JS code", defaultValue: "" },
          },
          defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
          getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
        },
      },
      render: ({ src, alt, width, height, actions = [], puck }: any) => {
        const actionCtx = useActionState();
        const style: React.CSSProperties = {
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          display: "block",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
          cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
        };
        const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
          const list = (Array.isArray(actions) ? actions : []) as ActionType[];
          const acts = list.filter((a) => a.event === ev);
          if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
        };
        return (
          <img
            ref={puck?.dragRef}
            src={src || "/placeholder_light_gray_block.png"}
            alt={alt || "Image"}
            style={style}
            onClick={(e) => runEvt("click", e.currentTarget)}
            onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)}
            onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}
          />
        );
      },
    },
    Video: {
      label: "Vidéo",
      inline: true,
      fields: { url: { type: "text", label: "URL", placeholder: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 315 } },
      render: ({ url, height, puck }: any) => {
        let embedUrl = url;
        try {
          const u = new URL(url);
          if (u.hostname === "www.youtube.com" && u.searchParams.get("v")) {
            embedUrl = `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
          } else if (u.hostname === "youtu.be") {
            embedUrl = `https://www.youtube.com/embed${u.pathname}`;
          }
        } catch {}
        return (
          <div ref={puck?.dragRef} style={{ width: "100%", height: height || 315, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <iframe src={embedUrl || ""} width="100%" height={height || 315} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          </div>
        );
      },
    },
    QrCode: {
      label: "QR Code",
      inline: true,
      fields: { url: { type: "text", label: "Lien à encoder", defaultValue: "https://hublocal.link" }, size: { type: "number", label: "Taille (px)", defaultValue: 128 } },
      render: ({ url, size, puck }: any) => {
        const s = size || 128;
        const src = `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&data=${encodeURIComponent(url || "")}`;
        return (
          <div ref={puck?.dragRef} style={{ width: s, height: s, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <img src={src} alt="QR Code" style={{ width: "100%", height: "100%" }} />
          </div>
        );
      },
    },
    SpotifyCard: {
      label: "Carte Spotify",
      inline: true,
      fields: { url: { type: "text", label: "URL Spotify", defaultValue: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" }, height: { type: "number", label: "Hauteur (px)", defaultValue: 152 } },
      render: ({ url, height, puck }: any) => {
        let embedUrl = url || "";
        try {
          const u = new URL(url || "");
          if (!u.pathname.startsWith("/embed")) u.pathname = "/embed" + u.pathname;
          embedUrl = u.toString();
        } catch {}
        return (
          <div ref={puck?.dragRef} style={{ width: "100%", height: height || 152, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <iframe src={embedUrl} width="100%" height={height || 152} frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          </div>
        );
      },
    },
    Testimonials: {
      label: "Témoignages",
      inline: true,
      fields: {
        items: { type: "textarea", label: "Témoignages (JSON)", defaultValue: JSON.stringify([{ quote: "Super service !", author: "Jean" }, { quote: "Incroyable expérience.", author: "Marie" }]) },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
      },
      render: ({ items, backgroundColor, borderRadius, padding, puck }: any) => {
  let parsed: unknown = [];
  try { parsed = JSON.parse(items || "[]"); } catch { parsed = []; }
  const normalized = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  const list = normalized.filter((entry): entry is { quote?: string; author?: string } => typeof entry === "object" && entry !== null);
        const style: React.CSSProperties = { backgroundColor: backgroundColor || "#f9fafb", borderRadius: `${borderRadius || 0}px`, padding: `${padding || 0}px`, marginTop: "0.5rem", marginBottom: "0.5rem" };
        return (
          <div ref={puck?.dragRef} style={style}>
            {list.map((item, idx) => (
              <blockquote key={idx} style={{ marginBottom: "1rem" }}>
                <p style={{ fontStyle: "italic" }}>{item.quote}</p>
                <footer style={{ marginTop: ".25rem", fontWeight: 500 }}>— {item.author}</footer>
              </blockquote>
            ))}
          </div>
        );
      },
    },
    TypingText: {
      label: "Texte animé",
      inline: true,
      fields: {
        text: { type: "textarea", label: "Texte", defaultValue: "Bonjour 👋 Tape en direct…" },
        speed: { type: "number", label: "Vitesse (ms/lettre)", defaultValue: 40 },
        loop: { type: "select", label: "Boucle", options: [{ label: "Oui", value: "true" }, { label: "Non", value: "false" }], defaultValue: "true" },
        loopDelay: { type: "number", label: "Pause avant relance (ms)", defaultValue: 500 },
        cursor: { type: "select", label: "Curseur", options: [{ label: "Afficher", value: "true" }, { label: "Masquer", value: "false" }], defaultValue: "true" },
        color: { type: "text", label: "Couleur", defaultValue: "#111827" },
        fontSize: { type: "number", label: "Taille (px)", defaultValue: 18 },
        fontFamily: { type: "text", label: "Police", defaultValue: "" },
        fontWeight: { type: "select", label: "Graisse", options: [
          { label: "300", value: "300" }, { label: "400", value: "400" }, { label: "500", value: "500" }, { label: "600", value: "600" }, { label: "700", value: "700" }, { label: "800", value: "800" }, { label: "900", value: "900" }, { label: "Bold", value: "bold" },
        ], defaultValue: "600" },
        textAlign: { type: "select", label: "Alignement", options: [
          { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
        ], defaultValue: "left" },
      },
      render: ({ text, speed, loop, loopDelay, cursor, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
        const loopBool = String(loop) === "true";
        const cursorBool = String(cursor) === "true";
        return (
          <span ref={puck?.dragRef}>
            <TypingTextComponent text={text} speed={speed} loop={loopBool} loopDelay={loopDelay} cursor={cursorBool} color={color} fontSize={fontSize} fontFamily={fontFamily} fontWeight={fontWeight} textAlign={textAlign} />
          </span>
        );
      },
    },
    ExternalPost: {
      label: "Article externe",
      inline: true,
      fields: {
        post: {
          type: "external",
          label: "Sélectionner un article",
          async fetchList() {
            return [
              { id: "1", label: "Premier article" },
              { id: "2", label: "Deuxième article" },
              { id: "3", label: "Troisième article" },
            ];
          },
        },
        fallbackTitle: { type: "text", label: "Titre par défaut", defaultValue: "Aucun article" },
        fallbackBody: { type: "textarea", label: "Contenu par défaut", defaultValue: "Choisissez un article externe pour afficher son contenu." },
      },
      resolveData: async (args: any, ctx: any) => {
        const { post, fallbackTitle, fallbackBody } = args || {};
        const changed = (ctx && (ctx as any).changed) || {};
        // Only recompute when the post id changes
        if (!changed?.post) return undefined;
        const posts = {
          "1": { title: "Premier article", body: "Ceci est le corps du premier article." },
          "2": { title: "Deuxième article", body: "Contenu du deuxième article avec plus de détails." },
          "3": { title: "Troisième article", body: "Voici un autre article pour l’exemple." },
        } as Record<string, { title: string; body: string }>;
        const entry = post && posts[post as string];
        return { props: { resolvedTitle: entry?.title || fallbackTitle, resolvedBody: entry?.body || fallbackBody } };
      },
      render: ({ resolvedTitle, resolvedBody, fallbackTitle, fallbackBody, puck }: any) => {
        const title = resolvedTitle || fallbackTitle || "";
        const body = resolvedBody || fallbackBody || "";
        return (
          <article ref={puck?.dragRef} style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
            <p style={{ marginBottom: 0 }}>{body}</p>
          </article>
        );
      },
    },
    ColorBox: {
      label: "Boîte de couleur",
      inline: true,
      fields: {
        color: {
          type: "custom",
          label: "Couleur",
          defaultValue: "#2563eb",
          render: ({ value, onChange }: any) => {
            return (
              <input
                type="color"
                value={value || "#2563eb"}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: "100%", height: "2rem", padding: 0, border: "none", background: "transparent" }}
              />
            );
          },
        },
        size: { type: "number", label: "Taille (px)", defaultValue: 64 },
      },
      render: ({ color, size, puck }: any) => {
        const s = size || 64;
        const c = color || "#2563eb";
        return (
          <div
            ref={puck?.dragRef}
            style={{ width: s, height: s, backgroundColor: c, borderRadius: "0.25rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}
          />
        );
      },
    },
    LinksList: {
      label: "Liste de liens",
      inline: true,
      fields: {
        items: { type: "textarea", label: "Liens (JSON)", defaultValue: JSON.stringify([{ label: "LinkedIn", url: "https://www.linkedin.com" }, { label: "YouTube", url: "https://www.youtube.com" }]) },
        color: { type: "text", label: "Couleur du texte", defaultValue: "#2563eb" },
        spacing: { type: "number", label: "Espacement (px)", defaultValue: 4 },
      },
      render: ({ items, color, spacing, puck }: any) => {
        let list: Array<{ label: string; url: string }> = [];
        try { list = JSON.parse(items || "[]"); } catch { list = []; }
        const styleLink: React.CSSProperties = { color: color || "#2563eb", textDecoration: "underline", display: "block", marginBottom: `${spacing || 0}px` };
        return (
          <div ref={puck?.dragRef} style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {list.map((item, idx) => (
              <a key={idx} href={item.url} style={styleLink} target="_blank" rel="noopener noreferrer">{item.label}</a>
            ))}
          </div>
        );
      },
    },
    Card: {
      label: "Carte",
      inline: true,
      fields: {
        elId: { type: "text", label: "Element ID", defaultValue: "" },
        icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "📦" },
        title: { type: "text", label: "Titre", defaultValue: "Titre" },
        description: { type: "textarea", label: "Description", defaultValue: "Description" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#ffffff" },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
        borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
        align: { type: "select", label: "Alignement du texte", options: [
          { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" },
        ], defaultValue: "left" },
        layout: { type: "select", label: "Disposition", options: [
          { label: "Verticale", value: "vertical" }, { label: "Horizontale", value: "horizontal" },
        ], defaultValue: "vertical" },
        href: { type: "text", label: "Lien (optionnel)", defaultValue: "" },
        shadow: { type: "select", label: "Ombre", options: [
          { label: "Avec ombre", value: "true" }, { label: "Sans ombre", value: "false" },
        ], defaultValue: "true" },
        actions: {
          type: "array",
          label: "Actions",
          arrayFields: {
            event: { type: "select", label: "event", options: [ { label: "click", value: "click" }, { label: "mouseenter", value: "mouseenter" }, { label: "mouseleave", value: "mouseleave" } ], defaultValue: "click" },
            type: { type: "select", label: "type", options: [
              { label: "navigate", value: "navigate" },
              { label: "emit", value: "emit" },
              { label: "toggle", value: "toggle" },
              { label: "setFlag", value: "setFlag" },
              { label: "runJS", value: "runJS" },
            ], defaultValue: "setFlag" },
            url: { type: "text", label: "url", defaultValue: "#" },
            name: { type: "text", label: "event name", defaultValue: "" },
            detail: { type: "textarea", label: "detail (JSON)", defaultValue: "" },
            flag: { type: "text", label: "flag name", defaultValue: "modalOpen" },
            value: { type: "select", label: "flag value", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
            code: { type: "textarea", label: "JS code", defaultValue: "" },
          },
          defaultItemProps: { event: "click", type: "setFlag", flag: "modalOpen", value: "true" },
          getItemSummary: (it: any) => `${it?.event || 'event'} → ${it?.type || 'action'}`,
        },
      },
      render: ({ elId, icon, title, description, backgroundColor, borderRadius, padding, borderColor, borderWidth, align, layout, href, shadow, actions = [], puck }: any) => {
        const actionCtx = useActionState();
        const style: React.CSSProperties = {
          backgroundColor: backgroundColor || "#ffffff",
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          padding: padding ? `${padding}px` : undefined,
          boxShadow: String(shadow) === "true" ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : undefined,
          borderWidth: borderWidth ? `${borderWidth}px` : undefined,
          borderColor: borderColor || undefined,
          borderStyle: borderWidth ? "solid" : undefined,
          textAlign: (align as React.CSSProperties["textAlign"]) || "left",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
          cursor: Array.isArray(actions) && actions.length ? "pointer" : undefined,
        };
        const isUrl = typeof icon === "string" && (icon.startsWith("http") || icon.startsWith("/"));
        const inner = (
          <div style={{ display: layout === "horizontal" ? "flex" : "block", gap: layout === "horizontal" ? 12 : undefined, alignItems: layout === "horizontal" ? "center" : undefined }}>
            {icon && (
              <div style={{ fontSize: "2rem", marginBottom: layout === "horizontal" ? 0 : "0.5rem" }}>
                {isUrl ? <img src={icon} alt="Icon" style={{ width: "2rem", height: "2rem", objectFit: "cover" }} /> : icon}
              </div>
            )}
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>{title}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{description}</p>
            </div>
          </div>
        );
        const runEvt = async (ev: "click" | "mouseenter" | "mouseleave", el: HTMLElement) => {
          const list = (Array.isArray(actions) ? actions : []) as ActionType[];
          const acts = list.filter((a) => a.event === ev);
          if (acts.length > 0) await runActions(acts, { isEditing: (puck as any)?.isEditing, currentEl: el, ctxOverride: actionCtx });
        };
        const cardEl = (
          <div id={elId || undefined} ref={puck?.dragRef} style={style} onClick={(e) => runEvt("click", e.currentTarget)} onMouseEnter={(e) => runEvt("mouseenter", e.currentTarget)} onMouseLeave={(e) => runEvt("mouseleave", e.currentTarget)}>
            {inner}
          </div>
        );
        if (href) {
          const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            const list = (Array.isArray(actions) ? actions : []) as ActionType[];
            const clickActs = list.filter((a) => a.event === "click");
            if (clickActs.length > 0) {
              e.preventDefault();
              return; // handled by inner
            }
            if ((puck as any)?.isEditing) {
              e.preventDefault();
              try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
            }
          };
          return <a href={href} onClick={onClick} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{cardEl}</a>;
        }
        return cardEl;
      },
    },
    Hero: {
      label: "Héros",
      inline: true,
      fields: {
        title: { type: "text", label: "Titre", defaultValue: "Titre" },
        description: { type: "textarea", label: "Description", defaultValue: "Description du héros" },
        image: { type: "text", label: "Image (URL)", defaultValue: "https://images.unsplash.com/photo-1606761569780-43b7311d8682?auto=format&fit=crop&w=800&q=80" },
        imagePositionMobile: { type: "select", label: "Position Image (Mobile)", options: [
          { label: "Haut", value: "top" }, { label: "Bas", value: "bottom" },
        ], defaultValue: "top" },
        imagePositionDesktop: { type: "select", label: "Position Image (Desktop)", options: [
          { label: "Gauche", value: "left" }, { label: "Droite", value: "right" },
        ], defaultValue: "right" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
        textColor: { type: "text", label: "Couleur du texte", defaultValue: "#111827" },
        radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        paddingMobile: { type: "number", label: "Padding Mobile (px)", defaultValue: 32 },
        paddingDesktop: { type: "number", label: "Padding Desktop (px)", defaultValue: 32 },
        gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
        imageRadius: { type: "number", label: "Arrondi image (px)", defaultValue: 8 },
        imageFit: { type: "select", label: "Ajustement image", options: [
          { label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }, { label: "Fill", value: "fill" },
        ], defaultValue: "cover" },
        imageMaxHeight: { type: "number", label: "Hauteur max image (px)", defaultValue: 480 },
        buttons: {
          type: "array",
          label: "buttons",
          arrayFields: {
            label: { type: "text", label: "label", defaultValue: "Button" },
            href: { type: "text", label: "href", defaultValue: "#" },
            variant: { type: "select", label: "variant", options: [
              { label: "primary", value: "primary" },
              { label: "secondary", value: "secondary" },
              { label: "outline", value: "outline" },
              { label: "ghost", value: "ghost" },
            ], defaultValue: "primary" },
            actionType: { type: "select", label: "action", options: [
              { label: "none", value: "none" },
              { label: "setFlag", value: "setFlag" },
              { label: "toggle", value: "toggle" },
            ], defaultValue: "none" },
            flag: { type: "text", label: "flag name", defaultValue: "" },
            value: { type: "select", label: "flag value (for setFlag)", options: [ { label: "true", value: "true" }, { label: "false", value: "false" } ], defaultValue: "true" },
          },
          defaultItemProps: { label: "Learn more", href: "#", variant: "primary" },
          getItemSummary: (item: any) => item?.label || "button",
        },
        align: { type: "select", label: "Alignement du texte", options: [
          { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" },
        ], defaultValue: "left" },
      },
      resolveData: async () => {
        return { props: {} };
      },
      resolveFields: async (data: any = {}, params: any = {}) => {
        const fields = (params && params.fields) || {};
        const props = (data && data.props) || {};
        if ((props.imagePosition === 'top' || props.imagePosition === 'bottom') && 'imageFit' in fields) {
          const { imageFit, ...rest } = fields as any;
          return rest;
        }
        return fields;
      },
      permissions: { delete: false, drag: true, duplicate: true },
      render: ({ 
        title, description, image, 
        imagePositionMobile, imagePositionDesktop, 
        backgroundColor, textColor, radius, 
        paddingMobile, paddingDesktop,
        gap, imageRadius, imageFit, imageMaxHeight, buttons, align, puck 
      }: any) => {
        const actionCtx = useActionState();
        const breakpoint = useBreakpoint();

        const imagePosition = getResponsiveValue(breakpoint, imagePositionMobile, imagePositionDesktop, imagePositionDesktop, "top");
        const padding = getResponsiveValue(breakpoint, paddingMobile, paddingDesktop, paddingDesktop, 32);

        let btns: Array<{ label?: string; href?: string; url?: string; variant?: string }> = [];
        if (Array.isArray(buttons)) {
          btns = buttons;
        } else {
          try {
            const parsed = typeof buttons === "string" ? JSON.parse(buttons) : buttons;
            if (Array.isArray(parsed)) btns = parsed.filter((x: any) => x && typeof x === "object");
            else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).buttons)) btns = (parsed as any).buttons.filter((x: any) => x && typeof x === "object");
            else if (parsed && typeof parsed === "object") btns = [parsed as any];
          } catch { btns = []; }
        }
        
        const isHorizontal = imagePosition === "left" || imagePosition === "right";
        const flexDirection = isHorizontal ? "row" : "column";
        const orderImageFirst = imagePosition === "left" || imagePosition === "top";
        const columnWidth = isHorizontal ? "50%" : "100%";
        
        const containerStyle: React.CSSProperties = {
          display: "flex",
          flexDirection,
          flexWrap: isHorizontal ? "wrap" : undefined,
          alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
          justifyContent: "space-between",
          backgroundColor: backgroundColor || "#f9fafb",
          color: textColor || "#111827",
          padding: `${padding}px`,
          gap: `${gap ?? 16}px`,
          borderRadius: `${radius ?? 8}px`,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        const textStyle: React.CSSProperties = {
          flex: isHorizontal ? "1 1 50%" : undefined,
          width: columnWidth,
          textAlign: (align as React.CSSProperties["textAlign"]) || "left",
        };
        const imageStyle: React.CSSProperties = {
          width: "100%",
          maxHeight: imageMaxHeight ? `${imageMaxHeight}px` : undefined,
          height: "auto",
          borderRadius: imageRadius ? `${imageRadius}px` : undefined,
          objectFit: imageFit || "cover",
        };
        const left = (
          <div style={textStyle}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h2>
            <p style={{ fontSize: "1rem", marginBottom: "1rem" }}>{description}</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {btns.map((btn, idx) => {
                const href = (btn as any).href ?? (btn as any).url ?? "#";
                const variant = (btn as any).variant ?? "primary";
                const styleMap: Record<string, React.CSSProperties> = {
                  primary: { backgroundColor: "#6366f1", color: "#ffffff", border: "1px solid #6366f1" },
                  secondary: { backgroundColor: "#e5e7eb", color: "#111827", border: "1px solid #e5e7eb" },
                  outline: { backgroundColor: "transparent", color: "#111827", border: "1px solid #d1d5db" },
                  ghost: { backgroundColor: "transparent", color: "#6366f1", border: "1px solid transparent" },
                };
                const baseStyle: React.CSSProperties = { padding: "0.5rem 1rem", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", display: "inline-block" };
                const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
                  const isEditing = (puck as any)?.isEditing;
                  const actionType = (btn as any).actionType as string | undefined;
                  const rawFlag = (btn as any).flag as any;
                  const flag = rawFlag != null ? String(rawFlag).trim() : undefined;
                  const valueStr = (btn as any).value as string | undefined;
                  if (actionType && actionType !== "none") {
                    e.preventDefault();
                    const actions: ActionType[] = [] as any;
                    if (actionType === "setFlag" && flag) {
                      actions.push({ event: "click", type: "setFlag", flag, value: valueStr === "true" });
                    } else if (actionType === "toggle" && flag) {
                      actions.push({ event: "click", type: "toggle", flag });
                    }
                    if (actions.length) {
                      await runActions(actions, { isEditing, currentEl: e.currentTarget, ctxOverride: actionCtx });
                      return;
                    }
                  }
                  if (isEditing && href) {
                    e.preventDefault();
                    try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
                  }
                };
                return <a key={idx} href={href} onClick={handleClick} style={{ ...baseStyle, ...(styleMap[variant] || styleMap.primary) }} rel="noopener noreferrer">{(btn.label as string) || "Button"}</a>;
              })}
            </div>
          </div>
        );
        const right = (
          <div
            style={{
              flex: isHorizontal ? "1 1 50%" : undefined,
              width: columnWidth,
              display: "flex",
              justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
            }}
          >
            {image && <img src={image} alt={title || "Image"} style={imageStyle} />}
          </div>
        );
        return (
          <div ref={puck?.dragRef} style={containerStyle}>
            {orderImageFirst ? right : left}
            {orderImageFirst ? left : right}
          </div>
        );
      },
    },
    Logos: {
      label: "Logos",
      inline: true,
      fields: {
        items: { type: "textarea", label: "Logos (JSON)", defaultValue: JSON.stringify([
          { src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg", alt: "React" },
          { src: "https://upload.wikimedia.org/wikipedia/commons/4/47/Nodejs.svg", alt: "Node.js" },
          { src: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg", alt: "Node" },
          { src: "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png", alt: "JavaScript" },
        ]) },
        columns: { type: "number", label: "Colonnes", defaultValue: 4 },
        gap: { type: "number", label: "Espacement (px)", defaultValue: 16 },
        gapX: { type: "number", label: "Espacement horizontal (px)", defaultValue: 0 },
        gapY: { type: "number", label: "Espacement vertical (px)", defaultValue: 0 },
        justifyContent: { type: "select", label: "Justification", options: [
          { label: "Début", value: "flex-start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "flex-end" }, { label: "Espacé", value: "space-between" }, { label: "Espacé autour", value: "space-around" },
        ], defaultValue: "center" },
        alignItems: { type: "select", label: "Alignement vertical", options: [
          { label: "Début", value: "start" }, { label: "Centre", value: "center" }, { label: "Fin", value: "end" }, { label: "Stretch", value: "stretch" },
        ], defaultValue: "center" },
        size: { type: "number", label: "Taille (px)", defaultValue: 64 },
        grayscale: { type: "select", label: "Niveaux de gris", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
        hoverOpacity: { type: "number", label: "Opacité au survol (0-1)", defaultValue: 1 },
        linkTarget: { type: "select", label: "Cible du lien", options: [ { label: "Nouvel onglet", value: "_blank" }, { label: "Même onglet", value: "_self" } ], defaultValue: "_blank" },
      },
      render: ({ items, columns, gap, gapX, gapY, justifyContent, alignItems, size, grayscale, hoverOpacity, linkTarget, puck }: any) => {
        let logos: Array<{ src: string; alt?: string; url?: string }> = [];
        try {
          const parsed = typeof items === "string" ? JSON.parse(items) : items;
          if (Array.isArray(parsed)) logos = parsed.map((it: any) => (typeof it === 'string' ? { src: it } : it)).filter((x: any) => x && typeof x === "object");
          else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).items)) logos = (parsed as any).items.map((it: any) => (typeof it === 'string' ? { src: it } : it));
        } catch { logos = []; }
        const style: React.CSSProperties = {
          display: "grid",
          gridTemplateColumns: columns ? `repeat(${columns}, auto)` : undefined,
          gap: gap ? `${gap}px` : undefined,
          columnGap: gapX ? `${gapX}px` : undefined,
          rowGap: gapY ? `${gapY}px` : undefined,
          alignItems: alignItems || "center",
          justifyContent: justifyContent || "center",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        return (
          <div ref={puck?.dragRef} style={style}>
            {logos.map((logo, idx) => {
              const img = (
                <img key={idx} src={logo.src} alt={logo.alt || "Logo"} style={{ width: size ? `${size}px` : "64px", height: "auto", objectFit: "contain", filter: String(grayscale) === 'true' ? 'grayscale(100%)' : undefined, transition: 'opacity .15s ease-in-out' }}
                  onMouseEnter={(e) => { const v = Number(hoverOpacity); if (!Number.isNaN(v) && v >= 0 && v <= 1) (e.currentTarget as HTMLImageElement).style.opacity = String(v); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
                />
              );
              return logo.url ? (
                <a key={idx} href={logo.url} target={linkTarget || "_blank"} rel="noopener noreferrer">{img}</a>
              ) : (
                img
              );
            })}
          </div>
        );
      },
    },
    Navbar: {
      label: "Navbar",
      inline: true,
      fields: {
        brand: { type: "text", label: "Marque", defaultValue: "Brand" },
        brandHref: { type: "text", label: "Lien marque", defaultValue: "/" },
        brandImageSrc: { type: "text", label: "Logo (URL)", defaultValue: "" },
        brandImageWidth: { type: "number", label: "Logo largeur (px)", defaultValue: 24 },
        brandImageHeight: { type: "number", label: "Logo hauteur (px)", defaultValue: 24 },
        brandGap: { type: "number", label: "Espace logo/texte (px)", defaultValue: 8 },
        brandFontSize: { type: "number", label: "Taille marque (px)", defaultValue: 18 },
        brandFontWeight: { type: "select", label: "Graisse marque", options: [
          { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
        ], defaultValue: "700" },
        brandColor: { type: "text", label: "Couleur marque", defaultValue: "inherit" },

        align: { type: "select", label: "Alignement liens", options: [ { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" } ], defaultValue: "right" },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 12 },
        gap: { type: "number", label: "Espace horizontal (px)", defaultValue: 12 },
        containerMaxWidth: { type: "number", label: "Max width conteneur (px, 0=fluid)", defaultValue: 1280 },
        centerContainer: { type: "select", label: "Centrer conteneur", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },

        backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
        textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
        borderBottom: { type: "select", label: "Bordure basse", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
        borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
        shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

        positionMode: { type: "select", label: "Position", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
        top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
        zIndex: { type: "number", label: "z-index", defaultValue: 50 },

        linkGap: { type: "number", label: "Espace liens (px)", defaultValue: 12 },
        linkPaddingX: { type: "number", label: "Padding lien X (px)", defaultValue: 8 },
        linkPaddingY: { type: "number", label: "Padding lien Y (px)", defaultValue: 6 },
        linkHoverUnderline: { type: "select", label: "Souligner au survol", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
        linkHoverColor: { type: "text", label: "Couleur au survol", defaultValue: "" },

        collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 768 },
        mobileMenuPosition: { type: "select", label: "Menu mobile côté", options: [ { label: "Droite", value: "right" }, { label: "Gauche", value: "left" } ], defaultValue: "right" },
        menuButtonLabel: { type: "text", label: "Texte bouton menu", defaultValue: "Menu" },

        links: {
          type: "array",
          label: "Liens",
          arrayFields: {
            label: { type: "text", label: "label", defaultValue: "Link" },
            href: { type: "text", label: "href", defaultValue: "#" },
            target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
            active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
          },
          defaultItemProps: { label: "About", href: "#", target: "_self", active: "false" },
          getItemSummary: (item: any) => item?.label || "link",
        },
      },
      render: (props: any) => {
        function NavBarView({ puck, ...p }: any) {
          const { ref, width } = useElementWidth<HTMLDivElement>();
          const [open, setOpen] = useState(false);
          const collapseAt = Number(p.collapseAt || 0) || 0;
          const collapsed = collapseAt > 0 && width > 0 && width < collapseAt;
          const justify = p.align === "center" ? "center" : p.align === "right" ? "flex-end" : "flex-start";
          const containerStyle: React.CSSProperties = {
            maxWidth: Number(p.containerMaxWidth) ? `${p.containerMaxWidth}px` : undefined,
            margin: String(p.centerContainer) === "true" ? "0 auto" : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: p.gap ?? 12,
          };
          const navStyle: React.CSSProperties = {
            backgroundColor: p.backgroundColor || "#ffffff",
            color: p.textColor || "#111827",
            padding: `${p.paddingY ?? 12}px ${p.paddingX ?? 16}px`,
            borderBottom: String(p.borderBottom) === "true" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
            boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
            position: p.positionMode || "static",
            top: p.top ?? 0,
            zIndex: p.zIndex ?? 50,
          } as React.CSSProperties;

          const brandLinkStyle: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            gap: p.brandGap ?? 8,
            fontSize: p.brandFontSize ? `${p.brandFontSize}px` : undefined,
            fontWeight: p.brandFontWeight || 700,
            color: p.brandColor && p.brandColor !== "inherit" ? p.brandColor : undefined,
            textDecoration: "none",
          };

          const linkStyleBase: React.CSSProperties = {
            textDecoration: "none",
            color: "inherit",
            padding: `${p.linkPaddingY ?? 6}px ${p.linkPaddingX ?? 8}px`,
            borderRadius: 6,
          };

          const LinksInline = () => (
            <div style={{ display: "flex", alignItems: "center", justifyContent: justify, gap: p.linkGap ?? 12, flex: 1, marginLeft: 12 }}>
              {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => {
                const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  const c = p.linkHoverColor as string;
                  if (c) (e.currentTarget as HTMLAnchorElement).style.color = c;
                  if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
                };
                const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "inherit";
                  if (String(p.linkHoverUnderline) === "true") (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
                };
                const active = routeIsActive(l?.href, l?.active);
                const style: React.CSSProperties = { ...linkStyleBase, opacity: active ? 1 : 0.9, fontWeight: active ? 600 : 500 };
                return (
                  <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
                     style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    {l?.label || "Link"}
                  </a>
                );
              })}
            </div>
          );

          const LinksMobile = () => (
            <div style={{ display: open ? "block" : "none", position: "absolute", [p.mobileMenuPosition === "left" ? "left" : "right"]: 0, top: "100%", background: p.backgroundColor || "#fff", border: `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}`, borderRadius: 8, padding: 8, boxShadow: "0 4px 12px rgba(0,0,0,.08)" } as React.CSSProperties}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                {(Array.isArray(p.links) ? p.links : []).map((l: any, i: number) => (
                  <a key={i} href={l?.href || "#"} target={l?.target || "_self"} rel={l?.target === "_blank" ? "noopener noreferrer" : undefined}
                     style={{ ...linkStyleBase }}>{l?.label || "Link"}</a>
                ))}
              </div>
            </div>
          );

          return (
            <nav ref={puck?.dragRef} style={navStyle}>
              <div ref={ref} style={containerStyle}>
                <a href={p.brandHref || "/"} style={brandLinkStyle}>
                  {p.brandImageSrc ? (
                    <img src={p.brandImageSrc} alt={p.brand || "Brand"} style={{ width: p.brandImageWidth || 24, height: p.brandImageHeight || 24 }} />
                  ) : null}
                  <span>{p.brand || "Brand"}</span>
                </a>
                {collapsed ? (
                  <div style={{ marginLeft: "auto", position: "relative" }}>
                    <button type="button" onClick={() => setOpen((v) => !v)}
                      style={{ background: "transparent", color: "inherit", border: 0, padding: 8, borderRadius: 6, cursor: "pointer" }}>
                      {p.menuButtonLabel || "Menu"}
                    </button>
                    <LinksMobile />
                  </div>
                ) : (
                  <LinksInline />
                )}
              </div>
            </nav>
          );
        }
        return <NavBarView {...props} />;
      },
    },
    Sidebar: {
      label: "Sidebar",
      inline: true,
      fields: {
        position: { type: "select", label: "Position", options: [ { label: "Gauche", value: "left" }, { label: "Droite", value: "right" } ], defaultValue: "left" },
        stickyMode: { type: "select", label: "Positionnement", options: [ { label: "Static", value: "static" }, { label: "Sticky", value: "sticky" }, { label: "Fixed", value: "fixed" } ], defaultValue: "static" },
        top: { type: "number", label: "Décalage top (px)", defaultValue: 0 },
        zIndex: { type: "number", label: "z-index", defaultValue: 40 },

        widthDesktop: { type: "number", label: "Largeur desktop (px)", defaultValue: 280 },
        widthMobile: { type: "number", label: "Largeur mobile (px)", defaultValue: 280 },
        collapseAt: { type: "number", label: "Plier sous (px, 0=jamais)", defaultValue: 1024 },
        showToggle: { type: "select", label: "Afficher bouton", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
        showDesktopToggle: { type: "select", label: "Boutons test (desktop)", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
        overlay: { type: "select", label: "Overlay mobile", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
        controlFlag: { type: "text", label: "Flag de contrôle (ouvrir/fermer)", defaultValue: "" },
        controlDefaultOpen: { type: "select", label: "Ouvert par défaut si flag non défini", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "true" },

        backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
        textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
        radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 12 },
        borderColor: { type: "text", label: "Couleur bordure", defaultValue: "#e5e7eb" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 1 },
        shadow: { type: "select", label: "Ombre", options: [ { label: "Avec", value: "true" }, { label: "Sans", value: "false" } ], defaultValue: "false" },

        itemGap: { type: "number", label: "Espacement éléments (px)", defaultValue: 8 },
        itemPaddingX: { type: "number", label: "Padding X élément (px)", defaultValue: 8 },
        itemPaddingY: { type: "number", label: "Padding Y élément (px)", defaultValue: 6 },
        itemRadius: { type: "number", label: "Arrondi élément (px)", defaultValue: 6 },
        itemHoverBg: { type: "text", label: "Fond au survol", defaultValue: "#f3f4f6" },
        itemActiveBg: { type: "text", label: "Fond actif", defaultValue: "#e5e7eb" },
        itemTextColor: { type: "text", label: "Couleur texte", defaultValue: "inherit" },
        itemHoverTextColor: { type: "text", label: "Texte au survol", defaultValue: "inherit" },
        itemActiveTextColor: { type: "text", label: "Texte actif", defaultValue: "inherit" },

        items: {
          type: "array",
          label: "Éléments",
          arrayFields: {
            label: { type: "text", label: "label", defaultValue: "Item" },
            href: { type: "text", label: "href", defaultValue: "#" },
            icon: { type: "text", label: "Icône (emoji ou URL)", defaultValue: "" },
            target: { type: "select", label: "target", options: [ { label: "_self", value: "_self" }, { label: "_blank", value: "_blank" } ], defaultValue: "_self" },
            active: { type: "select", label: "actif?", options: [ { label: "Non", value: "false" }, { label: "Oui", value: "true" } ], defaultValue: "false" },
          },
          defaultItemProps: { label: "Dashboard", href: "#", icon: "", target: "_self", active: "false" },
          getItemSummary: (it: any) => it?.label || "item",
        },
      },
      render: (props: any) => {
        function SidebarView({ puck, ...p }: any) {
          const { ref, width } = useElementWidth<HTMLDivElement>();
          const [open, setOpen] = useState(false);
          const actionState = useActionState();
          const collapseAt = Number(p.collapseAt || 0) || 0;
          const measured = width > 0 ? width : (typeof window !== "undefined" ? window.innerWidth : 0);
          const collapsed = collapseAt > 0 && measured > 0 && measured < collapseAt;
          const side = p.position === "right" ? "right" : "left";
          const desktopWidth = Number(p.widthDesktop || 280) || 280;
          const mobileWidth = Number(p.widthMobile || 280) || 280;
          const flagName = String(p.controlFlag ?? "").trim();
          const flagVal = flagName ? actionState.flags[flagName] : undefined;
          const defaultOpen = String(p.controlDefaultOpen) === "true";

          const resolvedOpen: boolean = flagName
            ? (flagVal !== undefined ? !!flagVal : defaultOpen)
            : open;

          const handleOpen = () => {
            if (flagName) {
              actionState.setFlag(flagName, true);
            } else {
              setOpen(true);
            }
          };
          const handleClose = () => {
            if (flagName) {
              actionState.setFlag(flagName, false);
            } else {
              setOpen(false);
            }
          };
          const handleToggle = () => {
            if (flagName) {
              actionState.toggleFlag(flagName);
            } else {
              setOpen((v) => !v);
            }
          };

          const commonAsideStyle: React.CSSProperties = {
            backgroundColor: p.backgroundColor || "#ffffff",
            color: p.textColor || "#111827",
            borderRadius: p.radius ? `${p.radius}px` : undefined,
            padding: `${p.padding || 0}px`,
            border: String(p.borderWidth || 0) !== "0" ? `${p.borderWidth ?? 1}px solid ${p.borderColor || "#e5e7eb"}` : undefined,
            boxShadow: String(p.shadow) === "true" ? "0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)" : undefined,
          };
          const itemBaseStyle: React.CSSProperties = {
            textDecoration: "none",
            color: p.itemTextColor && p.itemTextColor !== "inherit" ? p.itemTextColor : "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: `${p.itemPaddingY ?? 6}px ${p.itemPaddingX ?? 8}px`,
            borderRadius: p.itemRadius ? `${p.itemRadius}px` : "6px",
          };

          const ItemsList = () => (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: p.itemGap ?? 8 }}>
              {(Array.isArray(p.items) ? p.items : []).map((it: any, i: number) => {
                const onMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  const bg = p.itemHoverBg as string; const tc = p.itemHoverTextColor as string;
                  if (bg) (e.currentTarget as HTMLAnchorElement).style.background = bg;
                  if (tc) (e.currentTarget as HTMLAnchorElement).style.color = tc;
                };
                const onMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  const active = routeIsActive(it?.href, it?.active);
                  (e.currentTarget as HTMLAnchorElement).style.background = active ? (p.itemActiveBg as string) || "" : "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit";
                };
                const active = routeIsActive(it?.href, it?.active);
                const style: React.CSSProperties = {
                  ...itemBaseStyle,
                  background: active ? (p.itemActiveBg as string) || "#e5e7eb" : "transparent",
                  color: active ? (p.itemActiveTextColor as string) || "inherit" : (p.itemTextColor as string) || "inherit",
                };
                const icon = it?.icon;
                const iconEl = icon ? (
                  icon.startsWith("http") || icon.startsWith("/")
                    ? <img src={icon} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                    : <span style={{ fontSize: 16 }}>{icon}</span>
                ) : null;
                return (
                  <li key={i}>
                    <a href={it?.href || "#"} target={it?.target || "_self"} rel={it?.target === "_blank" ? "noopener noreferrer" : undefined}
                       style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                      {iconEl}
                      <span>{it?.label || "Item"}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          );

          const MobileDrawer = () => (
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: (collapsed && resolvedOpen) ? "block" : "none",
                zIndex: (p.zIndex ?? 40) + 1,
              }}
            >
              {String(p.overlay) === "true" ? (
                <div
                  onClick={() => handleClose()}
                  style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }}
                />
              ) : null}
              <aside
                style={{
                  ...commonAsideStyle,
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  [side]: 0,
                  width: mobileWidth,
                  overflowY: "auto",
                } as React.CSSProperties}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleClose()}
                    style={{ background: "transparent", border: 0, padding: 8, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
                <ItemsList />
              </aside>
            </div>
          );

          const isOpenMobile = collapsed ? resolvedOpen : undefined;
          const isVisibleDesktop = !collapsed ? resolvedOpen : true;

          return (
            <div ref={puck?.dragRef} style={{ position: "relative" }}>
              {collapsed && String(p.showToggle) === "true" ? (
                <button
                  type="button"
                  onClick={() => handleOpen()}
                  style={{
                    background: "transparent",
                    border: `1px solid ${p.borderColor || "#e5e7eb"}`,
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    margin: "0.5rem 0",
                  }}
                >
                  Open sidebar
                </button>
              ) : null}
              <div ref={ref} style={{ width: "100%" }} />
              {collapsed ? (
                isOpenMobile ? <MobileDrawer /> : null
              ) : (
                isVisibleDesktop ? (
                  <aside
                    style={{
                      ...commonAsideStyle,
                      position: p.stickyMode || "static",
                      top: p.top ?? 0,
                      zIndex: p.zIndex ?? 40,
                      width: desktopWidth,
                      margin: "0.5rem 0",
                    }}
                  >
                    {String(p.showDesktopToggle) === "true" ? (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleOpen()}
                          style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClose()}
                          style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle()}
                          style={{ border: `1px solid ${p.borderColor || "#e5e7eb"}`, background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Toggle
                        </button>
                      </div>
                    ) : null}
                    <ItemsList />
                  </aside>
                ) : null
              )}
            </div>
          );
        }
        return <SidebarView {...props} />;
      },
    },
    Modal: {
      label: "Modal",
      inline: true,
      fields: {
        flag: { type: "text", label: "Flag d'ouverture", defaultValue: "modalOpen" },
        overlay: { type: "select", label: "Overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
        closeOnOverlay: { type: "select", label: "Fermer sur overlay", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
        overlayColor: { type: "text", label: "Couleur overlay", defaultValue: "rgba(17,24,39,0.55)" },
        overlayBlur: { type: "number", label: "Blur overlay (px)", defaultValue: 0 },
        width: { type: "number", label: "Largeur (px)", defaultValue: 560 },
        maxWidth: { type: "number", label: "Max width (px)", defaultValue: 720 },
        maxHeight: { type: "number", label: "Hauteur max (px)", defaultValue: 640 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
        gap: { type: "number", label: "Espacement interne (px)", defaultValue: 16 },
        radius: { type: "number", label: "Arrondi (px)", defaultValue: 12 },
        shadow: { type: "select", label: "Ombre", options: [
          { label: "Légère", value: "sm" },
          { label: "Moyenne", value: "md" },
          { label: "Forte", value: "lg" },
        ], defaultValue: "md" },
        backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
        textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
        textAlign: { type: "select", label: "Alignement", options: [
          { label: "Gauche", value: "left" },
          { label: "Centré", value: "center" },
          { label: "Droite", value: "right" },
        ], defaultValue: "left" },
        eyebrow: { type: "text", label: "Sur-titre", defaultValue: "" },
        title: { type: "text", label: "Titre", defaultValue: "Titre du modal" },
        description: { type: "textarea", label: "Description", defaultValue: "Ajoutez un texte introductif pour contextualiser votre contenu." },
        bodyText: { type: "textarea", label: "Texte principal", defaultValue: "" },
        showCloseButton: { type: "select", label: "Bouton fermer", options: [ { label: "Afficher", value: "true" }, { label: "Masquer", value: "false" } ], defaultValue: "true" },
        closeLabel: { type: "text", label: "Label bouton fermer", defaultValue: "Fermer" },
        primaryLabel: { type: "text", label: "Action principale", defaultValue: "Confirmer" },
        primaryFlag: { type: "text", label: "Flag action principale", defaultValue: "" },
        primaryCloses: { type: "select", label: "Fermer après action principale", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "true" },
        secondaryLabel: { type: "text", label: "Action secondaire", defaultValue: "" },
        secondaryFlag: { type: "text", label: "Flag action secondaire", defaultValue: "" },
        secondaryCloses: { type: "select", label: "Fermer après action secondaire", options: [ { label: "Oui", value: "true" }, { label: "Non", value: "false" } ], defaultValue: "false" },
        actionsAlign: { type: "select", label: "Alignement actions", options: [
          { label: "Aligné à gauche", value: "flex-start" },
          { label: "Centré", value: "center" },
          { label: "Aligné à droite", value: "flex-end" },
          { label: "Espacées", value: "space-between" },
        ], defaultValue: "flex-end" },
        children: { type: "slot", label: "Contenu avancé (slot)" },
      },
      render: ({
        flag,
        overlay,
        closeOnOverlay,
        overlayColor,
        overlayBlur,
        width,
        maxWidth,
        maxHeight,
        padding,
        gap,
        radius,
        shadow,
        backgroundColor,
        textColor,
        textAlign,
        eyebrow,
        title,
        description,
        bodyText,
        showCloseButton,
        closeLabel,
        primaryLabel,
        primaryFlag,
        primaryCloses,
        secondaryLabel,
        secondaryFlag,
        secondaryCloses,
        actionsAlign,
        children: Content,
        puck,
      }: any) => {
        const { flags, setFlag } = useActionState();
        const rawFlagName = flag ?? "modalOpen";
        const flagName = String(rawFlagName).trim();
        const isOpen = !!flags[flagName];
        const isEditing = (puck as any)?.isEditing;
        if (!isOpen && !isEditing) return null;
  const parsedTextAlign = (textAlign || "left") as React.CSSProperties["textAlign"];
        const overlayStyle: React.CSSProperties = {
          position: "absolute",
          inset: 0,
          background: overlayColor || "rgba(17,24,39,0.55)",
          backdropFilter: overlayBlur ? `blur(${overlayBlur}px)` : undefined,
          transition: "opacity 0.2s ease",
        };
        const getShadow = (value?: string) => {
          switch (value) {
            case "sm":
              return "0 10px 20px rgba(15,23,42,0.15)";
            case "lg":
              return "0 30px 60px rgba(15,23,42,0.35)";
            default:
              return "0 20px 40px rgba(15,23,42,0.22)";
          }
        };
        const baseWidth = typeof width === "number" && width > 0 ? width : null;
        const baseMaxWidth = typeof maxWidth === "number" && maxWidth > 0 ? maxWidth : null;
        const safeWidth = baseWidth ? `min(${baseWidth}px, calc(100vw - 2.5rem))` : undefined;
        const safeMaxWidth = baseMaxWidth ? `min(${baseMaxWidth}px, calc(100vw - 2rem))` : "calc(100vw - 2rem)";
        const safeMaxHeight = typeof maxHeight === "number" && maxHeight > 0 ? `min(${maxHeight}px, calc(100vh - 3rem))` : "calc(100vh - 3rem)";
        const handleAction = (targetFlag?: string, shouldClose?: string | boolean) => {
          const trimmed = (targetFlag || "").toString().trim();
          if (trimmed) {
            setFlag(trimmed, true);
          }
          if (String(shouldClose) === "true") {
            setFlag(flagName, false);
          }
        };
        const headingId = `${flagName || "modal"}-heading`;
        const descriptionId = `${flagName || "modal"}-description`;
        const showClose = String(showCloseButton ?? "true") !== "false";
        const hasSlotContent = typeof Content === "function";
        const bodyParagraphs = (bodyText || "")
          .split(/\n{2,}/)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);
        const actions: Array<{
          variant: "primary" | "secondary";
          label: string;
          flag?: string;
          closes?: string | boolean;
        }> = [];
        if ((primaryLabel || "").trim()) {
          actions.push({ variant: "primary", label: primaryLabel, flag: primaryFlag, closes: primaryCloses });
        }
        if ((secondaryLabel || "").trim()) {
          actions.push({ variant: "secondary", label: secondaryLabel, flag: secondaryFlag, closes: secondaryCloses });
        }
        const body = (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? headingId : undefined}
            aria-describedby={bodyParagraphs.length || description ? descriptionId : undefined}
            style={{
              background: backgroundColor || "#fff",
              color: textColor || "#111827",
              width: safeWidth,
              maxWidth: safeMaxWidth,
              maxHeight: safeMaxHeight,
              padding: `${padding || 0}px`,
              borderRadius: radius ? `${radius}px` : undefined,
              boxShadow: getShadow(String(shadow)),
              display: "flex",
              flexDirection: "column",
              gap: typeof gap === "number" ? gap : 16,
              textAlign: parsedTextAlign,
              overflow: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(148,163,184,0.8) transparent",
            }}
          >
            {showClose ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setFlag(flagName, false)}
                  aria-label={closeLabel || "Fermer le modal"}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 8,
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  ✕
                </button>
              </div>
            ) : null}
            {(eyebrow || title || description) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {eyebrow ? <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{eyebrow}</span> : null}
                {title ? <h2 id={headingId} style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>{title}</h2> : null}
                {description ? <p id={descriptionId} style={{ margin: 0, color: "rgba(17,24,39,0.76)", lineHeight: 1.55 }}>{description}</p> : null}
              </div>
            ) : null}
            {bodyParagraphs.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.6 }}>
                {bodyParagraphs.map((paragraph: string, idx: number) => (
                  <p key={idx} style={{ margin: 0 }}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {hasSlotContent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Content />
              </div>
            ) : null}
            {actions.length ? (
              <div style={{ display: "flex", justifyContent: (actionsAlign || "flex-end") as React.CSSProperties["justifyContent"], gap: 12, flexWrap: "wrap" }}>
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAction(action.flag, action.closes)}
                    style={{
                      minWidth: 120,
                      padding: "0.6rem 1.25rem",
                      borderRadius: 999,
                      border: action.variant === "secondary" ? "1px solid rgba(15,23,42,0.18)" : "1px solid transparent",
                      background: action.variant === "secondary" ? "transparent" : "#111827",
                      color: action.variant === "secondary" ? "#111827" : "#f9fafb",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
        return (
          <div
            ref={puck?.dragRef}
            style={{
              position: "fixed",
              inset: 0,
              display: isOpen ? "grid" : (isEditing ? "grid" : "none"),
              placeItems: "center",
              zIndex: 1000,
              padding: "2rem 1rem",
              overflowY: "auto",
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            {String(overlay) === "true" ? (
              <div
                onClick={() => {
                  if (String(closeOnOverlay) === 'true') setFlag(flagName, false);
                }}
                style={overlayStyle}
              />
            ) : null}
            <div style={{ position: "relative", zIndex: 1 }}>{body}</div>
          </div>
        );
      },
    },
  },
} as const;