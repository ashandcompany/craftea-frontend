"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    artists as artistsApi,
    ApiError,
    type StripeOnboardingStatus,
    type ArtistVerificationStatus,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader, Check, ImageIcon, Palette,
    ShieldCheck, ShieldOff, Hourglass, Upload, X, FileImage, CheckCircle2, ZoomIn,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { assetUrl } from "@/lib/utils";

type SocialLinks = {
    instagram?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
    tiktok?: string;
};

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

export default function ArtistSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // ── Profil artiste ──────────────────────────────────────────────────────
    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileMissing, setProfileMissing] = useState(false);
    const [artistProfile, setArtistProfile] = useState<{
        bio?: string;
        social_links?: SocialLinks;
        banner_url?: string;
        logo_url?: string;
    } | null>(null);
    const [form, setForm] = useState({
        bio: "",
        social_links: {
            instagram: "",
            twitter: "",
            website: "",
            youtube: "",
            tiktok: "",
        } as SocialLinks,
    });
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [stripeStatus, setStripeStatus] = useState<StripeOnboardingStatus | null>(null);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeConnecting, setStripeConnecting] = useState(false);
    const [stripeNotice, setStripeNotice] = useState("");

    // ── Validation artiste ──────────────────────────────────────────────────
    const [verificationStatus, setVerificationStatus] = useState<ArtistVerificationStatus | null>(null);
    const [verificationLoading, setVerificationLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [fileItems, setFileItems] = useState<FileItem[]>([]);
    const [description, setDescription] = useState("");
    const [lightbox, setLightbox] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Stripe helpers ──────────────────────────────────────────────────────
    const refreshStripeStatus = async () => {
        if (!user || user.role !== "artist") return;
        setStripeLoading(true);
        try {
            const status = await artistsApi.getStripeOnboardingStatus();
            setStripeStatus(status);
        } catch {
            setStripeStatus(null);
        } finally {
            setStripeLoading(false);
        }
    };

    const connectStripe = async () => {
        if (!user || user.role !== "artist") return;
        if (profileMissing) {
            setProfileError("Créez d'abord votre profil artiste avant de connecter Stripe.");
            return;
        }
        setProfileError("");
        setStripeConnecting(true);
        try {
            const { url } = await artistsApi.createStripeOnboardingLink();
            window.location.assign(url);
        } catch (err: unknown) {
            setProfileError(err instanceof Error ? err.message : "Impossible de démarrer l'onboarding Stripe");
        } finally {
            setStripeConnecting(false);
        }
    };

    // ── Load artist profile ─────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        if (user.role !== "artist") {
            router.push("/account");
            return;
        }

        artistsApi
            .me()
            .then((profile) => {
                setProfileMissing(false);
                const socialLinks = typeof profile.social_links === "string"
                    ? (JSON.parse(profile.social_links || "{}") as SocialLinks)
                    : ((profile.social_links || {}) as SocialLinks);
                setArtistProfile({
                    bio: profile.bio,
                    banner_url: profile.banner_url,
                    logo_url: profile.logo_url,
                    social_links: socialLinks,
                });
                setForm({ bio: profile.bio || "", social_links: socialLinks });
                void refreshStripeStatus();
            })
            .catch((err: unknown) => {
                if (err instanceof ApiError && err.status === 404) {
                    setProfileMissing(true);
                    setArtistProfile(null);
                    setStripeStatus(null);
                    return;
                }
                setProfileError(err instanceof Error ? err.message : "Erreur");
            })
            .finally(() => setProfileLoading(false));
    }, [user]);

    // ── Load verification status ────────────────────────────────────────────
    useEffect(() => {
        if (!user || user.role !== "artist") return;
        artistsApi.getMyVerification()
            .then(setVerificationStatus)
            .catch(() => {})
            .finally(() => setVerificationLoading(false));
    }, [user]);

    // ── Stripe return URL params ────────────────────────────────────────────
    useEffect(() => {
        const stripeParam = searchParams.get("stripe");
        if (!stripeParam) return;
        if (stripeParam === "success") {
            setStripeNotice("Retour Stripe réussi. Vérifiez le statut pour confirmer l'activation des paiements.");
            void refreshStripeStatus();
        } else if (stripeParam === "refresh") {
            setStripeNotice("Onboarding Stripe interrompu. Vous pouvez reprendre la configuration.");
        }
    }, [searchParams]);

    // ── Lightbox keyboard close ─────────────────────────────────────────────
    useEffect(() => {
        if (!lightbox) return;
        const close = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [lightbox]);

    // ── Profile save ────────────────────────────────────────────────────────
    const save = async () => {
        if (!user || user.role !== "artist") return;
        setProfileError("");
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append("bio", form.bio);
            payload.append("social_links", JSON.stringify(form.social_links));
            if (bannerFile) payload.append("banner", bannerFile);
            if (logoFile) payload.append("logo", logoFile);

            const savedProfile = profileMissing
                ? await artistsApi.create(payload)
                : await artistsApi.updateMe(payload);

            setProfileMissing(false);
            const socialLinks = typeof savedProfile.social_links === "string"
                ? (JSON.parse(savedProfile.social_links || "{}") as SocialLinks)
                : ((savedProfile.social_links || {}) as SocialLinks);
            setArtistProfile({
                bio: savedProfile.bio,
                banner_url: savedProfile.banner_url,
                logo_url: savedProfile.logo_url,
                social_links: socialLinks,
            });
            setBannerFile(null);
            setLogoFile(null);
            setSaved(true);
            void refreshStripeStatus();
        } catch (err: unknown) {
            setProfileError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setSaving(false);
        }
    };

    // ── Verification file handlers ──────────────────────────────────────────
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

    const updateFileName = (index: number, value: string) => {
        setFileItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, name: value } : item))
        );
    };

    // ── Verification submit ─────────────────────────────────────────────────
    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileItems.length === 0) {
            setVerificationError("Veuillez ajouter au moins un fichier de preuve.");
            return;
        }
        setSubmitting(true);
        setVerificationError(null);
        try {
            const fd = new FormData();
            fileItems.forEach((item) => fd.append("files", item.file));
            fd.append("names", JSON.stringify(fileItems.map((item) => item.name.trim())));
            if (description.trim()) fd.append("description", description.trim());
            const result = await artistsApi.submitVerification(fd);
            fileItems.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
            setVerificationStatus(result);
            setFileItems([]);
            setDescription("");
            setVerificationSuccess(true);
        } catch (err) {
            setVerificationError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || user.role !== "artist") return null;

    const socialFields = [
        { key: "instagram" as const, label: "instagram", placeholder: "https://instagram.com/..." },
        { key: "twitter" as const, label: "twitter / x", placeholder: "https://x.com/..." },
        { key: "website" as const, label: "site web", placeholder: "https://..." },
        { key: "youtube" as const, label: "youtube", placeholder: "https://youtube.com/..." },
        { key: "tiktok" as const, label: "tiktok", placeholder: "https://tiktok.com/@..." },
    ];

    const currentVerifStatus = verificationStatus?.validation_status ?? "none";
    const verifCfg = STATUS_CONFIG[currentVerifStatus];
    const VerifIcon = verifCfg.icon;
    const canSubmit = currentVerifStatus === "none" || currentVerifStatus === "rejected";

    return (
        <div>
            <AccountPageHeader icon={Palette} title="> Profil artiste" description="— bio, visuels, réseaux sociaux et validation" />

            {/* ── Profil ─────────────────────────────────────────────────── */}
            {profileLoading ? (
                <div className="py-16 text-center text-stone-400">
                    <Loader size={20} className="inline-block animate-spin" />
                    <p className="mt-2 text-sm">chargement...</p>
                </div>
            ) : (
                <div className="border border-stone-200 p-5">
                    {profileError && (
                        <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{profileError}</AlertDescription>
                        </Alert>
                    )}

                    {stripeNotice && (
                        <Alert className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{stripeNotice}</AlertDescription>
                        </Alert>
                    )}

                    {profileMissing && (
                        <div className="mb-5 border border-dashed border-stone-300 bg-stone-50 p-4 text-center">
                            <p className="text-xs text-stone-500">Profil artiste non encore créé — remplissez le formulaire pour le créer</p>
                        </div>
                    )}

                    {/* Stripe Connect */}
                    <div className="mb-5 border border-stone-200 bg-stone-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-stone-400">stripe connect</p>
                                <p className="mt-1 text-sm text-stone-700">
                                    {stripeStatus?.stripeOnboarded
                                        ? "Compte Stripe connecté et opérationnel"
                                        : "Compte Stripe non finalisé"}
                                </p>
                                <p className="mt-1 text-xs text-stone-500">
                                    {stripeStatus?.stripeAccountId
                                        ? `Compte: ${stripeStatus.stripeAccountId}`
                                        : "Aucun compte Stripe lié"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => void refreshStripeStatus()}
                                    disabled={stripeLoading || profileMissing}
                                    className="border border-stone-300 px-3 py-2 text-xs text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {stripeLoading ? "vérification..." : "vérifier le statut"}
                                </button>
                                <button
                                    onClick={() => void connectStripe()}
                                    disabled={stripeConnecting || profileMissing}
                                    className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-3 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {(stripeConnecting || stripeLoading) && <Loader size={12} className="animate-spin" />}
                                    {stripeStatus?.stripeOnboarded ? "mettre à jour Stripe" : "continuer avec Stripe"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Bio */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">bio</label>
                            <textarea
                                rows={3}
                                placeholder="présentez votre univers créatif..."
                                value={form.bio}
                                onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, bio: e.target.value })); }}
                                className="w-full resize-none border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                            />
                        </div>

                        {/* Social links */}
                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-wider text-stone-400">réseaux sociaux</label>
                            <div className="space-y-3">
                                {socialFields.map((field) => (
                                    <div key={field.key} className="flex items-center gap-3">
                                        <span className="w-20 text-right text-[10px] uppercase tracking-wider text-stone-400">
                                            {field.label}
                                        </span>
                                        <input
                                            type="url"
                                            placeholder={field.placeholder}
                                            value={form.social_links?.[field.key] || ""}
                                            onChange={(e) => {
                                                setSaved(false);
                                                setForm((f) => ({ ...f, social_links: { ...f.social_links, [field.key]: e.target.value } }));
                                            }}
                                            className="flex-1 border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Images */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-stone-400">bannière</label>
                                <div className="h-20 border border-stone-200 bg-stone-50 overflow-hidden">
                                    {bannerFile ? (
                                        <img src={URL.createObjectURL(bannerFile)} alt="nouvelle bannière" className="h-full w-full object-cover" />
                                    ) : artistProfile?.banner_url ? (
                                        <img src={assetUrl(artistProfile.banner_url, "artist-images")} alt="bannière actuelle" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400"><ImageIcon size={16} /></div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => { setSaved(false); setBannerFile(e.target.files?.[0] || null); }}
                                    className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-stone-400">photo de profil</label>
                                <div className="h-20 w-20 border border-stone-200 bg-stone-50 overflow-hidden">
                                    {logoFile ? (
                                        <img src={URL.createObjectURL(logoFile)} alt="nouveau logo" className="h-full w-full object-cover" />
                                    ) : artistProfile?.logo_url ? (
                                        <img src={assetUrl(artistProfile.logo_url, "artist-images")} alt="logo actuel" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400"><ImageIcon size={16} /></div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => { setSaved(false); setLogoFile(e.target.files?.[0] || null); }}
                                    className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                />
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={save}
                                disabled={saving || saved}
                                className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                            >
                                {saving && <Loader size={12} className="animate-spin" />}
                                {saved && <Check size={12} />}
                                {saving ? "enregistrement..." : saved ? "sauvegardé" : profileMissing ? "créer le profil" : "enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Validation ─────────────────────────────────────────────── */}
            <div className="mt-8 border-t border-stone-200 pt-8">
                <div className="mb-5 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-stone-400" />
                    <h2 className="text-xs uppercase tracking-widest text-stone-400">validation artiste</h2>
                </div>

                {verificationLoading ? (
                    <div className="py-10 text-center text-stone-400">
                        <Loader size={18} className="inline-block animate-spin" />
                        <p className="mt-2 text-sm">chargement...</p>
                    </div>
                ) : (
                    <>
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
                        <div className={`mb-6 flex items-start gap-3 border p-4 ${verifCfg.bg}`}>
                            <VerifIcon size={18} className={`mt-0.5 shrink-0 ${verifCfg.color}`} strokeWidth={1.5} />
                            <div>
                                <p className={`text-sm font-semibold font-mono ${verifCfg.color}`}>
                                    Statut : {verifCfg.label}
                                </p>
                                {currentVerifStatus === "rejected" && verificationStatus?.validation_note && (
                                    <p className="mt-1 text-sm text-red-700 leading-relaxed">
                                        Motif du refus : {verificationStatus.validation_note}
                                    </p>
                                )}
                                {currentVerifStatus === "approved" && (
                                    <p className="mt-1 text-sm text-emerald-700">
                                        Votre profil artiste est visible et actif sur Craftea.
                                    </p>
                                )}
                                {currentVerifStatus === "pending" && (
                                    <p className="mt-1 text-sm text-amber-700">
                                        Notre équipe examine vos documents. Vous recevrez un email dès que la décision sera prise.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submitted documents */}
                        {verificationStatus && verificationStatus.documents.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-mono tracking-widest text-stone-400 uppercase mb-3">
                                    Documents soumis
                                </h3>
                                {verificationStatus.documents[0]?.description && (
                                    <p className="text-sm text-stone-600 mb-3 leading-relaxed border-l-2 border-stone-300 pl-3 italic">
                                        {verificationStatus.documents[0].description}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {verificationStatus.documents.map((doc) => (
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
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
                        {canSubmit && !verificationSuccess && (
                            <form onSubmit={handleVerificationSubmit} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-mono tracking-widest text-stone-400 uppercase mb-1">
                                        {currentVerifStatus === "rejected" ? "Nouvelle soumission" : "Soumettre les preuves"}
                                    </h3>
                                    <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                                        Uploadez des photos de vos œuvres en cours de création (WIP), de votre atelier, des croquis, des outils ou tout document attestant que vous êtes bien l'auteur de vos créations. Formats acceptés : JPG, PNG, WEBP, PDF. Maximum 5 fichiers, 15 Mo chacun.
                                    </p>

                                    {fileItems.length < 5 && (
                                        <div
                                            className="border-2 border-dashed border-stone-300 p-8 text-center cursor-pointer hover:border-stone-500 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={24} className="mx-auto text-stone-400 mb-2" strokeWidth={1.5} />
                                            <p className="text-sm text-stone-500 font-mono">Cliquez pour sélectionner des fichiers</p>
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

                                    {fileItems.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {fileItems.map((item, i) => (
                                                <div key={i} className="border border-stone-200 bg-stone-50 flex gap-3 p-3">
                                                    <div className="w-20 h-20 shrink-0 bg-stone-200 overflow-hidden flex items-center justify-center">
                                                        {item.previewUrl ? (
                                                            <img src={item.previewUrl} alt="aperçu" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileImage size={24} className="text-stone-400" strokeWidth={1.5} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateFileName(i, e.target.value)}
                                                            maxLength={255}
                                                            placeholder="Nom de l'image"
                                                            className="w-full border border-stone-300 px-2 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:border-stone-600"
                                                        />
                                                        <p className="text-xs text-stone-400 font-mono truncate">
                                                            {item.file.name} · {(item.file.size / 1024).toFixed(0)} Ko
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
                                        placeholder="Décrivez brièvement vos documents : techniques utilisées, matériaux, contexte de création..."
                                        className="w-full border border-stone-300 px-3 py-2 text-sm font-mono text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-600 resize-none"
                                    />
                                </div>

                                {verificationError && (
                                    <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
                                        {verificationError}
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

                        {verificationSuccess && (
                            <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4">
                                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" strokeWidth={1.5} />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-700 font-mono">Demande soumise avec succès</p>
                                    <p className="text-sm text-emerald-700 mt-1">Notre équipe va examiner vos documents et vous notifiera par email.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
