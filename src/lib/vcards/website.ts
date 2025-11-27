import { Types } from "mongoose"

import { AppModel } from "@/lib/models/App"
import { getSiteBaseUrl } from "@/lib/profile/urls"

export const normalizePageSlug = (slug?: string | null): string => {
  if (typeof slug !== "string") return "home"
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, "")
  return trimmed || "home"
}

export const buildAppPublishedPath = (appId: string, pageSlug?: string | null) => {
  const normalizedSlug = normalizePageSlug(pageSlug)
  return `/published/app/${encodeURIComponent(appId)}/${normalizedSlug}`
}

export const buildAppPublishedUrl = (appId: string, pageSlug?: string | null) => {
  const base = getSiteBaseUrl()
  return `${base}${buildAppPublishedPath(appId, pageSlug)}`
}

export const getDefaultAppWebsite = async (
  appId: string | undefined | null,
  ownerEmail: string,
  pageSlug?: string | null,
): Promise<string | undefined> => {
  if (!appId || !ownerEmail) return undefined
  if (!Types.ObjectId.isValid(appId)) return undefined

  const app = await AppModel.findOne({ _id: appId, ownerEmail }).select("_id").lean<any>()
  if (!app) return undefined

  return buildAppPublishedUrl(String(app._id), pageSlug)
}

export const getAppPrimaryWebsite = getDefaultAppWebsite

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
