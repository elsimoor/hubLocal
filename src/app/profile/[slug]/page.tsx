import { notFound } from "next/navigation";
import { Render } from "@measured/puck/rsc";
import { config } from "@/lib/puck/config";
import { connectDB } from "@/lib/mongodb";
import { UserModel, UserDoc } from "@/lib/models/User";
import { PuckDocModel, PuckDoc } from "@/lib/models/PuckDoc";
import { AppModel } from "@/lib/models/App";
import { Metadata } from "next";
import { cloneProfileTemplateData } from "@/lib/puck/profileTemplate";
import { getLegacyProfileDocSlugs } from "@/lib/profile/docSlug";

type PageParams = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

async function getProfileData(slug: string) {
  await connectDB();
  // Slug format: @username
  const username = decodeURIComponent(slug).replace(/^@/, "");

  const user = (await UserModel.findOne({ username }).lean()) as UserDoc | null;
  if (!user) return null;

  const defaultApp = await AppModel.findOne({ ownerEmail: user.email, isDefault: true }).lean();
  const slugCandidates = getLegacyProfileDocSlugs((defaultApp as any)?.slug ?? null);
  let doc: PuckDoc | null = null;
  for (const candidate of slugCandidates) {
    doc = (await PuckDocModel.findOne({ ownerEmail: user.email, slug: candidate }).lean()) as PuckDoc | null;
    if (doc) break;
  }

  return { user, doc, defaultApp };
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfileData(slug);
  if (!data || !data.doc) return { title: "Profile Not Found" };

  const { root } = data.doc.data || {};
  return {
    title: root?.props?.title || `${data.user.name}'s Profile`,
    description: root?.props?.description || "",
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const { slug } = await params;
  const data = await getProfileData(slug);

  if (!data || !data.doc) {
    notFound();
  }

  const pageData = data.doc.data && (data.doc.data as any).root
    ? data.doc.data
    : cloneProfileTemplateData();

  return (
    <Render config={config as any} data={pageData} />
  );
}
