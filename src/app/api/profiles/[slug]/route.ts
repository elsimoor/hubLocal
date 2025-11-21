import { NextResponse } from "next/server";
import { getProfileBySlug } from "@/lib/profile/service";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug || "");
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
