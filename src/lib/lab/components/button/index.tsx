"use client";
import { Square } from "lucide-react";
import type { IComponentProps } from "../../types";

const button: IComponentProps = {
    id: "button",
    name: "Bouton",
    icon: <Square color="#9ca3af" />,
    type: "layout",
    container: false,
    resize: false,
    props: [
        { name: "label", label: "Texte du bouton", type: "string", value: "Bouton" },
        { name: "href", label: "Lien (URL)", type: "string", value: "" },
        { name: "newTab", label: "Ouvrir dans un nouvel onglet", type: "boolean", value: false },
    ],
    style: [
        "backgroundColor", "color", "opacity",
        "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign",
        "padding", "margin",
        "borderWidth", "borderStyle", "borderColor", "borderRadius",
        "boxShadow",
        "width", "height", "minHeight"
    ],
};

export default button;
