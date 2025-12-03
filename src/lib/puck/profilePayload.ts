import {
  DEFAULT_PROFILE_THEME,
  DEFAULT_PROFILE_VCF,
  PROFILE_ICON_KEYS,
  PROFILE_LINK_TYPES,
  ProfilePayload,
  createEmptyProfilePayload,
} from "@/types/profile";
import { cloneProfileTemplateData } from "@/lib/puck/profileTemplate";

const PROFILE_COMPONENT_TYPE = "ProfileDefaultPage";
const iconSet = new Set(PROFILE_ICON_KEYS);
const linkTypeSet = new Set(PROFILE_LINK_TYPES);

const splitImagesField = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n|,/)
    .map((img) => img.trim())
    .filter(Boolean);
};

export const buildProfilePayloadFromProps = (props: any): ProfilePayload => {
  const payload = createEmptyProfilePayload();
  const slugValue = typeof props?.slug === "string" ? props.slug.trim() : "";
  payload.slug = slugValue ? slugValue.replace(/^@+/, "") : payload.slug;
  payload.displayName = typeof props?.displayName === "string" && props.displayName.trim()
    ? props.displayName.trim()
    : payload.displayName;
  payload.tagline = typeof props?.tagline === "string" ? props.tagline : payload.tagline;
  payload.avatarUrl = typeof props?.avatarUrl === "string" ? props.avatarUrl : payload.avatarUrl;
  payload.backgroundUrl = typeof props?.backgroundUrl === "string" ? props.backgroundUrl : payload.backgroundUrl;
  payload.buttonPrimaryLabel = typeof props?.buttonPrimaryLabel === "string" && props.buttonPrimaryLabel.trim()
    ? props.buttonPrimaryLabel.trim()
    : payload.buttonPrimaryLabel;
  payload.buttonSecondaryLabel = typeof props?.buttonSecondaryLabel === "string" && props.buttonSecondaryLabel.trim()
    ? props.buttonSecondaryLabel.trim()
    : payload.buttonSecondaryLabel;

  payload.links = Array.isArray(props?.links)
    ? (props.links
        .map((link: any) => {
          const type = linkTypeSet.has(link?.type) ? link.type : "link";
          const label = typeof link?.label === "string" ? link.label.trim() : "";
          if (!label) return null;
          const iconKey = iconSet.has(link?.iconKey) ? link.iconKey : "Share";
          const url = typeof link?.url === "string" ? link.url.trim() : "";
          const images = type === "album" ? splitImagesField(link?.images) : undefined;
          return {
            type,
            label,
            iconKey,
            url: type === "album" ? "" : url,
            images,
          };
        })
        .filter(Boolean) as ProfilePayload["links"])
    : [];

  payload.vcf = {
    ...DEFAULT_PROFILE_VCF,
    firstName: typeof props?.vcfFirstName === "string" ? props.vcfFirstName : DEFAULT_PROFILE_VCF.firstName,
    lastName: typeof props?.vcfLastName === "string" ? props.vcfLastName : DEFAULT_PROFILE_VCF.lastName,
    cellPhone: typeof props?.vcfCellPhone === "string" ? props.vcfCellPhone : DEFAULT_PROFILE_VCF.cellPhone,
    workPhone: typeof props?.vcfWorkPhone === "string" ? props.vcfWorkPhone : DEFAULT_PROFILE_VCF.workPhone,
    workEmail: typeof props?.vcfWorkEmail === "string" ? props.vcfWorkEmail : DEFAULT_PROFILE_VCF.workEmail,
    homeEmail: typeof props?.vcfHomeEmail === "string" ? props.vcfHomeEmail : DEFAULT_PROFILE_VCF.homeEmail,
    workAddress: typeof props?.vcfWorkAddress === "string" ? props.vcfWorkAddress : DEFAULT_PROFILE_VCF.workAddress,
    workCity: typeof props?.vcfWorkCity === "string" ? props.vcfWorkCity : DEFAULT_PROFILE_VCF.workCity,
    workZip: typeof props?.vcfWorkZip === "string" ? props.vcfWorkZip : DEFAULT_PROFILE_VCF.workZip,
    homeAddress: typeof props?.vcfHomeAddress === "string" ? props.vcfHomeAddress : DEFAULT_PROFILE_VCF.homeAddress,
    homeCity: typeof props?.vcfHomeCity === "string" ? props.vcfHomeCity : DEFAULT_PROFILE_VCF.homeCity,
    homeZip: typeof props?.vcfHomeZip === "string" ? props.vcfHomeZip : DEFAULT_PROFILE_VCF.homeZip,
    org: typeof props?.vcfOrg === "string" ? props.vcfOrg : DEFAULT_PROFILE_VCF.org,
    title: typeof props?.vcfTitle === "string" ? props.vcfTitle : DEFAULT_PROFILE_VCF.title,
    url: typeof props?.vcfUrl === "string" ? props.vcfUrl : DEFAULT_PROFILE_VCF.url,
    note: typeof props?.vcfNote === "string" ? props.vcfNote : DEFAULT_PROFILE_VCF.note,
    linkedin: typeof props?.vcfLinkedin === "string" ? props.vcfLinkedin : DEFAULT_PROFILE_VCF.linkedin,
    github: typeof props?.vcfGithub === "string" ? props.vcfGithub : DEFAULT_PROFILE_VCF.github,
    whatsapp: typeof props?.vcfWhatsapp === "string" ? props.vcfWhatsapp : DEFAULT_PROFILE_VCF.whatsapp,
  };

  const sanitize = (value: unknown, fallback: string) =>
    typeof value === "string" && value.trim().length > 0 ? value : fallback;

  payload.theme = {
    cardGradient: sanitize(props?.themeGradient, DEFAULT_PROFILE_THEME.cardGradient),
    panelBackground: sanitize(props?.themePanelBackground, DEFAULT_PROFILE_THEME.panelBackground),
    panelShadow: sanitize(props?.themePanelShadow, DEFAULT_PROFILE_THEME.panelShadow),
    cardSurface: sanitize(props?.themeCardSurface, DEFAULT_PROFILE_THEME.cardSurface),
    cardShadow: sanitize(props?.themeCardShadow, DEFAULT_PROFILE_THEME.cardShadow),
    accentPrimary: sanitize(props?.themeAccentPrimary, DEFAULT_PROFILE_THEME.accentPrimary),
    accentPrimaryText: sanitize(props?.themeAccentPrimaryText, DEFAULT_PROFILE_THEME.accentPrimaryText),
    accentSecondary: sanitize(props?.themeAccentSecondary, DEFAULT_PROFILE_THEME.accentSecondary),
    accentSecondaryText: sanitize(
      props?.themeAccentSecondaryText,
      DEFAULT_PROFILE_THEME.accentSecondaryText,
    ),
    textPrimary: sanitize(props?.themeTextPrimary, DEFAULT_PROFILE_THEME.textPrimary),
    textSecondary: sanitize(props?.themeTextSecondary, DEFAULT_PROFILE_THEME.textSecondary),
    iconColor: sanitize(props?.themeIconColor, DEFAULT_PROFILE_THEME.iconColor),
  };

  return payload;
};

