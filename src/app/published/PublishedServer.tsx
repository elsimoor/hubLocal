import React from "react";

// Server-safe renderer for published Puck JSON.
// This aims for broad compatibility by handling common primitives and
// gracefully degrading unknown components while preserving child content.

type Node = {
  type?: string;
  props?: any;
  children?: Node[];
  content?: Node[];
  slots?: Record<string, Node[] | undefined>;
};

function isArrayLike(val: any): val is any[] {
  return Array.isArray(val) && val.length >= 0;
}

function getChildren(n: any): any[] {
  if (!n) return [];
  if (isArrayLike(n.children)) return n.children as any[];
  if (isArrayLike(n.content)) return n.content as any[];
  if (isArrayLike(n?.props?.children)) return n.props.children as any[];
  if (n?.slots && typeof n.slots === "object") {
    // Prefer a slot named "children" when present; otherwise flatten all slots
    const slots = n.slots as Record<string, any>;
    if (isArrayLike(slots.children)) return slots.children;
    return Object.values(slots).filter(isArrayLike).flat();
  }
  return [];
}

function textFromProps(props: any): string {
  if (!props) return "";
  return (
    props.text ?? props.title ?? props.content ?? props.label ?? ""
  );
}

function classIf(v: any, cls: string) {
  return v ? cls : "";
}

