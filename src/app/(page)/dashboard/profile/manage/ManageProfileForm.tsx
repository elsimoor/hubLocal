"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import ProfileClient from "@/app/profile/[slug]/ProfileClient";
import {
  DEFAULT_PROFILE_VCF,
  PROFILE_ICON_KEYS,
  PROFILE_LINK_TYPES,
  ProfileLink,
  ProfilePayload,
  createEmptyProfilePayload,
} from "@/types/profile";
import { applyProfilePayloadToDoc, extractProfilePayloadFromDoc } from "@/lib/puck/profilePayload";
import { uploadImageToFirebase } from "@/lib/firebase/client";

const slugify = (value: string) =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

const defaultLink = (): ProfileLink => ({
  type: "link",
  label: "New link",
  iconKey: PROFILE_ICON_KEYS[0] || "Share",
  url: "",
});

export default function ManageProfileForm() {
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [sourceDoc, setSourceDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [docRes, variablesRes] = await Promise.all([
          fetch("/api/profile/puck", { cache: "no-store" }),
          fetch("/api/variables?format=map", { cache: "no-store" }),
        ]);
        if (!docRes.ok) throw new Error("Failed to load profile doc");
        const json = await docRes.json();
        if (!active) return;
        const doc = json?.data;
        setSourceDoc(doc);
        const parsed = extractProfilePayloadFromDoc(doc);
        console.log("[ManageProfile] Loaded profile doc", {
          hasDoc: !!doc,
          displayNameFromDoc: parsed.displayName,
          taglineFromDoc: parsed.tagline,
        });

        // When variables exist, prefer them for displayName/tagline so manage UI shows live values
        if (variablesRes.ok) {
          const variablesJson = await variablesRes.json();
          const variablesMap = variablesJson?.variables || {};
          console.log("[ManageProfile] Loaded variable map", variablesMap);
          if (variablesMap.full_name) parsed.displayName = variablesMap.full_name;
          if (variablesMap.tagline) parsed.tagline = variablesMap.tagline;
        }
        setPayload(parsed);
      } catch (err) {
        console.error(err);
        if (active) {
          setPayload(createEmptyProfilePayload());
          setError("Impossible de charger les informations du profil.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleBasicChange = (field: keyof ProfilePayload, value: string) => {
    setPayload((prev) => {
      if (!prev) return prev;
      if (field === "slug") {
        return { ...prev, slug: slugify(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleVcfChange = (field: keyof typeof DEFAULT_PROFILE_VCF, value: string) => {
    setPayload((prev) => (prev ? { ...prev, vcf: { ...prev.vcf, [field]: value } } : prev));
  };

  const handleLinkChange = (index: number, patch: Partial<ProfileLink> & { imagesText?: string }) => {
    setPayload((prev) => {
      if (!prev) return prev;
      const nextLinks = prev.links.map((link, idx) => {
        if (idx !== index) return link;
        const next: ProfileLink = { ...link, ...patch };
        if (patch.imagesText !== undefined) {
          next.images = patch.imagesText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        }
        if (next.type !== "album") {
          delete next.images;
        }
        if (next.type !== "link") {
          next.url = "";
        }
        return next;
      });
      return { ...prev, links: nextLinks };
    });
  };

  const handleRemoveLink = (index: number) => {
    setPayload((prev) => {
      if (!prev) return prev;
      return { ...prev, links: prev.links.filter((_, idx) => idx !== index) };
    });
  };

  const handleAddLink = () => {
    setPayload((prev) => {
      if (!prev) return prev;
      return { ...prev, links: [...prev.links, defaultLink()] };
    });
  };

  const appendAlbumImages = (index: number, urls: string[]) => {
    if (!urls.length) return;
    setPayload((prev) => {
      if (!prev) return prev;
      const nextLinks = prev.links.map((link, idx) => {
        if (idx !== index) return link;
        const existing = Array.isArray(link.images) ? link.images : [];
        return { ...link, images: [...existing, ...urls] };
      });
      return { ...prev, links: nextLinks };
    });
  };

  const handleAlbumUpload = async (index: number, files: FileList | null) => {
    if (!files?.length) return;
    setUploadingField(`album-${index}`);
    setUploadError(null);
    try {
      const uploads = await Promise.all(Array.from(files).map((file) => uploadImageToFirebase(file, "profile-media")));
      appendAlbumImages(index, uploads);
    } catch (err) {
      console.error(err);
      setUploadError("Téléversement impossible. Réessayez.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSingleImageUpload = async (files: FileList | null, field: "avatarUrl" | "backgroundUrl") => {
    if (!files?.length) return;
    setUploadingField(field);
    setUploadError(null);
    try {
      const url = await uploadImageToFirebase(files[0], "profile-media");
      handleBasicChange(field, url);
    } catch (err) {
      console.error(err);
      setUploadError("Téléversement impossible. Réessayez.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!payload) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // Force the Puck document to use mustache placeholders so templates stay wired to variables
      const docPayload = {
        ...payload,
        displayName: "{{full_name}}",
        tagline: "{{tagline}}",
      };
      console.log("[ManageProfile] Submitting payload", {
        docDisplayName: docPayload.displayName,
        docTagline: docPayload.tagline,
        profilePayloadDisplayName: payload.displayName,
        profilePayloadTagline: payload.tagline,
      });
      const doc = applyProfilePayloadToDoc(sourceDoc, docPayload, true);
      console.log("[ManageProfile] Next doc profile node", doc?.root?.children?.[0]?.props);
      const res = await fetch("/api/profile/puck", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: doc, profilePayload: payload }),
      });
      if (!res.ok) throw new Error("Sauvegarde impossible");
      setSourceDoc(doc);
      setMessage("Profil mis à jour");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const previewPayload = useMemo(() => payload ?? createEmptyProfilePayload(), [payload]);

  if (loading || !payload) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Profil</h2>
              <p className="text-sm text-gray-500">Identité, slug public et visuels.</p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              disabled={saving}
            >
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Slug public
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.slug}
                onChange={(e) => handleBasicChange("slug", e.target.value)}
                placeholder="alex-rivers"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Nom affiché
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.displayName}
                onChange={(e) => handleBasicChange("displayName", e.target.value)}
                placeholder="Alex Rivers"
              />
              <p className="mt-1 text-xs text-gray-500">Astuce: utilisez des variables moustache comme {'{{full_name}}'} pour lier aux valeurs globales.</p>
            </label>
            <label className="md:col-span-2 text-sm font-medium text-gray-700">
              Tagline
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.tagline}
                onChange={(e) => handleBasicChange("tagline", e.target.value)}
                placeholder="Luxury, Fashion, Personal Style Enthusiast, Entrepreneur."
              />
              <p className="mt-1 text-xs text-gray-500">Astuce: vous pouvez aussi mettre {'{{tagline}}'} pour que l’éditeur remplace automatiquement.</p>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Avatar URL
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.avatarUrl}
                onChange={(e) => handleBasicChange("avatarUrl", e.target.value)}
                placeholder="https://…"
              />
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (event) => {
                    await handleSingleImageUpload(event.target.files, "avatarUrl");
                    event.target.value = "";
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-600"
                >
                  <UploadCloud size={12} />
                  Importer
                </label>
                {uploadingField === "avatarUrl" && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
              </div>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Arrière-plan URL
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.backgroundUrl}
                onChange={(e) => handleBasicChange("backgroundUrl", e.target.value)}
                placeholder="https://…"
              />
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  id="background-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (event) => {
                    await handleSingleImageUpload(event.target.files, "backgroundUrl");
                    event.target.value = "";
                  }}
                />
                <label
                  htmlFor="background-upload"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-600"
                >
                  <UploadCloud size={12} />
                  Importer
                </label>
                {uploadingField === "backgroundUrl" && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
              </div>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Bouton principal
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.buttonPrimaryLabel}
                onChange={(e) => handleBasicChange("buttonPrimaryLabel", e.target.value)}
                placeholder="Connect"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Bouton secondaire
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={payload.buttonSecondaryLabel}
                onChange={(e) => handleBasicChange("buttonSecondaryLabel", e.target.value)}
                placeholder="Links"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Liens</h3>
              <p className="text-sm text-gray-500">Boutons, albums et actions vCard.</p>
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} /> Ajouter
            </button>
          </header>
          <div className="space-y-4">
            {payload.links.length === 0 && (
              <p className="text-sm text-gray-500">Aucun lien encore. Ajoutez votre premier bouton.</p>
            )}
            {payload.links.map((link, index) => (
              <div key={index} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">#{index + 1} {link.label || "Sans titre"}</div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Type
                    <select
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={link.type}
                      onChange={(e) => handleLinkChange(index, { type: e.target.value as ProfileLink["type"] })}
                    >
                      {PROFILE_LINK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Icône
                    <select
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={link.iconKey}
                      onChange={(e) => handleLinkChange(index, { iconKey: e.target.value })}
                    >
                      {PROFILE_ICON_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="md:col-span-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Label
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={link.label}
                      onChange={(e) => handleLinkChange(index, { label: e.target.value })}
                    />
                  </label>
                  {link.type === "link" && (
                    <label className="md:col-span-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      URL
                      <input
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={link.url || ""}
                        onChange={(e) => handleLinkChange(index, { url: e.target.value })}
                      />
                    </label>
                  )}
                  {link.type === "album" && (
                    <label className="md:col-span-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Images (une URL par ligne)
                      <textarea
                        className="mt-1 h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={(link.images || []).join("\n")}
                        onChange={(e) => handleLinkChange(index, { imagesText: e.target.value })}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          id={`album-upload-${index}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={async (event) => {
                            await handleAlbumUpload(index, event.target.files);
                            event.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`album-upload-${index}`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600"
                        >
                          <UploadCloud size={12} />
                          Importer des images
                        </label>
                        {uploadingField === `album-${index}` && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Téléversement…
                          </span>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold">vCard</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.keys(DEFAULT_PROFILE_VCF).map((field) => (
              <label key={field} className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {field}
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={(payload.vcf as any)[field] || ""}
                  onChange={(e) => handleVcfChange(field as keyof typeof DEFAULT_PROFILE_VCF, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        {(message || error || uploadError) && (
          <div className="space-y-3">
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {uploadError && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{uploadError}</div>}
            {message && !error && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          </div>
        )}
      </form>

      <aside className="lg:w-[420px]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-600">Aperçu</h4>
          <div className="max-h-[80vh] overflow-auto rounded-xl border border-gray-100">
            <ProfileClient profile={previewPayload} />
          </div>
        </div>
      </aside>
    </div>
  );
}
