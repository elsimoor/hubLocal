"use client";

import { useMemo, useState, type ComponentType } from "react";
import QRCode from "react-qr-code";
import GradualBlurMemo from "@/components/GradualBlur";
import ImageGalleryModal from "@/lib/components/ImageGalleryModal";
import { ProfilePayload } from "@/types/profile";
import { Contact2, Globe, Image, Mail, Share, UserCheck2, Youtube } from "lucide-react";

const PUBLIC_BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://hub-local-nu.vercel.app/").replace(/\/$/, "");

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
  const [flipped, setFlipped] = useState(false);
  const pageUrl = useMemo(() => {
    const cleanSlug = profile.slug?.replace(/^\/+|\/+$/g, "");
    return cleanSlug ? `${PUBLIC_BASE_URL}/${cleanSlug}` : PUBLIC_BASE_URL;
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
    <div className="min-h-screen relative bg-[#bfbfbf] flex items-center justify-center md:p-8">
      <div className="relative w-full max-w-[540px] bg-white md:rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <section style={{ position: "relative" }}>
          <div className="pt-3 px-3 pb-20" style={{ height: "100%", overflowY: "auto" }}>
            <div
              className="absolute left-0 right-0 top-0 h-[100%] rounded-t-xl -z-0"
              style={{
                background: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                backgroundSize: "cover",
                filter: "blur(80px) brightness(1)",
                backgroundPosition: "center",
              }}
            />

            <header className="relative top-0 w-full max-w-[510px] z-10 flex items-center justify-between h-16 px-4">
              <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm font-bold">
                {headerInitial}
              </div>
              <div className="flex gap-2">
                <button
                  className="w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center"
                  onClick={() => shareProfile(pageUrl, displayName)}
                >
                  <Share size={16} color="#163a39" />
                </button>
              </div>
            </header>

            <div className="relative z-10 text-center pt-10 px-6 pb-5">
              <div
                style={{
                  scale: flipped ? 1.6 : 1,
                  transitionProperty: "all",
                  transformOrigin: "center",
                  animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDuration: "1050ms",
                }}
                className="mx-auto w-[186px] h-[186px] rounded-full overflow-hidden border-white"
              >
                <div className="coin-wrapper" onClick={() => setFlipped((prev) => !prev)}>
                  <div className={`coin-inner ${flipped ? "flipped" : ""}`}>
                    <div className="coin-front">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-white text-lg text-gray-500">{headerInitial}</div>
                      )}
                    </div>
                    <div className="coin-back">
                      <QRCode value={pageUrl} size={140} />
                    </div>
                  </div>
                </div>
              </div>

              <h1 className="mt-3 mb-1 text-[20px] font-extrabold text-[#163a39]">{displayName}</h1>
              {profile.tagline && (
                <p className="mx-auto mb-3 text-[13px] text-[#2b2b2b] max-w-[80%]">{profile.tagline}</p>
              )}

              <div className="inline-flex rounded-full p-1 gap-2">
                <button className="px-6 py-2 rounded-full bg-[#fbf3e7] text-[#163a39] font-semibold">
                  {profile.buttonPrimaryLabel || "Connect"}
                </button>
                <button className="px-6 py-2 rounded-full bg-[#3c706f] text-white font-semibold">
                  {profile.buttonSecondaryLabel || "Links"}
                </button>
              </div>
            </div>

            <main className="relative z-10 px-7 pb-9 pt-2 flex flex-col gap-3.5">
              {links.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-10">
                  Aucune carte configurée pour le moment.
                </div>
              )}
              {links.map((link, index) => {
                const Icon = ICON_COMPONENTS[link.iconKey as keyof typeof ICON_COMPONENTS] || Share;
                const label = link.label || "Sans titre";
                if (link.type === "album") {
                  return (
                    <AlbumComponent key={link.id || index} label={label} images={link.images || []} Icon={Icon} />
                  );
                }
                if (link.type === "vcf") {
                  return (
                    <OnClickButton
                      key={link.id || index}
                      label={label}
                      Icon={Icon}
                      onClick={handleDownloadVCF}
                      disabled={!hasVcfData(profile)}
                    />
                  );
                }
                return (
                  <LinkButton key={link.id || index} label={label} url={link.url || "#"} Icon={Icon} />
                );
              })}
            </main>
          </div>

          <GradualBlurMemo target="page" position="bottom" height="8rem" strength={2} divCount={5} curve="bezier" exponential opacity={1} />
        </section>

        <aside className="fixed hidden md:block right-9 top-9 text-center text-[12px] z-10">
          <div className="text-black">View on mobile</div>
          <div className="mt-2 w-[92px] h-[92px] bg-white rounded-md shadow-[0_6px_18px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#777] font-bold">
            <QRCode value={pageUrl} size={80} />
          </div>
        </aside>
        <style jsx>{`
          .coin-wrapper {
            width: 186px;
            height: 186px;
            margin: 0 auto;
            cursor: pointer;
            perspective: 1000px;
          }
          .coin-inner {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.8s ease-in-out;
          }
          .coin-inner.flipped {
            transform: rotateY(180deg);
          }
          .coin-front,
          .coin-back {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            backface-visibility: hidden;
            overflow: hidden;
            border: 4px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .coin-front img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
          .coin-back {
            background: white;
            transform: rotateY(180deg);
          }
        `}</style>
      </div>
    </div>
  );
}

