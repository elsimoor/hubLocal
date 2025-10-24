"use client";
import type { HTMLAttributes, ReactNode } from "react";

type RenderProps = {
  node: any;
  rootProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
};

export default function RenderSpotifyCard({ node, rootProps = {} }: RenderProps) {
  const { className, style: _ignored, ...rest } = rootProps;
  const url: string = node?.props?.url || "";
  const height: number = node?.props?.height || 152;
  // Convert to embed URL by inserting /embed into the path
  let embedUrl = url;
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith("/embed")) {
      u.pathname = "/embed" + u.pathname;
    }
    embedUrl = u.toString();
  } catch {
    // ignore invalid URL
  }
  return (
    <div {...(rest as any)} className={className || ""} style={{ width: "100%", height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}