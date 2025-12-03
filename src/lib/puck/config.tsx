"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { DropZone, Render } from "@measured/puck"
import type { FieldProps } from "@measured/puck"
// Import ActionStateProvider, useActionState and runActions to enable
// interactive behaviour. useActionState exposes a flags API for
// controlling UI state (e.g. whether a modal is open) and runActions
// executes an array of actions defined in fields such as Button.actions.
import { useActionState, runActions } from "./actions"
import { selectionStore, useSelectedPaths } from "./selectionStore"
import { ProfileHeader, ProfileLinks, ProfileVCard } from "@/components/profile/PuckProfileComponents"
import {
  ProfileAvatarCoin,
  ProfileCardShell,
  ProfileCTAButtons,
  ProfileIdentitySection,
  ProfileLinksSection,
  type ProfileLinksSectionItem,
  ProfileNameBlock,
  ProfileThemeProvider,
  ProfileTopBar,
} from "@/components/profile/ProfileCardElements"
import ProfileClient from "@/app/profile/[slug]/ProfileClient"
import QRCode from "react-qr-code"
import { 
  Contact2, 
  Globe, 
  Image as ImageIcon, 
  Mail, 
  Share, 
  UserCheck2, 
  Youtube,
  Box,
  LayoutGrid,
  Columns3,
  LayoutList,
  Package,
  Layers,
  Type,
  AlignLeft,
  FileText,
  MousePointerClick,
  Play,
  Images,
  Menu,
  PanelLeft,
  SquareDashedBottom,
  Clock,
  Database,
  ChevronDown,
  FolderTree,
  User,
  CreditCard,
  Grid3x3,
  ShoppingCart,
  Palette,
  Maximize,
  Proportions,
  Flame,
  MessageSquare,
  Link2,
  Star,
  Info,
  BarChart3,
  FileCode,
  Smile
} from "lucide-react"
import {
  DEFAULT_PROFILE_VCF,
  // PROFILE_ICON_KEYS,
  // PROFILE_LINK_TYPES,
  ProfilePayload,
  createEmptyProfilePayload,
} from "@/types/profile"
import { profileComponentDefaults } from "@/lib/puck/profileDefaults"
import { cloneProfileTemplateData, profileTemplateData, profileTemplateLinks } from "@/lib/puck/profileTemplate"
import { buildProfilePayloadFromProps } from "@/lib/puck/profilePayload"
import { downloadVCard } from "./profile-vcf-handler"

// Helper function to create labels with icons
const createLabel = (IconComponent: any, text: string) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <IconComponent size={16} />
      <span>{text}</span>
    </div>
  )
}

// Helper functions for selection highlighting.
const outlineForSelected: any = { outline: "2px solid #6366f1", outlineOffset: 2 }





const PROFILE_ICON_KEYS = ["Contact2", "Globe", "Image", "Mail", "Share", "UserCheck2", "Youtube"] as const
const PROFILE_ICON_OPTIONS = PROFILE_ICON_KEYS.map((key) => ({ label: key, value: key }))

const ICON_COMPONENTS = {
  Contact2,
  Globe,
  Image: ImageIcon,
  Mail,
  Share,
  UserCheck2,
  Youtube,
} as const

const PROFILE_LINK_TYPES = ["link", "album", "vcf"] as const
const PROFILE_LINK_TYPE_OPTIONS = PROFILE_LINK_TYPES.map((value) => ({ label: value, value }))

const parseAlbumImages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((img) => (typeof img === "string" ? img.trim() : "")).filter(Boolean)
  }
  if (typeof value !== "string") return []
  return value
    .split(/\r?\n|,/)
    .map((img) => img.trim())
    .filter(Boolean)
}

const buildPuckProfileLinks = (links: any[]): ProfileLinksSectionItem[] => {
  if (!Array.isArray(links)) return []
  return links.map((link, index) => {
    const Icon = ICON_COMPONENTS[link?.iconKey as keyof typeof ICON_COMPONENTS] || Share
    const label = typeof link?.label === "string" && link.label.trim() ? link.label : "Untitled"
    const type = link?.type === "album" || link?.type === "vcf" ? link.type : "link"

    if (type === "album") {
      return {
        id: link?.id || index,
        label,
        type,
        icon: Icon,
        images: parseAlbumImages(link?.images),
      }
    }

    if (type === "vcf") {
      const handleDownloadVCard = () => {
        const vcardData: any = {
          fullName: link?.vcfName || "Contact",
          email: link?.vcfEmail || undefined,
          phone: link?.vcfPhone || undefined,
          organization: link?.vcfOrganization || undefined,
          title: link?.vcfTitle || undefined,
          url: link?.vcfUrl || undefined,
          note: link?.vcfNote || undefined,
        }
        downloadVCard(vcardData, `${vcardData.fullName}.vcf`)
      }

      return {
        id: link?.id || index,
        label,
        type,
        icon: Icon,
        onClick: handleDownloadVCard,
      }
    }

    return {
      id: link?.id || index,
      label,
      type,
      icon: Icon,
      url: link?.url || "#",
    }
  })
}

const DEFAULT_THEME = {
  panelBackground:
    "linear-gradient(180deg, rgba(230, 240, 255, 0.4) 0%, rgba(220, 230, 250, 0.3) 50%, rgba(240, 240, 245, 0.5) 100%)",
  panelShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
  cardGradient: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(200,220,255,0.25) 100%)",
  cardSurface: "rgba(255, 255, 255, 0.92)",
  cardShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  iconColor: "#4b5563",
  accentPrimary: "#ffffff",
  accentPrimaryText: "#1f2937",
  accentSecondary: "#4a90e2",
  accentSecondaryText: "#ffffff",
}

const HEX_3 = /^#([0-9a-f]{3})$/i
const HEX_4 = /^#([0-9a-f]{4})$/i
const HEX_6 = /^#([0-9a-f]{6})$/i
const HEX_8 = /^#([0-9a-f]{8})$/i

const normalizeHexColor = (value?: string): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (HEX_6.test(trimmed)) return trimmed

  const shortMatch = trimmed.match(HEX_3)
  if (shortMatch?.[1]) {
    const [r, g, b] = shortMatch[1].split("")
    return `#${r}${r}${g}${g}${b}${b}`
  }

  if (HEX_8.test(trimmed)) {
    return `#${trimmed.slice(1, 7)}`
  }

  const alphaMatch = trimmed.match(HEX_4)
  if (alphaMatch?.[1]) {
    const [r, g, b] = alphaMatch[1].slice(0, 3).split("")
    return `#${r}${r}${g}${g}${b}${b}`
  }

  return null
}

const COLOR_INPUT_FALLBACK = "#000000"
const resolveColorInputValue = (value: string, fallback: string): string => {
  return normalizeHexColor(value) ?? normalizeHexColor(fallback) ?? COLOR_INPUT_FALLBACK
}

const DEFAULT_COLOR_FIELD_HELPER =
  "Use the picker or enter any CSS color. Non-hex values still apply even if the swatch keeps the last valid hex."

type ColorPickerFieldOptions = {
  label: string
  defaultValue: string
  helperText?: string
}

type ColorPickerFieldProps = FieldProps<string> & {
  defaultValue: string
  helperText?: string
}

const ColorPickerFieldControl: React.FC<ColorPickerFieldProps> = ({
  value,
  onChange,
  readOnly,
  defaultValue,
  helperText,
  id,
}) => {
  const resolvedValue = typeof value === "string" ? value : ""
  const fallbackHex = normalizeHexColor(defaultValue) ?? COLOR_INPUT_FALLBACK
  const colorInputValue = resolveColorInputValue(resolvedValue, fallbackHex)
  const textInputId = id ? `${id}-text` : undefined

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="color"
          value={colorInputValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
          style={{
            width: 48,
            height: 32,
            border: "none",
            padding: 0,
            background: "transparent",
            cursor: readOnly ? "not-allowed" : "pointer",
          }}
        />
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: colorInputValue,
          }}
        />
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{colorInputValue.toUpperCase()}</span>
      </div>
      <input
        type="text"
        id={textInputId}
        value={resolvedValue}
        placeholder="#000000 or CSS color"
        onChange={(event) => onChange(event.target.value)}
        disabled={readOnly}
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: readOnly ? "#f3f4f6" : "#ffffff",
        }}
      />
      {helperText ? <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{helperText}</p> : null}
    </div>
  )
}

const createColorPickerField = ({ label, defaultValue, helperText }: ColorPickerFieldOptions) => ({
  type: "custom" as const,
  label,
  defaultValue,
  render: (props: FieldProps<string>) => (
    <ColorPickerFieldControl
      {...props}
      defaultValue={defaultValue}
      helperText={helperText ?? DEFAULT_COLOR_FIELD_HELPER}
    />
  ),
})

const defaultProfileBackgroundImage = profileComponentDefaults.backgroundUrl || ""

const PROFILE_CHILD_COMPONENT_TYPES = [
  "ProfileHeaderPuck",
  "ProfileAvatarPuck",
  "ProfileInfoPuck",
  "ProfileButtonsPuck",
  "ProfileLinksPuck",
  "ProfileHeader",
  "ProfileLinks",
  "ProfileVCard",
] as const

const profilePageFields = {
  backgroundImage: {
    type: "text",
    label: "Background image URL",
    defaultValue: defaultProfileBackgroundImage,
  },
  themeGradient: { type: "text", label: "Card gradient (advanced CSS)", defaultValue: DEFAULT_THEME.cardGradient },
  themeGradientFrom: createColorPickerField({ label: "Card gradient - from (hex)", defaultValue: "#ffffff" }),
  themeGradientTo: createColorPickerField({ label: "Card gradient - to (hex)", defaultValue: "#c8dcff" }),
  themePanelBackground: {
    type: "text",
    label: "Panel background (advanced CSS)",
    defaultValue: DEFAULT_THEME.panelBackground,
  },
  themePanelBackgroundColor: createColorPickerField({
    label: "Panel background color (hex)",
    defaultValue: "#f6f9ff",
  }),
  themePanelShadow: { type: "text", label: "Panel shadow", defaultValue: DEFAULT_THEME.panelShadow },
  themeCardSurface: { type: "text", label: "Card surface (advanced CSS)", defaultValue: DEFAULT_THEME.cardSurface },
  themeCardSurfaceColor: createColorPickerField({
    label: "Card surface color (hex)",
    defaultValue: "#ffffff",
  }),
  themeCardShadow: { type: "text", label: "Card shadow", defaultValue: DEFAULT_THEME.cardShadow },
  themeAccentPrimary: createColorPickerField({
    label: "Primary accent color (hex)",
    defaultValue: DEFAULT_THEME.accentPrimary,
  }),
  themeAccentPrimaryText: createColorPickerField({
    label: "Primary accent text (hex)",
    defaultValue: DEFAULT_THEME.accentPrimaryText,
  }),
  themeAccentSecondary: createColorPickerField({
    label: "Secondary accent color (hex)",
    defaultValue: DEFAULT_THEME.accentSecondary,
  }),
  themeAccentSecondaryText: createColorPickerField({
    label: "Secondary accent text (hex)",
    defaultValue: DEFAULT_THEME.accentSecondaryText,
  }),
  themeTextPrimary: createColorPickerField({
    label: "Primary text color (hex)",
    defaultValue: DEFAULT_THEME.textPrimary,
  }),
  themeTextSecondary: createColorPickerField({
    label: "Secondary text color (hex)",
    defaultValue: DEFAULT_THEME.textSecondary,
  }),
  themeIconColor: createColorPickerField({
    label: "Icon color (hex)",
    defaultValue: DEFAULT_THEME.iconColor,
  }),
  children: {
    type: "slot",
    label: "Profile components",
    allow: Array.from(PROFILE_CHILD_COMPONENT_TYPES),
  },
} as const

const profilePageDefaultProps = {
  backgroundImage: defaultProfileBackgroundImage,
  themeGradient: DEFAULT_THEME.cardGradient,
  themeGradientFrom: "#ffffff",
  themeGradientTo: "#c8dcff",
  themePanelBackground: DEFAULT_THEME.panelBackground,
  themePanelBackgroundColor: "#f6f9ff",
  themePanelShadow: DEFAULT_THEME.panelShadow,
  themeCardSurface: DEFAULT_THEME.cardSurface,
  themeCardSurfaceColor: "#ffffff",
  themeCardShadow: DEFAULT_THEME.cardShadow,
  themeAccentPrimary: DEFAULT_THEME.accentPrimary,
  themeAccentPrimaryText: DEFAULT_THEME.accentPrimaryText,
  themeAccentSecondary: DEFAULT_THEME.accentSecondary,
  themeAccentSecondaryText: DEFAULT_THEME.accentSecondaryText,
  themeTextPrimary: DEFAULT_THEME.textPrimary,
  themeTextSecondary: DEFAULT_THEME.textSecondary,
  themeIconColor: DEFAULT_THEME.iconColor,
  children: [],
}

const buildProfileThemeFromProps = (props: any) => {
  const cardGradient =
    props.themeGradientFrom && props.themeGradientTo
      ? `linear-gradient(135deg, ${props.themeGradientFrom} 0%, ${props.themeGradientTo} 100%)`
      : props.themeGradient

  const panelBackground = props.themePanelBackgroundColor || props.themePanelBackground
  const cardSurface = props.themeCardSurfaceColor || props.themeCardSurface

  return {
    cardGradient,
    panelBackground,
    panelShadow: props.themePanelShadow,
    cardSurface,
    cardShadow: props.themeCardShadow,
    accentPrimary: props.themeAccentPrimary,
    accentPrimaryText: props.themeAccentPrimaryText,
    accentSecondary: props.themeAccentSecondary,
    accentSecondaryText: props.themeAccentSecondaryText,
    textPrimary: props.themeTextPrimary,
    textSecondary: props.themeTextSecondary,
    iconColor: props.themeIconColor,
  }
}

const cloneNodeArray = (nodes?: any[]): any[] => {
  if (!Array.isArray(nodes)) return []
  return nodes.map((node) => {
    const clonedChildren = cloneNodeArray(node?.children)
    return {
      ...node,
      props: node?.props ? { ...node.props } : {},
      children: clonedChildren.length ? clonedChildren : undefined,
    }
  })
}

const cloneProfileTemplateChildren = () => {
  const tree = cloneProfileTemplateData()
  console.log("tree",tree)
  const firstChild = Array.isArray(tree?.root?.children) ? tree.root.children[0] : null
  if (firstChild?.type === "ProfileDefaultPage" && Array.isArray(firstChild.children)) {
    console.log("firstChild",firstChild)
    let clone =  cloneNodeArray(firstChild.children)
    console.log("clone",clone)
    return clone
  }
  return []
}

const cloneTemplateLinks = () =>
  profileTemplateLinks.map((link) => ({
    ...link,
  }))

const renderProfilePageComponent = ({ puck, children, backgroundImage, ...props }: any) => {
  const theme = buildProfileThemeFromProps(props)
  const path = getPathFromPuck(puck)
  const isSelected = selectionStore.has(path)
  const isEditing = isEditingFromPuck(puck)

  const onMouseDown = (e: any) => {
    e.stopPropagation()
    if (!isEditing) return
    if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
    else selectionStore.toggle(path, false)
  }

  const wrapperStyle = isSelected ? { ...outlineForSelected, width: "100%" } : { width: "100%" }
  let content: any[] = Array.isArray(children) && children.length ? children : []

  // If content is empty, try falling back to the profile template children
  // (this covers editor insertion where resolveData may not be executed).
  try {
    console.log('[PuckDebug] renderProfilePageComponent initial content length:', Array.isArray(content) ? content.length : 0)
    if ((!Array.isArray(content) || content.length === 0) && typeof cloneProfileTemplateChildren === 'function') {
      const fallback = cloneProfileTemplateChildren()
      console.log('[PuckDebug] cloneProfileTemplateChildren returned length:', Array.isArray(fallback) ? fallback.length : 'not-array')
      if (Array.isArray(fallback) && fallback.length) {
        content = fallback
        console.log('[PuckDebug] applied fallback children, new content length:', content.length)
      }
    }
    if (Array.isArray(content) && content.length > 0) console.log('[PuckDebug] renderProfilePageComponent sample node:', content[0])
    console.log('[PuckDebug] puck present?:', !!puck, 'has renderDropZone?:', typeof puck?.renderDropZone === 'function')
  } catch (e) {
    try {
      console.error('[PuckDebug] failed logging content debug', e)
    } catch {}
  }

  // Use the canonical slot render pattern: when the slot field is present the
  // editor provides a render function (a React component) to `children`.
  // If we have that, call it. If we only have a node array (fallback), wrap
  // it in a small component that uses <Render /> so the slot API still receives
  // a component.
  let renderedContent: any = null
  try {
    const isSlotRenderFunction = typeof children === "function"
    console.log('[PuckDebug] isSlotRenderFunction:', isSlotRenderFunction)

    if (isSlotRenderFunction) {
      const SlotComponent = children as any
      // Pass allow to restrict what can be dropped into this slot in the editor
      renderedContent = <SlotComponent allow={Array.from(PROFILE_CHILD_COMPONENT_TYPES)} />
      console.log('[PuckDebug] rendered slot via SlotComponent')
    } else if (Array.isArray(content) && content.length > 0) {
      // Fallback slot component that renders the node array via <Render />
      const FallbackSlot: React.FC = () => (
        <Render config={(config as any)} data={{ root: { props: {}, children: content } }} />
      )
      renderedContent = <FallbackSlot />
      console.log('[PuckDebug] rendered fallback slot via <Render />')
    } else {
      // Empty state - render nothing but keep markup for editor drop behaviour
      renderedContent = null
      console.log('[PuckDebug] no content to render for profile page')
    }
  } catch (e) {
    console.error('[PuckDebug] error while building renderedContent', e)
    renderedContent = null
  }

  return (
    <div ref={puck?.dragRef} data-puck-path={path || undefined} style={wrapperStyle} onMouseDown={onMouseDown}>
      <ProfileThemeProvider value={theme}>
        <div className="min-h-screen relative bg-[#bfbfbf] flex items-center justify-center md:p-8">
          <ProfileCardShell gradient={theme.cardGradient} backgroundImage={backgroundImage}>
            {renderedContent}
          </ProfileCardShell>
        </div>
      </ProfileThemeProvider>
    </div>
  )
}

function ProfileAvatarPuckComponent({ slug, displayName, avatarUrl }: any) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  const handleQRChange = useCallback((url: string) => {
    setQrCodeUrl(url)
  }, [])

  const pageUrl = useMemo(() => {
    const cleanSlug = slug?.replace(/^\/+|\/+$/g, "")
    return cleanSlug
      ? `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/profile/@${cleanSlug}`
      : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000"
  }, [slug])

  const display = displayName || slug || "Profile"
  const headerInitial = display.charAt(0).toUpperCase()

  return (
    <ProfileIdentitySection>
      <ProfileAvatarCoin
        avatarUrl={avatarUrl}
        fallbackInitial={headerInitial}
        pageUrl={pageUrl}
        size={186}
        onQRCodeUrlChange={handleQRChange}
      />
    </ProfileIdentitySection>
  )
}


const getPathFromPuck = (puck: any): string | null => {
  try {
    const p = (puck as any) || {}
    if (Array.isArray(p.path)) return p.path.join(".")
    if (typeof p.path === "string") return p.path as string
    if (typeof p.node?.path === "string") return p.node.path as string
    if (typeof p.key === "string") return p.key as string
    if (typeof p.id === "string") return p.id as string
  } catch { }
  return null
}
const isEditingFromPuck = (puck: any): boolean => {
  try {
    return !!(puck as any)?.isEditing
  } catch {
    return false
  }
}

// const PROFILE_ICON_OPTIONS = PROFILE_ICON_KEYS.map((key) => ({ label: key, value: key }))
// const PROFILE_LINK_TYPE_OPTIONS = PROFILE_LINK_TYPES.map((value) => ({ label: value, value }))

// const ICON_COMPONENTS = {
//   Contact2,
//   Globe,
//   Image: ImageIcon,
//   Mail,
//   Share,
//   UserCheck2,
//   Youtube,
// } as const;

// const parseAlbumImages = (value: unknown): string[] => {
//   if (Array.isArray(value)) {
//     return value
//       .map((img) => (typeof img === "string" ? img.trim() : ""))
//       .filter(Boolean);
//   }
//   if (typeof value !== "string") return [];
//   return value
//     .split(/\r?\n|,/)
//     .map((img) => img.trim())
//     .filter(Boolean);
// };

// const buildPuckProfileLinks = (links: any[]): ProfileLinksSectionItem[] => {
//   if (!Array.isArray(links)) return [];
//   return links.map((link, index) => {
//     const Icon = ICON_COMPONENTS[link?.iconKey as keyof typeof ICON_COMPONENTS] || Share;
//     const label = typeof link?.label === "string" && link.label.trim() ? link.label : "Sans titre";
//     const type = link?.type === "album" || link?.type === "vcf" ? link.type : "link";
//     if (type === "album") {
//       return {
//         id: link?.id || index,
//         label,
//         type,
//         icon: Icon,
//         images: parseAlbumImages(link?.images),
//       };
//     }
//     if (type === "vcf") {
//       return {
//         id: link?.id || index,
//         label,
//         type,
//         icon: Icon,
//         onClick: () => alert("Configure the vCard data to enable downloads."),
//       };
//     }
//     return {
//       id: link?.id || index,
//       label,
//       type: "link",
//       icon: Icon,
//       url: typeof link?.url === "string" && link.url.trim() ? link.url : "#",
//     };
//   });
// };
/**
 * Hook that returns the width of an element. Some components (like gallery)
 * adjust layout based on the container width.
 */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState<number>(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      setWidth(el.getBoundingClientRect().width || 0)
    } catch { }
    let ro: ResizeObserver | null = null
    try {
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = entry.contentRect?.width ?? (entry.target as HTMLElement).clientWidth
            if (typeof w === "number") setWidth(w)
          }
        })
        ro.observe(el)
      } else {
        const handler = () => setWidth(el.getBoundingClientRect().width || 0)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
      }
    } catch { }
    return () => {
      try {
        ro?.disconnect()
      } catch { }
    }
  }, [])
  return { ref, width } as const
}

/**
 * Helper component to animate typing text character by character.
 * Accepts text, speed in milliseconds, loop boolean, loopDelay in ms,
 * cursor boolean to show a caret, optional colour and font size. It uses
 * useState and useEffect to progressively reveal the text, resetting
 * when looping is enabledã€579873606476094â€ L667-L786ã€‘.
 */
function TypingTextComponent({
  text,
  speed = 100,
  loop = false,
  loopDelay = 2000,
  cursor = true,
  color,
  fontSize,
}: {
  text: string
  speed?: number
  loop?: boolean
  loopDelay?: number
  cursor?: boolean
  color?: string
  fontSize?: number
}) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!text) return
    let timeout: any
    if (index < text.length) {
      timeout = setTimeout(() => setIndex((i) => i + 1), speed)
    } else if (loop) {
      timeout = setTimeout(() => setIndex(0), loopDelay)
    }
    return () => clearTimeout(timeout)
  }, [index, text, speed, loop, loopDelay])
  const display = text.slice(0, index)
  return (
    <span
      style={{
        color: color || undefined,
        fontSize: fontSize ? `${fontSize}px` : undefined,
        whiteSpace: "pre",
      }}
    >
      {display}
      {cursor ? <span style={{ borderRight: "2px solid", paddingLeft: "2px" }} /> : null}
    </span>
  )
}

