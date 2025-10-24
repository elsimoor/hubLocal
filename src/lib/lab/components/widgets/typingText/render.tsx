"use client";
import { useEffect, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";

type Props = {
    node: any;
    rootProps?: HTMLAttributes<HTMLSpanElement>;
    style?: CSSProperties;
};

const valUnit = (
    s: Record<string, any>,
    name: string,
    defUnit: string,
    defValue?: number | string
) => {
    const v = s[name] ?? defValue;
    if (v == null) return undefined;
    if (typeof v === "number") {
        const u = s[`${name}Unit`] ?? defUnit;
        const map: Record<string, string> = { pixels: "px", rem: "rem", "%": "%", dvh: "dvh", vw: "vw", vh: "vh", ms: "ms", s: "s" };
        return `${v}${map[u] ?? u}`;
    }
    return v;
};

export function RenderTypingText({ node, rootProps = {}, style }: Props) {
    const { text = "", speed = 40, loop = true, loopDelay = 500, cursor = true } = node.props || {};
    const s = node.style || {};
    const [idx, setIdx] = useState(0);

    useEffect(() => { setIdx(0); }, [text, speed, loop, loopDelay]);

    useEffect(() => {
        if (!text) return;
        const perChar = Math.max(1, Number(speed) || 40);
        const pause = Math.max(0, Number(loopDelay) || 500);

        if (idx < text.length) {
            const t = setTimeout(() => setIdx(i => i + 1), perChar);
            return () => clearTimeout(t);
        }
        if (loop) {
            const t = setTimeout(() => setIdx(0), pause);
            return () => clearTimeout(t);
        }
    }, [idx, text, speed, loop, loopDelay]);

    const merged: CSSProperties = { ...(style || {}) };

    // ---- Width
    const wm = s.widthMode ?? "auto";
    if (wm === "fixed") {
        merged.width = valUnit(s, "width", "pixels", undefined);
    } else {
        merged.width = wm as any; // "auto" | "fit-content" | "min-content" | "max-content"
    }

    // ---- Height
    const hm = s.heightMode ?? "auto";
    if (hm === "fixed") {
        merged.height = valUnit(s, "height", "pixels", undefined);
    } else {
        merged.height = hm as any;
    }

    return (
        <span {...rootProps} style={merged}>
            {text.slice(0, Math.min(idx, text.length))}
            {cursor && <span className="inline-block w-[1ch] animate-pulse">|</span>}
        </span>
    );
}
