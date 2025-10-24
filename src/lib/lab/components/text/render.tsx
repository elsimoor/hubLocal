"use client";
import type { CSSProperties, HTMLAttributes, ReactNode, ElementType } from "react";
import { useSession } from "next-auth/react";

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
    if (s.opacity !== undefined) css.opacity = Number(s.opacity);
    if (s.fontSize !== undefined) css.fontSize = unit(s.fontSize, s.fontSizeUnit);
    if (s.fontWeight) css.fontWeight = s.fontWeight as any;
    if (s.lineHeight !== undefined) css.lineHeight = unit(s.lineHeight, s.lineHeightUnit) as any;
    if (s.letterSpacing !== undefined) css.letterSpacing = unit(s.letterSpacing, s.letterSpacingUnit) as any;
    if (s.textAlign) css.textAlign = s.textAlign as any;

    if (s.margin !== undefined) css.margin = unit(s.margin, s.marginUnit);
    if (s.padding !== undefined) css.padding = unit(s.padding, s.paddingUnit);

    if (s.width !== undefined) css.width = unit(s.width, s.widthUnit);

    if (!css.color) css.color = "#111827";
    return css;
}

export function RenderText({ node, rootProps = {} }: RenderProps) {
    const selected = (rootProps as any)["data-selected"] ?? false;
    const { className, style: _ignored, ...rest } = rootProps;

    const style = cssFromNodeStyle(node?.style || {});
    const merged: CSSProperties = selected
        ? { ...style, outline: "2px solid rgba(59,130,246,.85)", outlineOffset: 0 }
        : style;

    const Tag = ((node?.props?.tag as string) || "p") as ElementType;
    let content = node?.props?.text ?? "Texte";
    // Replace dynamic variables in the text with values from the user session
    try {
        const { data: session } = useSession();
        const user: any = session?.user;
        if (user) {
            content = content
                .replace(/\{\{\s*firstName\s*\}\}/gi, user.firstName ?? "")
                .replace(/\{\{\s*lastName\s*\}\}/gi, user.lastName ?? "");
        }
    } catch {
        // ignore errors if useSession isn't available
    }

    return (
        <Tag
            {...rest}
            className={[
                "hover:outline hover:outline-2 hover:outline-blue-300/70 transition-[outline] duration-100",
                className || "",
            ].join(" ")}
            style={merged}
        >
            {content}
        </Tag>
    );
}
