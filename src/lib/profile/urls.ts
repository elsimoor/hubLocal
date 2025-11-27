const FALLBACK_BASE_URL = "http://localhost:3000"

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export const getSiteBaseUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (explicit) {
    return trimTrailingSlash(explicit)
  }
  if (process.env.VERCEL_URL) {
    return trimTrailingSlash(`https://${process.env.VERCEL_URL}`)
  }
  return FALLBACK_BASE_URL
}

export const buildProfileUrl = (username: string): string => {
  const base = getSiteBaseUrl()
  const cleanUsername = (username || "").replace(/^@+/, "").trim()
  return cleanUsername ? `${base}/profile/@${cleanUsername}` : `${base}/profile`
}
