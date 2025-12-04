import { Types } from "mongoose"
import { AppModel } from "@/lib/models/App"
import { getSiteBaseUrl } from "@/lib/profile/urls"

export const normalizePageSlug = (slug?: string | null): string => {
  if (typeof slug !== "string") return "home"
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, "")
  return trimmed || "home"
}

export const buildHubPublishedPath = (hubId: string, pageSlug?: string | null) => {
  const normalizedSlug = normalizePageSlug(pageSlug)
  return `/published/app/${encodeURIComponent(hubId)}/${normalizedSlug}`
}

export const buildHubPublishedUrl = (hubId: string, pageSlug?: string | null) => {
  const base = getSiteBaseUrl()
  return `${base}${buildHubPublishedPath(hubId, pageSlug)}`
}

// Backward compatibility
export const buildAppPublishedPath = buildHubPublishedPath;
export const buildAppPublishedUrl = buildHubPublishedUrl;

export const getDefaultHubWebsite = async (
  hubId: string | undefined | null,
  ownerEmail: string,
  pageSlug?: string | null,
): Promise<string | undefined> => {
  if (!hubId || !ownerEmail) return undefined
  if (!Types.ObjectId.isValid(hubId)) return undefined

  const hub = await AppModel.findOne({ _id: hubId, ownerEmail }).select("_id").lean<any>()
  if (!hub) return undefined

  return buildHubPublishedUrl(String(hub._id), pageSlug)
}

export const getHubPrimaryWebsite = getDefaultHubWebsite

// Backward compatibility
export const getDefaultAppWebsite = getDefaultHubWebsite;
export const getAppPrimaryWebsite = getDefaultHubWebsite;

export const extractPageSlugFromWebsite = (website?: string | null): string | undefined => {
  if (!website) return undefined
  try {
    const base = getSiteBaseUrl()
    const normalized = website.startsWith("http") ? website : `${base}${website}`
    const url = new URL(normalized)
    const match = url.pathname.match(/^\/published\/app\/[^/]+\/([^/?#]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  } catch {}
  return undefined
}
