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
import { ExternalLink, Loader2, PlusCircle, Trash2, Upload } from "lucide-react";

const PUBLIC_BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://hub-local-nu.vercel.app/").replace(/\/$/, "");

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
    return `${PUBLIC_BASE_URL}/${cleanSlug}`;
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
      <div className="min-h-[50vh] grid place-items-center">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-gray-500">Profiles</p>
          <h1 className="text-2xl font-semibold">Manage profile</h1>
          <p className="text-sm text-gray-600">
            Configure everything that shows up sur votre page publique <code>/profiles/{profile.slug || "slug"}</code>.
          </p>
        </div>
        {publicProfileUrl ? (
          <Link
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Voir ma page <ExternalLink size={16} />
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500"
            disabled
          >
            Définissez un slug pour prévisualiser
          </button>
        )}
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Informations principales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={profile.slug}
              onChange={(e) => updateProfileField("slug", e.target.value)}
              placeholder="ex: walid"
            />
            <p className="text-xs text-gray-500 mt-1">Utilisé dans l'URL publique.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nom affiché</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={profile.displayName}
              onChange={(e) => updateProfileField("displayName", e.target.value)}
              placeholder="Walid Moultamiss"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Tagline / bio</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              value={profile.tagline}
              onChange={(e) => updateProfileField("tagline", e.target.value)}
              placeholder="Luxury, fashion, personal style..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Bouton principal</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={profile.buttonPrimaryLabel}
              onChange={(e) => updateProfileField("buttonPrimaryLabel", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Bouton secondaire</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={profile.buttonSecondaryLabel}
              onChange={(e) => updateProfileField("buttonSecondaryLabel", e.target.value)}
            />
          </div>
        </div>
      </section>

      <ImageField
        label="Photo de profil"
        helper="Image ronde au centre de la carte"
        value={profile.avatarUrl}
        onChange={(url) => updateProfileField("avatarUrl", url)}
        uploading={uploadingField === "avatarUrl"}
        onUpload={(file) => handleImageUpload("avatarUrl", file)}
      />

      <ImageField
        label="Image d'arrière-plan"
        helper="Utilisée pour le flou en haut de page"
        value={profile.backgroundUrl}
        onChange={(url) => updateProfileField("backgroundUrl", url)}
        uploading={uploadingField === "backgroundUrl"}
        onUpload={(file) => handleImageUpload("backgroundUrl", file)}
      />

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cartes & liens</h2>
            <p className="text-sm text-gray-500">Chaque carte correspond à un bloc sur la page publique.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              onClick={() => addLink("link")}
            >
              <PlusCircle size={16} /> Carte lien
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              onClick={() => addLink("album")}
            >
              <PlusCircle size={16} /> Album
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={hasVcfLink}
              onClick={() => addLink("vcf")}
            >
              <PlusCircle size={16} /> Bouton vCard
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {profile.links.map((link) => (
            <div key={link.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm">{link.label || "Sans titre"}</strong>
                <button
                  className="text-red-500 hover:text-red-600"
                  onClick={() => removeLink(link.id!)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Label</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={link.label}
                    onChange={(e) => updateLink(link.id!, { label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Icône</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">URL</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={link.url || ""}
                    onChange={(e) => updateLink(link.id!, { url: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              )}

              {link.type === "album" && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Images ({link.images?.length || 0})</label>
                  {(link.images || []).map((img, index) => {
                    const fieldId = `${link.id}-${index}`;
                    return (
                      <div key={fieldId} className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-200 p-3">
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            value={img}
                            onChange={(e) => updateAlbumImage(link.id!, index, e.target.value)}
                            placeholder="https://"
                          />
                          <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
                            <Upload size={14} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleAlbumImageUpload(link.id!, index, e.target.files?.[0])}
                            />
                          </label>
                          <button
                            className="text-red-500"
                            onClick={() => removeAlbumImage(link.id!, index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {uploadingField === fieldId && <p className="text-xs text-gray-500">Upload en cours...</p>}
                      </div>
                    );
                  })}
                  <button
                    className="text-sm text-gray-700 inline-flex items-center gap-2"
                    onClick={() => addAlbumImage(link.id!)}
                  >
                    <PlusCircle size={16} /> Ajouter une image
                  </button>
                </div>
              )}
              {link.type === "vcf" && (
                <p className="text-sm text-gray-500">Ce bouton déclenchera le téléchargement de votre vCard configurée ci-dessous.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <VcfEditor vcf={profile.vcf} onChange={(fields) => updateProfileField("vcf", fields)} />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Enregistrer
        </button>
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
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{label}</h2>
        {helper && <p className="text-sm text-gray-500">{helper}</p>}
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://"
        />
        <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm cursor-pointer whitespace-nowrap">
          <Upload size={16} />
          {uploading ? "Upload..." : "Envoyer"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
      </div>
    </section>
  );
}

function VcfEditor({ vcf, onChange }: { vcf: ProfilePayload["vcf"]; onChange: (next: ProfilePayload["vcf"]) => void }) {
  function update<K extends keyof ProfilePayload["vcf"]>(key: K, value: string) {
    onChange({ ...vcf, [key]: value });
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-lg font-semibold">vCard</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Prénom" value={vcf.firstName} onChange={(v) => update("firstName", v)} />
        <InputField label="Nom" value={vcf.lastName} onChange={(v) => update("lastName", v)} />
        <InputField label="Téléphone perso" value={vcf.cellPhone} onChange={(v) => update("cellPhone", v)} />
        <InputField label="Téléphone pro" value={vcf.workPhone} onChange={(v) => update("workPhone", v)} />
        <InputField label="Email pro" value={vcf.workEmail} onChange={(v) => update("workEmail", v)} />
        <InputField label="Email perso" value={vcf.homeEmail} onChange={(v) => update("homeEmail", v)} />
        <InputField label="Organisation" value={vcf.org} onChange={(v) => update("org", v)} />
        <InputField label="Titre" value={vcf.title} onChange={(v) => update("title", v)} />
        <InputField label="Site web" value={vcf.url} onChange={(v) => update("url", v)} />
        <InputField label="LinkedIn" value={vcf.linkedin} onChange={(v) => update("linkedin", v)} />
        <InputField label="GitHub" value={vcf.github} onChange={(v) => update("github", v)} />
        <InputField label="WhatsApp" value={vcf.whatsapp} onChange={(v) => update("whatsapp", v)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <InputField label="Adresse pro" value={vcf.workAddress} onChange={(v) => update("workAddress", v)} />
        <InputField label="Ville pro" value={vcf.workCity} onChange={(v) => update("workCity", v)} />
        <InputField label="Code postal pro" value={vcf.workZip} onChange={(v) => update("workZip", v)} />
        <InputField label="Adresse perso" value={vcf.homeAddress} onChange={(v) => update("homeAddress", v)} />
        <InputField label="Ville perso" value={vcf.homeCity} onChange={(v) => update("homeCity", v)} />
        <InputField label="Code postal perso" value={vcf.homeZip} onChange={(v) => update("homeZip", v)} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Note</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={3}
          value={vcf.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </div>
    </section>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
