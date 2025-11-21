// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useState } from "react";
// import { uploadImageToFirebase } from "@/lib/firebase/client";
// import {
//   PROFILE_ICON_KEYS,
//   ProfileLink,
//   ProfileLinkType,
//   ProfilePayload,
//   createEmptyProfilePayload,
// } from "@/types/profile";
// import { ExternalLink, Loader2, PlusCircle, Trash2, Upload } from "lucide-react";

// const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://hub-local-nu.vercel.app").replace(/\/$/, "");

// const ICON_OPTIONS = PROFILE_ICON_KEYS.map((key) => ({ value: key, label: key }));
// const LINK_TYPE_OPTIONS: { value: ProfileLinkType; label: string }[] = [
//   { value: "link", label: "Link" },
//   { value: "album", label: "Album" },
//   { value: "vcf", label: "Download vCard" },
// ];

// function makeId() {
//   if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
//   return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
// }

// export default function ManageProfilePage() {
//   const [profile, setProfile] = useState<ProfilePayload>(createEmptyProfilePayload());
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [uploadingField, setUploadingField] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;
//     async function load() {
//       setLoading(true);
//       try {
//         const res = await fetch("/api/profiles/me", { cache: "no-store" });
//         if (!res.ok) throw new Error("profile_load_failed");
//         const data = await res.json();
//         if (!mounted) return;
//         setProfile({
//           ...data,
//           links: Array.isArray(data.links)
//             ? data.links.map((link: ProfileLink) => ({ ...link, id: link.id || makeId() }))
//             : [],
//         });
//       } catch (err: any) {
//         if (!mounted) return;
//         setError("Impossible de charger le profil.");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }
//     load();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const hasVcfLink = useMemo(() => profile.links.some((l) => l.type === "vcf"), [profile.links]);
//   const publicProfileUrl = useMemo(() => {
//     const cleanSlug = profile.slug?.replace(/^\/+|\/+$/g, "");
//     if (!cleanSlug) return null;
//     return `${SITE_URL}/profile/${cleanSlug}`;
//   }, [profile.slug]);

//   function updateProfileField<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
//     setProfile((prev) => ({ ...prev, [key]: value }));
//   }

//   function updateLink(id: string, patch: Partial<ProfileLink>) {
//     setProfile((prev) => ({
//       ...prev,
//       links: prev.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
//     }));
//   }

//   function removeLink(id: string) {
//     setProfile((prev) => ({ ...prev, links: prev.links.filter((link) => link.id !== id) }));
//   }

//   function addLink(type: ProfileLinkType) {
//     if (type === "vcf" && hasVcfLink) return;
//     const base: ProfileLink = {
//       id: makeId(),
//       type,
//       label: type === "vcf" ? "Download vCard" : "Nouvelle carte",
//       iconKey: "Share",
//       url: "",
//       images: type === "album" ? [] : undefined,
//     };
//     setProfile((prev) => ({ ...prev, links: [...prev.links, base] }));
//   }

//   async function handleImageUpload(field: "avatarUrl" | "backgroundUrl", file?: File) {
//     if (!file) return;
//     setUploadingField(field);
//     try {
//       const url = await uploadImageToFirebase(file, `profiles/${profile.slug || "temp"}`);
//       updateProfileField(field, url);
//     } catch (err) {
//       setError("Erreur lors de l'upload de l'image.");
//     } finally {
//       setUploadingField(null);
//     }
//   }

//   async function handleAlbumImageUpload(linkId: string, index: number, file?: File) {
//     if (!file) return;
//     const target = `${linkId}-${index}`;
//     setUploadingField(target);
//     try {
//       const url = await uploadImageToFirebase(file, `profiles/${profile.slug || "temp"}/albums`);
//       setProfile((prev) => ({
//         ...prev,
//         links: prev.links.map((link) => {
//           if (link.id !== linkId) return link;
//           const nextImages = [...(link.images || [])];
//           nextImages[index] = url;
//           return { ...link, images: nextImages };
//         }),
//       }));
//     } catch (err) {
//       setError("Upload impossible pour cette image.");
//     } finally {
//       setUploadingField(null);
//     }
//   }

