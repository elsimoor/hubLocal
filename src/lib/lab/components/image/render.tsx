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
  if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);
  if (s.height !== undefined) css.height = unit(s.height, s.heightUnit);
  if (s.minHeight !== undefined) css.minHeight = unit(s.minHeight, s.minHeightUnit);
  if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);
  if (s.boxShadow) css.boxShadow = s.boxShadow;
  return css;
}

export function RenderImage({ node, rootProps = {} }: RenderProps) {
  const selected = (rootProps as any)["data-selected"] ?? false;
  const { className, style: _ignored, ...rest } = rootProps;

  const style = cssFromNodeStyle(node?.style || {});
  const merged: CSSProperties = selected
    ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
    : style;

  const src = node?.props?.src || "";
  const alt = node?.props?.alt || "";
  const fit = node?.props?.fit || "cover";

  return (
    <div {...(rest as any)} className={["overflow-hidden", className || ""].join(" ")} style={merged}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: fit as any, display: "block" }} />
    </div>
  );
}
