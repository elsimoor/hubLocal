export type ProfileLinkType = "link" | "album" | "vcf";

export interface ProfileLink {
  id?: string; // client-side helper identifier
  type: ProfileLinkType;
  label: string;
  iconKey: string;
  url?: string;
  images?: string[];
}

export interface ProfileVcfFields {
  firstName: string;
  lastName: string;
  cellPhone: string;
  workPhone: string;
  workEmail: string;
  homeEmail: string;
  workAddress: string;
  workCity: string;
  workZip: string;
  homeAddress: string;
  homeCity: string;
  homeZip: string;
  org: string;
  title: string;
  url: string;
  note: string;
  linkedin: string;
  github: string;
  whatsapp: string;
}

export interface ProfileTheme {
  cardGradient: string;
  panelBackground: string;
  panelShadow: string;
  cardSurface: string;
  cardShadow: string;
  accentPrimary: string;
  accentPrimaryText: string;
  accentSecondary: string;
  accentSecondaryText: string;
  textPrimary: string;
  textSecondary: string;
  iconColor: string;
}

export interface ProfilePayload {
  slug: string;
  displayName: string;
  tagline: string;
  avatarUrl: string;
  backgroundUrl: string;
  buttonPrimaryLabel: string;
  buttonSecondaryLabel: string;
  links: ProfileLink[];
  vcf: ProfileVcfFields;
  theme: ProfileTheme;
}

export const PROFILE_ICON_KEYS = [
  "Contact2",
  "Globe",
  "Image",
  "Mail",
  "Share",
  "UserCheck2",
  "Youtube",
] as const;

export const PROFILE_LINK_TYPES: ProfileLinkType[] = ["link", "album", "vcf"];

export const DEFAULT_PROFILE_VCF: ProfileVcfFields = {
  firstName: "",
  lastName: "",
  cellPhone: "",
  workPhone: "",
  workEmail: "",
  homeEmail: "",
  workAddress: "",
  workCity: "",
  workZip: "",
  homeAddress: "",
  homeCity: "",
  homeZip: "",
  org: "",
  title: "",
  url: "",
  note: "",
  linkedin: "",
  github: "",
  whatsapp: "",
};

export const DEFAULT_PROFILE_THEME: ProfileTheme = {
  cardGradient: "linear-gradient(180deg, #8cc0de 0%, #f7ecd7 65%, #f5e7d0 100%)",
  panelBackground: "#ffffff",
  panelShadow: "0 40px 65px rgba(16, 34, 66, 0.25)",
  cardSurface: "#fbf3e7",
  cardShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 18px rgba(51, 45, 34, 0.2)",
  accentPrimary: "#fbf3e7",
  accentPrimaryText: "#163a39",
  accentSecondary: "#3c706f",
  accentSecondaryText: "#ffffff",
  textPrimary: "#163a39",
  textSecondary: "#2b2b2b",
  iconColor: "#163a39",
};

const PROFILE_TEMPLATE = {
  slug: "",
  displayName: "",
  tagline: "",
  avatarUrl: "",
  backgroundUrl: "",
  buttonPrimaryLabel: "Connect",
  buttonSecondaryLabel: "Links",
  theme: { ...DEFAULT_PROFILE_THEME },
} as const;

export function createEmptyProfilePayload(): ProfilePayload {
  return {
    ...PROFILE_TEMPLATE,
    links: [],
    vcf: { ...DEFAULT_PROFILE_VCF },
    theme: { ...DEFAULT_PROFILE_THEME },
  };
}

const SAMPLE_IMAGE_URL =
  "https://media-mad2-1.cdn.whatsapp.net/v/t61.24694-24/580079207_1361657892137598_6131541602506961288_n.jpg?ccb=11-4&oh=01_Q5Aa3AFBfRV_FWTlojjP0dLgHv5IWlOt6Kf0U6vS3oKZnOjkaQ&oe=692BC342&_nc_sid=5e03e0&_nc_cat=101";

const SAMPLE_ALBUM_IMAGES = [
  "https://remote.com/hubfs/Remote%20Website%20-%202025/Country%20Explorer%20Assets/denmark-employment-guide.webp",
  "https://www.ambassadorcruiseline.com/_astro/1200x675_Z2t9Cz1.webp",
  "https://explore-live.s3.eu-west-1.amazonaws.com/medialibraries/explore/explore-media/destinations/europe/denmark/denmark-thumb.jpg?ext=.jpg",
  "https://career-advice.jobs.ac.uk/wp-content/uploads/Nyhavn-Copenhagen-1193065316-1170x630.jpg.optimal.jpg",
];

export function createSampleProfilePayload(slug: string, displayName?: string): ProfilePayload {
  const sample = createEmptyProfilePayload();
  sample.slug = slug;
  sample.displayName = displayName || slug || "";
  sample.tagline = "Luxury, Fashion, Personal Style Enthusiast, Entrepreneur.";
  sample.avatarUrl = SAMPLE_IMAGE_URL;
  sample.backgroundUrl = SAMPLE_IMAGE_URL;
  sample.links = [
    { type: "vcf", label: "Download VCF", iconKey: "Contact2" },
    { type: "link", label: "My YouTube Channel", iconKey: "Youtube", url: "https://youtube.com/@hublocal" },
    { type: "link", label: "My Website", iconKey: "Globe", url: "https://hublocal.link" },
    { type: "link", label: "My Portfolio", iconKey: "UserCheck2", url: "https://hublocal.link/portfolio" },
    { type: "album", label: "My Photo Album", iconKey: "Image", images: [...SAMPLE_ALBUM_IMAGES] },
    { type: "link", label: "Contact Me", iconKey: "Mail", url: "mailto:walidmoultamis@gmail.com" },
  ];
  sample.vcf = {
    ...DEFAULT_PROFILE_VCF,
    firstName: "Walid",
    lastName: "Moultamiss",
    cellPhone: "+212600000000",
    workPhone: "+212522000000",
    workEmail: "walid@company.com",
    homeEmail: "walid@example.com",
    workAddress: "123 Avenue Hassan II",
    workCity: "Casablanca",
    workZip: "20000",
    homeAddress: "45 Rue Al Amal",
    homeCity: "Rabat",
    homeZip: "10000",
    org: "ByteForce",
    title: "Full Stack Developer",
    url: "https://byteforce.ma",
    note: "Best Moroccan developer you can hire.",
    linkedin: "https://linkedin.com/in/walid",
    github: "https://github.com/walid",
    whatsapp: "+212600000000",
  };
  sample.theme = { ...DEFAULT_PROFILE_THEME };
  return sample;
}
