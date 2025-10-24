"use client";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type RenderProps = {
  node: any;
  rootProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
};

const unit = (v: any, u?: string) => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return `${v}${!u || u === "pixels" ? "px" : u}`;
  return v;
};

function cssFromNodeStyle(s: Record<string, any> = {}): CSSProperties {
  const css: CSSProperties = {};
  if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);
  if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);
  if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);
  return css;
}

export function RenderLinksList({ node, rootProps = {} }: RenderProps) {
  const selected = (rootProps as any)["data-selected"] ?? false;
  const { className, style: _ignored, ...rest } = rootProps;

  const style = cssFromNodeStyle(node?.style || {});
  const merged: CSSProperties = selected
    ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
    : style;

  const title = node?.props?.title || "Liens";
  let items: Array<{ label: string; href: string }> = [];
  try {
    const raw = node?.props?.items;
    if (typeof raw === "string" && raw.trim()) items = JSON.parse(raw);
  } catch { /* ignore parse errors */ }

  return (
    <div {...(rest as any)} className={["space-y-2", className || ""].join(" ")} style={merged}>
      <div className="text-sm font-medium text-gray-800">{title}</div>
      <div className="grid gap-2">
        {items.map((it, i) => (
          <a
            key={i}
            href={it.href}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            {it.label}
          </a>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-gray-500">Aucun lien</div>
        )}
      </div>
    </div>
  );
}