//   function addAlbumImage(linkId: string) {
//     setProfile((prev) => ({
//       ...prev,
//       links: prev.links.map((link) => {
//         if (link.id !== linkId) return link;
//         return { ...link, images: [...(link.images || []), ""] };
//       }),
//     }));
//   }

//   function updateAlbumImage(linkId: string, index: number, value: string) {
//     setProfile((prev) => ({
//       ...prev,
//       links: prev.links.map((link) => {
//         if (link.id !== linkId) return link;
//         const next = [...(link.images || [])];
//         next[index] = value;
//         return { ...link, images: next };
//       }),
//     }));
//   }

//   function removeAlbumImage(linkId: string, index: number) {
//     setProfile((prev) => ({
//       ...prev,
//       links: prev.links.map((link) => {
//         if (link.id !== linkId) return link;
//         const next = [...(link.images || [])];
//         next.splice(index, 1);
//         return { ...link, images: next };
//       }),
//     }));
//   }

//   async function handleSave() {
//     setSaving(true);
//     setMessage(null);
//     setError(null);
//     try {
//       const payload = {
//         ...profile,
//         links: profile.links.map(({ id, ...rest }) => ({
//           ...rest,
//           images: rest.type === "album" ? rest.images || [] : undefined,
//         })),
//       };
//       const res = await fetch("/api/profiles/me", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         if (data?.error === "slug_taken") throw new Error("slug_taken");
//         if (data?.error === "missing_slug") throw new Error("missing_slug");
//         throw new Error("save_failed");
//       }
//       const saved = await res.json();
//       setProfile({
//         ...saved,
//         links: Array.isArray(saved.links)
//           ? saved.links.map((link: ProfileLink) => ({ ...link, id: link.id || makeId() }))
//           : [],
//       });
//       setMessage("Profil enregistré.");
//     } catch (err: any) {
//       if (err?.message === "slug_taken") setError("Ce slug est déjà utilisé.");
//       else if (err?.message === "missing_slug") setError("Le slug est obligatoire.");
//       else setError("Impossible d'enregistrer les modifications.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-[50vh] grid place-items-center">
//         <Loader2 className="animate-spin text-gray-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto space-y-8">
//       <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//         <div className="space-y-1">
//           <p className="text-sm uppercase tracking-wide text-gray-500">Profile</p>
//           <h1 className="text-2xl font-semibold">Manage profile</h1>
//           <p className="text-sm text-gray-600">
//             Configure everything that shows up sur votre page publique <code>/profile/{profile.slug || "slug"}</code>.
//           </p>
//         </div>
//         {publicProfileUrl ? (
//           <Link
//             href={publicProfileUrl}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
//           >
//             Voir ma page <ExternalLink size={16} />
//           </Link>
//         ) : (
//           <button
//             type="button"
//             className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500"
//             disabled
//           >
//             Définissez un slug pour prévisualiser
//           </button>
//         )}
//       </header>

//       {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
//       {message && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}

