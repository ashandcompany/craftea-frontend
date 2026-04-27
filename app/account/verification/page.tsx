"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  artists as artistsApi,
  type ArtistVerificationStatus,
  ApiError,
} from "@/lib/api";
import {
  ShieldCheck, ShieldOff, Hourglass, Upload, X, FileImage, CheckCircle2, ZoomIn,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { assetUrl } from "@/lib/utils";

const STATUS_CONFIG = {
  none: {
    label: "Non soumis",
    color: "text-stone-500",
    bg: "bg-stone-50 border-stone-200",
    icon: ShieldOff,
  },
  pending: {
    label: "En attente de validation",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Hourglass,
  },
  approved: {
    label: "Compte validé",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: ShieldCheck,
  },
  rejected: {
    label: "Demande refusée",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: ShieldOff,
  },
} as const;

interface FileItem {
  file: File;
  name: string;
  previewUrl: string | null;
}

export default function ArtistVerificationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<ArtistVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [description, setDescription] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "artist") {
      router.push("/account");
      return;
    }
    artistsApi.getMyVerification()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFileItems((prev) => {
      const slots = 5 - prev.length;
      const toAdd: FileItem[] = selected.slice(0, slots).map((f) => ({
        file: f,
        name: f.name.replace(/\.[^.]+$/, ""),
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      }));
      return [...prev, ...toAdd];
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFileItems((prev) => {
      const item = prev[index];
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateName = (index: number, value: string) => {
    setFileItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileItems.length === 0) {
      setError("Veuillez ajouter au moins un fichier de preuve.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fileItems.forEach((item) => fd.append("files", item.file));
      fd.append("names", JSON.stringify(fileItems.map((item) => item.name.trim())));
      if (description.trim()) fd.append("description", description.trim());
      const result = await artistsApi.submitVerification(fd);
      // Revoke object URLs
      fileItems.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
      setStatus(result);
      setFileItems([]);
      setDescription("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!lightbox) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [lightbox]);

  if (!user || user.role !== "artist") return null;

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400 font-mono">
        <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
        <p className="mt-2 text-sm">chargement...</p>
      </div>
    );
  }

  const currentStatus = status?.validation_status ?? "none";
  const cfg = STATUS_CONFIG[currentStatus];
  const StatusIcon = cfg.icon;
  const canSubmit = currentStatus === "none" || currentStatus === "rejected";

  return (
    <div>
      <AccountPageHeader
        icon={ShieldCheck}
        title="> validation artiste"
        description="— Prouvez la création de vos œuvres pour faire valider votre compte"
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={28} strokeWidth={1.5} />
          </button>
          <img
            src={lightbox}
            alt="Document de preuve"
            className="max-h-[85vh] max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Status banner */}
      <div className={`mb-6 flex items-start gap-3 border rounded-none p-4 ${cfg.bg}`}>
        <StatusIcon size={18} className={`mt-0.5 shrink-0 ${cfg.color}`} strokeWidth={1.5} />
        <div>
          <p className={`text-sm font-semibold font-mono ${cfg.color}`}>
            Statut : {cfg.label}
          </p>
          {currentStatus === "rejected" && status?.validation_note && (
            <p className="mt-1 text-sm text-red-700 leading-relaxed">
              Motif du refus : {status.validation_note}
            </p>
          )}
          {currentStatus === "approved" && (
            <p className="mt-1 text-sm text-emerald-700">
              Votre profil artiste est visible et actif sur Craftea.
            </p>
          )}
          {currentStatus === "pending" && (
            <p className="mt-1 text-sm text-amber-700">
              Notre équipe examine vos documents. Vous recevrez un email dÃ¨s que la décision sera prise.
            </p>
          )}
        </div>
      </div>

      {/* Previously submitted documents */}
      {status && status.documents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-mono tracking-widest text-stone-400 uppercase mb-3">
            Documents soumis
          </h2>
          {/* Global description, if any */}
          {status.documents[0]?.description && (
            <p className="text-sm text-stone-600 mb-3 leading-relaxed border-l-2 border-stone-300 pl-3 italic">
              {status.documents[0].description}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {status.documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setLightbox(assetUrl(doc.file_url, "artist-images"))}
                className="group relative border border-stone-200 hover:border-stone-400 transition-colors overflow-hidden text-left"
              >
                <div className="relative">
                  <img
                    src={assetUrl(doc.file_url, "artist-images")}
                    alt={doc.name ?? "Document de preuve"}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="p-2 bg-stone-50 text-xs text-stone-600 font-mono truncate">
                  {doc.name ?? "document"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submission form */}
      {canSubmit && !success && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xs font-mono tracking-widest text-stone-400 uppercase mb-1">
              {currentStatus === "rejected" ? "Nouvelle soumission" : "Soumettre les preuves"}
            </h2>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Uploadez des photos de vos œuvres en cours de création (WIP), de votre atelier, des
              croquis, des outils ou tout document attestant que vous Ãªtes bien l'auteur de vos
              créations. Formats acceptés : JPG, PNG, WEBP, PDF. Maximum 5 fichiers, 15 Mo chacun.
            </p>

            {/* Drop zone */}
            {fileItems.length < 5 && (
              <div
                className="border-2 border-dashed border-stone-300 p-8 text-center cursor-pointer hover:border-stone-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="mx-auto text-stone-400 mb-2" strokeWidth={1.5} />
                <p className="text-sm text-stone-500 font-mono">
                  Cliquez pour sélectionner des fichiers
                </p>
                <p className="text-xs text-stone-400 mt-1">{fileItems.length}/5 fichier(s)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Per-file cards with preview + name input */}
            {fileItems.length > 0 && (
              <div className="mt-4 space-y-3">
                {fileItems.map((item, i) => (
                  <div key={i} className="border border-stone-200 bg-stone-50 flex gap-3 p-3">
                    {/* Thumbnail preview */}
                    <div className="w-20 h-20 shrink-0 bg-stone-200 overflow-hidden flex items-center justify-center">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt="aperÃ§u"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileImage size={24} className="text-stone-400" strokeWidth={1.5} />
                      )}
                    </div>
                    {/* Name input + meta */}
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateName(i, e.target.value)}
                        maxLength={255}
                        placeholder="Nom de l'image"
                        className="w-full border border-stone-300 px-2 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:border-stone-600"
                      />
                      <p className="text-xs text-stone-400 font-mono truncate">
                        {item.file.name} Â· {(item.file.size / 1024).toFixed(0)} Ko
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-stone-400 hover:text-red-500 transition-colors self-start mt-0.5"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-stone-400 uppercase mb-1">
              Description globale <span className="text-stone-300">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Décrivez briÃ¨vement vos documents : techniques utilisées, matériaux, contexte de création..."
              className="w-full border border-stone-300 px-3 py-2 text-sm font-mono text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-600 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || fileItems.length === 0}
            className="px-6 py-3 bg-stone-900 text-white text-sm font-mono tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "envoi en cours..." : "soumettre ma demande"}
          </button>
        </form>
      )}

      {success && (
        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-emerald-700 font-mono">
              Demande soumise avec succÃ¨s
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Notre équipe va examiner vos documents et vous notifiera par email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
