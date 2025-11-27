import { profileComponentDefaults } from "./profileDefaults"

export type PuckTemplateTree = {
  root: {
    props: Record<string, unknown>
    children?: any[]
  }
  content?: any[]
  meta?: Record<string, unknown>
}

export const PROFILE_TEMPLATE_VERSION = 2

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
    children: [
      {
        type: "ProfileDefaultPage",
        props: {
          backgroundUrl: "",
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
              slug: "",
            },
          },
          {
            type: "ProfileAvatarPuck",
            props: {
              slug: "",
              displayName: "",
              avatarUrl: "",
            },
          },
          {
            type: "ProfileInfoPuck",
            props: {
              displayName: "",
              tagline: "",
            },
          },
          {
            type: "ProfileButtonsPuck",
            props: {
              buttonPrimaryLabel: "Connect",
              buttonSecondaryLabel: "Links",
            },
          },
          {
            type: "ProfileLinksPuck",
            props: {
              links: [],
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
