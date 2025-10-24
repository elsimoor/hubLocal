"use client";
import { QrCode } from "lucide-react";
import type { IComponentProps } from "../../types";

// QR Code widget: uses an external API to render a QR code for a given URL.
const qrCode: IComponentProps = {
  id: "qrCode",
  name: "QR Code",
  icon: <QrCode size={16} color="#6b7280" />,
  type: "widget",
  container: false,
  resize: false,
  props: [
    { name: "url", label: "Lien à encoder", type: "string", value: "https://hublocal.link" },
    { name: "size", label: "Taille (px)", type: "number", select: ["pixels"], value: 128, selectValue: "pixels" },
  ],
  style: ["width", "height", "margin", "padding", "borderRadius"],
};

export default qrCode;