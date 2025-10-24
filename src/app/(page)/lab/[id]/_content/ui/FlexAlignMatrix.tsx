"use client";
import { useRef } from "react";

type Dir = "row" | "column";
type Justify =
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
type Align = "stretch" | "flex-start" | "center" | "flex-end" | "baseline";

export default function FlexAlignMatrix({
    direction = "row",
    justify = "flex-start",
    align = "stretch",
    gap = 0,
    onChange,
}: {
    direction?: Dir;
    justify?: Justify;
    align?: Align;
    gap?: number;
    onChange: (patch: Record<string, any>) => void;
}) {
    const isRow = direction === "row";
    const isSpaced = justify === "space-between";

    const colToJustify: Record<number, Exclude<Justify, "space-between" | "space-around" | "space-evenly">> =
        { 0: "flex-start", 1: "center", 2: "flex-end" };
    const rowToAlign: Record<number, Exclude<Align, "stretch" | "baseline">> =
        { 0: "flex-start", 1: "center", 2: "flex-end" };

    const currentCol =
        justify === "flex-start" ? 0 : justify === "center" ? 1 : justify === "flex-end" ? 2 : -1;
    const currentRow =
        align === "flex-start" ? 0 : align === "center" ? 1 : align === "flex-end" ? 2 : -1;

    const clickTimer = useRef<number | null>(null);

    const applyMatrix = (r: 0 | 1 | 2, c: 0 | 1 | 2) => {
        const isSame = !isSpaced && r === currentRow && c === currentCol;
        if (isSame) {
            onChange({ justifyContent: "flex-start", alignItems: "stretch" });
        } else {
            onChange({
                justifyContent: colToJustify[c],
                alignItems: rowToAlign[r],
            });
        }
    };

    const onCellClick = (r: 0 | 1 | 2, c: 0 | 1 | 2) => {
        if (clickTimer.current) window.clearTimeout(clickTimer.current);
        clickTimer.current = window.setTimeout(() => applyMatrix(r, c), 180);
    };

    const toggleAutoSpace = () => {
        if (clickTimer.current) {
            window.clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }
        if (isSpaced) {
            onChange({ justifyContent: "flex-start" });
        } else {
            onChange({ justifyContent: "space-between", gap: 0 });
        }
    };

    return (
        <div className="space-y-2">
            <div
                className="relative rounded-lg bg-gray-50 border p-2 select-none"
                onDoubleClick={toggleAutoSpace}
                title="Double-clic : activer/désactiver la répartition auto (space-between)"
            >
                <div className="grid grid-cols-3 grid-rows-3 gap-1 w-28 h-20 mx-auto">
                    {[0, 1, 2].map((r) =>
                        [0, 1, 2].map((c) => {
                            const active = !isSpaced && r === currentRow && c === currentCol;
                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => onCellClick(r as 0 | 1 | 2, c as 0 | 1 | 2)}
                                    className={[
                                        "relative rounded-md border transition h-full w-full",
                                        active ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-gray-300",
                                    ].join(" ")}
                                    aria-label={`Align r${r} c${c}`}
                                >
                                    <span className="absolute inset-0 grid place-items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>

                {isSpaced && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div
                            className={[
                                "rounded bg-blue-500",
                                isRow ? "w-[70%] h-[2px]" : "h-[70%] w-[2px]",
                            ].join(" ")}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
