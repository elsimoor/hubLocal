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

const PROFILE_TEMPLATE = {
  slug: "",
  displayName: "",
  tagline: "",
  avatarUrl: "",
  backgroundUrl: "",
  buttonPrimaryLabel: "Connect",
  buttonSecondaryLabel: "Links",
} as const;

export function createEmptyProfilePayload(): ProfilePayload {
  return {
    ...PROFILE_TEMPLATE,
    links: [],
    vcf: { ...DEFAULT_PROFILE_VCF },
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
  return sample;
}