//       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
//         <h2 className="text-lg font-semibold">Informations principales</h2>
//         <div className="grid gap-4 md:grid-cols-2">
//           <div>
//             <label className="text-sm font-medium text-gray-700">Slug</label>
//             <input
//               className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//               value={profile.slug}
//               onChange={(e) => updateProfileField("slug", e.target.value)}
//               placeholder="ex: walid"
//             />
//             <p className="text-xs text-gray-500 mt-1">Utilisé dans l'URL publique.</p>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-gray-700">Nom affiché</label>
//             <input
//               className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//               value={profile.displayName}
//               onChange={(e) => updateProfileField("displayName", e.target.value)}
//               placeholder="Walid Moultamiss"
//             />
//           </div>
//           <div className="md:col-span-2">
//             <label className="text-sm font-medium text-gray-700">Tagline / bio</label>
//             <textarea
//               className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//               rows={3}
//               value={profile.tagline}
//               onChange={(e) => updateProfileField("tagline", e.target.value)}
//               placeholder="Luxury, fashion, personal style..."
//             />
//           </div>
//           <div>
//             <label className="text-sm font-medium text-gray-700">Bouton principal</label>
//             <input
//               className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//               value={profile.buttonPrimaryLabel}
//               onChange={(e) => updateProfileField("buttonPrimaryLabel", e.target.value)}
//             />
//           </div>
//           <div>
//             <label className="text-sm font-medium text-gray-700">Bouton secondaire</label>
//             <input
//               className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//               value={profile.buttonSecondaryLabel}
//               onChange={(e) => updateProfileField("buttonSecondaryLabel", e.target.value)}
//             />
//           </div>
//         </div>
//       </section>

//       <ImageField
//         label="Photo de profil"
//         helper="Image ronde au centre de la carte"
//         value={profile.avatarUrl}
//         onChange={(url) => updateProfileField("avatarUrl", url)}
//         uploading={uploadingField === "avatarUrl"}
//         onUpload={(file) => handleImageUpload("avatarUrl", file)}
//       />

//       <ImageField
//         label="Image d'arrière-plan"
//         helper="Utilisée pour le flou en haut de page"
//         value={profile.backgroundUrl}
//         onChange={(url) => updateProfileField("backgroundUrl", url)}
//         uploading={uploadingField === "backgroundUrl"}
//         onUpload={(file) => handleImageUpload("backgroundUrl", file)}
//       />

//       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
//         <header className="flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">Cartes & liens</h2>
//             <p className="text-sm text-gray-500">Chaque carte correspond à un bloc sur la page publique.</p>
//           </div>
//           <div className="flex gap-2">
//             <button
//               className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
//               onClick={() => addLink("link")}
//             >
//               <PlusCircle size={16} /> Carte lien
//             </button>
//             <button
//               className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
//               onClick={() => addLink("album")}
//             >
//               <PlusCircle size={16} /> Album
//             </button>
//             <button
//               className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
//               disabled={hasVcfLink}
//               onClick={() => addLink("vcf")}
//             >
//               <PlusCircle size={16} /> Bouton vCard
//             </button>
//           </div>
//         </header>

//         <div className="space-y-4">
//           {profile.links.map((link) => (
//             <div key={link.id} className="border rounded-xl p-4 space-y-3">
//               <div className="flex items-center justify-between">
//                 <strong className="text-sm">{link.label || "Sans titre"}</strong>
//                 <button
//                   className="text-red-500 hover:text-red-600"
//                   onClick={() => removeLink(link.id!)}
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//               <div className="grid gap-3 md:grid-cols-3">
//                 <div>
//                   <label className="text-xs uppercase tracking-wide text-gray-500">Label</label>
//                   <input
//                     className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                     value={link.label}
//                     onChange={(e) => updateLink(link.id!, { label: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <label className="text-xs uppercase tracking-wide text-gray-500">Type</label>
//                   <select
//                     className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                     value={link.type}
//                     onChange={(e) => {
//                       const value = e.target.value as ProfileLinkType;
//                       if (value === "vcf" && hasVcfLink && link.type !== "vcf") return;
//                       updateLink(link.id!, {
//                         type: value,
//                         images: value === "album" ? link.images || [] : undefined,
//                         url: value === "link" ? link.url || "" : "",
//                       });
//                     }}
//                   >
//                     {LINK_TYPE_OPTIONS.map((option) => (
//                       <option key={option.value} value={option.value} disabled={option.value === "vcf" && hasVcfLink && link.type !== "vcf"}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs uppercase tracking-wide text-gray-500">Icône</label>
//                   <select
//                     className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                     value={link.iconKey}
//                     onChange={(e) => updateLink(link.id!, { iconKey: e.target.value })}
//                   >
//                     {ICON_OPTIONS.map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {link.type === "link" && (
//                 <div>
//                   <label className="text-xs uppercase tracking-wide text-gray-500">URL</label>
//                   <input
//                     className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                     value={link.url || ""}
//                     onChange={(e) => updateLink(link.id!, { url: e.target.value })}
//                     placeholder="https://"
//                   />
//                 </div>
//               )}

