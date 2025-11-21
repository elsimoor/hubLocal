import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ProfileModel } from "@/lib/models/Profile";
import {
  ProfileLink,
  ProfilePayload,
  ProfileVcfFields,
  PROFILE_ICON_KEYS,
  PROFILE_LINK_TYPES,
  DEFAULT_PROFILE_VCF,
  createEmptyProfilePayload,
} from "@/types/profile";

const ICON_SET = new Set(PROFILE_ICON_KEYS);
const LINK_TYPES = new Set(PROFILE_LINK_TYPES);

const URL_REGEX = /^(https?:\/\/|mailto:)/i;

export function normalizeSlug(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function sanitizeUrl(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (URL_REGEX.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }
  return trimmed.includes("@") ? `mailto:${trimmed}` : `https://${trimmed}`;
}

function sanitizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizeLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((link) => {
      if (!link || typeof link !== "object") return null;
      const type = LINK_TYPES.has((link as any).type) ? (link as any).type : "link";
      const iconKey = ICON_SET.has((link as any).iconKey) ? (link as any).iconKey : "Share";
      const label = String((link as any).label ?? "").trim().slice(0, 80);
      if (!label) return null;
      const base: ProfileLink = {
        type,
        label,
        iconKey,
      };
      if (type === "link") {
        base.url = sanitizeUrl((link as any).url);
      }
      if (type === "album") {
        base.images = sanitizeImages((link as any).images);
      }
      if (type === "vcf") {
        base.url = "";
      }
      return base;
    })
    .filter(Boolean) as ProfileLink[];
}

function sanitizeVcf(value: unknown): ProfileVcfFields {
  const merged = { ...DEFAULT_PROFILE_VCF };
  if (!value || typeof value !== "object") return merged;
  for (const key of Object.keys(merged) as (keyof ProfileVcfFields)[]) {
    merged[key] = String((value as any)[key] ?? "").trim();
  }
  return merged;
}

export function sanitizeProfilePayload(payload: any): ProfilePayload {
  const base = createEmptyProfilePayload();
  base.slug = normalizeSlug(payload?.slug ?? base.slug);
  base.displayName = String(payload?.displayName ?? base.displayName).trim().slice(0, 80);
  base.tagline = String(payload?.tagline ?? base.tagline).trim().slice(0, 140);
  base.avatarUrl = typeof payload?.avatarUrl === "string" ? payload.avatarUrl.trim() : base.avatarUrl;
  base.backgroundUrl = typeof payload?.backgroundUrl === "string" ? payload.backgroundUrl.trim() : base.backgroundUrl;
  base.buttonPrimaryLabel = String(payload?.buttonPrimaryLabel ?? base.buttonPrimaryLabel).trim().slice(0, 32) || "Connect";
  base.buttonSecondaryLabel = String(payload?.buttonSecondaryLabel ?? base.buttonSecondaryLabel).trim().slice(0, 32) || "Links";
  base.links = sanitizeLinks(payload?.links);
  base.vcf = sanitizeVcf(payload?.vcf);
  return base;
}

export function serializeProfile(doc: any | null): ProfilePayload | null {
  if (!doc) return null;
  const base = createEmptyProfilePayload();
  base.slug = doc.slug ?? base.slug;
  base.displayName = doc.displayName ?? base.displayName;
  base.tagline = doc.tagline ?? base.tagline;
  base.avatarUrl = doc.avatarUrl ?? base.avatarUrl;
  base.backgroundUrl = doc.backgroundUrl ?? base.backgroundUrl;
  base.buttonPrimaryLabel = doc.buttonPrimaryLabel ?? base.buttonPrimaryLabel;
  base.buttonSecondaryLabel = doc.buttonSecondaryLabel ?? base.buttonSecondaryLabel;
  base.links = Array.isArray(doc.links)
    ? doc.links.map((link: any) => ({
        id: link?._id?.toString(),
        type: LINK_TYPES.has(link?.type) ? link.type : "link",
        label: link?.label ?? "",
        iconKey: ICON_SET.has(link?.iconKey) ? link.iconKey : "Share",
        url: link?.url ?? "",
        images: sanitizeImages(link?.images),
      }))
    : [];
  base.vcf = sanitizeVcf(doc.vcf);
  return base;
}

export async function getProfileBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  await connectDB();
  const doc = await ProfileModel.findOne({ slug: normalized }).lean();
  return serializeProfile(doc);
}

export async function getProfileByUserId(userId: Types.ObjectId) {
  await connectDB();
  const doc = await ProfileModel.findOne({ userId }).lean();
  return serializeProfile(doc);
}

export async function isSlugTaken(slug: string, excludeUserId?: Types.ObjectId) {
  if (!slug) return false;
  await connectDB();
  const query: Record<string, any> = { slug };
  if (excludeUserId) query.userId = { $ne: excludeUserId };
  const existing = await ProfileModel.exists(query);
  return Boolean(existing);
}

export async function upsertProfile(userId: Types.ObjectId, payload: ProfilePayload) {
  await connectDB();
  return ProfileModel.findOneAndUpdate(
    { userId },
    { ...payload, userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
