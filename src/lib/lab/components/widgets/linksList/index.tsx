"use client";
import { Link2 } from "lucide-react";
import type { IComponentProps } from "../../../types";

const linksList: IComponentProps = {
  id: "linksList",
  name: "Liste de liens",
  icon: <Link2 color="#9ca3af" />,
  type: "widget",
  container: false,
  resize: false,
  props: [
    { name: "title", label: "Titre", type: "string", value: "Mes liens" },
    { name: "items", label: "Liens (JSON)", type: "string", value: JSON.stringify([
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "YouTube", href: "https://www.youtube.com/" }
    ]) },
  ],
  style: ["width", "margin", "padding"],
};

export default linksList;
