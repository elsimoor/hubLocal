"use client";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type RenderProps = {
  node: any;
  rootProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
};

// Convert style keys to CSS properties similar to other widgets
const unit = (v: any, u?: string) => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return `${v}${!u || u === "pixels" ? "px" : u}`;
  return v;
};

function cssFromNodeStyle(s: Record<string, any> = {}): CSSProperties {
  const css: CSSProperties = {};
  if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);
  if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);
  if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);
  if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
  if (s.borderWidth !== undefined) css.borderWidth = unit(s.borderWidth, s.borderWidthUnit);
  if (s.borderColor) css.borderColor = s.borderColor;
  if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);
  return css;
}

export default function RenderTestimonials({ node, rootProps = {} }: RenderProps) {
  const selected = (rootProps as any)["data-selected"] ?? false;
  const { className, style: _ignored, ...rest } = rootProps;
  let items: Array<{ quote: string; author: string }> = [];
  try {
    const json = node?.props?.items || "[]";
    items = JSON.parse(json);
  } catch {
    items = [];
  }
  const style = cssFromNodeStyle(node?.style || {});
  const merged: CSSProperties = selected
    ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
    : style;
  return (
    <div {...(rest as any)} className={className || ""} style={merged}>
      {items.map((item, idx) => (
        <blockquote key={idx} style={{ marginBottom: "1rem" }}>
          <p style={{ fontStyle: "italic" }}>{item.quote}</p>
          <footer style={{ marginTop: ".25rem", fontWeight: 500 }}>— {item.author}</footer>
        </blockquote>
      ))}
    </div>
  );
}