function hasVcfData(profile: ProfilePayload) {
  const fields = profile.vcf || {};
  return Boolean(fields.firstName || fields.lastName || fields.cellPhone || fields.workEmail);
}

function LinkButton({ label, url, Icon }: { label: string; url: string; Icon: ComponentType<{ size?: number; color?: string }> }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ filter: "brightness(0.95)", backgroundColor: "#fbf3e7" }}
      className="flex z-10 items-center justify-between rounded-[28px] p-4 shadow-inner"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} color="#163a39" />
        <span className="text-[14px] text-[#0c0c0c]">{label}</span>
      </div>
      <span className="text-[20px] text-black/60">⋮</span>
    </a>
  );
}

function OnClickButton({ label, onClick, Icon, disabled }: { label: string; onClick: () => void; Icon: ComponentType<{ size?: number; color?: string }>; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ filter: "brightness(0.95)", backgroundColor: "#fbf3e7" }}
      className="flex z-10 items-center justify-between rounded-[28px] p-4 shadow-inner disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} color="#163a39" />
        <span className="text-[14px] text-[#0c0c0c]">{label}</span>
      </div>
      <span className="text-[20px] text-black/60">⋮</span>
    </button>
  );
}

function AlbumComponent({ label, images, Icon }: { label: string; images: string[]; Icon: ComponentType<{ size?: number; color?: string }> }) {
  const [open, setOpen] = useState(false);
  const maxShown = 4;
  const visible = images.slice(0, maxShown);
  const remaining = Math.max(images.length - maxShown, 0);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ filter: "brightness(0.95)", backgroundColor: "#fbf3e7" }}
        className="w-full rounded-[28px] p-4 shadow-inner cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon size={18} color="#163a39" />
          <span className="text-[14px] text-[#0c0c0c]">{label}</span>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-2 rounded-xl overflow-hidden">
          {visible.map((src, i) => (
            <div key={i} className="w-full h-[120px] bg-white relative">
              {i === maxShown - 1 && remaining > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xl font-semibold">
                  +{remaining}
                </div>
              ) : (
                <img src={src} alt="album item" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <div className="col-span-2 h-[120px] grid place-items-center text-sm text-gray-500 bg-white/60">
              Ajoutez des images via Manage profile.
            </div>
          )}
        </div>
        <div className="text-center mt-4">
          <div className="text-[16px] font-semibold text-[#0c0c0c]">{label}</div>
          <div className="text-[13px] text-black/60">{images.length} photos</div>
        </div>
      </div>

      <ImageGalleryModal images={images} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
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
    alert("Lien copié dans le presse-papiers.");
  }
}