function renderNode(node: any, key?: React.Key): React.ReactNode {
  if (!node || typeof node !== "object") return null;
  const type = String(node.type || "");
  const props = node.props || {};
  const children = getChildren(node);

  switch (type) {
    case "Container": {
      const style: React.CSSProperties = {};
      if (props.padding) style.padding = `${Number(props.padding) || 0}px`;
      if (props.margin) style.margin = `${Number(props.margin) || 0}px`;
      if (props.maxWidth) style.maxWidth = props.maxWidth;
      if (props.background) style.background = props.background;
      if (props.borderRadius != null) style.borderRadius = `${Number(props.borderRadius) || 0}px`;
      if (props.border) style.border = props.border;
      if (props.boxShadow) style.boxShadow = props.boxShadow;
      return (
        <div key={key} style={{ width: "100%", ...style }} className="mx-auto">
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "Hero": {
      const title = String(props.title || "");
      const subtitle = String(props.subtitle || "");
      const align = String(props.align || "left");
      const bg = props.background ? String(props.background) : undefined;
      const style: React.CSSProperties = { padding: "4rem 1rem", background: bg };
      const klass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";
      return (
        <section key={key} style={style} className={`w-full ${klass}`}>
          {title ? <h1 className="text-3xl font-bold text-gray-900">{title}</h1> : null}
          {subtitle ? <p className="mt-2 text-gray-600 text-lg">{subtitle}</p> : null}
          {children.map((c, i) => renderNode(c, i))}
        </section>
      );
    }
    case "Footer": {
      const text = String(props.text || props.copyright || "");
      return (
        <footer key={key} className="w-full py-6 text-center text-sm text-gray-600">
          {text}
        </footer>
      );
    }
    case "ResponsiveGrid": {
      const colsDesktop = Math.max(1, Math.min(Number(props.colsDesktop) || Number(props.columns) || 3, 12));
      const style: React.CSSProperties = { display: "grid", gap: "1rem", gridTemplateColumns: `repeat(${colsDesktop}, minmax(0, 1fr))` };
      return (
        <div key={key} style={style}>
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "Stack": {
      const gap = props.gap ? Number(props.gap) : 16;
      return (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap }}>
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "Spacer": {
      const h = Number(props.height) || 16;
      return <div key={key} style={{ height: h }} />;
    }
    case "Section": {
      const style: React.CSSProperties = {};
      if (props.padding) style.padding = `${Number(props.padding) || 0}px`;
      if (props.background) style.background = props.background;
      return (
        <section key={key} style={style} className="w-full">
          {children.map((c, i) => renderNode(c, i))}
        </section>
      );
    }
    case "Columns": {
      const cols = Math.max(1, Math.min(Number(props.columns) || 2, 12));
      const style: React.CSSProperties = { display: "grid", gap: "1rem", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
      return (
        <div key={key} style={style}>
          {children.map((c, i) => (
            <div key={i}>{renderNode(c, i)}</div>
          ))}
        </div>
      );
    }
    case "Grid":
    case "GridContainer": {
      const cols = Math.max(1, Math.min(Number(props.columns) || 3, 12));
      const style: React.CSSProperties = { display: "grid", gap: "1rem", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
      return (
        <div key={key} style={style}>
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "FlexContainer":
    case "ResponsiveFlex": {
      return (
        <div key={key} className="flex flex-wrap gap-4 items-start">
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "Heading": {
      const level = Number(props.level) || 1;
      const Tag = (level >= 1 && level <= 6 ? (`h${level}` as const) : "h2");
      const txt = String(textFromProps(props) || "Heading");
      return <Tag key={key} className="font-semibold text-gray-900">{txt}</Tag>;
    }
    case "Text": {
      const txt = String(textFromProps(props) || "");
      return <p key={key} className="text-gray-700 leading-7">{txt}</p>;
    }
    case "RichText": {
      const html = String(props.html || props.code || props.content || "");
      if (!html) return null;
      return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case "Image": {
      const src = String(props.src || "");
      const alt = String(props.alt || "");
      const w = props.width ? Number(props.width) : undefined;
      const h = props.height ? Number(props.height) : undefined;
      return <img key={key} src={src} alt={alt} width={w} height={h} className={classIf(props.rounded, "rounded-md")} />;
    }
    case "Video": {
      const src = String(props.src || "");
      if (!src) return null;
      return (
        <video key={key} src={src} controls className="w-full rounded-md" />
      );
    }
    case "Button": {
      const label = String(props.label || props.text || "Button");
      const href = String(props.href || "");
      const ButtonEl = href ? "a" : "button";
      const passProps: any = href ? { href, target: props.target || undefined } : {};
      return (
        <ButtonEl key={key} {...passProps} className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm">
          {label}
        </ButtonEl>
      );
    }
    case "Card": {
      return (
        <div key={key} className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
          {children.map((c, i) => renderNode(c, i))}
        </div>
      );
    }
    case "Navbar": {
      const items: any[] = props.items || props.links || [];
      return (
        <nav key={key} className="w-full flex items-center justify-between py-3">
          <div className="font-semibold">{props.brand || ""}</div>
          <div className="flex gap-4">
            {Array.isArray(items) && items.map((it, i) => {
              const label = String(it?.label ?? it ?? "");
              const href = String(it?.href ?? "#");
              return <a key={i} href={href} className="text-gray-700 hover:text-gray-900 text-sm">{label}</a>;
            })}
          </div>
        </nav>
      );
    }
    default: {
      // Fallback: try html first, then text, then children
      if (props?.html) return <div key={key} dangerouslySetInnerHTML={{ __html: String(props.html) }} />;
      const txt = textFromProps(props);
      if (txt) return <p key={key}>{String(txt)}</p>;
      if (children.length > 0) return <div key={key}>{children.map((c, i) => renderNode(c, i))}</div>;
      return null;
    }
  }
}

export default function PublishedServer({ data }: { data: any }) {
  const root = data?.root || {};
  const rp = root?.props || {};

  // Root layout
  const viewport = rp.viewport === "fixed" ? "fixed" : "fluid";
  const frameWidth = viewport === "fixed" ? 1280 : undefined;
  const backgroundPattern = typeof rp.backgroundPattern === "string" && rp.backgroundPattern !== "none" ? rp.backgroundPattern : undefined;

  // Children of root with robust fallbacks for older shapes
  let children = getChildren(root);
  if (!children || children.length === 0) {
    // Older shape: content stored under root.content or at top-level data.content
    if (isArrayLike((root as any)?.content)) children = (root as any).content;
    else if (isArrayLike((data as any)?.content)) children = (data as any).content;
    else if ((root as any)?.zones && typeof (root as any).zones === "object") {
      const zonesObj = (root as any).zones as Record<string, any>;
      children = Object.values(zonesObj).filter(isArrayLike).flat();
    } else if ((data as any)?.zones && typeof (data as any).zones === "object") {
      const zonesObj = (data as any).zones as Record<string, any>;
      children = Object.values(zonesObj).filter(isArrayLike).flat();
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50" style={{ background: backgroundPattern, backgroundAttachment: backgroundPattern ? "fixed" : undefined, backgroundSize: backgroundPattern ? "200px 200px" : undefined }}>
      {/* pre-body scripts (as requested) will be injected by page if needed */}
      <div className={typeof frameWidth === "number" ? "mx-auto py-6" : "mx-auto py-6 px-4"} style={typeof frameWidth === "number" ? { width: frameWidth } : undefined}>
        {children.map((c: any, i: number) => renderNode(c, i))}
      </div>
    </div>
  );
}
