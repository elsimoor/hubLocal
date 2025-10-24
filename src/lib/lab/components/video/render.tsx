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
  if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);
  if (s.boxShadow) css.boxShadow = s.boxShadow;
  return css;
}

export function RenderVideo({ node, rootProps = {} }: RenderProps) {
  const selected = (rootProps as any)["data-selected"] ?? false;
  const { className, style: _ignored, ...rest } = rootProps;

  const style = cssFromNodeStyle(node?.style || {});
  const merged: CSSProperties = selected
    ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
    : style;

  const url = node?.props?.url || "";
  const ratio = node?.props?.ratio || "16:9";
  const [w, h] = (ratio as string).split(":").map((x) => Number(x) || 1);
  const paddingTop = `${(h / w) * 100}%`;

  return (
    <div {...(rest as any)} className={["relative w-full", className || ""].join(" ")} style={merged}>
      <div style={{ position: "relative", width: "100%", paddingTop }}>
        <iframe
          src={url}
          title="Video"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
