import { profileComponentDefaults } from "./profileDefaults"

export type PuckTemplateTree = {
  root: {
    props: Record<string, unknown>
    children?: any[]
    content?: any[]
  }
  content?: any[]
  meta?: Record<string, unknown>
}

export const ensureDocHasRootContent = (doc: any): boolean => {
  if (!doc || typeof doc !== "object") return false
  let changed = false
  if (!doc.root || typeof doc.root !== "object") {
    doc.root = { props: {}, content: [] }
    changed = true
  }
  const root = doc.root
  if (!root.props || typeof root.props !== "object") {
    root.props = {}
    changed = true
  }
  if (!Array.isArray(root.content)) {
    if (Array.isArray(root.children)) root.content = root.children
    else if (Array.isArray(doc.content)) root.content = doc.content
    else if (Array.isArray(doc.children)) root.content = doc.children
    else root.content = []
    changed = true
  }
  if (root.children !== root.content) {
    root.children = root.content
    changed = true
  }
  return changed
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

const PROFILE_PAGE_WRAPPER_TYPES = new Set(["ProfileDefaultPage", "ProfileTemplatePage"])

const createProfileNodeNormalizer = (meta?: { context?: string }) => {
  const visited = new WeakSet<any>()
  const normalize = (node: any): boolean => {
    if (!node || typeof node !== "object" || visited.has(node)) return false
    visited.add(node)
    let changed = false
    const type = String(node.type || "")
    if (PROFILE_PAGE_WRAPPER_TYPES.has(type)) {
      const propsChildren = Array.isArray(node?.props?.children) ? node.props.children : null
      const directChildren = Array.isArray(node.children) ? node.children : null
      const canonical = Array.isArray(propsChildren) && propsChildren.length
        ? propsChildren
        : Array.isArray(directChildren) && directChildren.length
          ? directChildren
          : null
      if (canonical) {
        if (!node.props || typeof node.props !== "object") {
          node.props = {}
          changed = true
        }
        if (node.props.children !== canonical) {
          node.props.children = canonical
          changed = true
          try {
            console.log("[ProfileTemplateNormalize] Ensured props.children", {
              context: meta?.context,
              type,
              childCount: canonical.length,
            })
          } catch {}
        }
        if (node.children !== canonical) {
          node.children = canonical
          changed = true
        }
      }
    }
    const childArrays = [
      Array.isArray(node.children) ? node.children : null,
      Array.isArray(node.props?.children) ? node.props.children : null,
      Array.isArray(node.content) ? node.content : null,
    ]
    childArrays.forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((child) => {
          if (normalize(child)) changed = true
        })
      }
    })
    return changed
  }
  return normalize
}

const normalizeProfileTemplateNodes = (nodes?: any[], meta?: { context?: string }): boolean => {
  if (!Array.isArray(nodes) || nodes.length === 0) return false
  const normalize = createProfileNodeNormalizer(meta)
  let changed = false
  nodes.forEach((node) => {
    if (normalize(node)) changed = true
  })
  return changed
}

const profileTemplateContent = [
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
]

normalizeProfileTemplateNodes(profileTemplateContent, { context: "template" })

const cloneProfileTemplateContent = () => {
  const copy = JSON.parse(JSON.stringify(profileTemplateContent))
  normalizeProfileTemplateNodes(copy, { context: "clone" })
  return copy
}

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
    content: profileTemplateContent,
    children: profileTemplateContent,
  },
  content: [],
}

export const cloneProfileTemplateData = (): PuckTemplateTree => {
  const tree = JSON.parse(JSON.stringify(profileTemplateData))
  ensureDocHasRootContent(tree)
  return tree
}

export const ensureProfileTemplateContent = (doc: any, meta?: { context?: string }): boolean => {
  if (!doc || typeof doc !== "object") return false
  const context = meta?.context || "unknown"
  let changed = ensureDocHasRootContent(doc)
  const root = doc.root || {}
  let content = Array.isArray(root.content) ? root.content : []
  if (Array.isArray(content) && content.length === 0) {
    try {
      console.log("[ProfileTemplateEnsure] Empty content detected", {
        context,
        hasRoot: !!doc.root,
        hasProps: !!root.props,
      })
    } catch {}
    const templateContent = cloneProfileTemplateContent()
    root.content = templateContent
    root.children = templateContent
    doc.root = root
    content = templateContent
    changed = true
    try {
      console.log("[ProfileTemplateEnsure] Template content injected", {
        context,
        injectedChildren: templateContent.length,
      })
    } catch {}
  } else {
    try {
      console.log("[ProfileTemplateEnsure] Content already present", {
        context,
        childCount: Array.isArray(content) ? content.length : 0,
      })
    } catch {}
  }
  if (normalizeProfileTemplateNodes(content, { context })) {
    changed = true
  }
  return changed
}
