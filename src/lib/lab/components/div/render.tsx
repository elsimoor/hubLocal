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

    const setDim = (prop: keyof CSSProperties, val: any, uKey: string) => {
        if (val === 0 || val === "" || val === null || val === undefined) return;
        (css as any)[prop] = unit(val, s[uKey]);
    };

    if (s.display) css.display = s.display;

    if (s.display === "flex") {
        if (s.flexDirection) css.flexDirection = s.flexDirection;
        if (s.justifyContent) css.justifyContent = s.justifyContent;
        if (s.alignItems) css.alignItems = s.alignItems;
        if (s.flexWrap) css.flexWrap = s.flexWrap;
        if (s.gap !== undefined) css.gap = unit(s.gap, s.gapUnit);
    }

    if (s.display === "grid") {
        if (s.gridTemplateColumns) css.gridTemplateColumns = s.gridTemplateColumns;
        if (s.gridTemplateRows) css.gridTemplateRows = s.gridTemplateRows;
        if (s.gap !== undefined) css.gap = unit(s.gap, s.gapUnit);
        if (s.rowGap !== undefined) css.rowGap = unit(s.rowGap, s.rowGapUnit);
        if (s.columnGap !== undefined) css.columnGap = unit(s.columnGap, s.columnGapUnit);
    }

    if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
    if (s.color) css.color = s.color;

    if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);
    if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);

    if (s.borderWidth || s.borderStyle || s.borderColor) {
        const bw = unit(s.borderWidth, s.borderWidthUnit) ?? 0;
        css.border = `${bw} ${s.borderStyle ?? "solid"} ${s.borderColor ?? "transparent"}`;
    }
    if (s.borderRadius !== undefined) css.borderRadius = unit(s.borderRadius, s.borderRadiusUnit);

    setDim("width", s.width, "widthUnit");
    setDim("minWidth", s.minWidth, "minWidthUnit");
    setDim("maxWidth", s.maxWidth, "maxWidthUnit");
    setDim("height", s.height, "heightUnit");
    setDim("minHeight", s.minHeight, "minHeightUnit");
    setDim("maxHeight", s.maxHeight, "maxHeightUnit");

    if (s.overflow) css.overflow = s.overflow as any;

    if (s.position === "fixed") {
        css.position = "fixed";
        setDim("top", s.top, "topUnit");
        setDim("right", s.right, "rightUnit");
        setDim("bottom", s.bottom, "bottomUnit");
        setDim("left", s.left, "leftUnit");
    }

    return css;
}

export function RenderDiv({ node, rootProps = {}, children }: RenderProps) {
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
                "hover:outline hover:outline-2 hover:outline-blue-300/70",
                "transition-[outline] duration-100",
                className || "",
            ].join(" ")}
            style={merged}
        >
            {children}
        </div>
    );
}
