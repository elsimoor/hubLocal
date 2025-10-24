"use client";
import { FaQuoteLeft } from "react-icons/fa";
import type { IComponentProps } from "../../types";

// Testimonials widget: displays a list of quotes with authors. The items prop
// holds a JSON stringified array of objects { quote: string, author: string }.
const testimonials: IComponentProps = {
  id: "testimonials",
  name: "Témoignages",
  icon: <FaQuoteLeft size={16} color="#6b7280" />,
  type: "widget",
  container: false,
  resize: false,
  props: [
    {
      name: "items",
      label: "Témoignages (JSON)",
      type: "string",
      value: JSON.stringify([
        { quote: "Super service !", author: "Jean" },
        { quote: "Incroyable expérience.", author: "Marie" },
      ]),
    },
  ],
  style: ["width", "margin", "padding", "backgroundColor", "borderWidth", "borderColor", "borderRadius"],
};

export default testimonials;