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

    if (s.background) (css as any).background = s.background;
    else if (s.backgroundColor) (css as any).background = s.backgroundColor;

    if (s.display) css.display = s.display;
    if (s.flexDirection) css.flexDirection = s.flexDirection;
    if (s.justifyContent) css.justifyContent = s.justifyContent;
    if (s.alignItems) css.alignItems = s.alignItems;
    if (s.gap !== undefined) (css as any).gap = unit(s.gap, s.gapUnit);

    if (s.padding !== undefined) (css as any).padding = unit(s.padding, s.paddingUnit);
    if (s.overflow) css.overflow = s.overflow as any;

    css.width = "100%";
    (css as any).minHeight = "100%";

    return css;
}

export function RenderRoot({ node, rootProps = {}, children }: RenderProps) {
    const selected = (rootProps as any)["data-selected"] ?? false;
    const { className, style: _ignored, ...rest } = rootProps;

    const style = cssFromNodeStyle(node?.style || {});
    const merged: CSSProperties = selected
        ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
        : style;

    return (
        <div
            {...rest}
            className={[
                "hover:outline hover:outline-2 hover:outline-blue-300/70 transition-[outline] duration-100",
                "relative",
                className || "",
            ].join(" ")}
            style={merged}
        >
            {children}
        </div>
    );
}
