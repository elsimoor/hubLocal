"use client";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type RenderProps = {
  node: any;
  rootProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
};

// Helper to extract size from style or props
const unit = (v: any, u?: string) => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return `${v}${!u || u === "pixels" ? "px" : u}`;
  return v;
};

function cssFromNodeStyle(s: Record<string, any> = {}): CSSProperties {
  const css: CSSProperties = {};
  if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);
  if (s.height !== undefined) css.height = unit(s.height, s.heightUnit);
  if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);
  if (s.boxShadow) css.boxShadow = s.boxShadow;
  if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);
  if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);
  return css;
}

export default function RenderQrCode({ node, rootProps = {} }: RenderProps) {
  const selected = (rootProps as any)["data-selected"] ?? false;
  const { className, style: _ignored, ...rest } = rootProps;

  // Determine size: prefer style width/height then prop size
  const size = node?.props?.size || 128;
  const url = node?.props?.url || "";
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;

  const style = cssFromNodeStyle(node?.style || {});
  const merged: CSSProperties = selected
    ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
    : style;

  return (
    <div {...(rest as any)} className={className || ""} style={merged}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}