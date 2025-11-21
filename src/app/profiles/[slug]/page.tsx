import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getProfileBySlug } from "@/lib/profile/service";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export default async function Page({ params }: Props) {
  const slug = decodeURIComponent(params?.slug || "");
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    notFound();
  }
  return <ProfileClient profile={profile} />;
}
