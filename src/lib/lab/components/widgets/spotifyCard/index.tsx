"use client";
import { FaSpotify } from "react-icons/fa";
import type { IComponentProps } from "../../types";

// Spotify embed widget: displays a Spotify track or playlist in an iframe. The
// user must provide a public Spotify URL. The height can be adjusted.
const spotifyCard: IComponentProps = {
  id: "spotifyCard",
  name: "Carte Spotify",
  icon: <FaSpotify size={16} color="#1DB954" />,
  type: "widget",
  container: false,
  resize: false,
  props: [
    { name: "url", label: "URL Spotify", type: "string", value: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" },
    { name: "height", label: "Hauteur (px)", type: "number", select: ["pixels"], value: 152, selectValue: "pixels" },
  ],
  style: ["width", "margin", "padding"],
};

export default spotifyCard;