//               {link.type === "album" && (
//                 <div className="space-y-2">
//                   <label className="text-xs uppercase tracking-wide text-gray-500">Images ({link.images?.length || 0})</label>
//                   {(link.images || []).map((img, index) => {
//                     const fieldId = `${link.id}-${index}`;
//                     return (
//                       <div key={fieldId} className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-200 p-3">
//                         <div className="flex items-center gap-2">
//                           <input
//                             className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                             value={img}
//                             onChange={(e) => updateAlbumImage(link.id!, index, e.target.value)}
//                             placeholder="https://"
//                           />
//                           <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
//                             <Upload size={14} />
//                             <input
//                               type="file"
//                               accept="image/*"
//                               className="hidden"
//                               onChange={(e) => handleAlbumImageUpload(link.id!, index, e.target.files?.[0])}
//                             />
//                           </label>
//                           <button
//                             className="text-red-500"
//                             onClick={() => removeAlbumImage(link.id!, index)}
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                         {uploadingField === fieldId && <p className="text-xs text-gray-500">Upload en cours...</p>}
//                       </div>
//                     );
//                   })}
//                   <button
//                     className="text-sm text-gray-700 inline-flex items-center gap-2"
//                     onClick={() => addAlbumImage(link.id!)}
//                   >
//                     <PlusCircle size={16} /> Ajouter une image
//                   </button>
//                 </div>
//               )}
//               {link.type === "vcf" && (
//                 <p className="text-sm text-gray-500">Ce bouton déclenchera le téléchargement de votre vCard configurée ci-dessous.</p>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       <VcfEditor vcf={profile.vcf} onChange={(fields) => updateProfileField("vcf", fields)} />

//       <div className="flex justify-end">
//         <button
//           onClick={handleSave}
//           disabled={saving}
//           className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
//         >
//           {saving && <Loader2 size={16} className="animate-spin" />}
//           Enregistrer
//         </button>
//       </div>
//     </div>
//   );
// }

// function ImageField({
//   label,
//   helper,
//   value,
//   onChange,
//   onUpload,
//   uploading,
// }: {
//   label: string;
//   helper?: string;
//   value: string;
//   onChange: (url: string) => void;
//   onUpload: (file?: File) => void;
//   uploading: boolean;
// }) {
//   return (
//     <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
//       <div>
//         <h2 className="text-lg font-semibold">{label}</h2>
//         {helper && <p className="text-sm text-gray-500">{helper}</p>}
//       </div>
//       <div className="flex flex-col gap-3 md:flex-row">
//         <input
//           className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder="https://"
//         />
//         <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm cursor-pointer whitespace-nowrap">
//           <Upload size={16} />
//           {uploading ? "Upload..." : "Envoyer"}
//           <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
//         </label>
//       </div>
//     </section>
//   );
// }

// function VcfEditor({ vcf, onChange }: { vcf: ProfilePayload["vcf"]; onChange: (next: ProfilePayload["vcf"]) => void }) {
//   function update<K extends keyof ProfilePayload["vcf"]>(key: K, value: string) {
//     onChange({ ...vcf, [key]: value });
//   }