const findProfileComponentNode = (node: any): any | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findProfileComponentNode(child);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (typeof node.type === "string" && node.type === PROFILE_COMPONENT_TYPE) {
    return node;
  }
  return (
    findProfileComponentNode(node.children) ||
    findProfileComponentNode(node.content) ||
    findProfileComponentNode(node.root) ||
    findProfileComponentNode(node.slots ? Object.values(node.slots) : null) ||
    findProfileComponentNode(node.zones ? Object.values(node.zones) : null)
  );
};

export const extractProfilePayloadFromDoc = (doc: any): ProfilePayload => {
  const source = doc && typeof doc === "object" ? doc : cloneProfileTemplateData();
  const component = findProfileComponentNode(source) || findProfileComponentNode(source.root);
  const props = component?.props || {};
  return buildProfilePayloadFromProps(props);
};

export const profilePayloadToComponentProps = (payload: ProfilePayload) => {
  const toLines = (images?: string[]) => (Array.isArray(images) && images.length ? images.join("\n") : "");
  const links = Array.isArray(payload.links) ? payload.links : [];
  return {
    slug: payload.slug,
    displayName: payload.displayName,
    tagline: payload.tagline,
    avatarUrl: payload.avatarUrl,
    backgroundUrl: payload.backgroundUrl,
    buttonPrimaryLabel: payload.buttonPrimaryLabel,
    buttonSecondaryLabel: payload.buttonSecondaryLabel,
    links: links.map((link) => ({
      type: link.type,
      label: link.label,
      iconKey: link.iconKey,
      url: link.type === "album" ? "" : link.url || "",
      images: link.type === "album" ? toLines(link.images) : "",
    })),
    vcfFirstName: payload.vcf.firstName,
    vcfLastName: payload.vcf.lastName,
    vcfCellPhone: payload.vcf.cellPhone,
    vcfWorkPhone: payload.vcf.workPhone,
    vcfWorkEmail: payload.vcf.workEmail,
    vcfHomeEmail: payload.vcf.homeEmail,
    vcfWorkAddress: payload.vcf.workAddress,
    vcfWorkCity: payload.vcf.workCity,
    vcfWorkZip: payload.vcf.workZip,
    vcfHomeAddress: payload.vcf.homeAddress,
    vcfHomeCity: payload.vcf.homeCity,
    vcfHomeZip: payload.vcf.homeZip,
    vcfOrg: payload.vcf.org,
    vcfTitle: payload.vcf.title,
    vcfUrl: payload.vcf.url,
    vcfNote: payload.vcf.note,
    vcfLinkedin: payload.vcf.linkedin,
    vcfGithub: payload.vcf.github,
    vcfWhatsapp: payload.vcf.whatsapp,
    themeGradient: payload.theme.cardGradient,
    themePanelBackground: payload.theme.panelBackground,
    themePanelShadow: payload.theme.panelShadow,
    themeCardSurface: payload.theme.cardSurface,
    themeCardShadow: payload.theme.cardShadow,
    themeAccentPrimary: payload.theme.accentPrimary,
    themeAccentPrimaryText: payload.theme.accentPrimaryText,
    themeAccentSecondary: payload.theme.accentSecondary,
    themeAccentSecondaryText: payload.theme.accentSecondaryText,
    themeTextPrimary: payload.theme.textPrimary,
    themeTextSecondary: payload.theme.textSecondary,
    themeIconColor: payload.theme.iconColor,
  };
};

export const applyProfilePayloadToDoc = (doc: any, payload: ProfilePayload) => {
  const nextDoc =
    doc && typeof doc === "object"
      ? JSON.parse(JSON.stringify(doc))
      : cloneProfileTemplateData();
  const componentProps = profilePayloadToComponentProps(payload);
  const component = findProfileComponentNode(nextDoc) || findProfileComponentNode(nextDoc.root);
  if (component) {
    component.props = { ...(component.props || {}), ...componentProps };
  } else {
    if (!nextDoc.root) nextDoc.root = { props: {}, children: [] };
    const children = Array.isArray(nextDoc.root.children) ? nextDoc.root.children : [];
    children.push({ type: PROFILE_COMPONENT_TYPE, props: componentProps });
    nextDoc.root.children = children;
  }
  return nextDoc;
};
