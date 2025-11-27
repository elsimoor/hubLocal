import { use } from "react";
import EditVCardClient from "./EditVCardClient";

export default function EditVCardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <EditVCardClient id={id} />;
}
