"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    artists as artistsApi,
    ApiError,
    type StripeOnboardingStatus,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, Check, ImageIcon, Palette } from "lucide-react";
import { assetUrl } from "@/lib/utils";

type SocialLinks = {
    instagram?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
    tiktok?: string;
};

export default function ArtistSettingsPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
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
            setError("Créez d'abord votre profil artiste avant de connecter Stripe.");
            return;
        }

        setError("");
        setStripeConnecting(true);
        try {
            const { url } = await artistsApi.createStripeOnboardingLink();
            window.location.assign(url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Impossible de démarrer l'onboarding Stripe");
        } finally {
            setStripeConnecting(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== "artist") return;

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
                setForm({
                    bio: profile.bio || "",
                    social_links: socialLinks,
                });

                void refreshStripeStatus();
            })
            .catch((err: unknown) => {
                if (err instanceof ApiError && err.status === 404) {
                    setProfileMissing(true);
                    setArtistProfile(null);
                    setStripeStatus(null);
                    return;
                }
                setError(err instanceof Error ? err.message : "Erreur");
            })
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => {
        const stripeParam = searchParams.get("stripe");
        if (!stripeParam) return;

        if (stripeParam === "success") {
            setStripeNotice("Retour Stripe réussi. Vérifiez le statut pour confirmer l'activation des paiements.");
            void refreshStripeStatus();
            return;
        }

        if (stripeParam === "refresh") {
            setStripeNotice("Onboarding Stripe interrompu. Vous pouvez reprendre la configuration.");
        }
    }, [searchParams]);

    const save = async () => {
        if (!user || user.role !== "artist") return;
        setError("");
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
            setError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    if (user.role !== "artist") {
        return (
            <div>
                <div className="mb-8 border-b border-stone-200 pb-6">
                    <h1 className="text-2xl font-light tracking-tight text-stone-900">Profil artiste</h1>
                </div>
                <div className="border border-dashed border-stone-300 p-12 text-center">
                    <Palette size={28} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm text-stone-600 mb-1">Section réservée aux artistes</p>
                    <p className="text-xs text-stone-400">Contactez-nous pour devenir artiste sur Craftea</p>
                </div>
            </div>
        );
    }

    const socialFields = [
        { key: "instagram" as const, label: "instagram", placeholder: "https://instagram.com/..." },
        { key: "twitter" as const, label: "twitter / x", placeholder: "https://x.com/..." },
        { key: "website" as const, label: "site web", placeholder: "https://..." },
        { key: "youtube" as const, label: "youtube", placeholder: "https://youtube.com/..." },
        { key: "tiktok" as const, label: "tiktok", placeholder: "https://tiktok.com/@..." },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8 border-b border-stone-200 pb-6">
                <h1 className="text-2xl font-light tracking-tight text-stone-900">Profil artiste</h1>
                <p className="mt-1 text-sm text-stone-500">{"—"} bio, réseaux sociaux et visuels</p>
            </div>

            {loading ? (
                <div className="py-16 text-center text-stone-400">
                    <Loader size={20} className="inline-block animate-spin" />
                    <p className="mt-2 text-sm">chargement...</p>
                </div>
            ) : (
                <div className="border border-stone-200 p-5">
                    {error && (
                        <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{error}</AlertDescription>
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
                                onChange={(e) => {
                                    setSaved(false);
                                    setForm((f) => ({ ...f, bio: e.target.value }));
                                }}
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
                                                setForm((f) => ({
                                                    ...f,
                                                    social_links: { ...f.social_links, [field.key]: e.target.value },
                                                }));
                                            }}
                                            className="flex-1 border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Images */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Banner */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-stone-400">bannière</label>
                                <div className="h-20 border border-stone-200 bg-stone-50 overflow-hidden">
                                    {bannerFile ? (
                                        <img
                                            src={URL.createObjectURL(bannerFile)}
                                            alt="nouvelle bannière"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : artistProfile?.banner_url ? (
                                        <img
                                            src={assetUrl(artistProfile.banner_url, "artist-images")}
                                            alt="bannière actuelle"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400">
                                            <ImageIcon size={16} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setSaved(false);
                                        setBannerFile(e.target.files?.[0] || null);
                                    }}
                                    className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                />
                            </div>

                            {/* Logo */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-stone-400">photo de profil</label>
                                <div className="h-20 w-20 border border-stone-200 bg-stone-50 overflow-hidden">
                                    {logoFile ? (
                                        <img
                                            src={URL.createObjectURL(logoFile)}
                                            alt="nouveau logo"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : artistProfile?.logo_url ? (
                                        <img
                                            src={assetUrl(artistProfile.logo_url, "artist-images")}
                                            alt="logo actuel"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400">
                                            <ImageIcon size={16} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setSaved(false);
                                        setLogoFile(e.target.files?.[0] || null);
                                    }}
                                    className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                />
                            </div>
                        </div>

                        {/* Save button */}
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
        </div>
    );
}
