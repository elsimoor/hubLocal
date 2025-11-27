// "use client";

// import {
//   ComponentType,
//   CSSProperties,
//   ReactNode,
//   createContext,
//   useContext,
//   useMemo,
//   useState,
// } from "react";
// import QRCode from "react-qr-code";
// import GradualBlurMemo from "@/components/GradualBlur";
// import ImageGalleryModal from "@/lib/components/ImageGalleryModal";
// import { DEFAULT_PROFILE_THEME, ProfileTheme } from "@/types/profile";
// import { MoreVertical, Share } from "lucide-react";

// type IconRenderer = ComponentType<{ size?: number; color?: string }>;

// type ThemeOverride = Partial<ProfileTheme>;

// const ThemeContext = createContext<ProfileTheme>(DEFAULT_PROFILE_THEME);

// export function ProfileThemeProvider({
//   value,
//   children,
// }: {
//   value?: ThemeOverride | null;
//   children: ReactNode;
// }) {
//   const merged = useMemo(() => ({ ...DEFAULT_PROFILE_THEME, ...(value || {}) }), [value]);
//   return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>;
// }

// export function useProfileTheme() {
//   return useContext(ThemeContext);
// }

// const combineClasses = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

// const buildCardSurfaceStyle = (theme: ProfileTheme): CSSProperties => ({
//   backgroundColor: theme.cardSurface,
//   boxShadow: theme.cardShadow,
//   filter: "brightness(0.97)",
// });

// const MenuTrigger = () => {
//   const theme = useProfileTheme();
//   return (
//     <div
//       className="w-9 h-9 rounded-full flex items-center justify-center"
//       style={{ backgroundColor: "rgba(255,255,255,0.82)", color: theme.iconColor }}
//     >
//       <MoreVertical size={16} />
//     </div>
//   );
// };

// export function ProfileCardShell({
//   children,
//   backgroundImage,
//   gradient,
//   cardClassName,
//   showBottomFade = true,
// }: {
//   children: ReactNode;
//   backgroundImage?: string;
//   gradient?: string;
//   cardClassName?: string;
//   showBottomFade?: boolean;
// }) {
//   const theme = useProfileTheme();
//   const cardGradient = gradient || theme.cardGradient;