//   return (
//     <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
//       <h2 className="text-lg font-semibold">vCard</h2>
//       <div className="grid gap-4 md:grid-cols-2">
//         <InputField label="Prénom" value={vcf.firstName} onChange={(v) => update("firstName", v)} />
//         <InputField label="Nom" value={vcf.lastName} onChange={(v) => update("lastName", v)} />
//         <InputField label="Téléphone perso" value={vcf.cellPhone} onChange={(v) => update("cellPhone", v)} />
//         <InputField label="Téléphone pro" value={vcf.workPhone} onChange={(v) => update("workPhone", v)} />
//         <InputField label="Email pro" value={vcf.workEmail} onChange={(v) => update("workEmail", v)} />
//         <InputField label="Email perso" value={vcf.homeEmail} onChange={(v) => update("homeEmail", v)} />
//         <InputField label="Organisation" value={vcf.org} onChange={(v) => update("org", v)} />
//         <InputField label="Titre" value={vcf.title} onChange={(v) => update("title", v)} />
//         <InputField label="Site web" value={vcf.url} onChange={(v) => update("url", v)} />
//         <InputField label="LinkedIn" value={vcf.linkedin} onChange={(v) => update("linkedin", v)} />
//         <InputField label="GitHub" value={vcf.github} onChange={(v) => update("github", v)} />
//         <InputField label="WhatsApp" value={vcf.whatsapp} onChange={(v) => update("whatsapp", v)} />
//       </div>
//       <div className="grid gap-4 md:grid-cols-3">
//         <InputField label="Adresse pro" value={vcf.workAddress} onChange={(v) => update("workAddress", v)} />
//         <InputField label="Ville pro" value={vcf.workCity} onChange={(v) => update("workCity", v)} />
//         <InputField label="Code postal pro" value={vcf.workZip} onChange={(v) => update("workZip", v)} />
//         <InputField label="Adresse perso" value={vcf.homeAddress} onChange={(v) => update("homeAddress", v)} />
//         <InputField label="Ville perso" value={vcf.homeCity} onChange={(v) => update("homeCity", v)} />
//         <InputField label="Code postal perso" value={vcf.homeZip} onChange={(v) => update("homeZip", v)} />
//       </div>
//       <div>
//         <label className="text-sm font-medium text-gray-700">Note</label>
//         <textarea
//           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//           rows={3}
//           value={vcf.note}
//           onChange={(e) => update("note", e.target.value)}
//         />
//       </div>
//     </section>
//   );
// }

// function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
//   return (
//     <div>
//       <label className="text-sm font-medium text-gray-700">{label}</label>
//       <input
//         className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       />
//     </div>
//   );
// }



// test1


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { uploadImageToFirebase } from "@/lib/firebase/client";
import {
  PROFILE_ICON_KEYS,
  ProfileLink,
  ProfileLinkType,
  ProfilePayload,
  createEmptyProfilePayload,
} from "@/types/profile";
import { ExternalLink, Loader2, PlusCircle, Trash2, Upload, Check } from 'lucide-react';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://hub-local-nu.vercel.app").replace(/\/$/, "");

