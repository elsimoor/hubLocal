import { profileComponentDefaults } from "./profileDefaults"

export type PuckTemplateTree = {
  root: {
    props: Record<string, unknown>
    // Newer Puck shape uses `content` as the canonical child array; keep
    // `children` for backwards-compatibility with older code paths.
    content?: any[]
    children?: any[]
  }
  content?: any[]
  meta?: Record<string, unknown>
}

export const PROFILE_TEMPLATE_VERSION = 2

const buildProfileTemplateLinks = () => {
  const fullName = `${profileComponentDefaults.vcfFirstName || ""} ${profileComponentDefaults.vcfLastName || ""}`.trim()
  const defaultFullName = fullName || profileComponentDefaults.displayName || profileComponentDefaults.slug
  if (!Array.isArray(profileComponentDefaults.links)) return []
  return profileComponentDefaults.links.map((link) => {
    if (link.type === "vcf") {
      return {
        ...link,
        vcfName: defaultFullName,
        vcfEmail: profileComponentDefaults.vcfWorkEmail || profileComponentDefaults.vcfHomeEmail || "",
        vcfPhone: profileComponentDefaults.vcfCellPhone || profileComponentDefaults.vcfWorkPhone || "",
        vcfOrganization: profileComponentDefaults.vcfOrg || "",
        vcfTitle: profileComponentDefaults.vcfTitle || "",
        vcfUrl: profileComponentDefaults.vcfUrl || "",
        vcfNote: profileComponentDefaults.vcfNote || "",
      }
    }
    return link
  })
}

export const profileTemplateLinks = buildProfileTemplateLinks()

export const profileTemplateData: PuckTemplateTree = {
  meta: {
    templateName: "ProfileTemplate",
    version: PROFILE_TEMPLATE_VERSION,
  },
  root: {
    props: {
      title: "Profile",
      description: "Default profile template for new HubLocal accounts",
      viewport: "fluid",
      theme: "light",
      backgroundPattern: "none",
    },
      // Use `content` as the canonical array – the editor code expects
      // `data.root.content`. Keep `content: []` at the top-level for
      // backwards compatibility.
      content: [
        {
          type: "ProfileDefaultPage",
          props: {
            backgroundImage: profileComponentDefaults.backgroundUrl,
            themeGradient: profileComponentDefaults.themeGradient,
            themePanelBackground: profileComponentDefaults.themePanelBackground,
            themePanelShadow: profileComponentDefaults.themePanelShadow,
            themeCardSurface: profileComponentDefaults.themeCardSurface,
            themeCardShadow: profileComponentDefaults.themeCardShadow,
            themeAccentPrimary: profileComponentDefaults.themeAccentPrimary,
            themeAccentPrimaryText: profileComponentDefaults.themeAccentPrimaryText,
            themeAccentSecondary: profileComponentDefaults.themeAccentSecondary,
            themeAccentSecondaryText: profileComponentDefaults.themeAccentSecondaryText,
            themeTextPrimary: profileComponentDefaults.themeTextPrimary,
            themeTextSecondary: profileComponentDefaults.themeTextSecondary,
            themeIconColor: profileComponentDefaults.themeIconColor,
          },
          children: [
            {
              type: "ProfileHeaderPuck",
              props: {
                slug: profileComponentDefaults.slug,
              },
            },
            {
              type: "ProfileAvatarPuck",
              props: {
                slug: profileComponentDefaults.slug,
                displayName: profileComponentDefaults.displayName,
                avatarUrl: profileComponentDefaults.avatarUrl,
              },
            },
            {
              type: "ProfileInfoPuck",
              props: {
                displayName: profileComponentDefaults.displayName,
                tagline: profileComponentDefaults.tagline,
              },
            },
            {
              type: "ProfileButtonsPuck",
              props: {
                buttonPrimaryLabel: profileComponentDefaults.buttonPrimaryLabel,
                buttonSecondaryLabel: profileComponentDefaults.buttonSecondaryLabel,
              },
            },
            {
              type: "ProfileLinksPuck",
              props: {
                links: profileTemplateLinks,
              },
            },
          ],
        },
    ],
  },
  content: [],
}

export const cloneProfileTemplateData = (): PuckTemplateTree =>
  JSON.parse(JSON.stringify(profileTemplateData))