//   return (
//     <section
//       className={combineClasses(
//         "relative w-full max-w-[540px] md:rounded-xl overflow-hidden",
//         cardClassName,
//       )}
//       style={{ backgroundColor: theme.panelBackground, boxShadow: theme.panelShadow }}
//     >
//       <div className="absolute inset-0 pointer-events-none" style={{ background: cardGradient }} />
//       {backgroundImage && (
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{
//             background: `url(${backgroundImage}) center/cover`,
//             filter: "blur(80px) brightness(1)",
//           }}
//         />
//       )}
//       <div className="relative z-10 pt-3 px-3 pb-20" style={{ height: "100%", overflowY: "auto" }}>
//         {children}
//       </div>
//       {showBottomFade && (
//         <GradualBlurMemo
//           target="page"
//           position="bottom"
//           height="8rem"
//           strength={2}
//           divCount={5}
//           curve="bezier"
//           exponential
//           opacity={1}
//         />
//       )}
//     </section>
//   );
// }

// export function ProfileIdentitySection({
//   children,
//   className,
// }: {
//   children: ReactNode;
//   className?: string;
// }) {
//   return <div className={combineClasses("relative z-10 text-center pt-10 px-6 pb-5", className)}>{children}</div>;
// }

// export function ProfileTopBar({
//   initial,
//   onShare,
//   actions,
// }: {
//   initial: string;
//   onShare?: () => void;
//   actions?: ReactNode;
// }) {
//   const theme = useProfileTheme();
//   return (
//     <header className="relative top-0 w-full max-w-[510px] z-10 flex items-center justify-between h-16 px-4">
//       <div
//         className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm font-bold"
//         style={{ backgroundColor: "rgba(255,255,255,0.9)", color: theme.textPrimary }}
//       >
//         {initial}
//       </div>
//       <div className="flex gap-2">
//         {actions ?? (
//           <button
//             type="button"
//             className="w-9 h-9 rounded-full flex items-center justify-center"
//             onClick={onShare}
//             style={{ backgroundColor: "rgba(255,255,255,0.92)", color: theme.iconColor }}
//           >
//             <Share size={16} />
//           </button>
//         )}
//       </div>
//     </header>
//   );
// }

// export function ProfileAvatarCoin({
//   avatarUrl,
//   fallbackInitial,
//   pageUrl,
//   size = 186,
// }: {
//   avatarUrl?: string | null;
//   fallbackInitial: string;
//   pageUrl: string;
//   size?: number;
// }) {
//   const [flipped, setFlipped] = useState(false);
//   const theme = useProfileTheme();
//   const qrSize = useMemo(() => Math.max(60, size - 46), [size]);
//   const coinWrapperStyle: CSSProperties = {
//     width: size,
//     height: size,
//     margin: "0 auto",
//     cursor: "pointer",
//     perspective: "1000px",
//   };
//   const coinInnerStyle: CSSProperties = {
//     width: "100%",
//     height: "100%",
//     position: "relative",
//     transformStyle: "preserve-3d",
//     transition: "transform 0.8s ease-in-out",
//     transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
//   };
//   const coinFaceStyle: CSSProperties = {
//     position: "absolute",
//     width: "100%",
//     height: "100%",
//     borderRadius: "50%",
//     backfaceVisibility: "hidden",
//     overflow: "hidden",
//     border: "4px solid white",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   };
//   const coinBackStyle: CSSProperties = {
//     ...coinFaceStyle,
//     background: "white",
//     transform: "rotateY(180deg)",
//   };

//   return (
//     <div
//       style={{
//         scale: flipped ? 1.6 : 1,
//         transitionProperty: "all",
//         transformOrigin: "center",
//         animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
//         transitionDuration: "1050ms",
//       }}
//       className="mx-auto w-[186px] h-[186px] rounded-full overflow-hidden border-white"
//     >
//       <div style={coinWrapperStyle} onClick={() => setFlipped((prev) => !prev)}>
//         <div style={coinInnerStyle}>
//           <div style={coinFaceStyle}>
//             {avatarUrl ? (
//               <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
//             ) : (
//               <div
//                 className="w-full h-full grid place-items-center bg-white text-lg"
//                 style={{ color: theme.textPrimary }}
//               >
//                 {fallbackInitial}
//               </div>
//             )}
//           </div>
//           <div style={coinBackStyle}>
//             <QRCode value={pageUrl} size={qrSize} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export function ProfileNameBlock({
//   displayName,
//   tagline,
// }: {
//   displayName: string;
//   tagline?: string;
// }) {
//   const theme = useProfileTheme();
//   return (
//     <>
//       <h1 className="mt-3 mb-1 text-[20px] font-extrabold" style={{ color: theme.textPrimary }}>
//         {displayName}
//       </h1>
//       {tagline && (
//         <p
//           className="mx-auto mb-3 text-[13px] max-w-[80%]"
//           style={{ color: theme.textSecondary }}
//         >
//           {tagline}
//         </p>
//       )}
//     </>
//   );
// }

// export function ProfileCTAButtons({
//   primaryLabel,
//   secondaryLabel,
//   onPrimaryClick,
//   onSecondaryClick,
// }: {
//   primaryLabel: string;
//   secondaryLabel: string;
//   onPrimaryClick?: () => void;
//   onSecondaryClick?: () => void;
// }) {
//   const theme = useProfileTheme();
//   return (
//     <div className="inline-flex rounded-full p-1 gap-2">
//       <button
//         type="button"
//         onClick={onPrimaryClick}
//         className="px-6 py-2 rounded-full font-semibold"
//         style={{ backgroundColor: theme.accentPrimary, color: theme.accentPrimaryText }}
//       >
//         {primaryLabel}
//       </button>
//       <button
//         type="button"
//         onClick={onSecondaryClick}
//         className="px-6 py-2 rounded-full font-semibold"
//         style={{ backgroundColor: theme.accentSecondary, color: theme.accentSecondaryText }}
//       >
//         {secondaryLabel}
//       </button>
//     </div>
//   );
// }

// export function ProfileLinkButton({
//   label,
//   url,
//   Icon,
// }: {
//   label: string;
//   url?: string;
//   Icon: IconRenderer;
// }) {
//   const theme = useProfileTheme();
//   const cardStyle = buildCardSurfaceStyle(theme);
//   return (
//     <a
//       href={url || "#"}
//       target={url ? "_blank" : undefined}
//       rel={url ? "noopener noreferrer" : undefined}
//       style={cardStyle}
//       className="flex z-10 items-center justify-between rounded-[28px] p-4"
//     >
//       <div className="flex items-center gap-3">
//         <Icon size={18} color={theme.iconColor} />
//         <span className="text-[14px]" style={{ color: theme.textPrimary }}>
//           {label}
//         </span>
//       </div>
//       <MenuTrigger />
//     </a>
//   );
// }

// export function ProfileActionButton({
//   label,
//   onClick,
//   Icon,
//   disabled,
// }: {
//   label: string;
//   onClick?: () => void;
//   Icon: IconRenderer;
//   disabled?: boolean;
// }) {
//   const theme = useProfileTheme();
//   const cardStyle = buildCardSurfaceStyle(theme);
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       style={cardStyle}
//       className="flex z-10 items-center justify-between rounded-[28px] p-4 disabled:opacity-60"
//     >
//       <div className="flex items-center gap-3">
//         <Icon size={18} color={theme.iconColor} />
//         <span className="text-[14px]" style={{ color: theme.textPrimary }}>
//           {label}
//         </span>
//       </div>
//       <MenuTrigger />
//     </button>
//   );
// }

// export function ProfileAlbumCard({
//   label,
//   images,
//   Icon,
// }: {
//   label: string;
//   images?: string[];
//   Icon: IconRenderer;
// }) {
//   const [open, setOpen] = useState(false);
//   const theme = useProfileTheme();
//   const cardStyle = buildCardSurfaceStyle(theme);
//   const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
//   const visible = safeImages.slice(0, 4);
//   const remaining = Math.max(safeImages.length - visible.length, 0);

//   return (
//     <>
//       <div
//         onClick={() => setOpen(true)}
//         style={cardStyle}
//         className="w-full rounded-[28px] p-4 cursor-pointer"
//       >
//         <div className="flex items-center gap-2 mb-3">
//           <Icon size={18} color={theme.iconColor} />
//           <span className="text-[14px]" style={{ color: theme.textPrimary }}>
//             {label}
//           </span>
//         </div>
//         <div className="grid grid-cols-2 grid-rows-2 gap-2 rounded-xl overflow-hidden">
//           {visible.map((src, i) => (
//             <div key={`${src}-${i}`} className="w-full h-[120px] bg-white relative">
//               {i === visible.length - 1 && remaining > 0 ? (
//                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xl font-semibold">
//                   +{remaining}
//                 </div>
//               ) : (
//                 <img src={src} alt="album item" className="w-full h-full object-cover" />
//               )}
//             </div>
//           ))}
//           {visible.length === 0 && (
//             <div className="col-span-2 h-[120px] grid place-items-center text-sm text-gray-500 bg-white/60">
//               Ajoutez des images via Manage profile.
//             </div>
//           )}
//         </div>
//         <div className="text-center mt-4">
//           <div className="text-[16px] font-semibold" style={{ color: theme.textPrimary }}>
//             {label}
//           </div>
//           <div className="text-[13px]" style={{ color: theme.textSecondary }}>
//             {safeImages.length} photos
//           </div>
//         </div>
//       </div>
//       <ImageGalleryModal images={safeImages} isOpen={open} onClose={() => setOpen(false)} />
//     </>
//   );
// }

// export type ProfileLinksSectionItem = {
//   id?: string | number;
//   label: string;
//   type?: "link" | "album" | "vcf";
//   icon: IconRenderer;
//   url?: string;
//   images?: string[];
//   onClick?: () => void;
//   disabled?: boolean;
// };

// export function ProfileLinksSection({
//   items,
//   emptyMessage = "Aucune carte configuree pour le moment.",
// }: {
//   items: ProfileLinksSectionItem[];
//   emptyMessage?: string;
// }) {
//   const theme = useProfileTheme();
//   if (!items.length) {
//     return (
//       <main className="relative z-10 px-7 pb-9 pt-2 flex flex-col gap-3.5">
//         <div className="text-center text-sm py-10" style={{ color: theme.textSecondary }}>
//           {emptyMessage}
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="relative z-10 px-7 pb-9 pt-2 flex flex-col gap-3.5">
//       {items.map((item) => {
//         if (item.type === "album") {
//           return (
//             <ProfileAlbumCard
//               key={item.id ?? item.label}
//               label={item.label}
//               Icon={item.icon}
//               images={item.images}
//             />
//           );
//         }
//         if (item.type === "vcf") {
//           return (
//             <ProfileActionButton
//               key={item.id ?? item.label}
//               label={item.label}
//               Icon={item.icon}
//               onClick={item.onClick}
//               disabled={item.disabled}
//             />
//           );
//         }
//         return (
//           <ProfileLinkButton
//             key={item.id ?? item.label}
//             label={item.label}
//             url={item.url}
//             Icon={item.icon}
//           />
//         );
//       })}
//     </main>
//   );
// }








// test1

"use client"

import {
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react"
import QRCode from "react-qr-code"
import GradualBlurMemo from "@/components/GradualBlur"
import ImageGalleryModal from "@/lib/components/ImageGalleryModal"
import { DEFAULT_PROFILE_THEME, type ProfileTheme } from "@/types/profile"
import { MoreVertical, Share } from "lucide-react"

type IconRenderer = ComponentType<{ size?: number; color?: string }>

type ThemeOverride = Partial<ProfileTheme>

const ThemeContext = createContext<ProfileTheme>(DEFAULT_PROFILE_THEME)

export function ProfileThemeProvider({
  value,
  children,
}: {
  value?: ThemeOverride | null
  children: ReactNode
}) {
  const merged = useMemo(() => ({ ...DEFAULT_PROFILE_THEME, ...(value || {}) }), [value])
  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>
}

export function useProfileTheme() {
  return useContext(ThemeContext)
}

const combineClasses = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ")

const buildCardSurfaceStyle = (theme: ProfileTheme): CSSProperties => ({
  backgroundColor: theme.cardSurface,
  boxShadow: theme.cardShadow,
})

const MenuTrigger = () => {
  const theme = useProfileTheme()
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
      style={{ backgroundColor: "rgba(255,255,255,0.9)", color: theme.iconColor }}
    >
      <MoreVertical size={16} />
    </div>
  )
}

export function ProfileCardShell({
  children,
  backgroundImage,
  gradient,
  cardClassName,
  showBottomFade = true,
}: {
  children: ReactNode
  backgroundImage?: string
  gradient?: string
  cardClassName?: string
  showBottomFade?: boolean
}) {
  const theme = useProfileTheme()
  const cardGradient = gradient || theme.cardGradient

  return (
    <section
      className={combineClasses(
        "relative w-full max-w-[540px] mx-auto rounded-2xl md:rounded-3xl overflow-hidden",
        "xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl",
        cardClassName,
      )}
      style={{ backgroundColor: theme.panelBackground, boxShadow: theme.panelShadow }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: cardGradient }} />
      {backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `url(${backgroundImage}) center/cover`,
            filter: "blur(80px) brightness(1)",
          }}
        />
      )}
      <div className="relative z-10 pt-2 px-3 xs:px-4 sm:px-5 md:px-6 pb-20" style={{ minHeight: "100vh" }}>
        {children}
      </div>
      {showBottomFade && (
        <GradualBlurMemo
          target="page"
          position="bottom"
          height="8rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
        />
      )}
    </section>
  )
}

