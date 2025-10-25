"use client";

import React, { useEffect, useState } from "react";

// Typing text component used by TypingText block
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

// Puck configuration exported for both the editor and public renderer.
export const puckConfig = {
  categories: {
    layout: { title: "Mise en page", components: ["Container", "Flex", "Grid", "Space"] },
    typography: { title: "Typographie", components: ["Heading", "Text", "TypingText"] },
    actions: { title: "Actions", components: ["Button"] },
    media: { title: "Média", components: ["Image", "Video"] },
    widgets: { title: "Widgets", components: ["QrCode", "SpotifyCard", "Testimonials", "LinksList"] },
    other: { title: "Autres", components: ["Card", "Hero", "Logos", "Navbar", "Sidebar"] },
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
    },
    render: ({ children, title }: any) => (
      <div>
        {title ? <h1 style={{ fontSize: "1.875rem", fontWeight: 600, marginBottom: "1rem" }}>{title}</h1> : null}
        {children}
      </div>
    ),
  },
  components: {
    Container: {
      label: "Conteneur",
      fields: {
        children: { type: "slot", label: "Contenu" },
        padding: { type: "number", label: "Padding (px)", defaultValue: 8 },
        margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "transparent" },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 0 },
        borderColor: { type: "text", label: "Couleur de bordure", defaultValue: "#e5e7eb" },
        borderWidth: { type: "number", label: "Taille bordure (px)", defaultValue: 0 },
      },
      inline: true,
      render: ({ children: Content, padding, margin, backgroundColor, borderRadius, borderColor, borderWidth, puck }: any) => {
        const style: React.CSSProperties = {
          padding: `${padding || 0}px`,
          margin: `${margin || 0}px`,
          backgroundColor: backgroundColor || undefined,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          borderWidth: borderWidth ? `${borderWidth}px` : undefined,
          borderColor: borderColor || undefined,
          borderStyle: borderWidth ? "solid" : undefined,
        };
        return <div ref={puck?.dragRef} style={style}>{typeof Content === "function" ? <Content /> : null}</div>;
      },
    },
    Flex: {
      label: "Flex",
      fields: {
        children: { type: "slot", label: "Contenu" },
        direction: { type: "select", label: "Direction", options: [{ label: "Ligne", value: "row" }, { label: "Colonne", value: "column" }], defaultValue: "row" },
        gap: { type: "number", label: "Espacement (px)", defaultValue: 8 },
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
      render: ({ children: Content, direction, gap, gapX, gapY, wrap, alignItems, justifyContent, alignContent }: any) => {
        const style: React.CSSProperties = {
          display: "flex",
          flexDirection: direction || "row",
          gap: gap ? `${gap}px` : undefined,
          columnGap: gapX ? `${gapX}px` : undefined,
          rowGap: gapY ? `${gapY}px` : undefined,
          alignItems: alignItems || undefined,
          justifyContent: justifyContent || undefined,
          alignContent: alignContent || undefined,
          flexWrap: wrap || "nowrap",
        };
        return typeof Content === "function" ? <Content style={style} className="puck-flex-slot" /> : null;
      },
    },
    Grid: {
      label: "Grille",
      fields: {
        children: { type: "slot", label: "Contenu" },
        columns: { type: "number", label: "Colonnes", defaultValue: 2 },
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
      render: ({ children: Content, columns, rows, gap, gapX, gapY, autoRows, autoFlow, alignItems, justifyItems, alignContent, justifyContent, templateColumns, templateRows }: any) => {
        const gridTemplateColumns = (templateColumns && templateColumns.trim()) ? templateColumns : (columns ? `repeat(${columns}, 1fr)` : undefined);
        const gridTemplateRows = (templateRows && templateRows.trim()) ? templateRows : (rows ? `repeat(${rows}, auto)` : undefined);
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
        };
        return typeof Content === "function" ? <Content style={style} className="puck-grid-slot" /> : null;
      },
    },
    Space: {
      label: "Espace",
      inline: true,
      fields: {
        size: { type: "number", label: "Taille (px)", defaultValue: 16 },
        orientation: { type: "select", label: "Orientation", options: [
          { label: "Verticale", value: "vertical" },
          { label: "Horizontale", value: "horizontal" },
        ], defaultValue: "vertical" },
      },
      render: ({ size, orientation, puck }: any) => {
        const style: React.CSSProperties = {
          width: orientation === "horizontal" ? `${size || 0}px` : "100%",
          height: orientation === "vertical" ? `${size || 0}px` : undefined,
        };
        return <div ref={puck?.dragRef} style={style} />;
      },
    },
    Heading: {
      label: "Titre",
      inline: true,
      fields: {
        children: { type: "text", label: "Texte", placeholder: "Votre titre" },
        color: { type: "text", label: "Couleur", defaultValue: "#111827" },
        fontSize: { type: "number", label: "Taille (px)", defaultValue: 24 },
        fontFamily: { type: "text", label: "Police", placeholder: "" },
        fontWeight: { type: "select", label: "Graisse", options: [
          { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
        ], defaultValue: "600" },
      },
      render: ({ children, color, fontSize, fontFamily, fontWeight, puck }: any) => {
        const style: React.CSSProperties = {
          color: color || "#111827",
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily || undefined,
          fontWeight: fontWeight || undefined,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        return <h2 ref={puck?.dragRef} style={style}>{children}</h2>;
      },
    },
    Text: {
      label: "Texte",
      inline: true,
      fields: {
        children: { type: "textarea", label: "Contenu", placeholder: "Votre texte" },
        color: { type: "text", label: "Couleur", defaultValue: "#374151" },
        fontSize: { type: "number", label: "Taille (px)", defaultValue: 16 },
        fontFamily: { type: "text", label: "Police", placeholder: "" },
        fontWeight: { type: "select", label: "Graisse", options: [
          { label: "Normal", value: "400" }, { label: "Moyen", value: "500" }, { label: "Semi‑gras", value: "600" }, { label: "Gras", value: "700" },
        ], defaultValue: "400" },
        textAlign: { type: "select", label: "Alignement", options: [
          { label: "Gauche", value: "left" }, { label: "Centré", value: "center" }, { label: "Droite", value: "right" }, { label: "Justifié", value: "justify" },
        ], defaultValue: "left" },
      },
      render: ({ children, color, fontSize, fontFamily, fontWeight, textAlign, puck }: any) => {
        const style: React.CSSProperties = {
          color: color || "#374151",
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily || undefined,
          fontWeight: fontWeight || undefined,
          textAlign: (textAlign as React.CSSProperties["textAlign"]) || undefined,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        return <p ref={puck?.dragRef} style={style}>{children}</p>;
      },
    },
    Button: {
      label: "Bouton",
      inline: true,
      fields: {
        label: { type: "text", label: "Libellé", placeholder: "Cliquez ici" },
        href: { type: "text", label: "URL", placeholder: "#" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#7c3aed" },
        color: { type: "text", label: "Couleur du texte", defaultValue: "#ffffff" },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 8 },
        borderRadius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        fontSize: { type: "number", label: "Taille texte (px)", defaultValue: 14 },
      },
      render: ({ label, href, backgroundColor, color, paddingX, paddingY, borderRadius, fontSize, puck }: any) => {
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
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          if ((puck as any)?.isEditing && href) {
            e.preventDefault();
            try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
          }
        };
        return (
          <a ref={puck?.dragRef} href={href || '#'} style={style} onClick={handleClick} rel="noopener noreferrer">
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
      },
      render: ({ src, alt, width, height, puck }: any) => {
        const style: React.CSSProperties = {
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          display: "block",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        return <img ref={puck?.dragRef} src={src || "/placeholder_light_gray_block.png"} alt={alt || "Image"} style={style} />;
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
        let list: Array<{ quote: string; author: string }> = [];
        try { list = JSON.parse(items || "[]"); } catch { list = []; }
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
      },
      render: ({ icon, title, description, backgroundColor, borderRadius, padding, borderColor, borderWidth, align, layout, href, shadow, puck }: any) => {
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
        const card = <div ref={puck?.dragRef} style={style}>{inner}</div>;
        if (href) {
          const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if ((puck as any)?.isEditing) {
              e.preventDefault();
              try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {}
            }
          };
          return <a href={href} onClick={onClick} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{card}</a>;
        }
        return card;
      },
    },
    Hero: {
      label: "Héros",
      inline: true,
      fields: {
        title: { type: "text", label: "Titre", defaultValue: "Titre" },
        description: { type: "textarea", label: "Description", defaultValue: "Description du héros" },
        image: { type: "text", label: "Image (URL)", defaultValue: "https://images.unsplash.com/photo-1606761569780-43b7311d8682?auto=format&fit=crop&w=800&q=80" },
        imagePosition: { type: "select", label: "Position de l’image", options: [
          { label: "Gauche", value: "left" }, { label: "Droite", value: "right" }, { label: "Haut", value: "top" }, { label: "Bas", value: "bottom" },
        ], defaultValue: "right" },
        backgroundColor: { type: "text", label: "Couleur de fond", defaultValue: "#f9fafb" },
        textColor: { type: "text", label: "Couleur du texte", defaultValue: "#111827" },
        radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 32 },
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
          },
          defaultItemProps: { label: "Learn more", href: "#", variant: "primary" },
          getItemSummary: (item: any) => item?.label || "button",
        },
        align: { type: "select", label: "Alignement du texte", options: [
          { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" },
        ], defaultValue: "left" },
      },
      render: ({ title, description, image, imagePosition, backgroundColor, textColor, radius, padding, gap, imageRadius, imageFit, imageMaxHeight, buttons, align, puck }: any) => {
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
        const flexDirection = imagePosition === "left" || imagePosition === "right" ? "row" : "column";
        const orderImageFirst = imagePosition === "left" || imagePosition === "top";
        const containerStyle: React.CSSProperties = {
          display: "flex",
          flexDirection,
          alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
          justifyContent: "space-between",
          backgroundColor: backgroundColor || "#f9fafb",
          color: textColor || "#111827",
          padding: `${padding ?? 32}px`,
          gap: `${gap ?? 16}px`,
          borderRadius: `${radius ?? 8}px`,
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        };
        const textStyle: React.CSSProperties = { flex: "1 1 0", textAlign: (align as React.CSSProperties["textAlign"]) || "left" };
        const imageStyle: React.CSSProperties = { width: flexDirection === "row" ? "50%" : "100%", maxHeight: imageMaxHeight ? `${imageMaxHeight}px` : undefined, height: "auto", borderRadius: imageRadius ? `${imageRadius}px` : undefined, objectFit: imageFit || "cover" };
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
                const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => { if ((puck as any)?.isEditing && href) { e.preventDefault(); try { if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener'); } catch {} } };
                return <a key={idx} href={href} onClick={handleClick} style={{ ...baseStyle, ...(styleMap[variant] || styleMap.primary) }} rel="noopener noreferrer">{(btn.label as string) || "Button"}</a>;
              })}
            </div>
          </div>
        );
        const right = (
          <div style={{ flex: "1 1 0", display: "flex", justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}>
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
        align: { type: "select", label: "Alignement", options: [ { label: "Gauche", value: "left" }, { label: "Centre", value: "center" }, { label: "Droite", value: "right" } ], defaultValue: "right" },
        backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
        textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 12 },
        links: { type: "array", label: "Liens", arrayFields: { label: { type: "text", label: "label", defaultValue: "Link" }, href: { type: "text", label: "href", defaultValue: "#" } }, defaultItemProps: { label: "About", href: "#" }, getItemSummary: (item: any) => item?.label || "link" },
      },
      render: ({ brand, brandHref, align, backgroundColor, textColor, paddingY, links = [], puck }: any) => {
        const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
        return (
          <nav ref={puck?.dragRef} style={{ backgroundColor, color: textColor, padding: `${paddingY || 0}px 16px`, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <a href={brandHref || "/"} style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>{brand || "Brand"}</a>
              <div style={{ display: "flex", alignItems: "center", justifyContent: justify, gap: 12, flex: 1, marginLeft: 12 }}>
                {(Array.isArray(links) ? links : []).map((l: any, i: number) => (
                  <a key={i} href={l?.href || "#"} style={{ textDecoration: "none", color: "inherit", opacity: 0.9 }}>{l?.label || "Link"}</a>
                ))}
              </div>
            </div>
          </nav>
        );
      },
    },
    Sidebar: {
      label: "Sidebar",
      inline: true,
      fields: {
        position: { type: "select", label: "Position", options: [ { label: "Gauche", value: "left" }, { label: "Droite", value: "right" } ], defaultValue: "left" },
        width: { type: "number", label: "Largeur (px)", defaultValue: 240 },
        backgroundColor: { type: "text", label: "Fond", defaultValue: "#ffffff" },
        textColor: { type: "text", label: "Texte", defaultValue: "#111827" },
        radius: { type: "number", label: "Arrondi (px)", defaultValue: 8 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 12 },
        items: { type: "array", label: "Éléments", arrayFields: { label: { type: "text", label: "label", defaultValue: "Item" }, href: { type: "text", label: "href", defaultValue: "#" } }, defaultItemProps: { label: "Dashboard", href: "#" }, getItemSummary: (it: any) => it?.label || "item" },
      },
      render: ({ position, width, backgroundColor, textColor, radius, padding, items = [], puck }: any) => (
        <aside ref={puck?.dragRef} style={{ width: width || 240, backgroundColor, color: textColor, borderRadius: radius ? `${radius}px` : undefined, padding: `${padding || 0}px`, margin: "0.5rem 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {(Array.isArray(items) ? items : []).map((it: any, i: number) => (
              <li key={i}><a href={it?.href || "#"} style={{ textDecoration: "none", color: "inherit", display: "block", padding: "6px 8px", borderRadius: 6 }}>{it?.label || "Item"}</a></li>
            ))}
          </ul>
        </aside>
      ),
    },
  },
} as const;
