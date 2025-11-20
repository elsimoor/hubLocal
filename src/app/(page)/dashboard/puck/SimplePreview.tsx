"use client";
import React from "react";

type Node = any;

function Box({ children, title }: { children?: React.ReactNode; title?: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, background: "#fff", marginBottom: 8 }}>
      {title ? <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{title}</div> : null}
      {children}
    </div>
  );
}

function renderNode(n: Node, idx: number): React.ReactNode {
  if (!n || typeof n !== "object") return null;
  const t = String((n as any).type || "");
  const p = (n as any).props || {};
  const children: any[] = Array.isArray((n as any).content)
    ? (n as any).content
    : Array.isArray((n as any).children)
      ? (n as any).children
      : ((): any[] => {
          const out: any[] = [];
          if ((n as any).slots && typeof (n as any).slots === 'object') {
            for (const v of Object.values((n as any).slots)) if (Array.isArray(v)) out.push(...(v as any[]));
          }
          if ((n as any).zones && typeof (n as any).zones === 'object') {
            for (const v of Object.values((n as any).zones)) if (Array.isArray(v)) out.push(...(v as any[]));
          }
          return out;
        })();

  switch (t.toLowerCase()) {
    case "text":
    case "paragraph":
    case "p":
      return <p key={idx} style={{ margin: "6px 0" }}>{String(p.text || p.children || p.content || "Texte")}</p>;
    case "heading":
    case "h1":
    case "h2":
    case "h3":
      return <h3 key={idx} style={{ margin: "6px 0", fontWeight: 700 }}>{String(p.text || p.title || "Titre")}</h3>;
    case "image":
    case "img":
      return (
        <img
          key={idx}
          src={String(p.src || p.url || p.href || "")}
          alt={String(p.alt || "")}
          style={{ display: "block", maxWidth: "100%", borderRadius: 6 }}
        />
      );
    case "button":
    case "link":
    case "a":
      return (
        <a
          key={idx}
          href={String(p.href || p.url || "#")}
          style={{
            display: "inline-block",
            padding: "6px 10px",
            background: "#111827",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          {String(p.label || p.text || "Action")}
        </a>
      );
    case "div":
    case "container":
    case "section":
      return <Box key={idx}>{children.map(renderNode)}</Box>;
    default:
      // Unknown: show a simple labeled box and render children recursively
      if (children.length) return <Box key={idx} title={`${t || "Bloc"}`}>{children.map(renderNode)}</Box>;
      const guess = String(p.text || p.title || p.label || p.children || "");
      return <Box key={idx} title={`${t || "Bloc"} (inconnu)`}>{guess ? <div style={{ fontSize: 12 }}>{guess}</div> : null}</Box>;
  }
}

export default function SimplePreview({ data }: { data: { root?: { content?: any[] } } }) {
  const content: any[] = Array.isArray(data?.root?.content) ? (data.root!.content as any[]) : [];
  console.log('[SimplePreview] Rendering with content:', content);
  
  if (content.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#6b7280", padding: 12, textAlign: "center" }}>
        Ce groupe ne contient aucun élément pour le moment.
      </div>
    );
  }
  
  return (
    <div>
      {content.map(renderNode)}
    </div>
  );
}