// Added 'defaultExpanded' for better UX - commonly used categories expand by default
// Added descriptive titles to improve editor usability
export const config = {
  categories: {
    layout: {
      title: "Layout & Containers",
      components: [
        "Container",
        "FlexContainer",
        "Grid",
        "GridContainer",
        "Columns",
        "Section",
        "Stack",
        "ResponsiveFlex",
        "ResponsiveGrid",
        "Spacer",
        "Space",
      ],
      defaultExpanded: true, // Most frequently used
    },
    layout_items: {
      title: "Layout Items",
      components: ["FlexItem", "GridItem", "LayoutItem", "Hero", "Footer", "AutoColumns"],
      defaultExpanded: false,
    },
    typography: {
      title: "Typography & Text",
      components: ["Heading", "Text", "RichText"],
      defaultExpanded: true,
    },
    actions: {
      title: "Interactive Elements",
      components: ["Button"],
      defaultExpanded: true,
    },
    media: {
      title: "Media & Images",
      components: ["Image", "Video", "Gallery"],
      defaultExpanded: false,
    },
    navigation: {
      title: "Navigation",
      components: ["Navbar", "Sidebar"],
      defaultExpanded: true,
    },
    overlays: {
      title: "Modals & Overlays",
      components: ["Modal"],
      defaultExpanded: false,
    },
    widgets: {
      title: "Visual Widgets",
      components: [
        "Card",
        "ColorBox",
        "ColorPickerBox",
        "QrCode",
        "SpotifyCard",
        "ExternalPost",
        "Shop",
        // Added Stats from the imported configuration. This component displays
        // numerical data with labels in a responsive grid.
        "Stats",
      ],
      // Expand widgets by default so newly added components such as Stats are visible
      defaultExpanded: true,
    },
    animations: {
      title: "Animations & Effects",
      components: ["TypingText"],
      defaultExpanded: false,
    },
    data: {
      title: "Data & Remote Content",
      components: ["RemoteData", "DataSelector"],
      defaultExpanded: false,
    },
    structure: {
      title: "Structure & Organization",
      components: ["Accordion", "Tabs", "Group"],
      defaultExpanded: false,
    },
    custom: {
      title: "Custom Components",
      components: [
        "Testimonials",
        "LinksList",
        "Logos",
        "SelectedInfo",
        // Template acts as a generic wrapper for nested content and is added
        // from the imported configuration.
        "Template",
      ],
      // Expand custom components by default so Template is visible
      defaultExpanded: true,
    },
    profile: {
      title: "Profile Elements",
      components: [
        "ProfileDefaultPage",
        "ProfileTemplatePage",
        "ProfileHeaderPuck",
        "ProfileAvatarPuck",
        "ProfileInfoPuck",
        "ProfileButtonsPuck",
        "ProfileLinksPuck",
        "ProfileHeader",
        "ProfileLinks",
        "ProfileVCard",
      ],
      defaultExpanded: true,
    },
  },
  // Root defines the page level fields and wrapper.
  root: {
    fields: {
      title: {
        type: "text",
        label: "Page Title",
        defaultValue: "Untitled Page",
      },
      description: {
        type: "textarea",
        label: "Meta Description (SEO)",
        defaultValue: "Page description for search engines",
      },
      scriptBeforeBody: {
        type: "textarea",
        label: "Script tags before body",
        defaultValue: "",
      },
      scriptAfterBody: {
        type: "textarea",
        label: "Script tags after body",
        defaultValue: "",
      },
      viewport: {
        type: "select",
        label: "Viewport Mode",
        options: [
          { label: "Fluid", value: "fluid" },
          { label: "Fixed (1280px)", value: "fixed" },
        ],
        defaultValue: "fluid",
      },
      theme: {
        type: "select",
        label: "Color Theme",
        options: [
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "light",
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "None", value: "none" },
          {
            label: "Overlapping Cubes",
            value:
              "repeating-conic-gradient(from 30deg at 50% calc(1/3 * 1em),#1a1a1a 0deg 60deg,#ffffff 60deg 120deg)",
          },
          {
            label: "Geometric Flowers",
            value:
              "radial-gradient(circle at 20% 80%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em),radial-gradient(circle at 80% 20%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em),radial-gradient(circle at 50% 50%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em)",
          },
          {
            label: "Wavy Lines",
            value:
              "repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, transparent 1px, transparent calc(1em + 1px))",
          },
          {
            label: "Checkerboard",
            value:
              "linear-gradient(45deg, #e5e7eb 25%, transparent 25%),linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),linear-gradient(45deg, transparent 75%, #e5e7eb 75%),linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
          },
          { label: "Dots Grid", value: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)" },
          {
            label: "Diagonal Stripes",
            value: "repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 2px, transparent 2px, transparent 20px)",
          },
          // { label: 'Overlapping Cubes', value: 'repeating-conic-gradient(from 30deg at 50% calc(1/3 * 1em),#1a1a1a 0deg 60deg,#ffffff 60deg 120deg)' },
          // { label: 'Geometric Flowers', value: 'radial-gradient(circle at 20% 80%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em),radial-gradient(circle at 80% 20%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em),radial-gradient(circle at 50% 50%, #1a1a1a 0%, #1a1a1a 1em, transparent 1em)' },
          // { label: 'Wavy Lines', value: 'repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, transparent 1px, transparent calc(1em + 1px))' },
          // { label: 'Checkerboard', value: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%),linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),linear-gradient(45deg, transparent 75%, #e5e7eb 75%),linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)' },
          // { label: 'Dots Grid', value: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)' },
          // { label: 'Diagonal Stripes', value: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 2px, transparent 2px, transparent 20px)' },
          { label: 'Polka Dots', value: 'radial-gradient(circle, #1a1a1a 20%, transparent 20%)' },
          { label: 'Pattern 1', value: 'conic-gradient(from 0deg at calc(500%/6) calc(100%/3),#999999 0 120deg,#0000 0), conic-gradient(from -120deg at calc(100%/6) calc(100%/3),#cdcbcc 0 120deg,#0000 0), conic-gradient(from 120deg at calc(100%/3) calc(500%/6),#f2f2f2 0 120deg,#0000 0), conic-gradient(from 120deg at calc(200%/3) calc(500%/6),#f2f2f2 0 120deg,#0000 0), conic-gradient(from -180deg at calc(100%/3) 50%,#cdcbcc 60deg,#f2f2f2 0 120deg,#0000 0)' },
          { label: 'Pattern 2', value: 'repeating-conic-gradient(from 30deg,#0000 0 120deg,#3c3c3c 0 180deg) calc(.5*200px) calc(.5*200px*0.577), repeating-conic-gradient(from 30deg,#1d1d1d 0 60deg,#4e4f51 0 120deg,#3c3c3c 0 180deg)' },
          { label: 'Pattern 3', value: 'radial-gradient(#C02942 24%,#0000 25%), radial-gradient(#53777A 30%,#0000 32%) calc(72px/2) calc(72px/2), repeating-conic-gradient(from 30deg,#ECD078 0 30deg,#D95B43 0 90deg)' },
          { label: 'Pattern 4', value: 'radial-gradient(47% 50% at -10% 50%,#0000 37%,#4a99b4 39% 70%,#0000 72%) 0 calc(100px/2), radial-gradient(47% 50% at -10% 50%,#0000 37%,#4a99b4 39% 70%,#0000 72%) calc(100px/2) 0' },
          { label: 'Pattern 5', value: 'radial-gradient(50% 50% at 100% 0,#e7525b 0% 5% ,#78dbf0 6% 15%,#e7525b 16% 25%,#78dbf0 26% 35%,#e7525b 36% 45%, #78dbf0 46% 55%,#e7525b 56% 65%,#78dbf0 66% 75%,#e7525b 76% 85%,#78dbf0 86% 95%, #0000 96%)' },
          { label: 'Pattern 6', value: 'conic-gradient(from 75deg,#b9b9b9 15deg ,#dcdcdc 0 30deg ,#0000 0 180deg, #dcdcdc 0 195deg,#b9b9b9 0 210deg,#0000 0) calc(0.5*105px) calc(0.5*105px/0.577)' },
          { label: 'Pattern 7', value: 'conic-gradient(from 150deg at 50% 33%,#0000,#FA6900 .5deg 60deg,#0000 60.5deg) calc(120px/2) calc(120px/1.4), conic-gradient(from -30deg at 50% 66%,#0000,#D95B43 .5deg 60deg,#ECD078 60.5deg)' },
          { label: 'Pattern 8', value: 'linear-gradient(-26.56deg,#4ECDC4 33%,#556270 33.3% 66.6%,#4ECDC4 67%) 0/100px 100px' },
          { label: 'Pattern 9', value: 'radial-gradient(farthest-side at -33.33% 50%,#0000 52%,#170409 54% 57%,#0000 59%) 0 calc(140px/2), radial-gradient(farthest-side at 50% 133.33%,#0000 52%,#170409 54% 57%,#0000 59%) calc(140px/2) 0' },
          { label: 'Pattern 10', value: 'repeating-conic-gradient(at 33% 33%,#00A0B0 0 25%,#0000 0 50%), repeating-conic-gradient(at 66% 66%,#00A0B0 0 25%,#0000 0 50%), #EB6841' },
          { label: 'Pattern 11', value: 'radial-gradient(at 80% 80%,#e7525b 25.4%,#0000 26%), radial-gradient(at 20% 80%,#e7525b 25.4%,#0000 26%), conic-gradient(from -45deg at 50% 41%,#e7525b 90deg,#78dbf0 0) calc(120px/2) 0' },
          { label: 'Pattern 12', value: 'conic-gradient(from -45deg,#ECEDDC 90deg,#0000 90.5deg), conic-gradient(from 135deg,#ECEDDC 90deg,#0000 90.5deg) calc(100px/2) 0, #29AB87' },
          { label: 'Pattern 13', value: 'conic-gradient(from 90deg at 2px 2px,#0000 90deg,#366 0), conic-gradient(from 90deg at 1px 1px,#0000 90deg,#366 0)' },
          { label: 'Pattern 14', value: 'conic-gradient(from 162deg at calc(90px * .5) calc(90px * .68), #fff220 36deg, #0000 0), conic-gradient(from 18deg at calc(90px * .19) calc(90px * .59), #fff220 36deg, #0000 0)' },
          { label: 'Pattern 15', value: 'conic-gradient(from 45deg at 75% 75%, #FECEA8 90deg,#FF847C 0 180deg,#0000 0), conic-gradient(from -45deg at 25% 25%, #FECEA8 90deg,#0000 0)' },
          { label: 'Pattern 16', value: 'linear-gradient(145deg,#baa0ab 0), linear-gradient(145deg,#baa0ab 0) calc(222px/2) 222px, linear-gradient( 35deg,#baa0ab 0)' },
          { label: 'Pattern 17', value: 'conic-gradient(at 20px calc(100% - 20px),#0000 270deg,#C02942 0) calc(20px + 15px) 0, linear-gradient(#53777A 20px,#0000 0) 0 15px' },
          { label: 'Pattern 18', value: 'linear-gradient(135deg,#0000 20.5%,#fff 0 29.5%,#0000 0) 0 calc(200px/4), linear-gradient( 45deg,#0000 8%,#0d5a8f 0 17%,#0000 0 58%)' },
          { label: 'Pattern 19', value: 'conic-gradient(from 135deg,#E0E4CC 90deg,#0000 0) 64px calc(64px/2), conic-gradient(from 135deg,#69D2E7 90deg,#0000 0)' },
          { label: 'Pattern 20', value: 'conic-gradient(from -45deg,#EB6841 90deg,#0000 0 180deg,#EDC951 0 270deg,#0000 0) 0 calc(64px/2)/64px 64px' },
          { label: 'Pattern 21', value: 'calc( 2.598*36px/2) calc(36px/ 2)/calc(2*36px*1.732) calc(2*36px), conic-gradient(from 60deg at 62.5% 50%,#f2f2f2 60deg,#0000 0)' },
          { label: 'Pattern 22', value: 'conic-gradient(from -45deg at calc(100%/3) calc(100%/3) ,#F8CA00 90deg,#0000 0 )' },
          { label: 'Pattern 23', value: 'conic-gradient(at 62.5% 12.5%,#72e21f 0) calc( 120px/-8) calc(120px/2)' },
          { label: 'Pattern 24', value: 'conic-gradient(at 20.71% 50%,#3B8686 0) calc(170px/ 6.828) calc(170px/2)' },
          { label: 'Pattern 25', value: 'conic-gradient( #F10C49 63.43deg ,#F6D86B 0 116.36deg, #F10C49 0 180deg ,#F6D86B 0 243.43deg, #F10C49 0 296.15deg,#F6D86B 0)' },
          { label: 'Pattern 26', value: 'conic-gradient(at 10% 50%,#D3643B 0), conic-gradient(at 10% 50%,#D3643B 0) calc(1*40px) calc(3*40px)' },
          { label: 'Pattern 27', value: 'conic-gradient(from -116.36deg at 25% #4a99b4 0)' },
          { label: 'Pattern 28', value: 'conic-gradient(from -60deg at 50% calc(100%/3),#c3c3c3 0 120deg,#0000 0)' },
          { label: 'Pattern 29', value: 'conic-gradient(at 25% 25%,#0000 75%,#0B2E59 0) 50px 50px' },
          { label: 'Pattern 30', value: 'linear-gradient( 45deg,#0000 calc(25%/3) ,#73C8A9 0 calc(50%/3),#0000 0)' },
          { label: 'Pattern 31', value: 'calc( .9*100px) calc( .9*100px)/var(--_s) conic-gradient(at 20% 20%,#0000 75%,#67434F 0)' },
          { label: 'Pattern 32', value: 'conic-gradient(from 30deg at 87.5% 75%,#EAFDE6 60deg,#519548 0 120deg,#0000 0)' },
          { label: 'Pattern 33', value: 'conic-gradient(at 50% calc(100%/6),#5E9FA3 60deg,#0000 0)' },
          { label: 'Pattern 34', value: 'radial-gradient(27% 29% at right ,#0000 83%,#b09f79 85% 99%,#0000 101%)' },
          { label: 'Pattern 35', value: 'radial-gradient(35.36% 35.36% at 100% 25%,#0000 66%,#BFB35A 68% 70%,#0000 72%)' },
          { label: 'Pattern 36', value: 'radial-gradient(150px at 100% 0 ,#e7525b 6.25%,#78dbf0 6.3% 18.75%,#e7525b 18.8% 31.25%)' },
          { label: 'Pattern 37', value: 'conic-gradient(from 116.56deg at calc(100%/3) 0 ,#0000 90deg,#046D8B 0), #2FB8AC' },
          { label: 'Pattern 38', value: '60px 60px/var(--_s) conic-gradient(at calc(500%/6) 50%,#ffdc56 25%,#0000 0)' },
          { label: 'Pattern 39', value: 'conic-gradient(at 50% 25%,#0000 75%,#f86466 0)' },
          { label: 'Pattern 40', value: 'conic-gradient(from -60deg at 50% 28.86%,#0000, #e7525b 1deg 30deg,#78dbf0 31deg 89deg)' },
          { label: 'Pattern 41', value: 'conic-gradient(#0000 75%,#FCD036 0 100%,#0000 102%)' },
          { label: 'Pattern 42', value: 'conic-gradient(from 150deg,#F77825 60deg,#0000 0 180deg, #60B99A 0 240deg,#0000 0)' },
          { label: 'Pattern 43', value: 'conic-gradient(#0d6759 25%,#0000 0) 0 0/calc(2*76px) calc(76px/9.5)' },
          { label: 'Pattern 44', value: 'conic-gradient(from 30deg at 50% 25%,#0000 300deg,#cd2942 0)' },
          { label: 'Pattern 45', value: 'repeating-linear-gradient( 45deg,#fff 0 1px,#0000 0 calc(25% - 1px),#fff 0 25%)' },
          { label: 'Pattern 46', value: 'radial-gradient(25% 25% at 25% 25%,#91204D 99%,#0000 101%)' },
          { label: 'Pattern 47', value: 'radial-gradient(100% 100% at 100% 100%,#0000 46%,#73C8A9 47% 53%,#0000 54%)' },
          { label: 'Pattern 48', value: 'radial-gradient(100% 100% at 100% 0,#F8B195 4%,#78dbf0 6% 14%,#e7525b 16% 24%)' },
          { label: 'Pattern 49', value: 'radial-gradient(calc(25%/3) calc(25%/4) at 50% 100%,#0000 25%,#0008 47%,#e7525b 53% 147%)' },
          { label: 'Pattern 50', value: '0 0 /50px calc(5*50px/4) radial-gradient(calc(50px/2) at 0 20%,#084c7f)' },
          { label: 'Pattern 51', value: 'radial-gradient(calc(1.28*40px + 25px/2) at top 50% right calc(-.8*40px), #88A65E 0%)' },
          { label: 'Pattern 52', value: 'radial-gradient(at 100% 100%, #036564 35%, #0000 36%), #E8DDCB' },
          { label: 'Pattern 53', value: 'repeating-linear-gradient( 45deg,#c02942 0, repeating-linear-gradient( 45deg,#c02942 0) 80px 80px' },
          { label: 'Pattern 54', value: 'radial-gradient(56px at 100% 50%,#3FB8AF 99%,#0000 101%)' },
          { label: 'Pattern 55', value: 'radial-gradient(#0B486B 49%,#0000 50%), #CFF09E' },
          { label: 'Pattern 56', value: 'conic-gradient(from 140deg at 50% 87.5% ,#00A0B0 0)' },
          { label: 'Pattern 57', value: 'radial-gradient(calc(1.28*40px + 25px/2) at left 50% bottom calc(-.8*40px),#bb2528 0%)' },
          { label: 'Pattern 58', value: 'linear-gradient(135deg,#0000 18.75%,#5E412F 0 31.25%,#0000 0)' },
          { label: 'Pattern 59', value: 'conic-gradient(from 90deg at 2px 2px,#0000 25%,#4E395D 0)' },
          { label: 'Pattern 60', value: 'radial-gradient(#0000 70%,#1a2030 71%),#0f9177' },
          { label: 'Pattern 61', value: 'radial-gradient(calc(34px/2),#309292 97%,#0000)' },
          { label: 'Pattern 62', value: 'radial-gradient(36% 72% at 25% -50%,#FCEBB6 98%,#0000)' },
          { label: 'Pattern 63', value: 'radial-gradient(60px at 100% 40px,#0000 calc(99% - 20px),#7BB0A8 0)' },
          { label: 'Pattern 64', value: 'radial-gradient(30px 100%,#0000 32%,#45ADA8 30%, 33%)' },
          { label: 'Pattern 65', value: 'repeating-linear-gradient(#ECD078 0 10px, #0000 0 50%)' },
          { label: 'Pattern 66', value: 'radial-gradient(100% 50% at 100% 0 ,#0000, #0004 5%,#78dbf0 6% 14%)' },
          { label: 'Pattern 67', value: 'conic-gradient(#0000 75%,#CFF09E 0)' },
          { label: 'Pattern 68', value: 'conic-gradient(#7A6A53 135deg,#D9CEB2 0 270deg, #7A6A53 0 315deg,#D9CEB2 0)' },
          { label: 'Pattern 69', value: 'conic-gradient(from -45deg at 75% 12.5%,#413E4A 25%,#0000 0)' },
          { label: 'Pattern 70', value: 'conic-gradient(at calc(250%/3) calc(50%/3),#78dbf0 60deg,#0000 0 300deg,#e7525b 0)' },
          { label: 'Pattern 71', value: 'conic-gradient(at 12% 20% ,#0000 75%,#78dbf0 0)' },
          { label: 'Pattern 72', value: 'linear-gradient(225deg,#0000 3.125%,#987F69 0 9.375%, #0000 0 78.125%)' },
          { label: 'Pattern 73', value: 'linear-gradient(-45deg ,#0000 75%,#F67280 0), #355C7D' },
          { label: 'Pattern 74', value: 'radial-gradient(25% 50%,#5E412F 98%,#0000)' },
          { label: 'Pattern 75', value: 'repeating-conic-gradient(#F2E9E1 0 45deg,#99B2B7 0 90deg)' },
          { label: 'Pattern 76', value: '0 50px/calc(2*50px) calc(2*50px) radial-gradient(25% 25%,#d9ceb2 99%)' },
          { label: 'Pattern 77', value: 'radial-gradient(#0000 50%,#5A3D31 52% 55%,#E5EDB8 57%)' },
          { label: 'Pattern 78', value: 'linear-gradient(#0000 50%,#0004 0), conic-gradient(from -30deg at 90%,#fff 240deg)' },
          { label: 'Pattern 79', value: 'conic-gradient(from 180deg,#E08E79 0 25%,#774F38 0 50%,#0000 0)' },
          { label: 'Pattern 80', value: 'repeating-conic-gradient(from -45deg at 75% 37.5%,#0000 0 25%,#EEDD99 0 50%)' },
          { label: 'Pattern 81', value: 'conic-gradient(from 135deg at 25% 75%,#90c0b2 0 25%,#f9fbef 0 50%,#0000 0)' },
          { label: 'Pattern 82', value: 'radial-gradient(100% 100% at 100% 0,#0000 24%,#78dbf0 26% 34%)' },
          { label: 'Pattern 83', value: 'radial-gradient(calc(2.414*40px) at 0 0 ,#0000 calc(100% - 20px),#615375 calc(100% - 20px) 99%)' },
          { label: 'Pattern 84', value: 'radial-gradient(calc(2.414*40px) at 0 0 ,#FFE545 calc(100% - 2px),#0000), #C2A34F' },
          { label: 'Pattern 85', value: 'calc(160px/-4) calc(160px/-4)/80px 80px radial-gradient(#FF9F6A 17%,#1f5e79 18% 35%,#0000 36.5%)' },
          { label: 'Pattern 86', value: 'conic-gradient(at 50% 25%,#0341ae 25%,#0000 0)' },
          { label: 'Pattern 87', value: 'conic-gradient(at 75% 25%,#EFD9B4 0),#EFD9B4' },
          { label: 'Pattern 88', value: 'conic-gradient(at 25% 25%,#0000 75%,#AACCB1 0)' },
          { label: 'Pattern 89', value: 'radial-gradient(#655643 15%, #0000 17% 20%,#655643 22% 25%)' },
          { label: 'Pattern 90', value: 'conic-gradient(at calc(50%/3) calc(50%/3),#0000 75%,#556270 0)' },
          { label: 'Pattern 91', value: 'conic-gradient(from 60deg at 56.25% calc(425%/6),#ECBE13 0)' },
          { label: 'Pattern 92', value: 'conic-gradient(at 80% 20%,#DFBA69 12.5%,#5A2E2E 0 25%)' },
          { label: 'Pattern 93', value: 'conic-gradient(from 30deg at 80%, #ff9f6a 60deg,#1f5e79 0 120deg)' },
          { label: 'Pattern 94', value: 'calc( 80px/4) calc(80px/ 4) /calc(2*80px) 80px conic-gradient(at 62.5% 25%,#59A80F 0)' },
          { label: 'Pattern 95', value: 'conic-gradient(at 80% 80%,#99B2B7 75%,#0000 0), #EDC951' },
          { label: 'Pattern 96', value: 'radial-gradient(#0000 50%,#0002 54%,#DAD8A7 57%)' },
          { label: 'Pattern 97', value: 'radial-gradient(30% 30% at 0% 30%,#0000 66%,#3B2D38 68% 98%)' },
          { label: 'Pattern 98', value: 'conic-gradient(from -112.5deg at 25% 25%,#DCD1B4 0), #DCD1B4' },
          { label: 'Pattern 99', value: 'linear-gradient( 60deg, #0000 45%,#88ABC2 46% 54%,#0000 55%)' },
          { label: 'Pattern 100', value: 'conic-gradient(at 40% 40%,#0000 75%,#5E4352 0)' },
          { label: 'Pattern 101', value: 'conic-gradient(from 15deg at 86.6%, #955E3E 25%,#F1D4AF 0 150deg)' },
          { label: 'Pattern 102', value: 'conic-gradient(from 120deg at 50% 87.5%,#acc4a3 120deg,#0000 0)' },
          { label: 'Pattern 103', value: 'conic-gradient(at 50% 50px 0), #CCC68D' },
          { label: 'Pattern 104', value: 'radial-gradient(at 100% 0,#0000 17.5%,#e7525b 18% 35%)' },
          { label: 'Pattern 105', value: 'repeating-conic-gradient(#655643 0 30deg,#0000 0 150deg,#80BCA3 0 50%)' },
          { label: 'Pattern 106', value: 'conic-gradient(from 60deg at calc(3.866*41px),#5E8C6A 60deg,#0000 0)' },
          { label: 'Pattern 107', value: 'radial-gradient(60px,#542437 49%,#0000 50%)' },
          { label: 'Pattern 108', value: 'conic-gradient(at calc(100%/3) 25%,#0000 75%,#696758 0)' },
          { label: 'Pattern 109', value: 'radial-gradient(#0000 64%,#C5BC8E 65%)' },
          { label: 'Pattern 110', value: 'conic-gradient(from 45deg at 50% 35%,#0000 75%,#ADD8E6 0)' },
          { label: 'Pattern 111', value: 'repeating-conic-gradient(#DCD1B4 0 25%,#0000 0 50%)' },
          { label: 'Pattern 112', value: 'repeating-conic-gradient(#ECD078 0 25%,#0000 0 50%)' },
          { label: 'Pattern 113', value: 'conic-gradient(from 45deg at 75% 75%,#CF4647 25%,#524656 0 50%)' },
          { label: 'Pattern 114', value: 'linear-gradient(45deg,#73C8A9 20%,#0000 0 45%,#633D2E 0 70%)' },
          { label: 'Pattern 115', value: 'conic-gradient(from 45deg at 75% 75%,#EFD9B4 25%,#0000 0)' },
          { label: 'Pattern 116', value: 'conic-gradient(at calc(200%/3) 10%,#D3E2B6 0)' },
          { label: 'Pattern 117', value: 'radial-gradient(calc(1.5*40px) at 37.5% 0%,#0000 39%,#73C8A9 40% 93%)' },
          { label: 'Pattern 118', value: 'conic-gradient(from 135deg at 87.5% 37.5%,#0000 75%,#78dbf0 0)' },
          { label: 'Pattern 119', value: 'repeating-conic-gradient(from -15deg,#67917A 0 60deg,#0000 0 50%)' },
          { label: 'Pattern 120', value: 'linear-gradient(45deg,#0000 71%,#73C8A9 0 79%,#0000 0)' },
          { label: 'Pattern 121', value: 'radial-gradient(at 0 100%,#DFBA69 35%,#0000 calc(35% + 1px))' },
          { label: 'Pattern 122', value: 'calc(104px/ 2) 104px/calc(2*52px) calc(2*52px) radial-gradient(at 100% 0,#F67280 17.5%)' },
          { label: 'Pattern 123', value: 'conic-gradient(from -45deg at 30%,#0000 75%,#78dbf0 0)' },
          { label: 'Pattern 124', value: 'calc(2*30px) calc(5*30px) 60px conic-gradient(from -45deg at 50% calc(50%/3))' },
          { label: 'Pattern 125', value: 'conic-gradient(from 45deg at 70%,#8A9B0F 25%,#0000 0)' },
          { label: 'Pattern 126', value: 'conic-gradient(at 90% 40%,#0000 75%,#774F38 0), #F1D4AF' },
          { label: 'Pattern 127', value: 'linear-gradient(-45deg,#0000 48%,#F8EDD1 0 52%,#0000 0)' },
          { label: 'Pattern 128', value: 'conic-gradient(#c0b299 0),conic-gradient(#a4a9aa 0) calc(2*50px) 0' },
          { label: 'Pattern 129', value: 'conic-gradient(from -45deg at 75% 62.5%,#1C2130 0 25%,#0000 0)' },
          { label: 'Pattern 130', value: 'conic-gradient(at 78% 3%,#2B4E72 0)' },
          { label: 'Pattern 131', value: 'linear-gradient(-45deg,#0000 1.3%,#78dbf0 0 32%,#0000 0)' },
          { label: 'Pattern 132', value: 'radial-gradient(closest-corner at-25% 25%,#FF714B 99%,#0000 101%)' },
          { label: 'Pattern 133', value: 'repeating-conic-gradient(from 45deg,#000 0 25%,#fff 0 50%)' },
          { label: 'Pattern 134', value: 'conic-gradient(at 12.5% 62.5%,#0000 75%,#CFF09E 0)' },
          { label: 'Pattern 135', value: 'repeating-linear-gradient(#0000 0 48%,#6B5344 0 50%)' },
          { label: 'Pattern 136', value: 'conic-gradient(#5B7C8D 25%,#0000 0 50%,#EDF6EE 0 75%)' },
          { label: 'Pattern 137', value: 'radial-gradient(#DDD9AB 34%,#0000 36%)' },
          { label: 'Pattern 138', value: 'radial-gradient(50px at 100% 100%,#9D2053 99%,#0000 101%)' },
        ],
        defaultValue: "none",
      },
      pageFont: {
        type: "select",
        label: "Page Font",
        options: [
          { label: "Default (Inter)", value: "var(--font-inter, Arial, Helvetica, sans-serif)" },
          { label: "Lora (Serif)", value: "var(--font-lora, Georgia, serif)" },
          { label: "Playfair Display", value: "var(--font-playfair, 'Playfair Display', serif)" },
          { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
          { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
          { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
          { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
        ],
        defaultValue: "var(--font-inter, Arial, Helvetica, sans-serif)",
      },
      metaKeywords: {
        type: "text",
        label: "Meta Keywords (comma separated)",
        defaultValue: "",
      },
      metaImage: {
        type: "text",
        label: "Meta Image URL (OG/Twitter)",
        defaultValue: "",
      },
      metaAuthor: {
        type: "text",
        label: "Author",
        defaultValue: "",
      },
      metaCanonical: {
        type: "text",
        label: "Canonical URL (override)",
        defaultValue: "",
      },
      metaRobots: {
        type: "select",
        label: "Robots Directive",
        options: [
          { label: "index,follow", value: "index,follow" },
          { label: "noindex,follow", value: "noindex,follow" },
          { label: "index,nofollow", value: "index,nofollow" },
          { label: "noindex,nofollow", value: "noindex,nofollow" },
        ],
        defaultValue: "index,follow",
      },
      metaOgType: {
        type: "select",
        label: "OpenGraph Type",
        options: [
          { label: "website", value: "website" },
          { label: "article", value: "article" },
          { label: "profile", value: "profile" },
        ],
        defaultValue: "website",
      },
    },
    defaultProps: {
      title: "My Page",
      description: "",
      viewport: "fluid",
      theme: "light",
      backgroundPattern: "none",
    },
    render: ({ children, title, description, viewport, theme, backgroundPattern, pageFont }: any) => {
      return (
        <div
          data-theme={theme}
          style={{
            width: viewport === "fixed" ? "1280px" : "100%",
            margin: "0 auto",
            background: backgroundPattern !== "none" ? backgroundPattern : undefined,
            backgroundAttachment: backgroundPattern !== "none" ? "fixed" : undefined,
            backgroundSize: backgroundPattern !== "none" ? "200px 200px" : undefined,
            minHeight: "100vh",
            fontFamily: typeof pageFont === 'string' ? pageFont : undefined,
          }}
        >
          {/* Page metadata can be accessed programmatically */}
          {children}
        </div>
      )
    },
  },
  components: {
    ProfileDefaultPage: {
      label: "Profile Default Page",
      fields: profilePageFields,
      defaultProps: profilePageDefaultProps,
      render: (props: any) => renderProfilePageComponent(props),
    },

    // ProfileTemplatePage: {
    //   label: "Profile Template Page",
    //   description: "Pre-built profile layout with sample data you can customise.",
    //   fields: profilePageFields,
    //   defaultProps: {
    //     ...profilePageDefaultProps,
    //     children: [],
    //   },
    //   resolveData: async (data: any) => {
    //     const props = data?.props || {}
    //     const hasChildren = Array.isArray(props.children) && props.children.length > 0
    //     if (hasChildren) return data
    //     return {
    //       ...data,
    //       props: {
    //         ...profilePageDefaultProps,
    //         ...props,
    //         children: cloneProfileTemplateChildren(),
    //       },
    //     }
    //   },
    //   render: (props: any) => renderProfilePageComponent(props),
    // },

    ProfileTemplatePage: {
      label: "Profile Template Page",
      description: "Pre-built profile layout with sample data you can customise.",
      fields: profilePageFields,
      defaultProps: {
        ...profilePageDefaultProps,
        children: [],
      },
      resolveData: async (data: any) => {
        const props = data?.props || {}
        const hasChildren = Array.isArray(props.children) && props.children.length > 0
        if (hasChildren) return data
        return {
          ...data,
          props: {
            ...profilePageDefaultProps,
            ...props,
            children: cloneProfileTemplateChildren(),
          },
        }
      },
      render: (props: any) => renderProfilePageComponent(props),
    },
    ProfileHeaderPuck: {
      label: createLabel(User, "Profile Header"),
      fields: {
        slug: { type: "text", label: "Slug", defaultValue: profileComponentDefaults.slug || "" },
      },
      render: ({ slug }: any) => {
        const displayName = slug || "Profile"
        const headerInitial = displayName.charAt(0).toUpperCase()
        return <ProfileTopBar initial={headerInitial} />
      },
    },

    ProfileAvatarPuck: {
      label: createLabel(User, "Profile Avatar"),
      fields: {
        slug: { type: "text", label: "Slug", defaultValue: profileComponentDefaults.slug || "" },
        displayName: { type: "text", label: "Display name", defaultValue: profileComponentDefaults.displayName || "" },
        avatarUrl: { type: "text", label: "Avatar URL", defaultValue: profileComponentDefaults.avatarUrl || "" },
      },
      render: (props: any) => <ProfileAvatarPuckComponent {...props} />,
    },

    ProfileInfoPuck: {
      label: createLabel(UserCheck2, "Profile Info"),
      fields: {
        displayName: { type: "text", label: "Display name", defaultValue: profileComponentDefaults.displayName || "" },
        tagline: { type: "textarea", label: "Tagline", defaultValue: profileComponentDefaults.tagline || "" },
        width: { type: "text", label: "Width (eg. 100%, 320px)", defaultValue: "auto" },
        height: { type: "text", label: "Height (eg. auto, 200px)", defaultValue: "auto" },
        layout: {
          type: "select",
          label: "Layout",
          options: [
            { label: "Block", value: "block" },
            { label: "Flex", value: "flex" },
            { label: "Grid", value: "grid" },
          ],
          defaultValue: "block",
        },
        textAlign: {
          type: "select",
          label: "Text Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
            { label: "Justify", value: "justify" },
          ],
          defaultValue: "center",
        },
        verticalAlign: {
          type: "select",
          label: "Vertical Alignment",
          options: [
            { label: "Top", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "Bottom", value: "flex-end" },
            { label: "Stretch", value: "stretch" },
          ],
          defaultValue: "center",
        },
        center: {
          type: "select",
          label: "Center content",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
          defaultValue: true,
        },
        bgColor: {
          type: "select",
          label: "Background Color",
          options: [
            { label: "Transparent", value: "" },
            { label: "White", value: "#ffffff" },
            { label: "Light Gray", value: "#f3f4f6" },
            { label: "Dark Gray", value: "#1f2937" },
          ],
          defaultValue: "",
        },
        textColor: {
          type: "select",
          label: "Text Color",
          options: [
            { label: "Dark (Default)", value: "#1f2937" },
            { label: "Gray", value: "#6b7280" },
            { label: "Light", value: "#ffffff" },
            { label: "Primary Blue", value: "#4a90e2" },
            { label: "Custom", value: "custom" },
          ],
          defaultValue: "#1f2937",
        },
        customTextColor: { type: "text", label: "Custom text color (hex/rgb)", defaultValue: "" },
        padding: { type: "text", label: "Padding (eg. 8px, 16px)", defaultValue: "16px" },
        gap: { type: "text", label: "Gap (eg. 8px)", defaultValue: "8px" },
      },
      render: ({
        puck,
        displayName,
        tagline,
        width,
        height,
        layout,
        textAlign,
        verticalAlign,
        center,
        bgColor,
        textColor,
        customTextColor,
        padding,
        gap,
      }: any) => {
        const display = displayName || "Profile"

        const finalTextColor = textColor === "custom" ? customTextColor : textColor || "#1f2937"

        const style: React.CSSProperties = {
          width: width && width !== "auto" ? width : undefined,
          height: height && height !== "auto" ? height : undefined,
          display: layout && layout !== "block" ? layout : undefined,
          justifyContent: center && (layout === "flex" || layout === "grid") ? "center" : undefined,
          alignItems: verticalAlign && (layout === "flex" || layout === "grid") ? verticalAlign : undefined,
          textAlign: (textAlign as any) || "center",
          backgroundColor: bgColor || undefined,
          color: finalTextColor,
          padding: padding || undefined,
          gap: gap || undefined,
          boxSizing: "border-box",
        }

        return (
          <div style={style}>
            <ProfileNameBlock displayName={display} tagline={tagline} />
          </div>
        )
      },
    },

    ProfileButtonsPuck: {
      label: createLabel(MousePointerClick, "Profile Buttons"),
      fields: {
        buttonPrimaryLabel: {
          type: "text",
          label: "Primary button label",
          defaultValue: profileComponentDefaults.buttonPrimaryLabel || "Connect",
        },
        buttonSecondaryLabel: {
          type: "text",
          label: "Secondary button label",
          defaultValue: profileComponentDefaults.buttonSecondaryLabel || "Links",
        },
        onPrimaryClick: { type: "text", label: "Primary button action", defaultValue: "" },
        onSecondaryClick: { type: "text", label: "Secondary button action", defaultValue: "" },
        width: { type: "text", label: "Width (eg. 100%, 320px)", defaultValue: "auto" },
        height: { type: "text", label: "Height (eg. auto)", defaultValue: "auto" },
        layout: {
          type: "select",
          label: "Layout",
          options: [
            { label: "Inline (Horizontal)", value: "flex" },
            { label: "Stack (Vertical)", value: "flex-column" },
            { label: "Grid 2 Columns", value: "grid-2" },
            { label: "Full Width Stack", value: "flex-full" },
          ],
          defaultValue: "flex",
        },
        horizontalAlign: {
          type: "select",
          label: "Horizontal Alignment",
          options: [
            { label: "Left", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "Right", value: "flex-end" },
            { label: "Space Between", value: "space-between" },
            { label: "Space Around", value: "space-around" },
          ],
          defaultValue: "center",
        },
        verticalAlign: {
          type: "select",
          label: "Vertical Alignment",
          options: [
            { label: "Top", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "Bottom", value: "flex-end" },
            { label: "Stretch", value: "stretch" },
          ],
          defaultValue: "center",
        },
        center: {
          type: "select",
          label: "Center content (Legacy)",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
          defaultValue: true,
        },
        gap: { type: "text", label: "Gap between buttons (eg. 8px, 16px)", defaultValue: "16px" },
        bgColor: { type: "text", label: "Background Color", defaultValue: "" },
        textColor: { type: "text", label: "Text Color", defaultValue: "#1f2937" },
        padding: { type: "text", label: "Padding (eg. 8px, 16px)", defaultValue: "16px" },
      },
      render: ({
        puck,
        buttonPrimaryLabel,
        buttonSecondaryLabel,
        onPrimaryClick,
        onSecondaryClick,
        width,
        height,
        layout,
        horizontalAlign,
        verticalAlign,
        gap,
        bgColor,
        textColor,
        padding,
      }: any) => {
        let containerDisplay = "flex"
        let flexDirection: React.CSSProperties["flexDirection"] = "row"

        if (layout === "flex-column" || layout === "flex-full") {
          flexDirection = "column"
        } else if (layout === "grid-2") {
          containerDisplay = "grid"
        }

        const justifyContent =
          layout === "grid-2" ? "center" : horizontalAlign || (layout === "flex" ? "center" : "flex-start")

        const style: React.CSSProperties = {
          width: width && width !== "auto" ? width : layout === "flex-full" ? "100%" : undefined,
          height: height && height !== "auto" ? height : undefined,
          display: containerDisplay,
          flexDirection: containerDisplay === "flex" ? flexDirection : undefined,
          gridTemplateColumns: layout === "grid-2" ? "1fr 1fr" : undefined,
          justifyContent,
          alignItems: verticalAlign || "center",
          gap: gap || "16px",
          backgroundColor: bgColor || undefined,
          color: textColor || "#1f2937",
          padding: padding || "16px",
          boxSizing: "border-box",
        }

        return (
          <div style={style}>
            <ProfileCTAButtons
              primaryLabel={buttonPrimaryLabel}
              secondaryLabel={buttonSecondaryLabel}
              direction={layout === "flex" || layout === "flex-full" ? "row" : layout === "flex-column" ? "column" : undefined}
              onPrimaryClick={() => onPrimaryClick && eval(onPrimaryClick)}
              onSecondaryClick={() => onSecondaryClick && eval(onSecondaryClick)}
            />
          </div>
        )
      },
    },
    ProfileLinksPuck: {
      label: createLabel(Globe, "Profile Links"),
      fields: {
        links: {
          type: "array",
          label: "Links & actions",
          arrayFields: {
            label: { type: "text", label: "Label", defaultValue: "New link" },
            type: {
              type: "select",
              label: "Type",
              options: PROFILE_LINK_TYPE_OPTIONS,
              defaultValue: "link",
            },
            iconKey: {
              type: "select",
              label: "Icon",
              options: PROFILE_ICON_OPTIONS,
              defaultValue: "Share",
            },
            url: { type: "text", label: "URL", defaultValue: "https://example.com" },
            images: { type: "textarea", label: "Album images (one per line)", defaultValue: "" },
            vcfName: { type: "text", label: "Full Name", defaultValue: "" },
            vcfEmail: { type: "text", label: "Email", defaultValue: "" },
            vcfPhone: { type: "text", label: "Phone", defaultValue: "" },
            vcfOrganization: { type: "text", label: "Organization", defaultValue: "" },
            vcfTitle: { type: "text", label: "Job Title", defaultValue: "" },
            vcfUrl: { type: "text", label: "Website URL", defaultValue: "" },
            vcfNote: { type: "textarea", label: "Notes", defaultValue: "" },
          },
          defaultItemProps: {
            label: "New link",
            type: "link",
            iconKey: "Share",
            url: "https://example.com",
            images: "",
            vcfName: "",
            vcfEmail: "",
            vcfPhone: "",
            vcfOrganization: "",
            vcfTitle: "",
            vcfUrl: "",
            vcfNote: "",
          },
          getItemSummary: (item: any) => item?.label || "Link",
        },
      },
      defaultProps: {
        links: cloneTemplateLinks(),
      },
      resolveData: async (data: any) => {
        const links = data?.props?.links
        if (Array.isArray(links) && links.length) return data
        return {
          ...data,
          props: {
            ...data.props,
            links: cloneTemplateLinks(),
          },
        }
      },
      render: ({ links }: any) => {
        const items = buildPuckProfileLinks(links)
        return <ProfileLinksSection items={items} emptyMessage="No links configured yet." />
      },
    },
    Shop: {
      preview: () => (
        <div className="rounded-xl border border-gray-200 p-4 bg-white w-full">
          <div className="text-xs font-medium text-gray-500 mb-2">Shop</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-100 h-20" />
            <div className="rounded-lg bg-gray-100 h-20" />
          </div>
        </div>
      ),
      fields: {
        title: { type: "text", label: "Section Title", defaultValue: "Products" },
        fontFamily: {
          type: "select",
          label: "Font Family",
          options: [
            { label: "Inherit (from page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, Helvetica, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair Display", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
        showDisclaimer: {
          type: "select",
          label: "Show Disclaimer",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        disclaimerText: { type: "text", label: "Disclaimer Text", defaultValue: "Products may contain affiliate links" },
        showSearch: {
          type: "select",
          label: "Show Search Bar",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        searchPlaceholder: { type: "text", label: "Search Placeholder", defaultValue: "Search products" },
        currency: { type: "text", label: "Currency Symbol", defaultValue: "$" },
        defaultSort: {
          type: "select",
          label: "Default Sort",
          options: [
            { label: "Relevance", value: "relevance" },
            { label: "Title Aâ†’Z", value: "title-asc" },
            { label: "Price Lowâ†’High", value: "price-asc" },
            { label: "Price Highâ†’Low", value: "price-desc" },
          ],
          defaultValue: "relevance",
        },
        showCategoryChips: {
          type: "select",
          label: "Show Category Chips",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        categories: {
          type: "array",
          label: "Categories (optional preset)",
          getItemSummary: (item: any, i: number) => item?.name ? `${item.name}` : `Category ${i + 1}`,
          defaultItemProps: { name: "All" },
          arrayFields: {
            name: { type: "text", label: "Name", defaultValue: "All" },
          },
        },
        showCreatorChips: {
          type: "select",
          label: "Show Creator Chips",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "false",
        },
        creators: {
          type: "array",
          label: "Creators (optional preset)",
          getItemSummary: (item: any, i: number) => item?.name ? `${item.name}` : `Creator ${i + 1}`,
          defaultItemProps: { name: "" },
          arrayFields: {
            name: { type: "text", label: "Name", defaultValue: "" },
          },
        },
        enablePriceFilter: {
          type: "select",
          label: "Enable Price Filter",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        useNextImage: {
          type: "select",
          label: "Use Next.js Image",
          options: [
            { label: "No (img tag)", value: "false" },
            { label: "Yes (optimized)", value: "true" },
          ],
          defaultValue: "false",
        },
        cards: {
          type: "array",
          label: "Cards",
          getItemSummary: (item: any, i: number) => item?.title ? `${item.title}` : `Card ${i + 1}`,
          defaultItemProps: {
            title: "Sample Product",
            price: 19.99,
            url: "https://example.com",
            imageUrl: "https://picsum.photos/seed/puck/600/400",
            imageAlt: "Sample product image",
            imageFit: "cover",
            imageRatio: "16/9",
            rounded: "xl",
            background: "#f4f4f5",
            badgeText: "",
            badgeColor: "#ef4444",
            creator: "",
            category: "",
          },
          arrayFields: {
            title: { type: "text", label: "Title", defaultValue: "Product" },
            price: { type: "number", label: "Price", defaultValue: 0 },
            url: { type: "text", label: "URL", defaultValue: "" },
            imageUrl: { type: "text", label: "Image URL", defaultValue: "" },
            imageAlt: { type: "text", label: "Image Alt", defaultValue: "" },
            imageRatio: {
              type: "select",
              label: "Image Aspect Ratio",
              options: [
                { label: "1:1", value: "1/1" },
                { label: "4:3", value: "4/3" },
                { label: "3:4", value: "3/4" },
                { label: "16:9", value: "16/9" },
                { label: "9:16", value: "9/16" },
              ],
              defaultValue: "16/9",
            },
            imageFit: {
              type: "select",
              label: "Image Fit",
              options: [
                { label: "Cover", value: "cover" },
                { label: "Contain", value: "contain" },
                { label: "Fill", value: "fill" },
              ],
              defaultValue: "cover",
            },
            rounded: {
              type: "select",
              label: "Rounded",
              options: [
                { label: "None", value: "none" },
                { label: "sm", value: "sm" },
                { label: "md", value: "md" },
                { label: "lg", value: "lg" },
                { label: "xl", value: "xl" },
                { label: "2xl", value: "2xl" },
                { label: "full", value: "full" },
              ],
              defaultValue: "xl",
            },
            background: { type: "text", label: "Card Background", defaultValue: "#f4f4f5" },
            badgeText: { type: "text", label: "Badge Text", defaultValue: "" },
            badgeColor: { type: "text", label: "Badge Color", defaultValue: "#ef4444" },
            creator: { type: "text", label: "Creator", defaultValue: "" },
            category: { type: "text", label: "Category", defaultValue: "" },
          },
        },
      },
      render: ({ title, cards = [], currency = '$', showSearch = 'true', searchPlaceholder = 'Search products', showDisclaimer = 'true', disclaimerText = 'Products may contain affiliate links', fontFamily, puck, defaultSort = 'relevance', showCategoryChips = 'true', categories = [], showCreatorChips = 'false', creators = [], enablePriceFilter = 'true', useNextImage = 'false' }: any) => {
        const [query, setQuery] = React.useState("");
        const showSearchBool = (typeof showSearch === 'string' ? showSearch : String(showSearch)) === 'true';
        const showDisclaimerBool = (typeof showDisclaimer === 'string' ? showDisclaimer : String(showDisclaimer)) === 'true';
        const showCategories = (typeof showCategoryChips === 'string' ? showCategoryChips : String(showCategoryChips)) === 'true';
        const showCreators = (typeof showCreatorChips === 'string' ? showCreatorChips : String(showCreatorChips)) === 'true';
        const priceFilterOn = (typeof enablePriceFilter === 'string' ? enablePriceFilter : String(enablePriceFilter)) === 'true';
        const useNextImg = (typeof useNextImage === 'string' ? useNextImage : String(useNextImage)) === 'true';
        const [sortMode, setSortMode] = React.useState(String(defaultSort || 'relevance'));
        const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
        const [activeCreator, setActiveCreator] = React.useState<string | null>(null);
        const q = query.trim().toLowerCase();
        const prices = React.useMemo(() => {
          const nums = (cards || []).map((c: any) => Number(c?.price)).filter((n: number) => !isNaN(n));
          const min = nums.length ? Math.min(...nums) : 0;
          const max = nums.length ? Math.max(...nums) : 0;
          return { min, max };
        }, [cards]);
        const [minPrice, setMinPrice] = React.useState<number | ''>('');
        const [maxPrice, setMaxPrice] = React.useState<number | ''>('');

        const allCategories = React.useMemo(() => {
          const set = new Set<string>();
          (categories || []).forEach((x: any) => { if (x?.name) set.add(String(x.name)); });
          (cards || []).forEach((c: any) => { if (c?.category) set.add(String(c.category)); });
          return Array.from(set);
        }, [categories, cards]);
        const allCreators = React.useMemo(() => {
          const set = new Set<string>();
          (creators || []).forEach((x: any) => { if (x?.name) set.add(String(x.name)); });
          (cards || []).forEach((c: any) => { if (c?.creator) set.add(String(c.creator)); });
          return Array.from(set);
        }, [creators, cards]);

        const filtered = React.useMemo(() => {
          let list = (cards || []).slice();
          if (q) {
            list = list.filter((c: any) => {
              const t = String(c?.title || '').toLowerCase();
              const pStr = typeof c?.price === 'number' ? String(c.price) : String(c?.price || '');
              return t.includes(q) || pStr.includes(q);
            });
          }
          if (activeCategory) list = list.filter((c: any) => String(c?.category || '') === activeCategory);
          if (activeCreator) list = list.filter((c: any) => String(c?.creator || '') === activeCreator);
          const min = typeof minPrice === 'number' ? minPrice : -Infinity;
          const max = typeof maxPrice === 'number' ? maxPrice : Infinity;
          list = list.filter((c: any) => {
            const n = Number(c?.price);
            return !isNaN(n) ? n >= min && n <= max : true;
          });
          switch (sortMode) {
            case 'title-asc':
              list.sort((a: any, b: any) => String(a?.title || '').localeCompare(String(b?.title || '')));
              break;
            case 'price-asc':
              list.sort((a: any, b: any) => Number(a?.price || 0) - Number(b?.price || 0));
              break;
            case 'price-desc':
              list.sort((a: any, b: any) => Number(b?.price || 0) - Number(a?.price || 0));
              break;
          }
          return list;
        }, [q, cards, activeCategory, activeCreator, minPrice, maxPrice, sortMode]);

        const rClass = (r: string | undefined) => {
          switch (r) {
            case 'none': return 'rounded-none';
            case 'sm': return 'rounded-sm';
            case 'md': return 'rounded-md';
            case 'lg': return 'rounded-lg';
            case 'xl': return 'rounded-xl';
            case '2xl': return 'rounded-2xl';
            case 'full': return 'rounded-full';
            default: return 'rounded-xl';
          }
        };

        // Selection wiring
        const path = getPathFromPuck(puck)
        const _sel = useSelectedPaths()
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const baseStyle: any = { fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...baseStyle, ...outlineForSelected } : baseStyle
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          // Allow selection even when not in editing state so grouping works immediately.
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <section ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {showDisclaimerBool && disclaimerText ? (
              <div className="text-center text-gray-600 text-sm mb-3">{disclaimerText}</div>
            ) : null}
            {title ? (
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">{title}</h2>
            ) : null}
            {(showSearchBool || priceFilterOn) ? (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-gray-200 px-4 py-3 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z" /></svg>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Sort:</span>
                    <select className="border border-gray-200 rounded-md px-2 py-1 bg-white" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                      <option value="relevance">Relevance</option>
                      <option value="title-asc">Title Aâ€“Z</option>
                      <option value="price-asc">Price Lowâ€“High</option>
                      <option value="price-desc">Price Highâ€“Low</option>
                    </select>
                  </div>
                  {priceFilterOn ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Price:</span>
                      <input className="w-20 border border-gray-200 rounded-md px-2 py-1 bg-white" type="number" step="0.01" placeholder={String(prices.min)} value={minPrice as any} onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                      <span>-</span>
                      <input className="w-20 border border-gray-200 rounded-md px-2 py-1 bg-white" type="number" step="0.01" placeholder={String(prices.max)} value={maxPrice as any} onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                      <button className="text-gray-500 hover:text-gray-700" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Reset</button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showCategories && allCategories.length ? (
              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-sm border ${activeCategory === null ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>All</button>
                {allCategories.map((c: string, i: number) => (
                  <button key={i} onClick={() => setActiveCategory(c === activeCategory ? null : c)} className={`px-3 py-1.5 rounded-full text-sm border ${activeCategory === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>{c}</button>
                ))}
              </div>
            ) : null}

            {showCreators && allCreators.length ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setActiveCreator(null)} className={`px-3 py-1.5 rounded-full text-sm border ${activeCreator === null ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>All creators</button>
                {allCreators.map((c: string, i: number) => (
                  <button key={i} onClick={() => setActiveCreator(c === activeCreator ? null : c)} className={`px-3 py-1.5 rounded-full text-sm border ${activeCreator === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>{c}</button>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((c: any, idx: number) => {
                const fit = c?.imageFit || 'cover';
                const rounded = rClass(c?.rounded);
                const bg = typeof c?.background === 'string' && c.background ? c.background : '#f4f4f5';
                const ratio = typeof c?.imageRatio === 'string' ? c.imageRatio : '16/9';
                const trackClick = () => {
                  try {
                    const payload = { component: 'Shop', title: c?.title, url: c?.url, price: c?.price, creator: c?.creator, category: c?.category };
                    if (typeof window !== 'undefined') {
                      (window as any).dataLayer?.push({ event: 'shop_outbound_click', ...payload });
                      window.dispatchEvent(new CustomEvent('shop:outbound-click', { detail: payload }));
                    }
                  } catch { }
                };
                return (
                  <a key={idx} href={c?.url || '#'} target={c?.url ? '_blank' : undefined} rel={c?.url ? 'noopener noreferrer' : undefined} className="group block" onClick={trackClick}>
                    <div className={`overflow-hidden ${rounded} border border-gray-200 shadow-sm bg-white transition-shadow hover:shadow-md`} style={{ background: '#ffffff' }}>
                      <div className={`relative w-full ${rounded}`} style={{ background: bg, aspectRatio: ratio }}>
                        {c?.imageUrl ? (
                          useNextImg ? (
                            <Image src={c.imageUrl} alt={c?.imageAlt || ''} fill style={{ objectFit: fit as any }} />
                          ) : (
                            <img src={c.imageUrl} alt={c?.imageAlt || ''} className="w-full h-full" style={{ objectFit: fit as any }} />
                          )
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">No image</div>
                        )}
                        {c?.badgeText ? (
                          <div className="absolute top-2 left-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow" style={{ background: c?.badgeColor || '#ef4444', color: '#fff' }}>{c.badgeText}</div>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <div className="text-gray-900 text-base md:text-lg font-medium line-clamp-2">{c?.title || 'Untitled'}</div>
                        <div className="text-gray-500 text-sm mt-0.5">{currency}{typeof c?.price === 'number' ? c.price.toFixed(2) : String(c?.price || '')}</div>
                        <div className="text-gray-400 text-xs mt-1 flex gap-2">
                          {c?.category ? <span>#{c.category}</span> : null}
                          {c?.creator ? <span>by {c.creator}</span> : null}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
              {filtered.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-8">No products match your search.</div>
              ) : null}
            </div>
          </section>
        );
      },
    },
    /**
     * Container component for constraining content and applying padding/margins.
     * The wrapper applies selection outlines and passes dragRef for Puck.
     */
    Container: {
      label: createLabel(Box, "Container"),
      inline: true,
      fields: {
        children: { type: "slot", label: "Content" },
        padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
        margin: { type: "number", label: "Margin (px)", defaultValue: 0 },
        maxWidth: { type: "text", label: "Max width", defaultValue: "1280px" },
        background: { type: "text", label: "Background" },
        borderRadius: { type: "number", label: "Radius (px)", defaultValue: 0 },
        border: { type: "text", label: "Border", defaultValue: "" },
        boxShadow: { type: "text", label: "Box shadow", defaultValue: "" },
        // Visual hint sizes make empty containers easy to target while editing
        minWidth: { type: "number", label: "Min width (px)", defaultValue: 0 },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 64 },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      // This allows showing/hiding fields based on parent component or current props
      resolveFields: (data: any, ctx: any) => {
        const fields = config.components.Container.fields || {}
        // Example: Hide certain fields when in specific parent contexts
        if (ctx?.parent?.type === "Modal") {
          // Could modify fields here for context-specific behavior
        }
        return fields
      },
      render: ({
        children: Content,
        padding,
        margin,
        maxWidth,
        background,
        borderRadius,
        border,
        boxShadow,
        minWidth,
        minHeight,
        editingPadding,
        puck,
      }: any) => {
        // Apply a fullâ€‘width container by default. This ensures that the container
        // stretches to the available space instead of collapsing to its children.
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const extraPad = isEditing && typeof editingPadding === "number" && editingPadding > 0 ? editingPadding : 0
        const base: any = {
          width: "100%",
          padding: padding || extraPad ? `${(padding || 0) + extraPad}px` : undefined,
          margin: margin ? `${margin}px` : undefined,
          maxWidth: maxWidth || undefined,
          background: background || undefined,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          border: border || undefined,
          boxShadow: boxShadow || undefined,
        }
        // path, isSelected already computed above
        // While editing, apply hint min sizes and a subtle dashed outline to show the drop area
        const hint: any = isEditing
          ? {
            minWidth: typeof minWidth === "number" && minWidth > 0 ? `${minWidth}px` : undefined,
            minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : undefined,
            outline: !isSelected ? "1px dashed #e5e7eb" : undefined,
            outlineOffset: !isSelected ? -4 : undefined,
            background: !isSelected ? "#fafafa" : undefined,
          }
          : {}
        const style = isSelected ? { ...base, ...outlineForSelected, ...hint } : { ...base, ...hint }
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    // === Added responsive Section wrapper ===
    Section: {
      label: createLabel(Package, "Section"),
      fields: {
        children: { type: "slot", label: "Content" },
        maxWidth: { type: "text", label: "Max width", defaultValue: "1280px" },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 80 },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 24 },
        background: { type: "text", label: "Background", defaultValue: "" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Plain", value: "plain" },
            { label: "Muted", value: "muted" },
            { label: "Dark", value: "dark" },
            { label: "Gradient", value: "gradient" },
          ],
          defaultValue: "plain",
        },
        gradientFrom: { type: "text", label: "Gradient from", defaultValue: "#6366f1" },
        gradientTo: { type: "text", label: "Gradient to", defaultValue: "#8b5cf6" },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 0 },
        center: {
          type: "select",
          label: "Center content",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "false",
        },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      render: ({
        children: Content,
        maxWidth,
        paddingY,
        paddingX,
        background,
        variant,
        gradientFrom,
        gradientTo,
        minHeight,
        center,
        editingPadding,
        puck,
      }: any) => {
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        let bg: string | undefined = background || undefined
        if (variant === "muted") bg = "#f9fafb"
        if (variant === "dark") bg = "#111827"
        if (variant === "gradient")
          bg = `linear-gradient(135deg, ${gradientFrom || "#6366f1"}, ${gradientTo || "#8b5cf6"})`
        const base: any = {
          width: "100%",
          minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : undefined,
          background: bg,
          padding: `${(paddingY || 0) + (isEditing && editingPadding ? editingPadding : 0)}px ${(paddingX || 0) + (isEditing && editingPadding ? editingPadding : 0)}px`,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const inner: any = {
          maxWidth: maxWidth || undefined,
          margin: "0 auto",
          display: center === "true" ? "flex" : undefined,
          flexDirection: center === "true" ? "column" : undefined,
          alignItems: center === "true" ? "center" : undefined,
          textAlign: center === "true" ? "center" : undefined,
        }
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <section ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <div style={inner}>{typeof Content === "function" ? <Content /> : null}</div>
          </section>
        )
      },
    },
    // === Added Stack primitive (direction + gap) ===
    Stack: {
      label: createLabel(LayoutList, "Stack"),
      fields: {
        children: { type: "slot", label: "Items" },
        direction: {
          type: "select",
          label: "Direction",
          options: [
            { label: "Vertical", value: "column" },
            { label: "Horizontal", value: "row" },
          ],
          defaultValue: "column",
        },
        gap: { type: "number", label: "Gap (px)", defaultValue: 24 },
        wrap: {
          type: "select",
          label: "Wrap",
          options: [
            { label: "No", value: "nowrap" },
            { label: "Yes", value: "wrap" },
          ],
          defaultValue: "nowrap",
        },
        align: {
          type: "select",
          label: "Align items",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Stretch", value: "stretch" },
          ],
          defaultValue: "stretch",
        },
        justify: {
          type: "select",
          label: "Justify content",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Between", value: "space-between" },
            { label: "Around", value: "space-around" },
            { label: "Evenly", value: "space-evenly" },
          ],
          defaultValue: "flex-start",
        },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      render: ({ children: Content, direction, gap, wrap, align, justify, editingPadding, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const style: any = {
          display: "flex",
          flexDirection: direction || "column",
          gap: typeof gap === "number" ? `${gap}px` : undefined,
          flexWrap: wrap || undefined,
          alignItems: align || undefined,
          justifyContent: justify || undefined,
          width: "100%",
          padding: isEditing && editingPadding ? `${editingPadding}px` : undefined,
        }
        const final = isSelected ? { ...style, ...outlineForSelected } : style
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={final} onMouseDown={onMouseDown}>
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    // === ResponsiveFlex (direction + gap per breakpoint) ===
    ResponsiveFlex: {
      label: createLabel(Proportions, "Responsive Flex"),
      fields: {
        children: { type: "slot", label: "Items" },
        dirMobile: {
          type: "select",
          label: "Mobile direction",
          options: [
            { label: "Column", value: "column" },
            { label: "Row", value: "row" },
          ],
          defaultValue: "column",
        },
        dirTablet: {
          type: "select",
          label: "Tablet direction",
          options: [
            { label: "Inherit", value: "inherit" },
            { label: "Column", value: "column" },
            { label: "Row", value: "row" },
          ],
          defaultValue: "inherit",
        },
        dirDesktop: {
          type: "select",
          label: "Desktop direction",
          options: [
            { label: "Inherit", value: "inherit" },
            { label: "Column", value: "column" },
            { label: "Row", value: "row" },
          ],
          defaultValue: "inherit",
        },
        gapMobile: { type: "number", label: "Gap mobile (px)", defaultValue: 16 },
        gapTablet: { type: "number", label: "Gap tablet (px)", defaultValue: 24 },
        gapDesktop: { type: "number", label: "Gap desktop (px)", defaultValue: 32 },
        align: {
          type: "select",
          label: "Align items",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Stretch", value: "stretch" },
          ],
          defaultValue: "stretch",
        },
        justify: {
          type: "select",
          label: "Justify",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Between", value: "space-between" },
            { label: "Around", value: "space-around" },
            { label: "Evenly", value: "space-evenly" },
          ],
          defaultValue: "flex-start",
        },
        wrap: {
          type: "select",
          label: "Wrap",
          options: [
            { label: "No", value: "nowrap" },
            { label: "Wrap", value: "wrap" },
          ],
          defaultValue: "wrap",
        },
        tabletBreakpoint: { type: "number", label: "Tablet â‰¥ px", defaultValue: 640 },
        desktopBreakpoint: { type: "number", label: "Desktop â‰¥ px", defaultValue: 1024 },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      render: ({
        children: Content,
        dirMobile,
        dirTablet,
        dirDesktop,
        gapMobile,
        gapTablet,
        gapDesktop,
        align,
        justify,
        wrap,
        tabletBreakpoint,
        desktopBreakpoint,
        editingPadding,
        puck,
      }: any) => {
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const tabletBp = typeof tabletBreakpoint === "number" ? tabletBreakpoint : 640
        const desktopBp = typeof desktopBreakpoint === "number" ? desktopBreakpoint : 1024
        let direction = dirMobile || "column"
        if (width >= tabletBp && dirTablet && dirTablet !== "inherit") direction = dirTablet
        if (width >= desktopBp && dirDesktop && dirDesktop !== "inherit") direction = dirDesktop
        let gap = typeof gapMobile === "number" ? gapMobile : 16
        if (width >= tabletBp && typeof gapTablet === "number") gap = gapTablet
        if (width >= desktopBp && typeof gapDesktop === "number") gap = gapDesktop
        // ResponsiveFlex dynamic direction & gap; selection vars declared above
        const style: any = {
          display: "flex",
          flexDirection: direction,
          gap: `${gap}px`,
          flexWrap: wrap || undefined,
          alignItems: align || undefined,
          justifyContent: justify || undefined,
          width: "100%",
          padding: isEditing && editingPadding ? `${editingPadding}px` : undefined,
        }
        const final = isSelected ? { ...style, ...outlineForSelected } : style
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={(el) => {
              ; (ref as any).current = el
              if (puck?.dragRef) (puck.dragRef as any)(el)
            }}
            data-puck-path={path || undefined}
            style={final}
            onMouseDown={onMouseDown}
          >
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    // === ResponsiveGrid (different column counts per breakpoint) ===
    ResponsiveGrid: {
      label: createLabel(Grid3x3, "Responsive Grid"),
      fields: {
        children: { type: "slot", label: "Cells" },
        layout: {
          type: "select",
          label: "Preset layout",
          options: [
            { label: "Responsive", value: "responsive" },
            { label: "Auto Fit Cards", value: "auto-cards" },
            { label: "Gallery", value: "gallery" },
            { label: "Masonry (approx)", value: "masonry" },
          ],
          defaultValue: "responsive",
        },
        colsMobile: { type: "number", label: "Cols mobile", defaultValue: 1 },
        colsTablet: { type: "number", label: "Cols tablet", defaultValue: 2 },
        colsDesktop: { type: "number", label: "Cols desktop", defaultValue: 3 },
        gapMobile: { type: "number", label: "Gap mobile (px)", defaultValue: 12 },
        gapTablet: { type: "number", label: "Gap tablet (px)", defaultValue: 16 },
        gapDesktop: { type: "number", label: "Gap desktop (px)", defaultValue: 24 },
        autoRows: { type: "text", label: "Auto rows", defaultValue: "minmax(64px, auto)" },
        tabletBreakpoint: { type: "number", label: "Tablet â‰¥ px", defaultValue: 640 },
        desktopBreakpoint: { type: "number", label: "Desktop â‰¥ px", defaultValue: 1024 },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      render: ({
        children: Content,
        layout,
        colsMobile,
        colsTablet,
        colsDesktop,
        gapMobile,
        gapTablet,
        gapDesktop,
        autoRows,
        tabletBreakpoint,
        desktopBreakpoint,
        editingPadding,
        puck,
      }: any) => {
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const tabletBp = typeof tabletBreakpoint === "number" ? tabletBreakpoint : 640
        const desktopBp = typeof desktopBreakpoint === "number" ? desktopBreakpoint : 1024
        let gap = typeof gapMobile === "number" ? gapMobile : 12
        if (width >= tabletBp && typeof gapTablet === "number") gap = gapTablet
        if (width >= desktopBp && typeof gapDesktop === "number") gap = gapDesktop
        let template: string
        if (layout === "auto-cards") template = "repeat(auto-fit, minmax(240px, 1fr))"
        else if (layout === "gallery") template = "repeat(auto-fill, minmax(160px, 1fr))"
        else if (layout === "masonry") template = "repeat(auto-fill, minmax(200px, 1fr))"
        else {
          let cols = typeof colsMobile === "number" ? colsMobile : 1
          if (width >= tabletBp && typeof colsTablet === "number") cols = colsTablet
          if (width >= desktopBp && typeof colsDesktop === "number") cols = colsDesktop
          template = `repeat(${cols}, minmax(0, 1fr))`
        }
        // ResponsiveGrid dynamic template; selection vars declared above
        const extraPad = isEditing && typeof editingPadding === "number" && editingPadding > 0 ? editingPadding : 0
        const style: any = {
          display: "grid",
          width: "100%",
          gridTemplateColumns: template,
          gridAutoRows: autoRows || undefined,
          gap: `${gap}px`,
          padding: extraPad ? `${extraPad}px` : undefined,
        }
        const final = isSelected ? { ...style, ...outlineForSelected } : style
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={(el) => {
              ; (ref as any).current = el
              if (puck?.dragRef) (puck.dragRef as any)(el)
            }}
            data-puck-path={path || undefined}
            style={final}
            onMouseDown={onMouseDown}
          >
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    // === Footer component ===
    Footer: {
      label: createLabel(Package, "Footer"),
      fields: {
        columns: {
          type: "array",
          label: "Link columns",
          arrayFields: {
            heading: { type: "text", label: "Heading", defaultValue: "Resources" },
            links: {
              type: "array",
              label: "Links",
              arrayFields: {
                label: { type: "text", label: "Label", defaultValue: "Item" },
                href: { type: "text", label: "Href", defaultValue: "#" },
              },
              defaultItemProps: { label: "Item", href: "#" },
            },
          },
          defaultItemProps: { heading: "Resources", links: [{ label: "Docs", href: "#" }] },
        },
        copyright: { type: "text", label: "Copyright", defaultValue: "Â© Company" },
        year: { type: "number", label: "Year", defaultValue: new Date().getFullYear() },
        background: { type: "text", label: "Background", defaultValue: "#111827" },
        textColor: { type: "text", label: "Text color", defaultValue: "#ffffff" },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        gap: { type: "number", label: "Gap (px)", defaultValue: 24 },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 48 },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 24 },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({
        columns,
        copyright,
        year,
        background,
        textColor,
        align,
        gap,
        paddingY,
        paddingX,
        editingPadding,
        fontFamily,
        puck,
      }: any) => {
        const path = getPathFromPuck(puck)
        const isEditing = isEditingFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const style: any = {
          width: "100%",
          background: background || undefined,
          color: textColor || undefined,
          padding: `${(paddingY || 0) + (isEditing && editingPadding ? editingPadding : 0)}px ${(paddingX || 0) + (isEditing && editingPadding ? editingPadding : 0)}px`,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const final = isSelected ? { ...style, ...outlineForSelected } : style
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const gridStyle: any = {
          display: "grid",
          gap: `${gap}px`,
          gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
          marginBottom: "32px",
        }
        // Fix: Declared 'cols' variable from 'columns' prop
        const cols = columns
        return (
          <footer ref={puck?.dragRef} data-puck-path={path || undefined} style={final} onMouseDown={onMouseDown}>
            <div style={gridStyle}>
              {cols?.map((col: any, i: number) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: align as any }}>
                  <div style={{ fontWeight: 600 }}>{col?.heading || ""}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {Array.isArray(col?.links)
                      ? col.links.map((l: any, j: number) => (
                        <a
                          key={j}
                          href={l?.href || "#"}
                          style={{ color: textColor || undefined, textDecoration: "none", opacity: 0.85 }}
                          onClick={(e) => (isEditing ? e.preventDefault() : undefined)}
                        >
                          {l?.label || ""}
                        </a>
                      ))
                      : null}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, textAlign: align as any }}>
              {copyright || ""} {year}
            </div>
          </footer>
        )
      },
    },
    // === LayoutItem for Grid/Flex "Any item" dynamic span & flex controls ===
    LayoutItem: {
      label: "Layout Item",

      // All fields for the right sidebar
      fields: {
        children: {
          type: "slot",
          label: "Content",
        },

        // Padding & sizing options (always available)
        padding: {
          type: "text",
          label: "Padding (px)",
          defaultValue: "0",
          helpText: "e.g., 12, 16, or 20px",
        },
        minHeight: {
          type: "text",
          label: "Min Height",
          defaultValue: "auto",
          helpText: "e.g., 100px, 200px",
        },

        // Grid-specific options
        gridColumns: {
          type: "number",
          label: "Grid Columns Span",
          defaultValue: 1,
          helpText: "How many columns this item takes (Grid only)",
        },
        gridRows: {
          type: "number",
          label: "Grid Rows Span",
          defaultValue: 1,
          helpText: "How many rows this item takes (Grid only)",
        },

        // Flex-specific options
        flexGrow: {
          type: "number",
          label: "Flex Grow",
          defaultValue: 0,
          helpText: "How much this item grows to fill space (Flex only)",
        },
        flexShrink: {
          type: "number",
          label: "Flex Shrink",
          defaultValue: 1,
          helpText: "How much this item shrinks (Flex only)",
        },
        flexBasis: {
          type: "text",
          label: "Flex Basis",
          defaultValue: "auto",
          helpText: "Base size before flex calculation (Flex only)",
        },

        // Background styling
        bgColor: {
          type: "select",
          label: "Background Color",
          options: [
            { label: "None", value: "transparent" },
            { label: "Light Gray", value: "#f3f4f6" },
            { label: "Light Blue", value: "#dbeafe" },
            { label: "Light Green", value: "#dcfce7" },
            { label: "Light Yellow", value: "#fef3c7" },
            { label: "White", value: "#ffffff" },
          ],
          defaultValue: "transparent",
        },

        // Border options
        showBorder: {
          type: "radio",
          label: "Show Border",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "false",
        },

        // Debug overlay
        debugOverlay: {
          type: "radio",
          label: "Show Debug Info",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "false",
        },
      },

      // Render function
      render: ({
        children: Content,
        padding = "0",
        minHeight = "auto",
        gridColumns = 1,
        gridRows = 1,
        flexGrow = 0,
        flexShrink = 1,
        flexBasis = "auto",
        bgColor = "transparent",
        showBorder = "false",
        debugOverlay = "false",
        puck,
      }: any) => {
        const parentType = puck?.parentProps?.type || puck?.parent?.type || puck?.parentType

        const isInGrid = parentType === "Grid" || parentType === "ResponsiveGrid"
        const isInFlex = parentType === "FlexContainer" || parentType === "ResponsiveFlex" || parentType === "Stack"

        // Build style based on context
        const style: any = {
          // Grid properties (only apply if in grid)
          ...(isInGrid && {
            gridColumn: `span ${gridColumns}`,
            gridRow: `span ${gridRows}`,
          }),

          // Flex properties (only apply if in flex)
          ...(isInFlex && {
            flex: `${flexGrow} ${flexShrink} ${flexBasis}`,
          }),

          // Common properties
          padding: `${padding}px`,
          minHeight: minHeight === "auto" ? "auto" : minHeight,
          backgroundColor: bgColor,
          border: showBorder === "true" ? "2px dashed #9ca3af" : "none",
          borderRadius: "4px",
          position: "relative",
          transition: "all 0.2s ease",
        }

        return (
          <div
            ref={puck?.dragRef}
            style={style}
            data-puck-path={puck?.path}
            onMouseEnter={(e) => {
              if (puck?.isEditing) {
                ; (e.currentTarget as HTMLElement).style.backgroundColor =
                  bgColor === "transparent" ? "#f9fafb" : bgColor
              }
            }}
            onMouseLeave={(e) => {
              if (puck?.isEditing) {
                ; (e.currentTarget as HTMLElement).style.backgroundColor = bgColor
              }
            }}
          >
            {typeof Content === "function" ? <Content /> : Content}

            {/* Debug overlay showing current properties */}
            {puck?.isEditing && debugOverlay === "true" && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  background: "rgba(0, 0, 0, 0.75)",
                  color: "#fff",
                  padding: "4px 6px",
                  borderRadius: "3px",
                  pointerEvents: "none",
                  zIndex: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {isInGrid && `C${gridColumns}Ã—R${gridRows}`}
                {isInFlex && `G${flexGrow} S${flexShrink} B${flexBasis}`}
                {!isInGrid && !isInFlex && "Item"}
              </div>
            )}
          </div>
        )
      },
    },
    // === Spacer primitive ===
    Spacer: {
      label: createLabel(Maximize, "Spacer"),
      inline: true,
      fields: {
        sizeMobile: { type: "number", label: "Size mobile (px)", defaultValue: 24 },
        sizeTablet: { type: "number", label: "Size tablet (px)", defaultValue: 32 },
        sizeDesktop: { type: "number", label: "Size desktop (px)", defaultValue: 48 },
        orientation: {
          type: "select",
          label: "Orientation",
          options: [
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
          ],
          defaultValue: "vertical",
        },
        tabletBreakpoint: { type: "number", label: "Tablet â‰¥ px", defaultValue: 640 },
        desktopBreakpoint: { type: "number", label: "Desktop â‰¥ px", defaultValue: 1024 },
        showOutline: {
          type: "select",
          label: "Show outline (editing)",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "true",
        },
      },
      render: ({
        sizeMobile,
        sizeTablet,
        sizeDesktop,
        orientation,
        tabletBreakpoint,
        desktopBreakpoint,
        showOutline,
        puck,
      }: any) => {
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const tabletBp = typeof tabletBreakpoint === "number" ? tabletBreakpoint : 640
        const desktopBp = typeof desktopBreakpoint === "number" ? desktopBreakpoint : 1024
        let size = typeof sizeMobile === "number" ? sizeMobile : 24
        if (width >= tabletBp && typeof sizeTablet === "number") size = sizeTablet
        if (width >= desktopBp && typeof sizeDesktop === "number") size = sizeDesktop
        const isEditing = isEditingFromPuck(puck)
        const style: any =
          orientation === "horizontal" ? { width: `${size}px`, height: "1px" } : { height: `${size}px`, width: "1px" }
        if (isEditing && showOutline === "true") {
          style.outline = "1px dashed #e5e7eb"
          style.outlineOffset = -4
          style.background = "#fafafa"
        }
        return (
          <div
            ref={(el) => {
              ; (ref as any).current = el
              if (puck?.dragRef) (puck.dragRef as any)(el)
            }}
            style={style}
          />
        )
      },
    },
    // === AutoColumns component ===
    AutoColumns: {
      label: createLabel(Grid3x3, "Auto Columns"),
      fields: {
        children: { type: "slot", label: "Content" },
        minWidthMobile: { type: "number", label: "Min width mobile (px)", defaultValue: 160 },
        minWidthTablet: { type: "number", label: "Min width tablet (px)", defaultValue: 200 },
        minWidthDesktop: { type: "number", label: "Min width desktop (px)", defaultValue: 240 },
        gapMobile: { type: "number", label: "Gap mobile (px)", defaultValue: 12 },
        gapTablet: { type: "number", label: "Gap tablet (px)", defaultValue: 16 },
        gapDesktop: { type: "number", label: "Gap desktop (px)", defaultValue: 24 },
        tabletBreakpoint: { type: "number", label: "Tablet â‰¥ px", defaultValue: 640 },
        desktopBreakpoint: { type: "number", label: "Desktop â‰¥ px", defaultValue: 1024 },
        editingPadding: { type: "number", label: "Editing extra padding (px)", defaultValue: 8 },
      },
      render: ({
        children: Content,
        minWidthMobile,
        minWidthTablet,
        minWidthDesktop,
        gapMobile,
        gapTablet,
        gapDesktop,
        tabletBreakpoint,
        desktopBreakpoint,
        editingPadding,
        puck,
      }: any) => {
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const tabletBp = typeof tabletBreakpoint === "number" ? tabletBreakpoint : 640
        const desktopBp = typeof desktopBreakpoint === "number" ? desktopBreakpoint : 1024
        let minTrack = typeof minWidthMobile === "number" ? minWidthMobile : 160
        if (width >= tabletBp && typeof minWidthTablet === "number") minTrack = minWidthTablet
        if (width >= desktopBp && typeof minWidthDesktop === "number") minTrack = minWidthDesktop
        let gap = typeof gapMobile === "number" ? gapMobile : 12
        if (width >= tabletBp && typeof gapTablet === "number") gap = gapTablet
        if (width >= desktopBp && typeof gapDesktop === "number") gap = gapDesktop
        const path = getPathFromPuck(puck)
        const _sel = useSelectedPaths()
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const extraPad = isEditing && editingPadding ? editingPadding : 0
        const style: any = {
          display: "grid",
          width: "100%",
          gridTemplateColumns: `repeat(auto-fit, minmax(${minTrack}px, 1fr))`,
          gap: `${gap}px`,
          padding: extraPad ? `${extraPad}px` : undefined,
        }
        const final = isSelected ? { ...style, ...outlineForSelected } : style
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={(el) => {
              ; (ref as any).current = el
              if (puck?.dragRef) (puck.dragRef as any)(el)
            }}
            data-puck-path={path || undefined}
            style={final}
            onMouseDown={onMouseDown}
          >
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    /**
     * Flex container that only accepts FlexItem children. Users can control
     * common flexbox settings such as gap, wrap, alignment and justification.
     * See Puck's flex container â€“ flex item patternã€579873606476094â€ L667-L786ã€‘.
     */
    FlexContainer: {
      label: createLabel(Columns3, "Flex Container"),
      fields: {
        direction: {
          type: "select",
          label: "Direction",
          options: [
            { label: "Row (â†’)", value: "row" },
            { label: "Column (â†“)", value: "column" },
            { label: "Row Reverse (â†)", value: "row-reverse" },
            { label: "Column Reverse (â†‘)", value: "column-reverse" },
          ],
          defaultValue: "row",
        },
        gap: { type: "number", label: "Gap (px)", defaultValue: 16 },
        wrap: {
          type: "select",
          label: "Wrap",
          options: [
            { label: "No wrap", value: "nowrap" },
            { label: "Wrap", value: "wrap" },
          ],
          defaultValue: "wrap",
        },
        alignItems: {
          type: "select",
          label: "Align items",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Stretch", value: "stretch" },
          ],
          defaultValue: "stretch",
        },
        justifyContent: {
          type: "select",
          label: "Justify content",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Space Between", value: "space-between" },
            { label: "Space Around", value: "space-around" },
            { label: "Space Evenly", value: "space-evenly" },
          ],
          defaultValue: "flex-start",
        },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 100 },
        padding: { type: "number", label: "Padding (px)", defaultValue: 12 },
      },
      render: ({ direction, gap, wrap, alignItems, justifyContent, minHeight, padding, puck }: any) => {
        return (
          <DropZone
            zone="flex-container"
            style={{
              display: "flex",
              flexDirection: direction || "row",
              gap: gap ? `${gap}px` : "16px",
              flexWrap: wrap || "wrap",
              alignItems: alignItems || "stretch",
              justifyContent: justifyContent || "flex-start",
              minHeight: minHeight ? `${minHeight}px` : "100px",
              padding: padding ? `${padding}px` : "12px",
              width: "100%",
              // Visual indicator during editing
              border: "2px solid #3b82f6",
              borderRadius: "4px",
              backgroundColor: "rgba(59, 130, 246, 0.05)",
            }}
          />
        )
      },
    },
    /**
     * Flex item component representing a section within a FlexContainer. Each
     * FlexItem exposes controls for flex-grow, flex-shrink and flex-basis. It
     * disallows nesting of FlexItems to avoid deeply nested flex hierarchiesã€579873606476094â€ L667-L786ã€‘.
     */
    FlexItem: {
      label: createLabel(Layers, "Flex Item"),
      fields: {
        grow: {
          type: "number",
          label: "Flex grow",
          defaultValue: 0,
        },
        shrink: {
          type: "number",
          label: "Flex shrink",
          defaultValue: 1,
        },
        basis: {
          type: "text",
          label: "Flex basis",
          defaultValue: "auto",
        },
        minWidth: {
          type: "number",
          label: "Min width (px)",
          defaultValue: 100,
        },
      },
      render: ({ grow = 0, shrink = 1, basis = "auto", minWidth = 100, puck }: any) => {
        return (
          <div
            style={{
              flexGrow: grow,
              flexShrink: shrink,
              flexBasis: basis,
              minWidth: `${minWidth}px`,
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              background: "#f1f5f9",
            }}
          >
            <DropZone zone="flex-item-content" />
          </div>
        )
      },
    },
    /**
     * Grid container that defines CSS grid layout. By default it uses three
     * equal columns, but users can customise the template string. It only allows
     * GridItem children to be dropped insideã€579873606476094â€ L196-L318ã€‘.
     */
    GridContainer: {
      label: createLabel(LayoutGrid, "Grid Container"),
      fields: {
        children: { type: "slot", label: "Grid Items" },
        layout: {
          type: "select",
          label: "Preset layout",
          options: [
            { label: "Responsive", value: "responsive" },
            { label: "Auto Fit Cards", value: "auto-cards" },
            { label: "Gallery", value: "gallery" },
            { label: "Masonry (approx)", value: "masonry" },
          ],
          defaultValue: "responsive",
        },
        colsMobile: { type: "number", label: "Cols mobile", defaultValue: 1 },
        colsTablet: { type: "number", label: "Cols tablet", defaultValue: 2 },
        colsDesktop: { type: "number", label: "Cols desktop", defaultValue: 3 },
        gapMobile: { type: "number", label: "Gap mobile (px)", defaultValue: 12 },
        gapTablet: { type: "number", label: "Gap tablet (px)", defaultValue: 16 },
        gapDesktop: { type: "number", label: "Gap desktop (px)", defaultValue: 24 },
        autoRows: { type: "text", label: "Auto rows", defaultValue: "minmax(64px, auto)" },
        tabletBreakpoint: { type: "number", label: "Tablet â‰¥ px", defaultValue: 640 },
        desktopBreakpoint: { type: "number", label: "Desktop â‰¥ px", defaultValue: 1024 },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 120 },
        showGridLines: {
          type: "radio",
          label: "Show grid helper lines",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        editingPadding: { type: "number", label: "Editing padding (px)", defaultValue: 8 },
      },
      render: ({
        children: Content,
        layout,
        colsMobile,
        colsTablet,
        colsDesktop,
        gapMobile,
        gapTablet,
        gapDesktop,
        autoRows,
        tabletBreakpoint,
        desktopBreakpoint,
        minHeight,
        showGridLines,
        editingPadding,
        puck,
      }: any) => {
        const isEditing = puck?.isEditing
        const isSelected = puck?.isSelected

        // Simulate responsive behavior in editor
        const containerWidth = 800 // Default editor width
        const tabletBp = typeof tabletBreakpoint === "number" ? tabletBreakpoint : 640
        const desktopBp = typeof desktopBreakpoint === "number" ? desktopBreakpoint : 1024

        let gap = typeof gapMobile === "number" ? gapMobile : 12
        if (containerWidth >= tabletBp && typeof gapTablet === "number") gap = gapTablet
        if (containerWidth >= desktopBp && typeof gapDesktop === "number") gap = gapDesktop

        let template: string
        if (layout === "auto-cards") {
          template = "repeat(auto-fit, minmax(240px, 1fr))"
        } else if (layout === "gallery") {
          template = "repeat(auto-fill, minmax(160px, 1fr))"
        } else if (layout === "masonry") {
          template = "repeat(auto-fill, minmax(200px, 1fr))"
        } else {
          let cols = typeof colsMobile === "number" ? colsMobile : 1
          if (containerWidth >= tabletBp && typeof colsTablet === "number") cols = colsTablet
          if (containerWidth >= desktopBp && typeof colsDesktop === "number") cols = colsDesktop
          template = `repeat(${cols}, minmax(0, 1fr))`
        }

        const extraPad = isEditing && typeof editingPadding === "number" && editingPadding > 0 ? editingPadding : 0

        const style: any = {
          display: "grid",
          width: "100%",
          gridTemplateColumns: template,
          gridAutoRows: autoRows || undefined,
          gap: `${gap}px`,
          padding: extraPad ? `${extraPad}px` : undefined,
          minHeight: isEditing && typeof minHeight === "number" ? `${minHeight}px` : undefined,
          ...(isEditing
            ? {
              outline: isSelected ? "2px solid #6366f1" : "2px dashed #d1d5db",
              outlineOffset: "-2px",
              background: isSelected ? "rgba(99, 102, 241, 0.05)" : "rgba(209, 213, 219, 0.15)",
            }
            : {}),
          position: "relative",
        }

        const showLines = showGridLines === "true" && isEditing

        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={puck?.path}
            style={style}
            onMouseDown={(e) => {
              e.stopPropagation()
              if (isEditing && puck?.onSelect) puck.onSelect()
            }}
          >
            {/* Grid helper overlay showing column boundaries */}
            {showLines && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "grid",
                  gridTemplateColumns: template,
                  gap: `${gap}px`,
                  padding: extraPad ? `${extraPad}px` : undefined,
                  pointerEvents: "none",
                }}
              >
                {Array.from({ length: containerWidth }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRight: "1px solid rgba(99, 102, 241, 0.2)",
                      opacity: 0.5,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Grid size indicator badge */}
            {isEditing && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "rgba(99, 102, 241, 0.9)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {containerWidth >= desktopBp
                  ? `${colsDesktop}Ã—${colsDesktop} desktop`
                  : containerWidth >= tabletBp
                    ? `${colsTablet}Ã—${colsTablet} tablet`
                    : `${colsMobile}Ã—${colsMobile} mobile`}
              </div>
            )}

            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },
    Grid: {
      label: createLabel(LayoutGrid, "Grid"),
      fields: {
        layout: {
          type: "select",
          label: "Preset layout",
          options: [
            { label: "Custom", value: "custom" },
            { label: "Hero Split", value: "hero-split" },
            { label: "Sidebar Left", value: "sidebar-left" },
            { label: "Sidebar Right", value: "sidebar-right" },
            { label: "Feature Cards", value: "feature-cards" },
            { label: "Gallery", value: "gallery" },
            { label: "Bento", value: "bento" },
            { label: "2 Columns", value: "2-col" },
            { label: "3 Columns", value: "3-col" },
            { label: "4 Columns", value: "4-col" },
          ],
          defaultValue: "custom",
        },
        columns: {
          type: "text",
          label: "Column template",
          defaultValue: "repeat(3, 1fr)",
        },
        gap: { type: "number", label: "Gap (px)", defaultValue: 12 },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 64 },
        editingPadding: { type: "number", label: "Editing padding (px)", defaultValue: 8 },
      },
      render: ({ layout, columns, gap, minHeight, editingPadding, puck }: any) => {
        const presetMap: Record<string, string> = {
          "hero-split": "repeat(2, minmax(0,1fr))",
          "sidebar-left": "240px 1fr",
          "sidebar-right": "1fr 240px",
          "feature-cards": "repeat(auto-fit, minmax(240px, 1fr))",
          gallery: "repeat(auto-fill, minmax(160px,1fr))",
          bento: "repeat(6, 1fr)",
          "2-col": "repeat(2, 1fr)",
          "3-col": "repeat(3, 1fr)",
          "4-col": "repeat(4, 1fr)",
        }

        const isEditing = puck?.isEditing
        const extraPad = isEditing && typeof editingPadding === "number" && editingPadding > 0 ? editingPadding : 0

        const base: any = {
          display: "grid",
          width: "100%",
          gridTemplateColumns: presetMap[layout] || columns || undefined,
          gap: gap ? `${gap}px` : undefined,
          padding: extraPad ? `${extraPad}px` : undefined,
        }

        const hint: any = isEditing
          ? {
            minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : undefined,
            outline: "1px dashed #e5e7eb",
            outlineOffset: -4,
            background: "#fafafa",
          }
          : {}

        const style = { ...base, ...hint }

        return (
          <div ref={puck?.dragRef} style={style}>
            <DropZone zone="grid-zone" style={{ display: "contents" }} />
          </div>
        )
      },
    },
    /**
     * Grid item component that lives within a Grid. Users can set column and
     * row spans. Nesting of GridItems is disallowedã€579873606476094â€ L196-L318ã€‘.
     */
    GridItem: {
      label: createLabel(Box, "Grid Item"),
      inline: true,
      fields: {
        children: { type: "slot", label: "Content" },
        columns: { type: "number", label: "Column span", defaultValue: 1 },
        rows: { type: "number", label: "Row span", defaultValue: 1 },
        minWidth: { type: "number", label: "Min width (px)", defaultValue: 0 },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 64 },
        showOverlayLabel: {
          type: "select",
          label: "Show span label",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
      },
      render: ({ children: Content, columns, rows, minWidth, minHeight, showOverlayLabel, puck }: any) => {
        // Wrapper div receives the grid placement styles so span changes are reflected.
        const wrapperStyle: any = {
          gridColumn: `span ${columns || 1}`,
          gridRow: `span ${rows || 1}`,
          minWidth: typeof minWidth === "number" && minWidth > 0 ? `${minWidth}px` : undefined,
          minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : undefined,
          position: "relative",
        }
        const isEditing = isEditingFromPuck(puck)
        const showLabel = isEditing && String(showOverlayLabel) !== "false"
        const hint: any = isEditing
          ? {
            outline: "1px dashed #e5e7eb",
            outlineOffset: -4,
            background: "#fafafa",
            boxSizing: "border-box",
          }
          : {}
        return (
          <div ref={puck?.dragRef} style={{ ...wrapperStyle, ...hint }}>
            {typeof Content === "function" ? <Content /> : null}
            {showLabel ? (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 6,
                  fontSize: 11,
                  fontFamily: "monospace",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  padding: "2px 4px",
                  borderRadius: 4,
                  lineHeight: 1.2,
                  pointerEvents: "none",
                }}
              >
                {`c${columns || 1} r${rows || 1}`}
              </span>
            ) : null}
          </div>
        )
      },
    },
    /**
     * Columns component for multiâ€‘column layouts. Users can select automatic
     * distribution (all columns equal) or manual distribution where each column
     * has its own span value. This pattern is inspired by the puck-pages example.
     */
    Columns: {
      label: createLabel(Columns3, "Columns"),
      fields: {
        distribution: {
          type: "select",
          label: "Distribution",
          options: [
            { label: "Auto", value: "auto" },
            { label: "Manual", value: "manual" },
          ],
          defaultValue: "auto",
        },
        columns: {
          type: "array",
          label: "Columns",
          arrayFields: {
            span: {
              type: "number",
              label: "Span (fr)",
              defaultValue: 1,
            },
          },
          defaultItemProps: { span: 1 },
        },
        gap: { type: "number", label: "Gap (px)", defaultValue: 16 },
        // Visual hint sizes
        minWidth: { type: "number", label: "Min width (px)", defaultValue: 0 },
        minHeight: { type: "number", label: "Min height (px)", defaultValue: 64 },
        /**
         * When the container width is below this value (in pixels), the columns
         * will collapse into a single column. This provides a responsive
         * behaviour for tablet and mobile viewports by stacking the content
         * vertically instead of squishing columns side by side. See the Puck
         * blog on advanced grid and flex layouts for guidance on responsive
         * patternsã€994289787293651â€ L31-L39ã€‘.
         */
        collapseAt: {
          type: "number",
          label: "Collapse width (px)",
          defaultValue: 768,
        },
      },
      defaultProps: {
        distribution: "auto",
        columns: [{ span: 1 }, { span: 1 }, { span: 1 }],
        collapseAt: 768,
      },
      render: ({ distribution, columns, gap, collapseAt, minWidth, minHeight, puck }: any) => {
        const cols = Array.isArray(columns) && columns.length ? columns : [{ span: 1 }]
        // Use element width to determine if we should collapse into a single column.
        const { ref: widthRef, width } = useElementWidth<HTMLDivElement>()
        // Determine collapse breakpoint. Use the collapseAt field if provided, otherwise default to 768.
        const collapseBreakpoint = typeof collapseAt === "number" ? collapseAt : 768
        const collapse = typeof collapseBreakpoint === "number" && width <= collapseBreakpoint
        const template = collapse
          ? `repeat(1, minmax(0, 1fr))`
          : distribution === "manual"
            ? cols.map((col: any) => `minmax(0, ${col?.span || 1}fr)`).join(" ")
            : `repeat(${cols.length}, minmax(0, 1fr))`
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "grid",
          width: "100%",
          gridTemplateColumns: template,
          gap: gap ? `${gap}px` : undefined,
        }
        const hint: any = isEditing
          ? {
            minWidth: typeof minWidth === "number" && minWidth > 0 ? `${minWidth}px` : undefined,
            minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : undefined,
            outline: !isSelected ? "1px dashed #e5e7eb" : undefined,
            outlineOffset: !isSelected ? -4 : undefined,
            background: !isSelected ? "#fafafa" : undefined,
          }
          : {}
        const style = isSelected ? { ...base, ...outlineForSelected, ...hint } : { ...base, ...hint }
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={(el) => {
              // assign to both the widthRef for responsiveness and the puck dragRef
              ; (widthRef as any).current = el
              if (puck?.dragRef) (puck.dragRef as any)(el)
            }}
            data-puck-path={path || undefined}
            style={style}
            onMouseDown={onMouseDown}
          >
            {cols.map((_: any, idx: number) => (
              <div key={idx} style={{ display: "flex", minWidth: 0 }}>
                <DropZone
                  zone={`column-${idx}`}
                  style={{
                    width: "100%",
                    minHeight: typeof minHeight === "number" && minHeight > 0 ? `${minHeight}px` : "64px",
                    outline: "1px dashed #e5e7eb",
                    outlineOffset: -4,
                    background: "#fafafa",
                  }}
                  minEmptyHeight={Math.max(32, typeof minHeight === "number" ? minHeight : 0)}
                />
              </div>
            ))}
          </div>
        )
      },
    },
    /**
     * Space component for vertical spacing.
     */
    Space: {
      label: createLabel(Maximize, "Space"),
      inline: true,
      /**
       * Updated space component to support horizontal, vertical or both directions and
       * to select the spacing size via a number. This offers greater flexibility
       * compared with the original implementation which only set vertical height.
       */
      fields: {
        size: {
          type: "number",
          label: "Size (px)",
          defaultValue: 16,
        },
        direction: {
          type: "select",
          label: "Direction",
          options: [
            { label: "Both", value: "" },
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
          ],
          defaultValue: "",
        },
      },
      defaultProps: {
        size: 16,
        direction: "",
      },
      render: ({ size, direction, puck }: any) => {
        // Determine width/height based on selected direction. When direction is blank (both),
        // apply the size to both dimensions.
        const height = direction === "horizontal" ? undefined : size ? `${size}px` : "16px"
        const width = direction === "vertical" ? undefined : size ? `${size}px` : "16px"
        const base: any = {
          height,
          width,
          display: "block",
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown} />
      },
    },
    /**
     * Heading component for semantic headings.
     */
    Heading: {
      label: createLabel(Type, "Heading"),
      inline: true,
      fields: {
        level: {
          type: "select",
          label: "Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
            { label: "H5", value: "h5" },
            { label: "H6", value: "h6" },
          ],
          defaultValue: "h2",
        },
        text: { type: "text", label: "Text", defaultValue: "Heading" },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        color: { type: "text", label: "Color", defaultValue: "#111827" },
        marginBottom: { type: "number", label: "Bottom (px)", defaultValue: 8 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ level, text, align, color, marginBottom, fontFamily, puck }: any) => {
        const Tag: any = level || "h2"
        const base: any = {
          textAlign: align || undefined,
          color: color || undefined,
          marginBottom: marginBottom ? `${marginBottom}px` : undefined,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <Tag ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {text || "Heading"}
          </Tag>
        )
      },
    },
    /**
     * Text component for paragraphs.
     */
    Text: {
      label: createLabel(AlignLeft, "Text"),
      inline: true,
      fields: {
        text: { type: "textarea", label: "Text", defaultValue: "Lorem ipsum dolor sit ametâ€¦" },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        color: { type: "text", label: "Color", defaultValue: "#374151" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ text, align, color, fontFamily, puck }: any) => {
        const base: any = {
          textAlign: align || undefined,
          color: color || undefined,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <p ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {text}
          </p>
        )
      },
    },

    /**
     * RichText component for rendering arbitrary HTML content. This simple
     * implementation stores the HTML string in a textarea and renders it via
     * dangerouslySetInnerHTML. Editors can adjust text alignment and colour.
     * When editing, selection outlines are applied in the same way as for
     * other components. This component provides a lightweight alternative to
     * more fullâ€‘featured rich text editors and is inspired by community
     * plugins referenced in the awesomeâ€‘puck repositoryã€62556322094410â€ L6-L31ã€‘.
     */
    RichText: {
      label: createLabel(FileText, "Rich Text"),
      inline: true,
      fields: {
        html: {
          type: "textarea",
          label: "HTML",
          defaultValue: "<p>Rich text goes here</p>",
        },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        color: { type: "text", label: "Color", defaultValue: "#374151" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code', 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ html, align, color, fontFamily, puck }: any) => {
        const base: any = {
          textAlign: align || undefined,
          color: color || undefined,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            style={style}
            onMouseDown={onMouseDown}
            dangerouslySetInnerHTML={{ __html: html || "" }}
          />
        )
      },
    },
    /**
     * Image component with adjustable dimensions and object fit.
     */
    Image: {
      label: createLabel(ImageIcon, "Image"),
      inline: true,
      fields: {
        src: {
          type: "text",
          label: "Source",
          defaultValue: "https://via.placeholder.com/800x400?text=Image",
        },
        alt: { type: "text", label: "Alt", defaultValue: "" },
        width: { type: "number", label: "Width (px)", defaultValue: 800 },
        height: { type: "number", label: "Height (px)", defaultValue: 400 },
        objectFit: {
          type: "select",
          label: "Object fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
            { label: "Fill", value: "fill" },
            { label: "None", value: "none" },
          ],
          defaultValue: "cover",
        },
        radius: { type: "number", label: "Radius (px)", defaultValue: 0 },
      },
      render: ({ src, alt, width, height, objectFit, radius, puck }: any) => {
        const base: any = {
          width: typeof width === "number" ? `${width}px` : undefined,
          height: typeof height === "number" ? `${height}px` : undefined,
          objectFit: objectFit || undefined,
          borderRadius: radius ? `${radius}px` : undefined,
          display: "block",
          maxWidth: "100%",
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <img
            ref={puck?.dragRef as any}
            data-puck-path={path || undefined}
            style={style}
            src={src || "/placeholder.svg"}
            alt={alt || ""}
            onMouseDown={onMouseDown}
          />
        )
      },
    },
    /**
     * Button component with variant, size and shape options.
     */
    Button: {
      label: "Button",
      inline: true,
      fields: {
        label: { type: "text", label: "Label", defaultValue: "Get started" },
        href: { type: "text", label: "URL", defaultValue: "#" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
          defaultValue: "solid",
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
          defaultValue: "md",
        },
        rounded: {
          type: "select",
          label: "Shape",
          options: [
            { label: "Rounded", value: "rounded" },
            { label: "Pill", value: "pill" },
          ],
          defaultValue: "rounded",
        },
        // Define an actions array allowing multiple actions to be triggered
        // when certain events occur on the button. Each action has a type
        // defined in actions.tsx and optional parameters depending on the type.
        actions: {
          type: "array",
          label: "Actions",
          arrayFields: {
            event: {
              type: "select",
              label: "Event",
              options: [
                { label: "Click", value: "click" },
                { label: "Mouse enter", value: "mouseenter" },
                { label: "Mouse leave", value: "mouseleave" },
              ],
              defaultValue: "click",
            },
            type: {
              type: "select",
              label: "Action type",
              options: [
                { label: "Navigate", value: "navigate" },
                { label: "Scroll to", value: "scrollTo" },
                { label: "Copy text", value: "copy" },
                { label: "Emit event", value: "emit" },
                { label: "Toggle flag", value: "toggle" },
                { label: "Set flag", value: "setFlag" },
                { label: "Run JS", value: "runJS" },
              ],
              defaultValue: "navigate",
            },
            url: { type: "text", label: "URL" },
            target: {
              type: "select",
              label: "Target",
              options: [
                { label: "_self", value: "_self" },
                { label: "_blank", value: "_blank" },
              ],
              defaultValue: "_self",
            },
            selector: { type: "text", label: "Selector" },
            targetElId: { type: "text", label: "Element ID" },
            offset: { type: "number", label: "Offset (px)", defaultValue: 0 },
            smooth: {
              type: "select",
              label: "Smooth scroll",
              options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ],
              defaultValue: "true",
            },
            text: { type: "text", label: "Text" },
            name: { type: "text", label: "Event name" },
            detail: { type: "text", label: "Event detail" },
            flag: { type: "text", label: "Flag name" },
            value: {
              type: "select",
              label: "Flag value",
              options: [
                { label: "True", value: "true" },
                { label: "False", value: "false" },
              ],
              defaultValue: "true",
            },
            code: { type: "text", label: "JS code" },
          },
          // Define which fields are shown depending on the action type. This avoids
          // exposing irrelevant fields when configuring toggle flags or copy actions.
          resolveFields: (item: any) => {
            const t = item?.type || "navigate"
            return {
              url: t === "navigate",
              target: t === "navigate",
              selector: t === "scrollTo",
              targetElId: t === "scrollTo",
              offset: t === "scrollTo",
              smooth: t === "scrollTo",
              text: t === "copy",
              name: t === "emit",
              detail: t === "emit",
              flag: t === "toggle" || t === "setFlag",
              value: t === "setFlag",
              code: t === "runJS",
            }
          },
          defaultItemProps: { event: "click", type: "toggle", flag: "", value: "true" },
          getItemSummary: (a: any) => a?.type || "action",
        },
      },
      render: ({ label, href, variant, size, rounded, fontFamily, actions, puck }: any) => {
        // Grab the ActionState context. Passing this context to runActions ensures
        // that flags and toggle actions work reliably when buttons are clicked.
        const actionState = useActionState()
        const pad = size === "sm" ? "0.375rem 0.75rem" : size === "lg" ? "0.75rem 1.25rem" : "0.5rem 1rem"
        const radius = rounded === "pill" ? "9999px" : "0.5rem"
        let bg = "#111827",
          fg = "#ffffff",
          border = "none"
        if (variant === "outline") {
          bg = "transparent"
          fg = "#111827"
          border = "1px solid #111827"
        }
        if (variant === "ghost") {
          bg = "transparent"
          fg = "#111827"
          border = "none"
        }
        const base: any = {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: pad,
          borderRadius: radius,
          background: bg,
          color: fg,
          border,
          fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          cursor: "pointer",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const handleEvent = async (eventName: string, e: any) => {
          // Filter actions matching the event
          const acts = Array.isArray(actions) ? actions.filter((a: any) => (a?.event || "click") === eventName) : []
          if (acts.length) {
            await runActions(acts as any, { isEditing, currentEl: e?.currentTarget, ctxOverride: actionState })
          }
        }
        const onClick = async (e: any) => {
          // Determine actions attached to the click event. If any exist we should suppress
          // the anchor's default navigation to allow runActions to handle navigation first.
          const clickActs = Array.isArray(actions) ? actions.filter((a: any) => (a?.event || "click") === "click") : []
          if (isEditing || clickActs.length > 0) {
            e.preventDefault()
            e.stopPropagation()
          }
          await handleEvent("click", e)
        }
        const onMouseEnter = async (e: any) => {
          await handleEvent("mouseenter", e)
        }
        const onMouseLeave = async (e: any) => {
          await handleEvent("mouseleave", e)
        }
        // Determine whether this button has any actions bound to the click event. If
        // so, we suppress the anchor's href by setting it to "#" regardless of the
        // userâ€‘provided URL. Without this guard, a navigate action or accidental
        // string typed into the URL field could override the runActions logic and
        // navigate away before other actions (such as toggling a modal flag) execute.
        const clickActions = Array.isArray(actions) ? actions.filter((a: any) => (a?.event || "click") === "click") : []
        const anchorHref = clickActions.length > 0 ? "#" : href || "#"
        return (
          <a
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            href={anchorHref}
            style={style}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {label || "Get started"}
          </a>
        )
      },
    },
    /**
     * Hero section for landing pages. Provides controls for eyebrow, title,
     * subtitle, alignment, colours and callâ€‘toâ€‘action buttons.
     */
    Hero: {
      label: createLabel(Flame, "Hero"),
      fields: {
        eyebrow: { type: "text", label: "Eyebrow", defaultValue: "" },
        title: {
          type: "text",
          label: "Title",
          defaultValue: "Your product, highlighted",
        },
        subtitle: {
          type: "textarea",
          label: "Subtitle",
          defaultValue: "A short description of the main value proposition goes here.",
        },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        textColor: { type: "text", label: "Text color", defaultValue: "#111827" },
        background: {
          type: "text",
          label: "Background (color, gradient, url(...))",
          defaultValue: "#ffffff",
        },
        overlayColor: { type: "text", label: "Overlay color", defaultValue: "#000000" },
        overlayOpacity: {
          type: "number",
          label: "Overlay opacity (0-1)",
          defaultValue: 0,
        },
        // Slot for nested content inside the hero. Without an explicit allow list the hero
        // can accept any registered component. Nested content is rendered after the
        // callâ€‘toâ€‘action buttons.
        children: {
          type: "slot",
          label: "Extra Content",
        },
        maxWidth: { type: "text", label: "Content max width", defaultValue: "768px" },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 64 },
        ctaLabel: { type: "text", label: "Primary CTA label", defaultValue: "Get started" },
        ctaHref: { type: "text", label: "Primary CTA URL", defaultValue: "#" },
        ctaVariant: {
          type: "select",
          label: "Primary CTA variant",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
          defaultValue: "solid",
        },
        cta2Label: { type: "text", label: "Secondary CTA label", defaultValue: "" },
        cta2Href: { type: "text", label: "Secondary CTA URL", defaultValue: "#" },
        cta2Variant: {
          type: "select",
          label: "Secondary CTA variant",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
          defaultValue: "outline",
        },
        // Image fields to embed a picture within the hero. The image can be shown
        // above or below the text and CTAs. If no src is provided no image is rendered.
        imageSrc: { type: "text", label: "Image URL", defaultValue: "" },
        imageAlt: { type: "text", label: "Image alt text", defaultValue: "" },
        imagePosition: {
          type: "select",
          label: "Image position",
          options: [
            { label: "Above content", value: "above" },
            { label: "Below content", value: "below" },
          ],
          defaultValue: "above",
        },
        imageWidth: {
          type: "number",
          label: "Image width (px)",
          defaultValue: 600,
        },
        imageHeight: {
          type: "number",
          label: "Image height (px)",
          defaultValue: 400,
        },
        fontFamily: {
          type: "select",
          label: "Font (title/subtitle)",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: (props: any) => {
        const {
          children: Content,
          eyebrow,
          title,
          subtitle,
          align,
          textColor,
          background,
          overlayColor,
          overlayOpacity,
          maxWidth,
          paddingY,
          ctaLabel,
          ctaHref,
          ctaVariant,
          cta2Label,
          cta2Href,
          cta2Variant,
          imageSrc,
          imageAlt,
          imagePosition,
          imageWidth,
          imageHeight,
          fontFamily,
          puck,
        } = props || {}
        // Compute hero image element once. If no src is provided then heroImage is null.
        const heroImage = imageSrc ? (
          <img
            src={String(imageSrc) || "/placeholder.svg"}
            alt={String(imageAlt || "")}
            style={{
              width: typeof imageWidth === "number" ? `${imageWidth}px` : undefined,
              height: typeof imageHeight === "number" ? `${imageHeight}px` : undefined,
              maxWidth: "100%",
              borderRadius: 8,
            }}
          />
        ) : null
        const base: any = {
          position: "relative",
          paddingTop: typeof paddingY === "number" ? `${paddingY}px` : undefined,
          paddingBottom: typeof paddingY === "number" ? `${paddingY}px` : undefined,
          background: background || undefined,
          color: textColor || undefined,
        }
        const inner: any = {
          margin: "0 auto",
          maxWidth: maxWidth || undefined,
          textAlign: align as any,
        }
        // Helper to compute CTA styles.
        const btnStyle = (variant: string): any => {
          let bg = "#111827",
            fg = "#ffffff",
            border = "none"
          if (variant === "outline") {
            bg = "transparent"
            fg = "#111827"
            border = "1px solid #111827"
          }
          if (variant === "ghost") {
            bg = "transparent"
            fg = "#111827"
            border = "none"
          }
          return {
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: bg,
            color: fg,
            border,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const preventNav = (e: any) => {
          if (isEditing) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
        return (
          <section ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {overlayColor && typeof overlayOpacity === "number" && overlayOpacity > 0 ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: overlayColor,
                  opacity: Math.max(0, Math.min(1, overlayOpacity)),
                }}
              />
            ) : null}
            <div style={{ position: "relative", paddingLeft: 16, paddingRight: 16 }}>
              <div style={inner}>
                {/* Insert hero image at the top if configured to appear above the content */}
                {heroImage && String(imagePosition || "above") !== "below" ? (
                  <div style={{ marginBottom: 16 }}>{heroImage}</div>
                ) : null}
                {eyebrow ? (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    {eyebrow}
                  </div>
                ) : null}
                {title ? (
                  <h2
                    style={{
                      fontSize: 36,
                      lineHeight: 1.2,
                      fontWeight: 700,
                      marginBottom: 12,
                      fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                    }}
                  >
                    {title}
                  </h2>
                ) : null}
                {subtitle ? (
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.6,
                      opacity: 0.9,
                      marginBottom: 16,
                      fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
                {ctaLabel || cta2Label ? (
                  <div
                    style={{
                      display: "inline-flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {ctaLabel ? (
                      <a href={ctaHref || "#"} style={btnStyle(String(ctaVariant || "solid"))} onClick={preventNav}>
                        {ctaLabel}
                      </a>
                    ) : null}
                    {cta2Label ? (
                      <a href={cta2Href || "#"} style={btnStyle(String(cta2Variant || "outline"))} onClick={preventNav}>
                        {cta2Label}
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {/* Insert hero image below the content and CTAs when position is below */}
                {heroImage && String(imagePosition || "above") === "below" ? (
                  <div style={{ marginTop: 16 }}>{heroImage}</div>
                ) : null}
                {/* Render any nested content after the CTAs and hero image */}
                {typeof Content === "function" ? (
                  <div style={{ marginTop: 16 }}>
                    <Content />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )
      },
    },
    /**
     * Video component for embedding YouTube videos. Accepts a URL and height and
     * computes the embed URL automatically.
     */
    Video: {
      label: createLabel(Play, "Video"),
      inline: true,
      fields: {
        url: { type: "text", label: "YouTube URL", defaultValue: "" },
        height: { type: "number", label: "Height (px)", defaultValue: 400 },
      },
      render: ({ url, height, puck }: any) => {
        // Compute YouTube embed URL. Supports youtu.be and youtube.com links.
        let embedSrc = ""
        try {
          if (url) {
            const u = new URL(url)
            if (u.hostname.includes("youtu.be")) {
              embedSrc = `https://www.youtube.com/embed${u.pathname}`
            } else if (u.hostname.includes("youtube.com")) {
              const v = u.searchParams.get("v")
              if (v) embedSrc = `https://www.youtube.com/embed/${v}`
              else embedSrc = url
            } else {
              embedSrc = url
            }
          }
        } catch {
          embedSrc = url || ""
        }
        const base: any = {
          width: "100%",
          height: typeof height === "number" ? `${height}px` : "400px",
          border: "none",
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            style={{ width: "100%" }}
            onMouseDown={onMouseDown}
          >
            {embedSrc ? (
              <iframe
                title="Video"
                src={embedSrc}
                style={style}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div
                style={{
                  ...style,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                }}
              >
                <span style={{ opacity: 0.5 }}>Enter a YouTube URL</span>
              </div>
            )}
          </div>
        )
      },
    },
    /**
     * Gallery component for displaying a grid of images.
     */
    Gallery: {
      label: createLabel(Images, "Gallery"),
      fields: {
        images: {
          type: "array",
          label: "Images",
          arrayFields: {
            src: { type: "text", label: "Image URL", defaultValue: "" },
            alt: { type: "text", label: "Alt text", defaultValue: "" },
          },
          defaultItemProps: { src: "", alt: "" },
        },
        columns: { type: "number", label: "Columns", defaultValue: 3 },
        gap: { type: "number", label: "Gap (px)", defaultValue: 8 },
      },
      defaultProps: {
        images: [
          { src: "https://via.placeholder.com/600x400?text=Gallery+1", alt: "Gallery image 1" },
          { src: "https://via.placeholder.com/600x400?text=Gallery+2", alt: "Gallery image 2" },
          { src: "https://via.placeholder.com/600x400?text=Gallery+3", alt: "Gallery image 3" },
        ],
      },
      render: ({ images, columns, gap, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "grid",
          gridTemplateColumns: `repeat(${columns || 1}, minmax(0, 1fr))`,
          gap: gap ? `${gap}px` : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const imgs = Array.isArray(images) ? images : []
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {imgs.map((img: any, idx: number) => (
              <img
                key={idx}
                src={img?.src || "https://via.placeholder.com/600x400?text=Image"}
                alt={img?.alt || ""}
                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover", borderRadius: "0.25rem" }}
              />
            ))}
          </div>
        )
      },
    },
    /**
     * Testimonials component. Uses an array field to manage quotes and authors.
     */
    Testimonials: {
      label: "Testimonials",
      fields: {
        items: {
          type: "array",
          label: "Testimonials",
          arrayFields: {
            quote: { type: "textarea", label: "Quote", defaultValue: "" },
            author: { type: "text", label: "Author", defaultValue: "" },
          },
          defaultItemProps: { quote: "", author: "" },
          getItemSummary: (props: any) => (props?.quote ? `${props.quote.slice(0, 20)}â€¦` : "Testimonial"),
        },
        background: { type: "text", label: "Background", defaultValue: "#f9fafb" },
        textColor: { type: "text", label: "Text color", defaultValue: "#111827" },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "center",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        items: [
          { quote: "Puck makes building pages a breeze.", author: "Jane Doe" },
          { quote: "Our marketing team loves using this editor!", author: "John Smith" },
        ],
      },
      render: ({ items, background, textColor, align, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          background: background || undefined,
          color: textColor || undefined,
          padding: "2rem 1rem",
          textAlign: align || "center",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const testimonials = Array.isArray(items) ? items : []
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <div style={{ maxWidth: "640px", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
              {testimonials.map((item: any, idx: number) => (
                <div key={idx}>
                  <p style={{ fontStyle: "italic", marginBottom: "0.5rem" }}>â€œ{item?.quote || ""}â€</p>
                  <p style={{ fontWeight: 600 }}>{item?.author || ""}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
    },
    /**
     * LinksList component for simple link lists.
     */
    LinksList: {
      label: createLabel(Link2, "Links List"),
      fields: {
        title: { type: "text", label: "Title", defaultValue: "Useful Links" },
        items: {
          type: "array",
          label: "Links",
          arrayFields: {
            label: { type: "text", label: "Label", defaultValue: "" },
            url: { type: "text", label: "URL", defaultValue: "" },
          },
          defaultItemProps: { label: "", url: "" },
          getItemSummary: (props: any) => props?.label || "Link",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        items: [
          { label: "Learn more about Puck", url: "https://puckeditor.com" },
          { label: "GitHub", url: "https://github.com/measuredco/puck" },
        ],
      },
      render: ({ title, items, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const links = Array.isArray(items) ? items : []
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {title ? <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3> : null}
            <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
              {links.map((item: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "0.25rem" }}>
                  <a href={item?.url || "#"} style={{ textDecoration: "underline", color: "#2563eb" }}>
                    {item?.label || ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      },
    },
    /**
     * Logos component for displaying a set of logos in a grid. Items can optionally
     * link to a URL.
     */
    Logos: {
      label: createLabel(Star, "Logos"),
      fields: {
        items: {
          type: "array",
          label: "Logos",
          arrayFields: {
            src: { type: "text", label: "Image URL", defaultValue: "" },
            alt: { type: "text", label: "Alt text", defaultValue: "" },
            url: { type: "text", label: "Link URL", defaultValue: "" },
          },
          defaultItemProps: { src: "", alt: "", url: "" },
          getItemSummary: (props: any) => (props?.src ? props.src.split("/").pop() : "Logo"),
        },
        columns: { type: "number", label: "Columns", defaultValue: 5 },
        gap: { type: "number", label: "Gap (px)", defaultValue: 16 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        items: [
          {
            src: "https://raw.githubusercontent.com/measuredco/puck/main/examples/components/github.png",
            alt: "GitHub",
            url: "https://github.com",
          },
          {
            src: "https://raw.githubusercontent.com/measuredco/puck/main/examples/components/vercel.png",
            alt: "Vercel",
            url: "https://vercel.com",
          },
          {
            src: "https://raw.githubusercontent.com/measuredco/puck/main/examples/components/netlify.png",
            alt: "Netlify",
            url: "https://www.netlify.com",
          },
          {
            src: "https://raw.githubusercontent.com/measuredco/puck/main/examples/components/react.png",
            alt: "React",
            url: "https://react.dev",
          },
          {
            src: "https://raw.githubusercontent.com/measuredco/puck/main/examples/components/nextjs.png",
            alt: "Next.js",
            url: "https://nextjs.org",
          },
        ],
      },
      render: ({ items, columns, gap, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "grid",
          gridTemplateColumns: `repeat(${columns || 1}, minmax(0, 1fr))`,
          gap: gap ? `${gap}px` : undefined,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const logos = Array.isArray(items) ? items : []
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {logos.map((logo: any, idx: number) => {
              const img = (
                <img
                  key={idx}
                  src={logo?.src || "https://via.placeholder.com/200x100?text=Logo"}
                  alt={logo?.alt || ""}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    padding: "0.5rem",
                  }}
                />
              )
              return logo?.url ? (
                <a key={idx} href={logo.url} style={{ display: "block" }}>
                  {img}
                </a>
              ) : (
                img
              )
            })}
          </div>
        )
      },
    },
    /**
     * Navbar component. This responsive navigation bar supports a brand
     * (text and optional logo), a list of links and collapses into a mobile
     * drawer when the viewport width drops below the specified breakpoint.
     * Users can customise link alignment, gap and menu label. The Navbar
     * respects Puckâ€™s editing state: navigation links prevent navigation
     * during editing and the bar shows a selection outline when selected.
     */
    Navbar: {
      label: createLabel(Menu, "Navbar"),
      inline: true,
      fields: {
        brand: { type: "text", label: "Brand", defaultValue: "Brand" },
        brandHref: { type: "text", label: "Brand URL", defaultValue: "/" },
        brandImageSrc: { type: "text", label: "Logo URL", defaultValue: "" },
        brandImageWidth: { type: "number", label: "Logo width (px)", defaultValue: 24 },
        brandImageHeight: { type: "number", label: "Logo height (px)", defaultValue: 24 },
        align: {
          type: "select",
          label: "Link alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "right",
        },
        paddingX: { type: "number", label: "Padding X (px)", defaultValue: 16 },
        paddingY: { type: "number", label: "Padding Y (px)", defaultValue: 12 },
        gap: { type: "number", label: "Gap (px)", defaultValue: 12 },
        collapseAt: { type: "number", label: "Collapse below (px)", defaultValue: 768 },
        menuButtonLabel: { type: "text", label: "Mobile menu label", defaultValue: "Menu" },
        mobileMenuPosition: {
          type: "select",
          label: "Mobile menu side",
          options: [
            { label: "Right", value: "right" },
            { label: "Left", value: "left" },
          ],
          defaultValue: "right",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
        links: {
          type: "array",
          label: "Links",
          arrayFields: {
            label: { type: "text", label: "Label", defaultValue: "Link" },
            href: { type: "text", label: "URL", defaultValue: "#" },
            target: {
              type: "select",
              label: "Target",
              options: [
                { label: "_self", value: "_self" },
                { label: "_blank", value: "_blank" },
              ],
              defaultValue: "_self",
            },
            active: {
              type: "select",
              label: "Active",
              options: [
                { label: "No", value: "false" },
                { label: "Yes", value: "true" },
              ],
              defaultValue: "false",
            },
          },
          defaultItemProps: { label: "About", href: "#", target: "_self", active: "false" },
          getItemSummary: (it: any) => it?.label || "Link",
        },
      },
      render: (props: any) => {
        const {
          brand,
          brandHref,
          brandImageSrc,
          brandImageWidth,
          brandImageHeight,
          align,
          paddingX,
          paddingY,
          gap,
          collapseAt,
          menuButtonLabel,
          mobileMenuPosition,
          fontFamily,
          links,
          puck,
        } = props || {}
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const [open, setOpen] = useState(false)
        const collapsePoint = Number(collapseAt || 0) || 0
        const collapsed = collapsePoint > 0 && width > 0 && width < collapsePoint
        const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const baseNav: any = {
          padding: `${paddingY ?? 12}px ${paddingX ?? 16}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: gap ?? 12,
          position: "relative",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const navStyle = isSelected ? { ...baseNav, ...outlineForSelected } : baseNav
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        // Prevent navigation when editing
        const preventNav = (e: any) => {
          if (isEditing) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
        return (
          <nav ref={puck?.dragRef} data-puck-path={path || undefined} style={navStyle} onMouseDown={onMouseDown}>
            <div ref={ref} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
              <a
                href={brandHref || "/"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 600,
                }}
                onClick={preventNav}
              >
                {brandImageSrc ? (
                  <img
                    src={brandImageSrc || "/placeholder.svg"}
                    alt={brand || "Brand"}
                    style={{ width: brandImageWidth || 24, height: brandImageHeight || 24, objectFit: "contain" }}
                  />
                ) : null}
                <span>{brand || "Brand"}</span>
              </a>
              {collapsed ? (
                <div style={{ marginLeft: "auto", position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 8,
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "inherit",
                    }}
                  >
                    {menuButtonLabel || "Menu"}
                  </button>
                  <div
                    style={{
                      display: open ? "block" : "none",
                      position: "absolute",
                      [mobileMenuPosition === "left" ? "left" : "right"]: 0,
                      top: "100%",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 4,
                      padding: 8,
                      zIndex: 100,
                      minWidth: 160,
                      boxShadow: "0 2px 8px rgba(0,0,0,.1)",
                    }}
                  >
                    {(Array.isArray(links) ? links : []).map((l: any, i: number) => (
                      <a
                        key={i}
                        href={l?.href || "#"}
                        target={l?.target || "_self"}
                        style={{
                          display: "block",
                          color: "inherit",
                          textDecoration: "none",
                          padding: "0.25rem 0.5rem",
                        }}
                        onClick={preventNav}
                      >
                        {l?.label || "Link"}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: justify,
                    gap: gap ?? 12,
                    marginLeft: 12,
                  }}
                >
                  {(Array.isArray(links) ? links : []).map((l: any, i: number) => {
                    const active = String(l?.active) === "true"
                    return (
                      <a
                        key={i}
                        href={l?.href || "#"}
                        target={l?.target || "_self"}
                        style={{
                          color: "inherit",
                          textDecoration: "none",
                          padding: "0.25rem 0.5rem",
                          opacity: active ? 1 : 0.9,
                          fontWeight: active ? 600 : 500,
                        }}
                        onClick={preventNav}
                      >
                        {l?.label || "Link"}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        )
      },
    },

    /**
     * TypingText component displays animated typing text. It uses the
     * TypingTextComponent helper to progressively reveal characters. Users can
     * control the text, speed, looping, loop delay, cursor, colour and font size.
     */
    TypingText: {
      label: createLabel(Clock, "Texte animÃ©"),
      inline: true,
      fields: {
        text: { type: "text", label: "Text", defaultValue: "Hello, world!" },
        speed: { type: "number", label: "Speed (ms)", defaultValue: 100 },
        loop: {
          type: "select",
          label: "Loop",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "false",
        },
        loopDelay: { type: "number", label: "Loop delay (ms)", defaultValue: 2000 },
        cursor: {
          type: "select",
          label: "Show cursor",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        color: { type: "text", label: "Colour", defaultValue: "#111827" },
        fontSize: { type: "number", label: "Font size (px)", defaultValue: 20 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ text, speed, loop, loopDelay, cursor, color, fontSize, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <TypingTextComponent
              text={text || ""}
              speed={Number(speed) || 100}
              loop={String(loop || "false") === "true"}
              loopDelay={Number(loopDelay) || 2000}
              cursor={String(cursor || "true") !== "false"}
              color={color || undefined}
              fontSize={typeof fontSize === "number" ? fontSize : undefined}
            />
          </div>
        )
      },
    },
    /**
     * QrCode component renders a QR code using the public api.qrserver.com service.
     * Provide a URL or text in the `url` field and adjust the size in pixels.
     */
    QrCode: {
      label: "QR Code",
      inline: true,
      fields: {
        url: { type: "text", label: "URL or text", defaultValue: "https://example.com" },
        size: { type: "number", label: "Size (px)", defaultValue: 200 },
      },
      render: ({ url, size, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { display: "inline-block" }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const data = encodeURIComponent(url || "")
        const sz = typeof size === "number" ? size : 200
        const src = `https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=${sz}x${sz}`
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <img src={src || "/placeholder.svg"} alt={url || "QR Code"} width={sz} height={sz} />
          </div>
        )
      },
    },
    /**
     * SpotifyCard embeds a Spotify track, album or playlist. Provide any
     * Spotify URL (open.spotify.com) and the component converts it into an embed.
     */
    SpotifyCard: {
      label: "Carte Spotify",
      inline: true,
      fields: {
        url: { type: "text", label: "Spotify URL", defaultValue: "" },
        height: { type: "number", label: "Height (px)", defaultValue: 352 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ url, height, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { width: "100%", fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        let embedUrl = ""
        try {
          if (url) {
            embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/")
          }
        } catch {
          embedUrl = url || ""
        }
        const h = typeof height === "number" ? height : 352
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {embedUrl ? (
              <iframe
                title="Spotify player"
                src={embedUrl}
                width="100%"
                height={h}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: h,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                }}
              >
                <span style={{ opacity: 0.6 }}>Enter a Spotify URL</span>
              </div>
            )}
          </div>
        )
      },
    },
    /**
     * ExternalPost displays a link to an external article with a title, description
     * and optional image. It offers simple fields for editors to create curated
     * link cards.
     */
    ExternalPost: {
      label: "Article externe",
      inline: true,
      fields: {
        title: { type: "text", label: "Title", defaultValue: "External article" },
        url: { type: "text", label: "Article URL", defaultValue: "" },
        description: { type: "textarea", label: "Description", defaultValue: "" },
        image: { type: "text", label: "Image URL", defaultValue: "" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ title, url, description, image, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {image ? (
              <img
                src={image || "/placeholder.svg"}
                alt={title || ""}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }}
              />
            ) : null}
            <div style={{ flex: 1 }}>
              {title ? (
                <h4 style={{ marginTop: 0, marginBottom: 4 }}>
                  {url ? (
                    <a href={url} style={{ color: "#2563eb", textDecoration: "underline" }}>
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </h4>
              ) : null}
              {description ? <p style={{ marginTop: 0, marginBottom: 0, opacity: 0.8 }}>{description}</p> : null}
            </div>
          </div>
        )
      },
    },
    /**
     * ColorBox renders a box with a custom colour, width and height. This simple
     * utility component can highlight sections or act as a spacer.
     */
    ColorBox: {
      label: createLabel(Palette, "BoÃ®te de couleur"),
      inline: true,
      fields: {
        color: { type: "text", label: "Colour", defaultValue: "#f3f4f6" },
        width: { type: "number", label: "Width (px)", defaultValue: 100 },
        height: { type: "number", label: "Height (px)", defaultValue: 100 },
        borderRadius: { type: "number", label: "Border radius (px)", defaultValue: 8 },
      },
      render: ({ color, width, height, borderRadius, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          background: color || "#f3f4f6",
          width: typeof width === "number" ? `${width}px` : undefined,
          height: typeof height === "number" ? `${height}px` : undefined,
          borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown} />
      },
    },
    /**
     * Card is a flexible container with optional header, body and footer
     * slots. Editors can adjust background, padding and border radius. This
     * component is intended for general content presentation.
     */
    Card: {
      label: createLabel(CreditCard, "Carte"),
      inline: true,
      fields: {
        header: { type: "slot", label: "Header" },
        body: { type: "slot", label: "Body" },
        footer: { type: "slot", label: "Footer" },
        background: { type: "text", label: "Background", defaultValue: "#ffffff" },
        padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
        borderRadius: { type: "number", label: "Border radius (px)", defaultValue: 8 },
        border: { type: "text", label: "Border", defaultValue: "" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({
        header: HeaderSlot,
        body: BodySlot,
        footer: FooterSlot,
        background,
        padding,
        borderRadius,
        border,
        fontFamily,
        puck,
      }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          background: background || "#ffffff",
          padding: typeof padding === "number" ? `${padding}px` : undefined,
          borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : undefined,
          border: border || undefined,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {typeof HeaderSlot === "function" ? (
              <div style={{ marginBottom: 8 }}>
                <HeaderSlot />
              </div>
            ) : null}
            {typeof BodySlot === "function" ? (
              <div style={{ marginBottom: 8 }}>
                <BodySlot />
              </div>
            ) : null}
            {typeof FooterSlot === "function" ? (
              <div>
                <FooterSlot />
              </div>
            ) : null}
          </div>
        )
      },
    },

    /**
     * RemoteData fetches JSON from a configurable URL and renders the
     * result. Editors can choose the HTTP method and optionally include a
     * request body. A property path can be provided to extract a nested
     * value from the response. The fetched data is displayed in a
     * <pre> tag by default. Errors are shown when the fetch fails.
     */
    RemoteData: {
      label: createLabel(Database, "Remote data"),
      inline: true,
      fields: {
        url: { type: "text", label: "Request URL", defaultValue: "https://jsonplaceholder.typicode.com/posts" },
        method: {
          type: "select",
          label: "Method",
          options: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
          ],
          defaultValue: "GET",
        },
        body: { type: "textarea", label: "Request body (JSON)", defaultValue: "" },
        property: { type: "text", label: "Response property path", defaultValue: "" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ url, method, body, property, fontFamily, puck }: any) => {
        const [data, setData] = useState<any>(null)
        const [error, setError] = useState<any>(null)
        const [loading, setLoading] = useState<boolean>(false)
        useEffect(() => {
          let cancelled = false
          async function fetchData() {
            if (!url) return
            setLoading(true)
            setError(null)
            try {
              const opts: any = { method: method || "GET" }
              if (String(method || "GET").toUpperCase() === "POST" && body) {
                opts.headers = { "Content-Type": "application/json" }
                opts.body = body
              }
              const res = await fetch(url, opts)
              const json = await res.json()
              let value: any = json
              try {
                const path = String(property || "")
                  .split(".")
                  .filter(Boolean)
                for (const key of path) {
                  value = value?.[key]
                }
              } catch { }
              if (!cancelled) setData(value)
            } catch (err: any) {
              if (!cancelled) setError(err?.message || "Fetch error")
            } finally {
              if (!cancelled) setLoading(false)
            }
          }
          fetchData()
          return () => {
            cancelled = true
          }
        }, [url, method, body, property])
        const pathId = getPathFromPuck(puck)
        const isSelected = selectionStore.has(pathId)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { width: "100%", fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(pathId, true)
          else selectionStore.toggle(pathId, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={pathId || undefined} style={style} onMouseDown={onMouseDown}>
            {loading ? <p>Loading...</p> : null}
            {error ? <p style={{ color: "red" }}>{String(error)}</p> : null}
            {!loading && !error ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 14 }}>
                {data !== null && data !== undefined ? JSON.stringify(data, null, 2) : "No data"}
              </pre>
            ) : null}
          </div>
        )
      },
    },

    /**
     * Sidebar component. This vertical navigation bar can stick to the left
     * or right of the page. It supports collapsing below a breakpoint and
     * can be controlled via an ActionState flag. When collapsed, a toggle
     * button appears and the sidebar slides into view. Overlay can be
     * optionally enabled on mobile. The component emphasises simplicity over
     * configurability while maintaining professional UX.
     */
    Sidebar: {
      label: createLabel(PanelLeft, "Sidebar"),
      inline: true,
      fields: {
        position: {
          type: "select",
          label: "Position",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        collapseAt: { type: "number", label: "Collapse below (px)", defaultValue: 1024 },
        widthDesktop: { type: "number", label: "Desktop width (px)", defaultValue: 280 },
        widthMobile: { type: "number", label: "Mobile width (px)", defaultValue: 280 },
        showToggle: {
          type: "select",
          label: "Show toggle button",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        overlay: {
          type: "select",
          label: "Overlay on mobile",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        controlFlag: { type: "text", label: "Control flag", defaultValue: "" },
        defaultOpen: {
          type: "select",
          label: "Default open",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "true",
        },
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            label: { type: "text", label: "Label", defaultValue: "Item" },
            href: { type: "text", label: "URL", defaultValue: "#" },
            target: {
              type: "select",
              label: "Target",
              options: [
                { label: "_self", value: "_self" },
                { label: "_blank", value: "_blank" },
              ],
              defaultValue: "_self",
            },
            active: {
              type: "select",
              label: "Active",
              options: [
                { label: "No", value: "false" },
                { label: "Yes", value: "true" },
              ],
              defaultValue: "false",
            },
          },
          defaultItemProps: { label: "Dashboard", href: "#", target: "_self", active: "false" },
          getItemSummary: (it: any) => it?.label || "Item",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: (props: any) => {
        const {
          position,
          collapseAt,
          widthDesktop,
          widthMobile,
          showToggle,
          overlay,
          controlFlag,
          defaultOpen,
          items,
          fontFamily,
          puck,
        } = props || {}
        const { ref, width } = useElementWidth<HTMLDivElement>()
        const [localOpen, setLocalOpen] = useState(false)
        const actionState = useActionState()
        const collapsePoint = Number(collapseAt || 0) || 0
        const measuredWidth = width > 0 ? width : typeof window !== "undefined" ? window.innerWidth : 0
        const collapsed = collapsePoint > 0 && measuredWidth > 0 && measuredWidth < collapsePoint
        const flagName = String(controlFlag ?? "").trim() || "" // Trimmed and checked for empty string
        const flagVal = flagName ? actionState.flags[flagName] : undefined
        const defaultOpenBool = String(defaultOpen) === "true"
        const isOpen = flagName ? (flagVal !== undefined ? !!flagVal : defaultOpenBool) : localOpen
        const setOpen = (value: boolean) => {
          if (flagName) actionState.setFlag(flagName, value)
          else setLocalOpen(value)
        }
        const toggleOpen = () => setOpen(!isOpen)
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const side = position === "right" ? "right" : "left"
        const wDesktop = Number(widthDesktop || 280) || 280
        const wMobile = Number(widthMobile || 280) || 280
        const baseAside: any = {
          position: collapsed ? "fixed" : "relative",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: collapsed ? wMobile : wDesktop,
          background: "#ffffff",
          borderRight: side === "left" ? "1px solid #e5e7eb" : undefined,
          borderLeft: side === "right" ? "1px solid #e5e7eb" : undefined,
          padding: 16,
          zIndex: 200,
          display: collapsed && !isOpen ? "none" : "flex",
          flexDirection: "column",
          gap: 8,
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const asideStyle = isSelected ? { ...baseAside, ...outlineForSelected } : baseAside
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const preventNav = (e: any) => {
          if (isEditing) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
        // Overlay when collapsed and open
        const overlayEl =
          collapsed && String(overlay) === "true" && isOpen ? (
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 190 }}
            />
          ) : null
        return (
          <>
            {overlayEl}
            {String(showToggle) !== "false" && collapsed ? (
              <button
                type="button"
                onClick={() => toggleOpen()}
                style={{
                  position: "fixed",
                  top: 12,
                  [side]: 12,
                  zIndex: 210,
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {isOpen ? "Close" : "Menu"}
              </button>
            ) : null}
            <aside ref={puck?.dragRef} data-puck-path={path || undefined} style={asideStyle} onMouseDown={onMouseDown}>
              {(Array.isArray(items) ? items : []).map((it: any, i: number) => {
                const active = String(it?.active) === "true"
                return (
                  <a
                    key={i}
                    href={it?.href || "#"}
                    target={it?.target || "_self"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 6,
                      background: active ? "#e5e7eb" : "transparent",
                      fontWeight: active ? 600 : 500,
                      opacity: active ? 1 : 0.9,
                    }}
                    onClick={preventNav}
                  >
                    {it?.label || "Item"}
                  </a>
                )
              })}
            </aside>
          </>
        )
      },
    },

    /**
     * Modal component. Displays a dialog when a specified flag in
     * ActionState is true. The flag can be toggled by Button actions (e.g.
     * using Set flag or Toggle flag). The modal includes optional title,
     * description and arbitrary slot content, along with configurable
     * primary and secondary actions. Actions are executed via runActions
     * when the respective buttons are clicked. If closeOnOverlay is true
     * clicking outside the modal will close it.
     */
    Modal: {
      label: createLabel(SquareDashedBottom, "Modal"),
      inline: true,
      fields: {
        flag: { type: "text", label: "Flag name", defaultValue: "modalOpen" },
        title: { type: "text", label: "Title", defaultValue: "Modal title" },
        description: { type: "textarea", label: "Description", defaultValue: "" },
        children: { type: "slot", label: "Content" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
        closeOnOverlay: {
          type: "select",
          label: "Close on overlay",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        showCloseButton: {
          type: "select",
          label: "Show close button",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        closeLabel: { type: "text", label: "Close label", defaultValue: "Close" },
        primaryLabel: { type: "text", label: "Primary label", defaultValue: "Confirm" },
        primaryClose: {
          type: "select",
          label: "Close after primary",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        primaryActions: {
          type: "array",
          label: "Primary actions",
          arrayFields: {
            event: {
              type: "select",
              label: "Event",
              options: [{ label: "Click", value: "click" }],
              defaultValue: "click",
            },
            type: {
              type: "select",
              label: "Action type",
              options: [
                { label: "Navigate", value: "navigate" },
                { label: "Scroll to", value: "scrollTo" },
                { label: "Copy text", value: "copy" },
                { label: "Emit event", value: "emit" },
                { label: "Toggle flag", value: "toggle" },
                { label: "Set flag", value: "setFlag" },
                { label: "Run JS", value: "runJS" },
              ],
              defaultValue: "navigate",
            },
            url: { type: "text", label: "URL" },
            target: {
              type: "select",
              label: "Target",
              options: [
                { label: "_self", value: "_self" },
                { label: "_blank", value: "_blank" },
              ],
              defaultValue: "_self",
            },
            selector: { type: "text", label: "Selector" },
            targetElId: { type: "text", label: "Element ID" },
            offset: { type: "number", label: "Offset (px)", defaultValue: 0 },
            smooth: {
              type: "select",
              label: "Smooth scroll",
              options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ],
              defaultValue: "true",
            },
            text: { type: "text", label: "Text" },
            name: { type: "text", label: "Event name" },
            detail: { type: "text", label: "Event detail" },
            flag: { type: "text", label: "Flag name" },
            value: {
              type: "select",
              label: "Flag value",
              options: [
                { label: "True", value: "true" },
                { label: "False", value: "false" },
              ],
              defaultValue: "true",
            },
            code: { type: "text", label: "JS code" },
          },
          defaultItemProps: { event: "click", type: "navigate", url: "#" },
          getItemSummary: (a: any) => a?.type || "action",
        },
        secondaryLabel: { type: "text", label: "Secondary label", defaultValue: "" },
        secondaryClose: {
          type: "select",
          label: "Close after secondary",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        secondaryActions: {
          type: "array",
          label: "Secondary actions",
          arrayFields: {
            event: {
              type: "select",
              label: "Event",
              options: [{ label: "Click", value: "click" }],
              defaultValue: "click",
            },
            type: {
              type: "select",
              label: "Action type",
              options: [
                { label: "Navigate", value: "navigate" },
                { label: "Scroll to", value: "scrollTo" },
                { label: "Copy text", value: "copy" },
                { label: "Emit event", value: "emit" },
                { label: "Toggle flag", value: "toggle" },
                { label: "Set flag", value: "setFlag" },
                { label: "Run JS", value: "runJS" },
              ],
              defaultValue: "navigate",
            },
            url: { type: "text", label: "URL" },
            target: {
              type: "select",
              label: "Target",
              options: [
                { label: "_self", value: "_self" },
                { label: "_blank", value: "_blank" },
              ],
              defaultValue: "_self",
            },
            selector: { type: "text", label: "Selector" },
            targetElId: { type: "text", label: "Element ID" },
            offset: { type: "number", label: "Offset (px)", defaultValue: 0 },
            smooth: {
              type: "select",
              label: "Smooth scroll",
              options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ],
              defaultValue: "true",
            },
            text: { type: "text", label: "Text" },
            name: { type: "text", label: "Event name" },
            detail: { type: "text", label: "Event detail" },
            flag: { type: "text", label: "Flag name" },
            value: {
              type: "select",
              label: "Flag value",
              options: [
                { label: "True", value: "true" },
                { label: "False", value: "false" },
              ],
              defaultValue: "true",
            },
            code: { type: "text", label: "JS code" },
          },
          defaultItemProps: { event: "click", type: "navigate", url: "#" },
          getItemSummary: (a: any) => a?.type || "action",
        },
      },
      render: (props: any) => {
        const {
          flag,
          title,
          description,
          children: Content,
          fontFamily,
          closeOnOverlay,
          showCloseButton,
          closeLabel,
          primaryLabel,
          primaryClose,
          primaryActions,
          secondaryLabel,
          secondaryClose,
          secondaryActions,
          puck,
        } = props || {}
        const { flags, setFlag, toggleFlag, allowCustomJS } = useActionState()
        const flagName = String(flag || "modalOpen").trim() || "modalOpen"
        const isOpen = !!flags[flagName]
        const isEditing = (puck as any)?.isEditing
        if (!isOpen && !isEditing) return null
        const handleClose = () => setFlag(flagName, false)
        const handlePrimary = async (e: any) => {
          await runActions(Array.isArray(primaryActions) ? (primaryActions as any) : [], {
            isEditing,
            currentEl: e?.currentTarget,
            ctxOverride: { flags, setFlag, toggleFlag, allowCustomJS },
          })
          if (String(primaryClose || "true") !== "false") handleClose()
        }
        const handleSecondary = async (e: any) => {
          await runActions(Array.isArray(secondaryActions) ? (secondaryActions as any) : [], {
            isEditing,
            currentEl: e?.currentTarget,
            ctxOverride: { flags, setFlag, toggleFlag, allowCustomJS },
          })
          if (String(secondaryClose || "true") !== "false") handleClose()
        }
        const parsedCloseOnOverlay = String(closeOnOverlay || "true") !== "false"
        const showClose = String(showCloseButton || "true") !== "false"
        const overlayClick = () => {
          if (parsedCloseOnOverlay) handleClose()
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const styleOverlay: any = {
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.5)",
          zIndex: 300,
        }
        const modalStyle: any = {
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const wrapperStyle = isSelected ? { ...styleOverlay, ...outlineForSelected } : styleOverlay
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            style={wrapperStyle}
            onMouseDown={onMouseDown}
            // Close the modal only when clicking on the dark backdrop (not when clicking inside the dialog)
            onClick={(e) => {
              if (parsedCloseOnOverlay && e.target === e.currentTarget) handleClose()
            }}
          >
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              {showClose ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{ background: "transparent", border: 0, fontSize: 14, cursor: "pointer" }}
                  >
                    {closeLabel || "Close"}
                  </button>
                </div>
              ) : null}
              {title ? <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3> : null}
              {description ? <p style={{ marginTop: 0, marginBottom: 16 }}>{description}</p> : null}
              {typeof Content === "function" ? <Content /> : null}
              {primaryLabel || secondaryLabel ? (
                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  {primaryLabel ? (
                    <button
                      type="button"
                      onClick={handlePrimary}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 4,
                        fontWeight: 600,
                        border: "none",
                        background: "#111827",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {primaryLabel}
                    </button>
                  ) : null}
                  {secondaryLabel ? (
                    <button
                      type="button"
                      onClick={handleSecondary}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 4,
                        fontWeight: 600,
                        border: "1px solid #111827",
                        background: "transparent",
                        color: "#111827",
                        cursor: "pointer",
                      }}
                    >
                      {secondaryLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )
      },
    },

    /**
     * Accordion component. Presents a list of collapsible panels. Each item
     * has a title and slot content. Only one panel is open at a time unless
     * allowMultiple is enabled. When editing in Puck, all panels are kept
     * open to make it easier to select nested components. Accordions reduce
     * clutter by letting users toggle the visibility of sectionsã€243256177162445â€ L136-L142ã€‘.
     */
    Accordion: {
      label: createLabel(ChevronDown, "Accordion"),
      inline: true,
      fields: {
        allowMultiple: {
          type: "select",
          label: "Allow multiple open",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "false",
        },
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            title: { type: "text", label: "Title", defaultValue: "Section title" },
            content: { type: "slot", label: "Content" },
          },
          defaultItemProps: { title: "Section title" },
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        allowMultiple: "false",
        items: [{ title: "Accordion Item 1" }, { title: "Accordion Item 2" }],
      },
      render: ({ allowMultiple, items, fontFamily, puck }: any) => {
        const [openIndexes, setOpenIndexes] = React.useState<number[]>([])
        const allowMulti = String(allowMultiple || "false") !== "false"
        const isEditing = isEditingFromPuck(puck)
        const toggle = (idx: number) => {
          setOpenIndexes((prev) => {
            if (allowMulti) {
              return prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
            } else {
              return prev.includes(idx) ? [] : [idx]
            }
          })
        }
        const panels = Array.isArray(items) ? items : []
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const editing = isEditing
        const base: any = { width: "100%", fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!editing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {panels.map((item: any, idx: number) => {
              const isOpen = editing || openIndexes.includes(idx)
              return (
                <div key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <div
                    onClick={() => toggle(idx)}
                    style={{
                      cursor: "pointer",
                      padding: "8px 12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item?.title || `Item ${idx + 1}`}</span>
                    <span>{isOpen ? "âˆ’" : "+"}</span>
                  </div>
                  <div style={{ display: isOpen ? "block" : "none", padding: "8px 12px" }}>
                    {typeof item?.content === "function"
                      ? (() => {
                        const ContentSlot = item.content
                        return <ContentSlot />
                      })()
                      : null}
                  </div>
                </div>
              )
            })}
          </div>
        )
      },
    },

    /**
     * Switch component. A simple toggle that flips a boolean flag on or off.
     * Switches toggle the state of a single settingã€720273760266879â€ L37-L42ã€‘. When toggled,
     * the specified flag in ActionState is updated. Editors can label the
     * switch and choose its default state.
     */
    Switch: {
      label: createLabel(MousePointerClick, "Switch"),
      inline: true,
      fields: {
        label: { type: "text", label: "Label", defaultValue: "Toggle" },
        flag: { type: "text", label: "Flag name", defaultValue: "switchFlag" },
        defaultChecked: {
          type: "select",
          label: "Default on",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          defaultValue: "false",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      render: ({ label, flag, defaultChecked, fontFamily, puck }: any) => {
        const { flags, setFlag } = useActionState()
        const flagName = String(flag || "switchFlag").trim() || "switchFlag"
        const defaultVal = String(defaultChecked || "false") !== "false"
        const [checked, setChecked] = React.useState<boolean>(() => {
          return flags.hasOwnProperty(flagName) ? !!flags[flagName] : defaultVal
        })
        // Keep internal state in sync with external flags
        React.useEffect(() => {
          if (flags.hasOwnProperty(flagName) && flags[flagName] !== checked) {
            setChecked(!!flags[flagName])
          }
        }, [flags[flagName]])
        const toggle = () => {
          const newVal = !checked
          setChecked(newVal)
          setFlag(flagName, newVal)
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { display: "flex", alignItems: "center", gap: "8px" }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={checked} onChange={toggle} style={{ cursor: "pointer" }} />
              <span style={{ fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }}>{label}</span>
            </label>
          </div>
        )
      },
    },

    /**
     * Slider component. Allows users to select a numeric value from a range.
     * Sliders reflect a range of values along a bar, from which users may
     * select a single valueã€263366092288640â€ L169-L176ã€‘. The current value is displayed next
     * to the slider.
     */
    Slider: {
      label: createLabel(BarChart3, "Slider"),
      inline: true,
      fields: {
        min: { type: "number", label: "Min", defaultValue: 0 },
        max: { type: "number", label: "Max", defaultValue: 100 },
        step: { type: "number", label: "Step", defaultValue: 1 },
        value: { type: "number", label: "Default value", defaultValue: 50 },
      },
      render: ({ min, max, step, value, puck }: any) => {
        const [val, setVal] = React.useState<number>(() => {
          return typeof value === "number" ? value : typeof min === "number" ? min : 0
        })
        const onChange = (e: any) => {
          const newVal = Number(e.target.value)
          setVal(newVal)
        }
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = { display: "flex", alignItems: "center", gap: "8px", width: "100%" }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <input
              type="range"
              min={typeof min === "number" ? min : 0}
              max={typeof max === "number" ? max : 100}
              step={typeof step === "number" ? step : 1}
              value={val}
              onChange={onChange}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 40, textAlign: "center" }}>{val}</span>
          </div>
        )
      },
    },

    /**
     * Tabs component. Provides a tabbed interface with switchable panels.
     * Each tab has a title and content that displays when selected.
     */
    Tabs: {
      label: createLabel(LayoutList, 'Tabs'),
      inline: true,
      fields: {
        defaultTab: { type: 'number', label: 'Default tab index', defaultValue: 0 },
        tabsAlign: {
          type: 'select',
          label: 'Tabs alignment',
          options: [
            { label: 'Left', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'flex-end' },
          ],
          defaultValue: 'flex-start',
        },
        tabs: {
          type: 'array',
          label: 'Tabs',
          getItemSummary: (item: any, i: number) => item?.title ? `${i + 1}. ${item.title}` : `Tab ${i + 1}`,
          // When adding a new tab, default the title; Puck will assign an internal key.
          defaultItemProps: { title: 'Tab' },
          arrayFields: {
            title: { type: 'text', label: 'Title', defaultValue: 'Tab' },
            content: { type: 'slot', label: 'Content' },
          },
        },
        fontFamily: {
          type: 'select',
          label: 'Font',
          options: [
            { label: 'Inherit (Page)', value: 'inherit' },
            { label: 'Inter', value: 'var(--font-inter, Arial, sans-serif)' },
            { label: 'Lora', value: 'var(--font-lora, Georgia, serif)' },
            { label: 'Playfair', value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: 'Source Sans 3', value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: 'Poppins', value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: 'Fira Code', value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: 'Roboto Mono', value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: 'inherit',
        },
        tabStyle: {
          type: 'select',
          label: 'Tab Style',
          options: [
            { label: 'Underline', value: 'underline' },
            { label: 'Pills', value: 'pills' },
            { label: 'Cards', value: 'cards' },
          ],
          defaultValue: 'pills',
        },
      },
      defaultProps: {
        defaultTab: 0,
        tabsAlign: 'flex-start',
        // Predefined keys for default tabs so Puck can identify them immediately.
        tabs: [
          // { title: 'Tab 1', key: 'tab-1' },

        ],
        tabStyle: 'pills',
      },
      render: ({ defaultTab, tabsAlign, tabs = [], fontFamily, tabStyle, puck }: any) => {
        const [activeTab, setActiveTab] = React.useState(() => (typeof defaultTab === 'number' ? defaultTab : 0));
        const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
        const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
        const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

        // On mount, persist the default tabs into Puckâ€™s state and assign keys if missing.
        React.useEffect(() => {
          if (!puck?.setFieldValue) return;
          // Only run once on mount.  Copy the current array of tabs into state,
          // assigning fallback keys to any tab without a key.
          const itemsWithKeys = (tabs || []).map((tab: any, idx: number) => ({
            ...tab,
            key: tab?.key || `tab-${idx + 1}`,
          }));
          puck.setFieldValue('tabs', itemsWithKeys);
        }, []); // empty dependency ensures this runs once

        // If tabs prop changes (e.g. after reorder), always work with an array.
        const items = Array.isArray(tabs) ? tabs : [];
        const currentIndex = items.length ? Math.min(activeTab, items.length - 1) : 0;
        const isEditing = puck?.isEditing ?? false;

        // Drag handlers
        const handleDragStart = (e: any, idx: number) => {
          setDraggedIndex(idx);
          e.dataTransfer.effectAllowed = 'move';
        };

        const handleDragOver = (e: any, idx: number) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverIndex(idx);
        };

        const handleDrop = (e: any, idx: number) => {
          e.preventDefault();
          if (draggedIndex !== null && draggedIndex !== idx) {
            const newTabs = [...items];
            const [draggedItem] = newTabs.splice(draggedIndex, 1);
            newTabs.splice(idx, 0, draggedItem);
            // Save the new order into Puckâ€™s state.  Do not preserve Reactâ€™s fallback keys.
            if (puck?.setFieldValue) {
              puck.setFieldValue('tabs', newTabs);
            }
          }
          setDraggedIndex(null);
          setDragOverIndex(null);
        };

        const handleDragEnd = () => {
          setDraggedIndex(null);
          setDragOverIndex(null);
        };

        // Styling helpers
        const getTabButtonStyle = (isActive: boolean, isHovered: boolean) => {
          const base = {
            padding: '12px 20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.3s ease',
            borderRadius: '8px',
            fontSize: '14px',
          };
          if (tabStyle === 'underline') {
            return {
              ...base,
              background: 'transparent',
              color: isActive ? '#3b82f6' : '#9ca3af',
              borderBottom: isActive ? '3px solid #3b82f6' : '2px solid transparent',
              borderRadius: 0,
            };
          }
          if (tabStyle === 'cards') {
            return {
              ...base,
              background: isActive ? '#3b82f6' : '#f3f4f6',
              color: isActive ? '#ffffff' : '#6b7280',
              boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transform: isHovered && isActive ? 'translateY(-2px)' : 'translateY(0)',
            };
          }
          // Default to "pills"
          return {
            ...base,
            background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f3f4f6',
            color: isActive ? '#ffffff' : '#6b7280',
            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isHovered && isActive ? 'scale(1.05)' : 'scale(1)',
          };
        };

        return (
          <div ref={puck?.dragRef} data-puck-path={puck?.path?.join('.') || undefined} style={{ width: '100%' }}>
            {/* Tab buttons */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: tabStyle === 'underline' ? '2px solid #e5e7eb' : 'none',
                justifyContent: tabsAlign || 'flex-start',
                flexWrap: 'wrap',
                marginBottom: '24px',
                fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                padding: tabStyle === 'cards' ? '8px' : '0',
                background: tabStyle === 'cards' ? '#f9fafb' : 'transparent',
                borderRadius: tabStyle === 'cards' ? '12px' : '0',
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!items.length) return;
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setActiveTab((prev) => (prev + 1) % items.length);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setActiveTab((prev) => (prev - 1 + items.length) % items.length);
                }
              }}
            >
              {items.map((tab: any, idx: any) => {
                const isActive = activeTab === idx;
                const isOver = dragOverIndex === idx;
                const isDragging = draggedIndex === idx;
                const isHovered = hoverIndex === idx;
                const key = tab?.key ?? idx;
                return (
                  <div
                    key={`${key}-btn`}
                    draggable={isEditing}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    style={{
                      opacity: isDragging ? 0.5 : 1,
                      background: isOver && !isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <button
                      type='button'
                      onClick={() => setActiveTab(idx)}
                      style={{
                        ...getTabButtonStyle(isActive, isHovered),
                        cursor: isEditing ? 'move' : 'pointer',
                      }}
                      title={isEditing ? 'Drag to reorder' : tab?.title}
                    >
                      {tab?.title || `Tab ${idx + 1}`}
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Tab content areas */}
            <div style={{ padding: '24px 0' }}>
              {items.map((tab, idx) => {
                const isActive = activeTab === idx;
                const TabContent = tab?.content;
                const key = tab?.key ?? idx;
                return (
                  <div
                    key={`${key}-content`}
                    style={{
                      display: isEditing || currentIndex === idx ? 'block' : 'none',
                      animation: isActive ? 'fadeIn 0.3s ease' : 'none',
                      ...(isEditing && {
                        marginBottom: '24px',
                        border: '2px dashed #3b82f6',
                        padding: '20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f0f4ff 0%, #f9fafb 100%)',
                      }),
                    }}
                  >
                    {isEditing && (
                      <div
                        style={{
                          paddingBottom: '12px',
                          fontWeight: 700,
                          color: '#3b82f6',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>ðŸ“‘</span>
                        {tab?.title || `Tab ${idx + 1}`}
                      </div>
                    )}
                    <div
                      style={
                        isEditing
                          ? {
                            minHeight: '100px',
                            background: '#fff',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                          }
                          : {}
                      }
                    >
                      {typeof TabContent === 'function' ? (
                        <TabContent />
                      ) : isEditing ? (
                        <div
                          style={{
                            minHeight: '80px',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#6b7280',
                            fontSize: 12,
                            fontStyle: 'italic',
                          }}
                        >
                          Drop components here
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* fade in animation */}
            <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(4px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
          </div>
        );
      },
    },

    /**
     * Group container. A generic wrapper that can hold arbitrary child content.
     * Can be used to compose reusable groups of UI.
     */
    Group: {
      label: createLabel(FolderTree, 'Group'),
      inline: true,
      fields: {
        title: { type: 'text', label: 'Title', defaultValue: 'Group' },
        description: { type: 'text', label: 'Description', defaultValue: '' },
        background: { type: 'text', label: 'Background', defaultValue: '' },
        padding: { type: 'number', label: 'Padding (px)', defaultValue: 16 },
        borderRadius: { type: 'number', label: 'Radius (px)', defaultValue: 12 },
        showTitle: {
          type: 'select',
          label: 'Show title',
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ],
          defaultValue: 'true',
        },
        content: { type: 'slot', label: 'Content' },
      },
      defaultProps: {
        title: 'Group',
        description: '',
        background: '',
        padding: 16,
        borderRadius: 12,
        showTitle: 'true',
      },
      render: ({ title, description, background, padding, borderRadius, showTitle, content: ContentSlot, puck }: any) => {
        const path = getPathFromPuck(puck)
        const _sel = useSelectedPaths()
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          width: '100%',
          background: background || undefined,
          padding: typeof padding === 'number' ? `${padding}px` : undefined,
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : undefined,
          border: '1px solid #e5e7eb',
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          // Allow selection even when not in explicit editing mode so that
          // clicking a Group once is enough for "Save as Group".
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        try {
          // Debug: log base Group render details: whether content slot is a function and the title
          console.log('[PuckDebug] base Group render', {
            title,
            hasContentSlot: typeof ContentSlot === 'function',
            contentSlotType: typeof ContentSlot,
          })
        } catch { }
        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {String(showTitle) === 'true' && (
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{title || 'Group'}</div>
                {description ? (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{description}</div>
                ) : null}
              </div>
            )}
            <div style={isEditing ? { minHeight: 80, background: '#fff', border: '1px dashed #c7d2fe', padding: 12, borderRadius: 8 } : {}}>
              {typeof ContentSlot === 'function' ? (
                <ContentSlot />
              ) : isEditing ? (
                <div style={{ minHeight: 60, display: 'grid', placeItems: 'center', color: '#6b7280', fontSize: 12, fontStyle: 'italic' }}>Drop components here</div>
              ) : null}
            </div>
          </div>
        )
      },
    },

    /**
     * ColorPickerBox component. A color picker widget for selecting colors.
     */
    ColorPickerBox: {
      label: createLabel(Palette, "Color Picker Box"),
      inline: true,
      fields: {
        label: { type: "text", label: "Label", defaultValue: "Pick a color" },
        defaultColor: { type: "text", label: "Default color", defaultValue: "#3b82f6" },
        flag: { type: "text", label: "Store in flag", defaultValue: "selectedColor" },
        showHex: {
          type: "select",
          label: "Show hex value",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        label: "Pick a color",
        defaultColor: "#3b82f6",
        flag: "selectedColor",
        showHex: "true",
      },
      render: ({ label, defaultColor, flag, showHex, fontFamily, puck }: any) => {
        const { flags, setFlag } = useActionState()
        const flagName = String(flag || "selectedColor").trim()
        const [color, setColor] = React.useState<string>(() => {
          return String(flags[flagName] || defaultColor || "#3b82f6")
        })

        React.useEffect(() => {
          // Store color as a string in a custom flag (not as boolean)
          // We'll use a different approach - just update local state
          // since setFlag expects boolean in this implementation
        }, [color, flagName])

        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }

        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {label && <label style={{ fontWeight: 600, fontSize: "14px" }}>{label}</label>}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: "60px", height: "40px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: color,
                  border: "2px solid #e5e7eb",
                  borderRadius: "4px",
                }}
              />
              {String(showHex) === "true" && (
                <span style={{ fontFamily: "monospace", fontSize: "14px", color: "#6b7280" }}>{color}</span>
              )}
            </div>
          </div>
        )
      },
    },

    /**
     * SelectedInfo component. Displays information about the currently selected item in the editor.
     */
    SelectedInfo: {
      label: createLabel(Info, "Selected Info"),
      inline: true,
      fields: {
        showType: {
          type: "select",
          label: "Show component type",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        showId: {
          type: "select",
          label: "Show component ID",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "true",
        },
        showPath: {
          type: "select",
          label: "Show component path",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
          defaultValue: "false",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Monospace (Default)", value: "monospace" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "monospace",
        },
      },
      defaultProps: {
        showType: "true",
        showId: "true",
        showPath: "false",
      },
      render: ({ showType, showId, showPath, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          padding: "12px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontFamily: fontFamily || 'monospace',
          fontSize: "12px",
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }

        // Get selection info from selectionStore
        const selectedPaths = selectionStore.get()
        const selectionInfo = selectedPaths.length > 0 ? selectedPaths[0] : null

        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <div style={{ fontWeight: 600, marginBottom: "8px", color: "#111827" }}>Selected Component Info</div>
            {selectionInfo ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#6b7280" }}>
                {String(showType) === "true" && (
                  <div>
                    <strong>Type:</strong> {selectionInfo.split(".").pop() || "Unknown"}
                  </div>
                )}
                {String(showId) === "true" && (
                  <div>
                    <strong>ID:</strong> {selectionInfo.split(".").slice(-2, -1)[0] || "N/A"}
                  </div>
                )}
                {String(showPath) === "true" && (
                  <div>
                    <strong>Path:</strong> {selectionInfo}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: "#9ca3af", fontStyle: "italic" }}>No component selected</div>
            )}
          </div>
        )
      },
    },

    /**
     * Stats component for displaying simple numerical values with labels in a responsive grid.
     * Each item consists of a value (description) and a label (title). Users can adjust the
     * number of columns and the gap between items. When selected in the editor the component
     * shows a purple outline, consistent with other components.
     */
    Stats: {
      label: createLabel(BarChart3, "Stats"),
      fields: {
        items: {
          type: "array",
          label: "Stats",
          arrayFields: {
            title: { type: "text", label: "Label", defaultValue: "Stat" },
            description: { type: "text", label: "Value", defaultValue: "1,000" },
          },
          defaultItemProps: { title: "Stat", description: "1,000" },
          getItemSummary: (item: any, i: number) =>
            item?.title && item?.description
              ? `${item.title} (${item.description})`
              : `Item #${i + 1}`,
        },
        columns: { type: "number", label: "Columns", defaultValue: 3 },
        gap: { type: "number", label: "Gap (px)", defaultValue: 16 },
      },
      defaultProps: {
        items: [
          {
            title: "Stat",
            description: "1,000",
          },
        ],
        columns: 3,
        gap: 16,
      },
      render: ({ items, columns, gap, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "grid",
          gridTemplateColumns: `repeat(${columns || 1}, minmax(0, 1fr))`,
          gap: gap ? `${gap}px` : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        const stats = Array.isArray(items) ? items : []
        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            style={style}
            onMouseDown={onMouseDown}
          >
            {stats.map((item: any, idx: number) => (
              <div key={idx} style={{ textAlign: "center", padding: "8px" }}>
                <div
                  style={{ fontSize: "1.5rem", fontWeight: 700 }}
                >
                  {item?.description}
                </div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>{item?.title}</div>
              </div>
            ))}
          </div>
        )
      },
    },

    /**
     * Template component that acts as a generic wrapper for nested content. This simplified
     * functionality found in the example configuration. This enhanced version adds a template
     * selector so users can choose between blank and example templates. When a template is
     * selected, the componentâ€™s children are automatically populated via resolveData.
     */
    Template: {
      label: createLabel(FileCode, "Template"),
      fields: {
        template: {
          type: "select",
          label: "Template",
          options: [
            { label: "Blank", value: "blank" },
            { label: "Example 1", value: "example_1" },
            { label: "Example 2", value: "example_2" },
          ],
          defaultValue: "blank",
        },
        children: { type: "slot", label: "Content" },
      },
      defaultProps: {
        template: "blank",
        children: [],
      },
      /**
       * When the template selection changes we populate the children array with
       * predefined content. This mimics the behaviour of the example configurationâ€™s
       * Template component but avoids requiring dynamic imports or complex APIs.
       */
      resolveData: async (data: any, { changed }: any) => {
        if (!changed.template) return data
        const template = data.props.template
        let children: any[] = []
        if (template === "example_1") {
          children = [
            {
              type: "Heading",
              props: {
                level: "h2",
                text: "Template example",
                // Use default styling from the Heading component
              },
            },
            {
              type: "Text",
              props: {
                text: "This component uses a simple template. You can replace this content with your own.",
              },
            },
          ]
        } else if (template === "example_2") {
          children = [
            {
              type: "Stack",
              props: {
                direction: "column",
                gap: 24,
                children: [
                  {
                    type: "Heading",
                    props: {
                      level: "h3",
                      text: "Template example 2",
                    },
                  },
                  {
                    type: "Text",
                    props: {
                      text: "This template demonstrates a simple stack of components.",
                    },
                  },
                  {
                    type: "Button",
                    props: {
                      label: "Learn more",
                      href: "#",
                      variant: "solid",
                    },
                  },
                ],
              },
            },
          ]
        }
        return {
          ...data,
          props: {
            ...data.props,
            children,
          },
        }
      },
      render: ({ children: Content, template, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          width: "100%",
          // Provide a subtle border so templates are visible even when not selected
          border: "1px dashed #e5e7eb",
          padding: "16px",
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }
        return (
          <div
            ref={puck?.dragRef}
            data-puck-path={path || undefined}
            style={style}
            onMouseDown={onMouseDown}
          >
            {typeof Content === "function" ? <Content /> : null}
          </div>
        )
      },
    },

    /**
     * SharedCounter component. A counter that uses shared state across multiple instances.
     */
    SharedCounter: {
      label: "Shared Counter",
      inline: true,
      fields: {
        label: { type: "text", label: "Label", defaultValue: "Counter" },
        counterFlag: { type: "text", label: "Shared flag name", defaultValue: "sharedCount" },
        initialValue: { type: "number", label: "Initial value", defaultValue: 0 },
        step: { type: "number", label: "Increment step", defaultValue: 1 },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        label: "Counter",
        counterFlag: "sharedCount",
        initialValue: 0,
        step: 1,
      },
      render: ({ label, counterFlag, initialValue, step, fontFamily, puck }: any) => {
        // Use local state instead of flags since setFlag expects boolean
        const [currentValue, setCurrentValue] = React.useState<number>(() => {
          return typeof initialValue === "number" ? initialValue : 0
        })

        const increment = () => {
          setCurrentValue((prev) => prev + (step || 1))
        }

        const decrement = () => {
          setCurrentValue((prev) => prev - (step || 1))
        }

        const reset = () => {
          setCurrentValue(initialValue || 0)
        }

        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          alignItems: "center",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }

        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {label && <div style={{ fontWeight: 600, fontSize: "14px" }}>{label}</div>}
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#3b82f6", fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }}>{currentValue}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={decrement}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                âˆ’
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "8px 16px",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={increment}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                +
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic", fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined }}>Counter value: {currentValue}</div>
          </div>
        )
      },
    },

    /**
     * DataSelector component. Allows selecting data from predefined options or external sources.
     */
    DataSelector: {
      label: createLabel(Database, "Data Selector"),
      inline: true,
      fields: {
        label: { type: "text", label: "Label", defaultValue: "Select Data" },
        dataType: {
          type: "select",
          label: "Data type",
          options: [
            { label: "Users", value: "users" },
            { label: "Posts", value: "posts" },
            { label: "Products", value: "products" },
            { label: "Custom", value: "custom" },
          ],
          defaultValue: "users",
        },
        selectedId: { type: "text", label: "Selected ID", defaultValue: "" },
        flag: { type: "text", label: "Store selection in flag", defaultValue: "selectedData" },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      defaultProps: {
        label: "Select Data",
        dataType: "users",
        selectedId: "",
        flag: "selectedData",
      },
      render: ({ label, dataType, selectedId, flag, fontFamily, puck }: any) => {
        const [selected, setSelected] = React.useState<string>(selectedId || "")
        const [data, setData] = React.useState<any[]>([])

        React.useEffect(() => {
          // Simulate data fetching based on dataType
          const mockData: Record<string, any[]> = {
            users: [
              { id: "user-1", name: "John Doe" },
              { id: "user-2", name: "Jane Smith" },
              { id: "user-3", name: "Bob Johnson" },
            ],
            posts: [
              { id: "post-1", name: "First Post" },
              { id: "post-2", name: "Second Post" },
              { id: "post-3", name: "Third Post" },
            ],
            products: [
              { id: "prod-1", name: "Product A" },
              { id: "prod-2", name: "Product B" },
              { id: "prod-3", name: "Product C" },
            ],
            custom: [
              { id: "custom-1", name: "Custom Item 1" },
              { id: "custom-2", name: "Custom Item 2" },
            ],
          }
          setData(mockData[dataType] || [])
        }, [dataType])

        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }

        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            {label && <label style={{ fontWeight: 600, fontSize: "14px" }}>{label}</label>}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="">-- Select {dataType} --</option>
              {data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {selected && (
              <div style={{ padding: "8px", background: "#f0f9ff", borderRadius: "4px", fontSize: "12px" }}>
                <strong>Selected:</strong> {data.find((item) => item.id === selected)?.name || "N/A"}
              </div>
            )}
          </div>
        )
      },
    },

    /**
     * BeverageSelector component. Demonstrates dynamic fields based on selection.
     * Similar to Puck's dynamic fields example for beverages.
     */
    BeverageSelector: {
      label: "Beverage Selector",
      inline: true,
      fields: {
        drink: {
          type: "radio",
          label: "Choose drink",
          options: [
            { label: "Water", value: "water" },
            { label: "Coffee", value: "coffee" },
            { label: "Tea", value: "tea" },
            { label: "Juice", value: "juice" },
          ],
          defaultValue: "water",
        },
        fontFamily: {
          type: "select",
          label: "Font",
          options: [
            { label: "Inherit (Page)", value: "inherit" },
            { label: "Inter", value: "var(--font-inter, Arial, sans-serif)" },
            { label: "Lora", value: "var(--font-lora, Georgia, serif)" },
            { label: "Playfair", value: "var(--font-playfair, 'Playfair Display', serif)" },
            { label: "Source Sans 3", value: "var(--font-source-sans, 'Source Sans 3', Arial, sans-serif)" },
            { label: "Poppins", value: "var(--font-poppins, 'Poppins', Arial, sans-serif)" },
            { label: "Fira Code", value: "var(--font-fira-code, 'Fira Code', monospace)" },
            { label: "Roboto Mono", value: "var(--font-roboto-mono, 'Roboto Mono', monospace)" },
          ],
          defaultValue: "inherit",
        },
      },
      resolveFields: (data: any) => {
        const baseFields = {
          drink: {
            type: "radio" as const,
            label: "Choose drink",
            options: [
              { label: "Water", value: "water" },
              { label: "Coffee", value: "coffee" },
              { label: "Tea", value: "tea" },
              { label: "Juice", value: "juice" },
            ],
          },
        }

        if (data.props.drink === "water") {
          return {
            ...baseFields,
            waterType: {
              type: "radio" as const,
              label: "Water type",
              options: [
                { label: "Still", value: "still" },
                { label: "Sparkling", value: "sparkling" },
              ],
            },
          }
        }

        if (data.props.drink === "coffee") {
          return {
            ...baseFields,
            coffeeType: {
              type: "select" as const,
              label: "Coffee type",
              options: [
                { label: "Espresso", value: "espresso" },
                { label: "Latte", value: "latte" },
                { label: "Cappuccino", value: "cappuccino" },
                { label: "Americano", value: "americano" },
              ],
            },
            milk: {
              type: "radio" as const,
              label: "Milk",
              options: [
                { label: "None", value: "none" },
                { label: "Regular", value: "regular" },
                { label: "Oat", value: "oat" },
                { label: "Almond", value: "almond" },
              ],
            },
          }
        }

        if (data.props.drink === "tea") {
          return {
            ...baseFields,
            teaType: {
              type: "select" as const,
              label: "Tea type",
              options: [
                { label: "Black", value: "black" },
                { label: "Green", value: "green" },
                { label: "Herbal", value: "herbal" },
                { label: "Oolong", value: "oolong" },
              ],
            },
            sugar: {
              type: "radio" as const,
              label: "Sugar",
              options: [
                { label: "No sugar", value: "no" },
                { label: "1 spoon", value: "1" },
                { label: "2 spoons", value: "2" },
              ],
            },
          }
        }

        if (data.props.drink === "juice") {
          return {
            ...baseFields,
            juiceType: {
              type: "select" as const,
              label: "Juice flavor",
              options: [
                { label: "Orange", value: "orange" },
                { label: "Apple", value: "apple" },
                { label: "Grape", value: "grape" },
                { label: "Cranberry", value: "cranberry" },
              ],
            },
          }
        }

        return baseFields
      },
      defaultProps: {
        drink: "water",
        waterType: "still",
        coffeeType: "espresso",
        milk: "none",
        teaType: "green",
        sugar: "no",
        juiceType: "orange",
      },
      render: ({ drink, waterType, coffeeType, milk, teaType, sugar, juiceType, fontFamily, puck }: any) => {
        const path = getPathFromPuck(puck)
        const isSelected = selectionStore.has(path)
        const isEditing = isEditingFromPuck(puck)
        const base: any = {
          padding: "16px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        }
        const style = isSelected ? { ...base, ...outlineForSelected } : base
        const onMouseDown = (e: any) => {
          e.stopPropagation()
          if (!isEditing) return
          if (e.ctrlKey || e.metaKey || e.shiftKey) selectionStore.toggle(path, true)
          else selectionStore.toggle(path, false)
        }

        let details = ""
        if (drink === "water") {
          details = waterType === "sparkling" ? "Sparkling water" : "Still water"
        } else if (drink === "coffee") {
          details = `${coffeeType || "Coffee"}${milk && milk !== "none" ? ` with ${milk} milk` : ""}`
        } else if (drink === "tea") {
          details = `${teaType || "Tea"}${sugar && sugar !== "no" ? ` with ${sugar} sugar` : ""}`
        } else if (drink === "juice") {
          details = `${juiceType || ""} juice`
        }

        return (
          <div ref={puck?.dragRef} data-puck-path={path || undefined} style={style} onMouseDown={onMouseDown}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "32px" }}>
                {drink === "water" ? "ðŸ’§" : drink === "coffee" ? "â˜•" : drink === "tea" ? "ðŸµ" : "ðŸ§ƒ"}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "16px", textTransform: "capitalize" }}>
                  {drink || "Unknown"}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>{details}</div>
              </div>
            </div>
          </div>
        )
      },
    },
  },
} as const

export type AppPuckConfig = typeof config

// For compatibility with imports expecting `puckConfig`.
export const puckConfig = config

// === Opinionated page templates (starter trees) ===
// These can be used to seed a new Puck document. Each template follows the
// minimal data shape expected by Puck: { root: { props, children: [] } }.
// A child node defines { type, props, children? }. Slots are represented as
// nested children arrays inside a component node when applicable.
export const templates = {
  LandingPage: {
    root: {
      props: {
        title: "Landing Page",
        description: "Professional landing page for your product or service",
        viewport: "fluid",
        theme: "light",
      },
      children: [
        {
          type: "Navbar",
          props: {
            brand: "Brand",
            links: [
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Contact", href: "#contact" },
            ],
          },
        },
        {
          type: "Hero",
          props: {
            title: "Welcome to Your Product",
            subtitle: "Create amazing experiences with our platform",
            align: "center",
            background: "#ffffff",
            overlayOpacity: 0,
          },
        },
        {
          type: "Section",
          props: {
            variant: "muted",
            center: "true",
            paddingY: 64,
            maxWidth: "960px",
          },
          children: [
            {
              type: "ResponsiveGrid",
              props: {
                colsMobile: 1,
                colsTablet: 2,
                colsDesktop: 3,
                gapDesktop: 32,
              },
              children: [
                {
                  type: "Card",
                  props: {
                    title: "Feature One",
                    body: "Describe your first key feature",
                  },
                },
                {
                  type: "Card",
                  props: {
                    title: "Feature Two",
                    body: "Describe your second key feature",
                  },
                },
                {
                  type: "Card",
                  props: {
                    title: "Feature Three",
                    body: "Describe your third key feature",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "Footer",
          props: {
            copyright: "Â© 2025 Your Company",
            year: new Date().getFullYear(),
          },
        },
      ],
    },
  },
  DocumentationPage: {
    root: {
      props: {
        title: "Documentation",
        description: "Comprehensive documentation and guides",
        viewport: "fixed",
        theme: "light",
      },
      children: [
        {
          type: "Navbar",
          props: {
            brand: "Docs",
            links: [
              { label: "Getting Started", href: "#" },
              { label: "API Reference", href: "#" },
            ],
          },
        },
        {
          type: "Container",
          props: {
            maxWidth: "900px",
            padding: 32,
          },
          children: [
            {
              type: "Heading",
              props: {
                level: "h1",
                text: "Documentation Title",
              },
            },
            {
              type: "Text",
              props: {
                text: "Start writing your documentation here...",
              },
            },
          ],
        },
      ],
    },
  },
  PortfolioPage: {
    root: {
      props: {
        title: "Portfolio",
        description: "Showcase your best work",
        viewport: "fluid",
        theme: "dark",
      },
      children: [
        {
          type: "Hero",
          props: {
            title: "My Portfolio",
            subtitle: "Showcasing my best work and projects",
            align: "center",
          },
        },
        {
          type: "Gallery",
          props: {
            images: [],
          },
        },
      ],
    },
  },
  ProfileTemplate: profileTemplateData,
}

export default config







