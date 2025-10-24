import root from "./root";
import div from "./div";
import button from "./button";
import typingText from "./widgets/typingText";
import image from "./image";
import video from "./video";
import linksList from "./widgets/linksList";
import qrCode from "./widgets/qrCode";
import spotifyCard from "./widgets/spotifyCard";
import testimonials from "./widgets/testimonials";
import type { IComponentsDualProps } from "../types";
import text from "./text";

const components: IComponentsDualProps = [
    root,
    div,
    button,
    typingText,
    text,
    image,
    video,
    linksList,
    qrCode,
    spotifyCard,
    testimonials,
];

export default components;
