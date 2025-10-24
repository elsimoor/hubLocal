"use client";
import { SquareDashed } from "lucide-react";
import type { IComponentProps } from "../../types";

const div: IComponentProps = {
    id: "div",
    name: "Conteneur",
    icon: <SquareDashed color="#9ca3af" />,
    type: "layout",
    container: true,
    resize: true,
    style: [
        "display",
        "flexDirection", "justifyContent", "alignItems", "flexWrap", "gap",
        "gridTemplateColumns", "gridTemplateRows", "rowGap", "columnGap",
        "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight",
        "padding", "margin",
        "backgroundColor", "opacity",
        "borderWidth", "borderStyle", "borderColor", "borderRadius",
        "overflow", "position", "top", "right", "bottom", "left",
        "boxShadow"
    ],
};

export default div;
