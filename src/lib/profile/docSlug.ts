const LEGACY_PROFILE_DOC_SLUG = "profile";
const PROFILE_HOME_SEGMENT = "home";

const normalizeSlug = (slug?: string | null): string => {
  const value = (slug || "").trim();
  return value || "default-app";
};

export const getProfileDocSlug = (appSlug?: string | null): string => {
  const normalized = normalizeSlug(appSlug);
  return `${normalized}/${PROFILE_HOME_SEGMENT}`;
};

export const getLegacyProfileDocSlugs = (appSlug?: string | null): string[] => {
  const normalized = normalizeSlug(appSlug);
  const desired = `${normalized}/${PROFILE_HOME_SEGMENT}`;
  const candidates = new Set<string>([
    desired,
    normalized,
    LEGACY_PROFILE_DOC_SLUG,
  ]);
  return Array.from(candidates);
};

export { LEGACY_PROFILE_DOC_SLUG, PROFILE_HOME_SEGMENT };
