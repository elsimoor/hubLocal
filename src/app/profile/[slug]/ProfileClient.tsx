"use client";

import { useMemo } from "react";
import QRCode from "react-qr-code";
import GradualBlurMemo from "@/components/GradualBlur";
import {
  ProfileAvatarCoin,
  ProfileCTAButtons,
  ProfileIdentitySection,
  ProfileLinksSection,
  type ProfileLinksSectionItem,
  ProfileNameBlock,
  ProfileTopBar,
  ProfileCardShell,
  ProfileThemeProvider,
} from "@/components/profile/ProfileCardElements";
import { ProfilePayload } from "@/types/profile";
import { Contact2, Globe, Image, Mail, Share, UserCheck2, Youtube } from "lucide-react";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://hub-local-nu.vercel.app").replace(/\/$/, "");

const ICON_COMPONENTS = {
  Contact2,
  Globe,
  Image,
  Mail,
  Share,
  UserCheck2,
  Youtube,
} as const;

type Props = { profile: ProfilePayload };

export default function ProfileClient({ profile }: Props) {
  const pageUrl = useMemo(() => {
    const cleanSlug = profile.slug?.replace(/^\/+|\/+$/g, "");
    return cleanSlug ? `${SITE_URL}/profile/@${cleanSlug}` : SITE_URL;
  }, [profile.slug]);

  const displayName = profile.displayName || profile.slug || "Profil";
  const headerInitial = (displayName || "H").charAt(0).toUpperCase() || "H";
  const avatarUrl = profile.avatarUrl || profile.backgroundUrl;
  const backgroundUrl = profile.backgroundUrl || profile.avatarUrl;

  const links = Array.isArray(profile.links) ? profile.links : [];

  const handleDownloadVCF = async () => {
    const vcfContent = await buildVcf(profile, avatarUrl);
    if (!vcfContent) return;
    const blob = new Blob([vcfContent], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName || "contact"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProfileThemeProvider value={profile.theme}>
      <div className="min-h-screen relative bg-[#bfbfbf] flex items-center justify-center md:p-8">
        <ProfileCardShell backgroundImage={backgroundUrl}>
          <ProfileTopBar initial={headerInitial} onShare={() => shareProfile(pageUrl, displayName)} />

          <ProfileIdentitySection>
            <ProfileAvatarCoin avatarUrl={avatarUrl} fallbackInitial={headerInitial} pageUrl={pageUrl} />
            <ProfileNameBlock displayName={displayName} tagline={profile.tagline} />
            <ProfileCTAButtons
              primaryLabel={profile.buttonPrimaryLabel || "Connect"}
              secondaryLabel={profile.buttonSecondaryLabel || "Links"}
            />
          </ProfileIdentitySection>

          <ProfileLinksSection
            items={buildProfileLinkItems(links, handleDownloadVCF, profile)}
            emptyMessage="Aucune carte configuree pour le moment."
          />
        </ProfileCardShell>

        <aside className="fixed hidden md:block right-9 top-9 text-center text-[12px] z-10">
          <div className="text-black">View on mobile</div>
          <div className="mt-2 w-[92px] h-[92px] bg-white rounded-md shadow-[0_6px_18px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#777] font-bold">
            <QRCode value={pageUrl} size={80} />
          </div>
        </aside>
      </div>
    </ProfileThemeProvider>
  );
}

function hasVcfData(profile: ProfilePayload) {
  const fields = profile.vcf || {};
  return Boolean(fields.firstName || fields.lastName || fields.cellPhone || fields.workEmail);
}

function buildProfileLinkItems(
  links: ProfilePayload["links"],
  handleDownloadVCF: () => Promise<void>,
  profile: ProfilePayload,
): ProfileLinksSectionItem[] {
  if (!Array.isArray(links)) return [];

  return links.map((link, index) => {
    const Icon = ICON_COMPONENTS[link.iconKey as keyof typeof ICON_COMPONENTS] || Share;
    const label = link.label || "Sans titre";
    if (link.type === "album") {
      return {
        id: link.id || index,
        label,
        type: "album" as const,
        icon: Icon,
        images: normalizeImages(link.images),
      };
    }
    if (link.type === "vcf") {
      return {
        id: link.id || index,
        label,
        type: "vcf" as const,
        icon: Icon,
        onClick: () => {
          void handleDownloadVCF();
        },
        disabled: !hasVcfData(profile),
      };
    }
    return {
      id: link.id || index,
      label,
      type: "link" as const,
      icon: Icon,
      url: link.url || "#",
    };
  });
}

function normalizeImages(images?: string[] | string): string[] {
  if (Array.isArray(images)) {
    return images.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
  }
  if (typeof images === "string") {
    return images
      .split(/\r?\n|,/)
      .map((img) => img.trim())
      .filter(Boolean);
  }
  return [];
}
async function buildVcf(profile: ProfilePayload, avatarUrl?: string) {
  const vcf = profile.vcf;
  if (!vcf) return null;
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${vcf.lastName || ""};${vcf.firstName || ""};;;`);
  lines.push(`FN:${[vcf.firstName, vcf.lastName].filter(Boolean).join(" ") || profile.displayName || ""}`);
  if (avatarUrl) {
    try {
      const photo = await toBase64(avatarUrl);
      if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photo}`);
    } catch {
      /* ignore image errors */
    }
  }
  if (vcf.cellPhone) lines.push(`TEL;TYPE=CELL:${vcf.cellPhone}`);
  if (vcf.workPhone) lines.push(`TEL;TYPE=WORK:${vcf.workPhone}`);
  if (vcf.workEmail) lines.push(`EMAIL;TYPE=WORK:${vcf.workEmail}`);
  if (vcf.homeEmail) lines.push(`EMAIL;TYPE=HOME:${vcf.homeEmail}`);
  if (vcf.workAddress || vcf.workCity || vcf.workZip) {
    lines.push(`ADR;TYPE=WORK:;;${vcf.workAddress || ""};${vcf.workCity || ""};;${vcf.workZip || ""};`);
  }
  if (vcf.homeAddress || vcf.homeCity || vcf.homeZip) {
    lines.push(`ADR;TYPE=HOME:;;${vcf.homeAddress || ""};${vcf.homeCity || ""};;${vcf.homeZip || ""};`);
  }
  if (vcf.org) lines.push(`ORG:${vcf.org}`);
  if (vcf.title) lines.push(`TITLE:${vcf.title}`);
  if (vcf.url) lines.push(`URL:${vcf.url}`);
  if (vcf.note) lines.push(`NOTE:${vcf.note}`);
  if (vcf.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${vcf.linkedin}`);
  if (vcf.github) lines.push(`X-SOCIALPROFILE;TYPE=github:${vcf.github}`);
  if (vcf.whatsapp) lines.push(`X-SOCIALPROFILE;TYPE=whatsapp:${vcf.whatsapp}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

async function toBase64(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === "string" ? reader.result.split(",")[1] : "";
        resolve(result || null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

function shareProfile(url: string, title: string) {
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
    alert("Lien copiÃ© dans le presse-papiers.");
  }
}








