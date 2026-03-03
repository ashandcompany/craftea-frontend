"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    shops as shopsApi,
    artists as artistsApi,
    products as productsApi,
    type Shop,
    ApiError,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader, Check, ImageIcon, Store, ArrowLeft, Trash2, Box, Truck,
} from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function ShopDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const shopId = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [shop, setShop] = useState<Shop | null>(null);
    const [productCount, setProductCount] = useState<number>(0);

    const [form, setForm] = useState({ name: "", description: "", location: "" });
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!user || user.role !== "artist" || !shopId) return;

        const load = async () => {
            try {
                const [shopData, productsData] = await Promise.all([
                    shopsApi.get(shopId),
                    productsApi.list({ shop_id: shopId, limit: 1, include_inactive: true }),
                ]);
                setShop(shopData);
                setProductCount(productsData.total);
                setForm({
                    name: shopData.name || "",
                    description: shopData.description || "",
                    location: shopData.location || "",
                });
            } catch (err) {
                if (err instanceof ApiError && err.status === 404) {
                    setError("Boutique introuvable");
                } else {
                    setError(err instanceof Error ? err.message : "Erreur");
                }
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [user, shopId]);

    const save = async () => {
        setError("");
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append("name", form.name);
            payload.append("description", form.description);
            payload.append("location", form.location);
            if (bannerFile) payload.append("banner", bannerFile);
            if (logoFile) payload.append("logo", logoFile);

            const updated = await shopsApi.update(shopId, payload);
            setShop(updated);
            setForm({
                name: updated.name || "",
                description: updated.description || "",
                location: updated.location || "",
            });
            setBannerFile(null);
            setLogoFile(null);
            setSaved(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await shopsApi.delete(shopId);
            router.push("/account/settings/shop");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
            setDeleting(false);
            setDeleteConfirm(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    if (!user) return null;

    if (user.role !== "artist") {
        return (
            <div>
                <div className="mb-8 border-b border-stone-200 pb-6">
                    <h1 className="text-2xl font-light tracking-tight text-stone-900">Boutique</h1>
                </div>
                <div className="border border-dashed border-stone-300 p-12 text-center">
                    <Store size={28} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm text-stone-600">Section réservée aux artistes</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 border-b border-stone-200 pb-6">
                <Link
                    href="/account/settings/shop"
                    className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700"
                >
                    <ArrowLeft size={12} /> toutes les boutiques
                </Link>
                <h1 className="text-2xl font-light tracking-tight text-stone-900">
                    {loading ? "Boutique" : shop?.name || "Boutique sans nom"}
                </h1>
                {shop && (
                    <div className="mt-1 flex items-center gap-3 text-sm text-stone-500">
                        <span>{"—"} créée le {formatDate(shop.created_at)}</span>
                        <span className="text-stone-300">|</span>
                        <Link
                            href={`/account/products`}
                            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
                        >
                            <Box size={12} /> {productCount} produit{productCount > 1 ? "s" : ""}
                        </Link>
                        <span className="text-stone-300">|</span>
                        <Link
                            href={`/account/settings/shop/${shopId}/shipping`}
                            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
                        >
                            <Truck size={12} /> frais de port
                        </Link>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-16 text-center text-stone-400">
                    <Loader size={20} className="inline-block animate-spin" />
                    <p className="mt-2 text-xs">chargement...</p>
                </div>
            ) : !shop ? (
                <div className="border border-dashed border-stone-300 p-12 text-center">
                    <Store size={28} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm text-stone-600 mb-1">{error || "Boutique introuvable"}</p>
                    <Link
                        href="/account/settings/shop"
                        className="mt-4 inline-block text-xs text-stone-500 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
                    >
                        ← retour aux boutiques
                    </Link>
                </div>
            ) : (
                <div className="border border-stone-200 p-5">
                    {error && (
                        <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">nom</label>
                            <input
                                type="text"
                                placeholder="nom de la boutique"
                                value={form.name}
                                onChange={(e) => {
                                    setSaved(false);
                                    setForm((f) => ({ ...f, name: e.target.value }));
                                }}
                                className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">localisation</label>
                            <input
                                type="text"
                                placeholder="ville, région..."
                                value={form.location}
                                onChange={(e) => {
                                    setSaved(false);
                                    setForm((f) => ({ ...f, location: e.target.value }));
                                }}
                                className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">description</label>
                            <textarea
                                rows={3}
                                placeholder="présentez votre boutique..."
                                value={form.description}
                                onChange={(e) => {
                                    setSaved(false);
                                    setForm((f) => ({ ...f, description: e.target.value }));
                                }}
                                className="w-full resize-none border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                            />
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
                                    ) : shop.banner_url ? (
                                        <img
                                            src={assetUrl(shop.banner_url, "artist-images")}
                                            alt="bannière"
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
                                <label className="text-xs uppercase tracking-wider text-stone-400">logo</label>
                                <div className="h-20 w-20 border border-stone-200 bg-stone-50 overflow-hidden">
                                    {logoFile ? (
                                        <img
                                            src={URL.createObjectURL(logoFile)}
                                            alt="nouveau logo"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : shop.logo_url ? (
                                        <img
                                            src={assetUrl(shop.logo_url, "artist-images")}
                                            alt="logo"
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

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                            {/* Delete */}
                            <div>
                                {deleteConfirm ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-stone-500">supprimer cette boutique ?</span>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                        >
                                            {deleting ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            {deleting ? "suppression..." : "oui, supprimer"}
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(false)}
                                            className="text-xs text-stone-400 hover:text-stone-700"
                                        >
                                            annuler
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(true)}
                                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500"
                                    >
                                        <Trash2 size={12} /> supprimer
                                    </button>
                                )}
                            </div>

                            {/* Save */}
                            <button
                                onClick={save}
                                disabled={saving || saved}
                                className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                            >
                                {saving && <Loader size={12} className="animate-spin" />}
                                {saved && <Check size={12} />}
                                {saving ? "enregistrement..." : saved ? "sauvegardé" : "mettre à jour"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
