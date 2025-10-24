"use client";
import { Image as ImageIcon } from "lucide-react";
import type { IComponentProps } from "../../types";

const image: IComponentProps = {
  id: "image",
  name: "Image",
  icon: <ImageIcon color="#9ca3af" />,
  type: "layout",
  container: false,
  resize: true,
  props: [
    { name: "src", label: "Source", type: "string", value: "https://picsum.photos/seed/demo/800/450" },
    { name: "alt", label: "Texte alternatif", type: "string", value: "" },
    { name: "fit", label: "Object Fit", type: "select", select: ["cover", "contain", "fill", "none", "scale-down"], value: "cover" },
  ],
  style: [
    "width", "height", "minHeight", "borderRadius", "boxShadow",
  ],
};

export default image;
