import { createSampleProfilePayload } from "@/types/profile";

const SAMPLE_SLUG = "alex-rivers";
const SAMPLE_NAME = "Alex Rivers";

const sampleProfile = createSampleProfilePayload(SAMPLE_SLUG, SAMPLE_NAME);

const joinImages = (images?: string[]) => (Array.isArray(images) ? images.filter(Boolean).join("\n") : "");

export const profileComponentDefaults = {
  slug: sampleProfile.slug || SAMPLE_SLUG,
  displayName: sampleProfile.displayName || SAMPLE_NAME,
  tagline:
    sampleProfile.tagline ||
    "Luxury, Fashion, Personal Style Enthusiast, Entrepreneur.",
  avatarUrl: sampleProfile.avatarUrl,
  backgroundUrl: sampleProfile.backgroundUrl,
  buttonPrimaryLabel: sampleProfile.buttonPrimaryLabel || "Connect",
  buttonSecondaryLabel: sampleProfile.buttonSecondaryLabel || "Links",
  links: sampleProfile.links.map((link) => ({
    type: link.type,
    label: link.label,
    iconKey: link.iconKey,
    url: link.url || "",
    images: joinImages(link.images),
  })),
  vcfFirstName: sampleProfile.vcf.firstName,
  vcfLastName: sampleProfile.vcf.lastName,
  vcfCellPhone: sampleProfile.vcf.cellPhone,
  vcfWorkPhone: sampleProfile.vcf.workPhone,
  vcfWorkEmail: sampleProfile.vcf.workEmail,
  vcfHomeEmail: sampleProfile.vcf.homeEmail,
  vcfWorkAddress: sampleProfile.vcf.workAddress,
  vcfWorkCity: sampleProfile.vcf.workCity,
  vcfWorkZip: sampleProfile.vcf.workZip,
  vcfHomeAddress: sampleProfile.vcf.homeAddress,
  vcfHomeCity: sampleProfile.vcf.homeCity,
  vcfHomeZip: sampleProfile.vcf.homeZip,
  vcfOrg: sampleProfile.vcf.org,
  vcfTitle: sampleProfile.vcf.title,
  vcfUrl: sampleProfile.vcf.url,
  vcfNote: sampleProfile.vcf.note,
  vcfLinkedin: sampleProfile.vcf.linkedin,
  vcfGithub: sampleProfile.vcf.github,
  vcfWhatsapp: sampleProfile.vcf.whatsapp,
  themeGradient: sampleProfile.theme.cardGradient,
  themePanelBackground: sampleProfile.theme.panelBackground,
  themePanelShadow: sampleProfile.theme.panelShadow,
  themeCardSurface: sampleProfile.theme.cardSurface,
  themeCardShadow: sampleProfile.theme.cardShadow,
  themeAccentPrimary: sampleProfile.theme.accentPrimary,
  themeAccentPrimaryText: sampleProfile.theme.accentPrimaryText,
  themeAccentSecondary: sampleProfile.theme.accentSecondary,
  themeAccentSecondaryText: sampleProfile.theme.accentSecondaryText,
  themeTextPrimary: sampleProfile.theme.textPrimary,
  themeTextSecondary: sampleProfile.theme.textSecondary,
  themeIconColor: sampleProfile.theme.iconColor,
};
