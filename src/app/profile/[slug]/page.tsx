import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getProfileBySlug } from "@/lib/profile/service";

type PageParams = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: PageParams }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || "");
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    notFound();
  }
  return <ProfileClient profile={profile} />;
}
