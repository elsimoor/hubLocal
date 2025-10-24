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

    if (s.color) css.color = s.color;
    if (s.fontSize !== undefined) css.fontSize = unit(s.fontSize, s.fontSizeUnit);
    if (s.fontWeight) css.fontWeight = s.fontWeight as any;
    if (s.lineHeight !== undefined) css.lineHeight = unit(s.lineHeight, s.lineHeightUnit) as any;
    if (s.letterSpacing !== undefined) css.letterSpacing = unit(s.letterSpacing, s.letterSpacingUnit) as any;
    if (s.textAlign) css.textAlign = s.textAlign as any;

    if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
    if (s.opacity !== undefined) css.opacity = Number(s.opacity);

    if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);
    if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);

    if (s.borderWidth || s.borderStyle || s.borderColor) {
        const bw = unit(s.borderWidth, s.borderWidthUnit) ?? 0;
        (css as any).border = `${bw} ${s.borderStyle ?? "solid"} ${s.borderColor ?? "transparent"}`;
    }
    if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);

    if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);
    if (s.height !== undefined) css.height = unit(s.height, s.heightUnit);
    if (s.minHeight !== undefined) css.minHeight = unit(s.minHeight, s.minHeightUnit);

    if (s.boxShadow) css.boxShadow = s.boxShadow;

    (css as any).cursor = "pointer";
    if (!css.display) css.display = "inline-flex";
    (css as any).alignItems = "center";
    (css as any).justifyContent = "center";
    if (!css.padding) css.padding = "8px 12px";
    if (!css.backgroundColor) css.backgroundColor = "#111827"; 
    if (!css.color) css.color = "#ffffff";
    if (!css.borderRadius) css.borderRadius = "8px";
    if (!css.minHeight) css.minHeight = "36px";

    return css;
}

export function RenderButton({ node, rootProps = {} }: RenderProps) {
    const selected = (rootProps as any)["data-selected"] ?? false;
    const { className, style: _ignored, onCopy: _onCopy, ...rest } = rootProps;

    const style = cssFromNodeStyle(node?.style || {});
    const merged: CSSProperties = selected
        ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
        : style;

    const label = node?.props?.label ?? "Bouton";
    const href = (node?.props?.href || "").trim();
    const newTab = !!node?.props?.newTab;

    if (href) {
        return (
            <a
                {...(rest as any)}
                href={href}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                className={[
                    "hover:outline hover:outline-2 hover:outline-blue-300/70 transition-[outline] duration-100 no-underline",
                    className || "",
                ].join(" ")}
                style={merged}
            >
                {label}
            </a>
        );
    }

    return (
        <button
            {...(rest as any)}
            type="button"
            className={[
                "hover:outline hover:outline-2 hover:outline-blue-300/70 transition-[outline] duration-100",
                className || "",
            ].join(" ")}
            style={merged}
        >
            {label}
        </button>
    );
}
