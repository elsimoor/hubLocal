"use client";
import { Clapperboard } from "lucide-react";
import type { IComponentProps } from "../../types";

const video: IComponentProps = {
  id: "video",
  name: "Vidéo",
  icon: <Clapperboard color="#9ca3af" />,
  type: "layout",
  container: false,
  resize: true,
  props: [
    { name: "url", label: "URL d\u2019intégration (iframe)", type: "string", value: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { name: "ratio", label: "Ratio", type: "select", select: ["16:9", "4:3", "1:1"], value: "16:9" },
  ],
  style: ["width", "height", "borderRadius", "boxShadow"],
};

export default video;