export function ProfileIdentitySection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={combineClasses("relative z-10 text-center pt-8 md:pt-10 px-4 md:px-6 pb-3 md:pb-5", className)}>
      {children}
    </div>
  )
}

export function ProfileTopBar({
  initial,
  onShare,
  actions,
}: {
  initial: string
  onShare?: () => void
  actions?: ReactNode
}) {
  const theme = useProfileTheme()
  return (
    <header className="relative top-0 w-full z-10 flex items-center justify-between h-14 md:h-16 px-3 md:px-4">
      <div
        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-sm font-bold text-xs md:text-sm hover:scale-110 transition-transform"
        style={{ backgroundColor: "rgba(255,255,255,0.95)", color: theme.textPrimary }}
      >
        {initial}
      </div>
      <div className="flex gap-2">
        {actions ?? (
          <button
            type="button"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            onClick={onShare}
            style={{ backgroundColor: "rgba(255,255,255,0.95)", color: theme.iconColor }}
          >
            <Share size={16} />
          </button>
        )}
      </div>
    </header>
  )
}

export function ProfileAvatarCoin({
  avatarUrl,
  fallbackInitial,
  pageUrl,
  size = 186,
  onQRCodeUrlChange,
}: {
  avatarUrl?: string | null
  fallbackInitial: string
  pageUrl: string
  size?: number
  onQRCodeUrlChange?: (url: string) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const theme = useProfileTheme()
  const qrSize = useMemo(() => Math.max(60, size - 46), [size])

  const handleFlip = useCallback(() => {
    setFlipped((prev) => {
      const newFlipped = !prev
      if (newFlipped && onQRCodeUrlChange) {
        onQRCodeUrlChange(pageUrl)
      }
      return newFlipped
    })
  }, [pageUrl, onQRCodeUrlChange])

  const coinWrapperStyle: CSSProperties = {
    width: `clamp(140px, 50vw, ${size}px)`,
    height: `clamp(140px, 50vw, ${size}px)`,
    margin: "0 auto",
    cursor: "pointer",
    perspective: "1000px",
  }

  const coinInnerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  }

  const coinFaceStyle: CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backfaceVisibility: "hidden",
    overflow: "hidden",
    border: "4px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
  }

  const coinBackStyle: CSSProperties = {
    ...coinFaceStyle,
    background: "white",
    transform: "rotateY(180deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  return (
    <div
      style={{
        scale: flipped ? 1.1 : 1,
        transitionProperty: "all",
        transformOrigin: "center",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        transitionDuration: "300ms",
      }}
      className="mx-auto"
    >
      <div style={coinWrapperStyle} onClick={handleFlip}>
        <div style={coinInnerStyle}>
          <div style={coinFaceStyle}>
            {avatarUrl ? (
              <img src={avatarUrl || "/placeholder.svg"} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-lg md:text-2xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {fallbackInitial}
              </div>
            )}
          </div>
          <div style={coinBackStyle}>
            <QRCode value={pageUrl} size={qrSize} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileNameBlock({
  displayName,
  tagline,
}: {
  displayName: string
  tagline?: string
}) {
  const theme = useProfileTheme()
  return (
    <>
      <h1
        className="mt-2 md:mt-3 mb-1 text-lg md:text-xl font-extrabold tracking-tight"
        style={{ color: theme.textPrimary }}
      >
        {displayName}
      </h1>
      {tagline && (
        <p
          className="mx-auto mb-3 text-xs md:text-sm max-w-[90%] md:max-w-[85%] leading-relaxed"
          style={{ color: theme.textSecondary }}
        >
          {tagline}
        </p>
      )}
    </>
  )
}

export function ProfileCTAButtons({
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  direction,
}: {
  primaryLabel: string
  secondaryLabel: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  direction?: "row" | "column"
}) {
  const theme = useProfileTheme()

  // Build className to optionally force row/column layout. Default keeps the
  // responsive behaviour (column on small, row on xs+).
  const base = "flex gap-2 md:gap-3 justify-center mt-3 md:mt-4 mb-2"
  const layoutClass = direction === "row" ? "flex-row" : direction === "column" ? "flex-col" : "flex-col xs:flex-row"

  return (
    <div className={`${base} ${layoutClass}`}>
      <button
        type="button"
        onClick={onPrimaryClick}
        className="px-5 md:px-6 py-2 md:py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: theme.accentPrimary,
          color: theme.accentPrimaryText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={onSecondaryClick}
        className="px-5 md:px-6 py-2 md:py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: theme.accentSecondary,
          color: theme.accentSecondaryText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {secondaryLabel}
      </button>
    </div>
  )
}

export function ProfileLinkButton({
  label,
  url,
  Icon,
}: {
  label: string
  url?: string
  Icon: IconRenderer
}) {
  const theme = useProfileTheme()
  const cardStyle = buildCardSurfaceStyle(theme)
  return (
    <a
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel={url ? "noopener noreferrer" : undefined}
      style={cardStyle}
      className="flex z-10 items-center justify-between rounded-2xl md:rounded-3xl p-3 md:p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: `${theme.accentPrimary}20` }}>
          <Icon size={18} color={theme.iconColor} />
        </div>
        <span className="text-xs md:text-sm font-medium" style={{ color: theme.textPrimary }}>
          {label}
        </span>
      </div>
      <MenuTrigger />
    </a>
  )
}

export function ProfileActionButton({
  label,
  onClick,
  Icon,
  disabled,
}: {
  label: string
  onClick?: () => void
  Icon: IconRenderer
  disabled?: boolean
}) {
  const theme = useProfileTheme()
  const cardStyle = buildCardSurfaceStyle(theme)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={cardStyle}
      className="w-full flex items-center justify-between rounded-2xl md:rounded-3xl p-3 md:p-4 disabled:opacity-60 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: `${theme.accentPrimary}20` }}>
          <Icon size={18} color={theme.iconColor} />
        </div>
        <span className="text-xs md:text-sm font-medium" style={{ color: theme.textPrimary }}>
          {label}
        </span>
      </div>
      <MenuTrigger />
    </button>
  )
}