const ICON_OPTIONS = PROFILE_ICON_KEYS.map((key) => ({ value: key, label: key }));
const LINK_TYPE_OPTIONS: { value: ProfileLinkType; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "album", label: "Album" },
  { value: "vcf", label: "Download vCard" },
];

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ManageProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload>(createEmptyProfilePayload());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/profiles/me", { cache: "no-store" });
        if (!res.ok) throw new Error("profile_load_failed");
        const data = await res.json();
        if (!mounted) return;
        setProfile({
          ...data,
          links: Array.isArray(data.links)
            ? data.links.map((link: ProfileLink) => ({ ...link, id: link.id || makeId() }))
            : [],
        });
      } catch (err: any) {
        if (!mounted) return;
        setError("Impossible de charger le profil.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const hasVcfLink = useMemo(() => profile.links.some((l) => l.type === "vcf"), [profile.links]);
  const publicProfileUrl = useMemo(() => {
    const cleanSlug = profile.slug?.replace(/^\/+|\/+$/g, "");
    if (!cleanSlug) return null;
    return `${SITE_URL}/profile/${cleanSlug}`;
  }, [profile.slug]);

  function updateProfileField<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateLink(id: string, patch: Partial<ProfileLink>) {
    setProfile((prev) => ({
      ...prev,
      links: prev.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    }));
  }

  function removeLink(id: string) {
    setProfile((prev) => ({ ...prev, links: prev.links.filter((link) => link.id !== id) }));
  }

  function addLink(type: ProfileLinkType) {
    if (type === "vcf" && hasVcfLink) return;
    const base: ProfileLink = {
      id: makeId(),
      type,
      label: type === "vcf" ? "Download vCard" : "Nouvelle carte",
      iconKey: "Share",
      url: "",
      images: type === "album" ? [] : undefined,
    };
    setProfile((prev) => ({ ...prev, links: [...prev.links, base] }));
  }

  async function handleImageUpload(field: "avatarUrl" | "backgroundUrl", file?: File) {
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadImageToFirebase(file, `profiles/${profile.slug || "temp"}`);
      updateProfileField(field, url);
    } catch (err) {
      setError("Erreur lors de l'upload de l'image.");
    } finally {
      setUploadingField(null);
    }
  }

  async function handleAlbumImageUpload(linkId: string, index: number, file?: File) {
    if (!file) return;
    const target = `${linkId}-${index}`;
    setUploadingField(target);
    try {
      const url = await uploadImageToFirebase(file, `profiles/${profile.slug || "temp"}/albums`);
      setProfile((prev) => ({
        ...prev,
        links: prev.links.map((link) => {
          if (link.id !== linkId) return link;
          const nextImages = [...(link.images || [])];
          nextImages[index] = url;
          return { ...link, images: nextImages };
        }),
      }));
    } catch (err) {
      setError("Upload impossible pour cette image.");
    } finally {
      setUploadingField(null);
    }
  }

  function addAlbumImage(linkId: string) {
    setProfile((prev) => ({
      ...prev,
      links: prev.links.map((link) => {
        if (link.id !== linkId) return link;
        return { ...link, images: [...(link.images || []), ""] };
      }),
    }));
  }

  function updateAlbumImage(linkId: string, index: number, value: string) {
    setProfile((prev) => ({
      ...prev,
      links: prev.links.map((link) => {
        if (link.id !== linkId) return link;
        const next = [...(link.images || [])];
        next[index] = value;
        return { ...link, images: next };
      }),
    }));
  }

  function removeAlbumImage(linkId: string, index: number) {
    setProfile((prev) => ({
      ...prev,
      links: prev.links.map((link) => {
        if (link.id !== linkId) return link;
        const next = [...(link.images || [])];
        next.splice(index, 1);
        return { ...link, images: next };
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        ...profile,
        links: profile.links.map(({ id, ...rest }) => ({
          ...rest,
          images: rest.type === "album" ? rest.images || [] : undefined,
        })),
      };
      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "slug_taken") throw new Error("slug_taken");
        if (data?.error === "missing_slug") throw new Error("missing_slug");
        throw new Error("save_failed");
      }
      const saved = await res.json();
      setProfile({
        ...saved,
        links: Array.isArray(saved.links)
          ? saved.links.map((link: ProfileLink) => ({ ...link, id: link.id || makeId() }))
          : [],
      });
      setMessage("Profil enregistré.");
    } catch (err: any) {
      if (err?.message === "slug_taken") setError("Ce slug est déjà utilisé.");
      else if (err?.message === "missing_slug") setError("Le slug est obligatoire.");
      else setError("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          <p className="text-sm text-slate-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Profil Management</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Manage your profile</h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Configure everything that shows up on your public page <code className="bg-slate-100 px-2 py-1 rounded text-blue-700 text-xs">/profile/{profile.slug || "slug"}</code>
            </p>
          </div>
          {publicProfileUrl ? (
            <Link
              href={publicProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
            >
              <ExternalLink size={16} />
              View Public Profile
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 bg-slate-50"
              disabled
            >
              Set a slug to preview
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800 flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-red-600 mt-0.5 flex-shrink-0"></div>
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-800 flex items-start gap-3">
            <Check size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
            {message}
          </div>
        )}

        {/* Main Info Section */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Basic Information</h2>
            <p className="text-sm text-slate-600">Core details about your profile</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition  disabled:opacity-50  disabled:cursor-not-allowed"
                disabled
                value={profile.slug}
                onChange={(e) => updateProfileField("slug", e.target.value)}
                placeholder="e.g: walid"
              />
              <p className="text-xs text-slate-500">Used in your public URL.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Display Name</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={profile.displayName}
                onChange={(e) => updateProfileField("displayName", e.target.value)}
                placeholder="Your Name"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Tagline / Bio</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                rows={3}
                value={profile.tagline}
                onChange={(e) => updateProfileField("tagline", e.target.value)}
                placeholder="Tell people about yourself..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Primary Button Label</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={profile.buttonPrimaryLabel}
                onChange={(e) => updateProfileField("buttonPrimaryLabel", e.target.value)}
                placeholder="e.g: Get Started"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Secondary Button Label</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={profile.buttonSecondaryLabel}
                onChange={(e) => updateProfileField("buttonSecondaryLabel", e.target.value)}
                placeholder="e.g: Learn More"
              />
            </div>
          </div>
        </div>

        {/* Image Upload Sections */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <ImageField
            label="Profile Picture"
            helper="Circular image displayed at the center"
            value={profile.avatarUrl}
            onChange={(url) => updateProfileField("avatarUrl", url)}
            uploading={uploadingField === "avatarUrl"}
            onUpload={(file) => handleImageUpload("avatarUrl", file)}
          />
          <ImageField
            label="Background Image"
            helper="Used for the blur effect at the top"
            value={profile.backgroundUrl}
            onChange={(url) => updateProfileField("backgroundUrl", url)}
            uploading={uploadingField === "backgroundUrl"}
            onUpload={(file) => handleImageUpload("backgroundUrl", file)}
          />
        </div>

        {/* Links Section */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Cards & Links</h2>
              <p className="text-sm text-slate-600">Each card appears as a block on your public page</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition"
                onClick={() => addLink("link")}
              >
                <PlusCircle size={16} /> Link Card
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition"
                onClick={() => addLink("album")}
              >
                <PlusCircle size={16} /> Album
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={hasVcfLink}
                onClick={() => addLink("vcf")}
              >
                <PlusCircle size={16} /> vCard Button
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {profile.links.map((link) => (
              <div key={link.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">{link.label || "Untitled"}</strong>
                  <button
                    className="text-slate-400 hover:text-red-600 transition"
                    onClick={() => removeLink(link.id!)}
                    title="Delete this card"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Label</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={link.label}
                      onChange={(e) => updateLink(link.id!, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Type</label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={link.type}
                      onChange={(e) => {
                        const value = e.target.value as ProfileLinkType;
                        if (value === "vcf" && hasVcfLink && link.type !== "vcf") return;
                        updateLink(link.id!, {
                          type: value,
                          images: value === "album" ? link.images || [] : undefined,
                          url: value === "link" ? link.url || "" : "",
                        });
                      }}
                    >
                      {LINK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.value === "vcf" && hasVcfLink && link.type !== "vcf"}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Icon</label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={link.iconKey}
                      onChange={(e) => updateLink(link.id!, { iconKey: e.target.value })}
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {link.type === "link" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">URL</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={link.url || ""}
                      onChange={(e) => updateLink(link.id!, { url: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                )}

                {link.type === "album" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Images ({link.images?.length || 0})</label>
                    {(link.images || []).map((img, index) => {
                      const fieldId = `${link.id}-${index}`;
                      return (
                        <div key={fieldId} className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-3">
                          <div className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                              value={img}
                              onChange={(e) => updateAlbumImage(link.id!, index, e.target.value)}
                              placeholder="https://"
                            />
                            <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm cursor-pointer transition">
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAlbumImageUpload(link.id!, index, e.target.files?.[0])}
                              />
                            </label>
                            <button
                              className="text-slate-400 hover:text-red-600 transition"
                              onClick={() => removeAlbumImage(link.id!, index)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {uploadingField === fieldId && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" /> Uploading...
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 transition"
                      onClick={() => addAlbumImage(link.id!)}
                    >
                      <PlusCircle size={16} /> Add Image
                    </button>
                  </div>
                )}
                {link.type === "vcf" && (
                  <p className="text-sm text-slate-600 italic">This button will trigger downloading your vCard.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VCard Section */}
        <VcfEditor vcf={profile.vcf} onChange={(fields) => updateProfileField("vcf", fields)} />

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageField({
  label,
  helper,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file?: File) => void;
  uploading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        {helper && <p className="text-sm text-slate-600 mt-1">{helper}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">URL</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://"
          />
        </div>
        <label className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white cursor-pointer transition shadow-md">
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

function VcfEditor({ vcf, onChange }: { vcf: ProfilePayload["vcf"]; onChange: (next: ProfilePayload["vcf"]) => void }) {
  function update<K extends keyof typeof vcf>(key: K, value: string) {
    onChange({ ...vcf, [key]: value });
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">vCard Information</h2>
        <p className="text-sm text-slate-600">Details included when someone downloads your vCard</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="First Name" value={vcf?.firstName || ""} onChange={(v) => update("firstName", v)} />
            <InputField label="Last Name" value={vcf?.lastName || ""} onChange={(v) => update("lastName", v)} />
            <InputField label="Cell Phone" value={vcf?.cellPhone || ""} onChange={(v) => update("cellPhone", v)} />
            <InputField label="Work Phone" value={vcf?.workPhone || ""} onChange={(v) => update("workPhone", v)} />
            <InputField label="Work Email" value={vcf?.workEmail || ""} onChange={(v) => update("workEmail", v)} />
            <InputField label="Home Email" value={vcf?.homeEmail || ""} onChange={(v) => update("homeEmail", v)} />
            <InputField label="Organization" value={vcf?.org || ""} onChange={(v) => update("org", v)} />
            <InputField label="Title" value={vcf?.title || ""} onChange={(v) => update("title", v)} />
            <InputField label="Website" value={vcf?.url || ""} onChange={(v) => update("url", v)} />
            <InputField label="LinkedIn" value={vcf?.linkedin || ""} onChange={(v) => update("linkedin", v)} />
            <InputField label="GitHub" value={vcf?.github || ""} onChange={(v) => update("github", v)} />
            <InputField label="WhatsApp" value={vcf?.whatsapp || ""} onChange={(v) => update("whatsapp", v)} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Addresses</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Work Address" value={vcf?.workAddress || ""} onChange={(v) => update("workAddress", v)} />
            <InputField label="Work City" value={vcf?.workCity || ""} onChange={(v) => update("workCity", v)} />
            <InputField label="Work ZIP" value={vcf?.workZip || ""} onChange={(v) => update("workZip", v)} />
            <InputField label="Home Address" value={vcf?.homeAddress || ""} onChange={(v) => update("homeAddress", v)} />
            <InputField label="Home City" value={vcf?.homeCity || ""} onChange={(v) => update("homeCity", v)} />
            <InputField label="Home ZIP" value={vcf?.homeZip || ""} onChange={(v) => update("homeZip", v)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Note</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            rows={3}
            value={vcf?.note || ""}
            onChange={(e) => update("note", e.target.value)}
            placeholder="Additional notes..."
          />
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</label>
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}