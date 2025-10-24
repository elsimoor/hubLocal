import type { JSX } from "react";

import { RenderDiv } from "../components/div/render";
import { RenderButton } from "../components/button/render";
import { RenderTypingText } from "../components/widgets/typingText/render";
import { RenderRoot } from "../components/root/render";
import { RenderText } from "../components/text/render";
import { RenderImage } from "../components/image/render";
import { RenderVideo } from "../components/video/render";
import { RenderLinksList } from "../components/widgets/linksList/render";

// Map type → renderer
export const rendererMap = new Map<string, (p: any) => JSX.Element>([
    ["root", RenderRoot],
    ["div", RenderDiv],
    ["button", RenderButton],
    ["typingText", RenderTypingText],
    ["text", RenderText],
    ["image", RenderImage],
    ["video", RenderVideo],
    ["linksList", RenderLinksList],
]);