export function ProfileAlbumCard({
  label,
  images,
  Icon,
}: {
  label: string
  images?: string[]
  Icon: IconRenderer
}) {
  const [open, setOpen] = useState(false)
  const theme = useProfileTheme()
  const cardStyle = buildCardSurfaceStyle(theme)
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : []
  const visible = safeImages.slice(0, 4)
  const remaining = Math.max(safeImages.length - visible.length, 0)

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={cardStyle}
        className="w-full rounded-2xl md:rounded-3xl p-3 md:p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: `${theme.accentPrimary}20` }}>
            <Icon size={18} color={theme.iconColor} />
          </div>
          <span className="text-xs md:text-sm font-medium" style={{ color: theme.textPrimary }}>
            {label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 rounded-lg md:rounded-xl overflow-hidden">
          {visible.map((src, i) => (
            <div key={`${src}-${i}`} className="w-full aspect-square bg-white relative overflow-hidden">
              {i === visible.length - 1 && remaining > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-base md:text-lg font-semibold">
                  +{remaining}
                </div>
              ) : (
                <img src={src || "/placeholder.svg"} alt="album item" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <div className="col-span-2 h-24 md:h-28 grid place-items-center text-xs text-gray-500 bg-white/60">
              Add images via Manage profile
            </div>
          )}
        </div>
        <div className="text-center mt-3 md:mt-4">
          <div className="text-sm md:text-base font-semibold" style={{ color: theme.textPrimary }}>
            {label}
          </div>
          <div className="text-xs" style={{ color: theme.textSecondary }}>
            {safeImages.length} photos
          </div>
        </div>
      </div>
      <ImageGalleryModal images={safeImages} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

export type ProfileLinksSectionItem = {
  id?: string | number
  label: string
  type?: "link" | "album" | "vcf"
  icon: IconRenderer
  url?: string
  images?: string[]
  onClick?: () => void
  disabled?: boolean
}

export function ProfileLinksSection({
  items,
  emptyMessage = "No links configured yet.",
}: {
  items: ProfileLinksSectionItem[]
  emptyMessage?: string
}) {
  const theme = useProfileTheme()
  if (!items.length) {
    return (
      <main className="relative z-10 px-4 md:px-6 pb-9 pt-2 flex flex-col gap-2 md:gap-3.5">
        <div className="text-center text-xs md:text-sm py-10" style={{ color: theme.textSecondary }}>
          {emptyMessage}
        </div>
      </main>
    )
  }

  return (
    <main className="relative z-10 px-4 md:px-6 pb-9 pt-2 flex flex-col gap-2 md:gap-3.5">
      {items.map((item) => {
        if (item.type === "album") {
          return (
            <ProfileAlbumCard key={item.id ?? item.label} label={item.label} Icon={item.icon} images={item.images} />
          )
        }
        if (item.type === "vcf") {
          return (
            <ProfileActionButton
              key={item.id ?? item.label}
              label={item.label}
              Icon={item.icon}
              onClick={item.onClick}
              disabled={item.disabled}
            />
          )
        }
        return <ProfileLinkButton key={item.id ?? item.label} label={item.label} url={item.url} Icon={item.icon} />
      })}
    </main>
  )
}
