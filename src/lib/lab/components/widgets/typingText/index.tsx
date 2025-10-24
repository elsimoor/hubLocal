"use client";
import { Type } from "lucide-react";
import type { IComponentProps } from "../../../types";

const typingText: IComponentProps = {
    id: "typingText",
    name: "Texte animé",
    icon: <Type size={16} color="#6b7280" />,
    type: "widget",
    container: false,
    resize: false,

    /* ----------- Props (comportement) ----------- */
    props: [
        { name: "text", label: "Texte", type: "string", value: "Bonjour 👋 Tape en direct…" },
        { name: "speed", label: "Vitesse (ms/lettre)", type: "number", select: ["ms"], value: 40, selectValue: "ms" },
        { name: "loop", label: "Boucler", type: "boolean", value: true },
        {
            name: "loopDelay",
            label: "Pause avant relance (ms)",
            type: "number",
            select: ["ms"],
            value: 500,
            selectValue: "ms",
            displayIf: [{ name: "loop", equal: [true] }],
        },
        { name: "cursor", label: "Curseur", type: "boolean", value: true },
    ],

    /* ----------- Styles (design) ----------- */
    style: [
        { name: "display", label: "Affichage", type: "select", select: ["inline", "inline-block", "block", "flex", "grid"], value: "inline-block" },
        { name: "alignSelf", label: "Align self", type: "select", select: ["auto", "flex-start", "center", "flex-end", "stretch", "baseline"], hidden: true, value: "auto" },
        { name: "order", label: "Ordre (flex)", type: "number", hidden: true, value: 0 },

        {
            name: "typography", label: "Typographie", type: "group", children: [
                { name: "color", label: "Couleur", type: "color", value: "#111827" },
                { name: "fontFamily", label: "Police (CSS)", type: "string", hidden: true, value: "" },
                { name: "fontSize", label: "Taille", type: "number", select: ["pixels", "rem"], value: 18, selectValue: "pixels" },
                { name: "fontWeight", label: "Graisse", type: "select", select: ["300", "400", "500", "600", "700", "800", "900", "bold"], value: "600" },
                { name: "lineHeight", label: "Interligne", type: "number", select: ["pixels", "rem", "%"], value: 24, selectValue: "pixels" },
                { name: "letterSpacing", label: "Espacement lettres", type: "number", select: ["pixels", "rem", "em"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "textTransform", label: "Transform.", type: "select", select: ["none", "uppercase", "lowercase", "capitalize"], hidden: true, value: "none" },
                { name: "textDecorationLine", label: "Décoration", type: "select", select: ["none", "underline", "line-through", "overline"], hidden: true, value: "none" },
                {
                    name: "textDecorationStyle", label: "Style déco", type: "select", select: ["solid", "dashed", "dotted", "double", "wavy"], hidden: true, value: "solid",
                    displayIf: [{ name: "textDecorationLine", notEqual: ["none"] }]
                },
                {
                    name: "textDecorationColor", label: "Couleur déco", type: "color", hidden: true, value: "#111827",
                    displayIf: [{ name: "textDecorationLine", notEqual: ["none"] }]
                },
                {
                    name: "textUnderlineOffset", label: "Décalage souligné", type: "number", select: ["pixels"], hidden: true, value: 0, selectValue: "pixels",
                    displayIf: [{ name: "textDecorationLine", equal: ["underline"] }]
                },
                { name: "textAlign", label: "Alignement", type: "select", select: ["left", "center", "right", "justify", "start", "end"], value: "left" },
                { name: "whiteSpace", label: "Sauts de ligne", type: "select", select: ["normal", "nowrap", "pre", "pre-wrap", "pre-line", "break-spaces"], hidden: true, value: "normal" },
                { name: "wordBreak", label: "Coupure mots", type: "select", select: ["normal", "break-word", "break-all", "keep-all"], hidden: true, value: "normal" },
                { name: "hyphens", label: "Césure", type: "select", select: ["none", "manual", "auto"], hidden: true, value: "none" },
            ]
        },

        {
            name: "background", label: "Fond", type: "group", children: [
                { name: "backgroundColor", label: "Couleur de fond", type: "color", value: "transparent" },
                { name: "backgroundImage", label: "Image (CSS)", type: "string", hidden: true, value: "" },
                { name: "backgroundSize", label: "Taille", type: "select", select: ["auto", "cover", "contain"], hidden: true, value: "auto" },
                { name: "backgroundRepeat", label: "Répétition", type: "select", select: ["repeat", "no-repeat", "repeat-x", "repeat-y", "space", "round"], hidden: true, value: "no-repeat" },
                { name: "backgroundPosition", label: "Position (CSS)", type: "string", hidden: true, value: "" },
            ]
        },

        {
            name: "spacing", label: "Espacements", type: "group", children: [
                { name: "padding", label: "Padding", type: "number", select: ["pixels", "rem", "%"], value: 0, selectValue: "pixels" },
                { name: "margin", label: "Margin", type: "number", select: ["pixels", "rem", "%"], value: 0, selectValue: "pixels" },
                { name: "paddingTop", label: "Padding top", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "paddingRight", label: "Padding right", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "paddingBottom", label: "Padding bottom", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "paddingLeft", label: "Padding left", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "marginTop", label: "Margin top", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "marginRight", label: "Margin right", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "marginBottom", label: "Margin bottom", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "marginLeft", label: "Margin left", type: "number", select: ["pixels", "rem", "%"], hidden: true, value: 0, selectValue: "pixels" },
            ]
        },

        {
            name: "border", label: "Bordure", type: "group", children: [
                { name: "borderWidth", label: "Taille", type: "number", select: ["pixels"], value: 0, selectValue: "pixels" },
                { name: "borderStyle", label: "Style", type: "select", select: ["solid", "dashed", "dotted", "double", "none"], value: "none" },
                { name: "borderColor", label: "Couleur", type: "color", value: "#e5e7eb" },
                { name: "borderRadius", label: "Arrondi", type: "number", select: ["pixels", "rem", "%"], value: 0, selectValue: "pixels" },
            ]
        },

        {
            name: "effects", label: "Effets", type: "group", children: [
                { name: "boxShadow", label: "Box shadow (CSS)", type: "string", value: "" },
                { name: "textShadow", label: "Text shadow (CSS)", type: "string", hidden: true, value: "" },
                { name: "opacity", label: "Opacité (0..1)", type: "number", hidden: true, value: 1 },
            ]
        },

        {
            name: "dimensions", label: "Dimensions", type: "group", children: [
                {
                    name: "widthMode", label: "Largeur (mode)", type: "select",
                    select: ["auto", "fit-content", "min-content", "max-content", "fixed"], value: "auto"
                },
                {
                    name: "width", label: "Largeur", type: "number", select: ["pixels", "rem", "%", "vw"], value: 0, selectValue: "pixels",
                    displayIf: [{ name: "widthMode", equal: ["fixed"] }]
                },

                {
                    name: "heightMode", label: "Hauteur (mode)", type: "select",
                    select: ["auto", "fit-content", "min-content", "max-content", "fixed"], value: "auto"
                },
                {
                    name: "height", label: "Hauteur", type: "number", select: ["pixels", "rem", "%", "vh", "dvh"], value: 0, selectValue: "pixels",
                    displayIf: [{ name: "heightMode", equal: ["fixed"] }]
                },

                { name: "minWidth", label: "Min largeur", type: "number", select: ["pixels", "rem", "%", "vw"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "maxWidth", label: "Max largeur", type: "number", select: ["pixels", "rem", "%", "vw"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "minHeight", label: "Min hauteur", type: "number", select: ["pixels", "rem", "%", "vh", "dvh"], hidden: true, value: 0, selectValue: "pixels" },
                { name: "maxHeight", label: "Max hauteur", type: "number", select: ["pixels", "rem", "%", "vh", "dvh"], hidden: true, value: 0, selectValue: "pixels" },
            ]
        },

        {
            name: "positioning", label: "Position/Overflow", type: "group", hidden: true, children: [
                { name: "overflow", label: "Overflow", type: "select", select: ["visible", "hidden", "auto", "clip", "scroll"], value: "visible" },
                { name: "position", label: "Position", type: "select", select: ["static", "relative", "absolute", "fixed", "sticky"], value: "static" },
                { name: "top", label: "Top", type: "number", select: ["pixels", "rem", "%", "vh", "vw"], value: 0, selectValue: "pixels" },
                { name: "right", label: "Right", type: "number", select: ["pixels", "rem", "%", "vh", "vw"], value: 0, selectValue: "pixels" },
                { name: "bottom", label: "Bottom", type: "number", select: ["pixels", "rem", "%", "vh", "vw"], value: 0, selectValue: "pixels" },
                { name: "left", label: "Left", type: "number", select: ["pixels", "rem", "%", "vh", "vw"], value: 0, selectValue: "pixels" },
                { name: "zIndex", label: "z-index", type: "number", hidden: true, value: 0 },
            ]
        },

        {
            name: "transitions", label: "Transitions", type: "group", hidden: true, children: [
                { name: "transitionProperty", label: "Propriété(s)", type: "string", value: "" },
                { name: "transitionDuration", label: "Durée", type: "number", select: ["ms", "s"], value: 200, selectValue: "ms" },
                {
                    name: "transitionTimingFunction", label: "Courbe", type: "select",
                    select: ["ease", "linear", "ease-in", "ease-out", "ease-in-out", "cubic-bezier(0.4,0,0.2,1)"], value: "ease"
                },
                { name: "transitionDelay", label: "Délai", type: "number", select: ["ms", "s"], value: 0, selectValue: "ms" },
            ]
        },
    ],
};

export default typingText;
