"use client";
import { Type as TypeIcon } from "lucide-react";
import type { IComponentProps } from "../../types";

const text: IComponentProps = {
    id: "text",
    name: "Texte",
    icon: <TypeIcon color="#9ca3af" />,
    type: "layout",
    container: false,
    resize: false,
    props: [
        { name: "text", label: "Contenu", type: "string", value: "Votre texte…" },
        { name: "tag", label: "Balise", type: "select", select: ["p", "h1", "h2", "h3", "span"], value: "p" },
    ],
    style: [
        "color", "opacity",
        "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign",
        "margin", "padding",
        "width"
    ],
};

export default text;
