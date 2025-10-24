"use client";
import { Layout } from "lucide-react";
import type { IComponentProps } from "../../types";

const root: IComponentProps = {
  id: "root",
  name: "Page (racine)",
  icon: <Layout color="#9ca3af" />,
  type: "layout",
  container: true,
  resize: false,
  style: [
    "background",
    "backgroundColor",
    "display", "flexDirection", "justifyContent", "alignItems", "gap",
    "padding",
    "overflow"
  ],
};

export default root;
