import { NextResponse } from "next/server";
import { getProfileBySlug } from "@/lib/profile/service";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug || "").replace(/^@+/, "");
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
