"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    artists as artistsApi,
    shops as shopsApi,
    ApiError,
    type Shop,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, Plus, Store, ArrowRight, ImageIcon, Check } from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function ShopListPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [shopList, setShopList] = useState<Shop[]>([]);
    const [noProfile, setNoProfile] = useState(false);
    const [error, setError] = useState("");

    // Create new shop form
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", description: "", location: "" });
    const [createBanner, setCreateBanner] = useState<File | null>(null);
    const [createLogo, setCreateLogo] = useState<File | null>(null);
    const [createSaving, setCreateSaving] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        if (!user || user.role !== "artist") return;

        artistsApi
            .me()
            .then((profile) => {
                setShopList(profile.shops || []);
                setNoProfile(false);
            })
            .catch((err: unknown) => {
                if (err instanceof ApiError && err.status === 404) {
                    setNoProfile(true);
                    return;
                }
                setError(err instanceof Error ? err.message : "Erreur");
            })
            .finally(() => setLoading(false));
    }, [user]);

    const saveNewShop = async () => {
        setCreateError("");
        if (!createForm.name.trim()) {
            setCreateError("Le nom est requis");
            return;
        }
        setCreateSaving(true);
        try {
            // Create artist profile first if needed
            if (noProfile) {
                await artistsApi.create({});
                setNoProfile(false);
            }

            const payload = new FormData();
            payload.append("name", createForm.name);
            payload.append("description", createForm.description);
            payload.append("location", createForm.location);
            if (createBanner) payload.append("banner", createBanner);
            if (createLogo) payload.append("logo", createLogo);

            const created = await shopsApi.create(payload);
            // Redirect to the new shop's settings
            router.push(`/account/settings/shop/${created.id}`);
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setCreateSaving(false);
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
                    <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes boutiques</h1>
                </div>
                <div className="border border-dashed border-stone-300 p-12 text-center">
                    <Store size={28} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm text-stone-600 mb-1">Section réservée aux artistes</p>
                    <p className="text-xs text-stone-400">Contactez-nous pour devenir artiste sur Craftea</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 border-b border-stone-200 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes boutiques</h1>
                        <p className="mt-1 text-sm text-stone-500">{"—"} gérez vos espaces de vente</p>
                    </div>
                    {!creating && shopList.length > 0 && (
                        <button
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
                        >
                            <Plus size={14} /> nouvelle boutique
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-16 text-center text-stone-400">
                    <Loader size={20} className="inline-block animate-spin" />
                    <p className="mt-2 text-xs">chargement...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Shop list */}
                    {shopList.length > 0 && (
                        <div className="space-y-3">
                            {shopList.map((shop, index) => (
                                <Link
                                    key={shop.id}
                                    href={`/account/settings/shop/${shop.id}`}
                                    className="group relative block border border-stone-200 p-5 hover:border-stone-400 transition-colors"
                                >
                                    <span className="absolute -left-3 -top-3 text-xs text-stone-300 bg-white px-1 group-hover:text-stone-500">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        {shop.logo_url ? (
                                            <img
                                                src={assetUrl(shop.logo_url, "artist-images")}
                                                alt={shop.name || ""}
                                                className="h-12 w-12 border border-stone-200 object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center border border-stone-200 bg-stone-50 shrink-0">
                                                <Store size={18} className="text-stone-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-stone-800 group-hover:text-stone-900">
                                                {shop.name || "boutique sans nom"}
                                            </p>
                                            <p className="text-[10px] text-stone-400 truncate">
                                                {[shop.location, `créée le ${formatDate(shop.created_at)}`].filter(Boolean).join(" — ")}
                                            </p>
                                            {shop.description && (
                                                <p className="mt-1 text-xs text-stone-500 line-clamp-1">{shop.description}</p>
                                            )}
                                        </div>
                                        <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 shrink-0" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Empty state or create form */}
                    {(shopList.length === 0 || creating) && (
                        <div className="border border-stone-200 p-5">
                            <h3 className="mb-4 text-sm text-stone-800">
                                {shopList.length === 0 ? "Créer votre première boutique" : "Nouvelle boutique"}
                            </h3>

                            {createError && (
                                <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                                    <AlertDescription>{createError}</AlertDescription>
                                </Alert>
                            )}

                            {noProfile && (
                                <div className="mb-4 border border-dashed border-stone-300 bg-stone-50 p-3 text-center">
                                    <p className="text-xs text-stone-500">Un profil artiste sera automatiquement créé avec la boutique</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">nom *</label>
                                    <input
                                        type="text"
                                        placeholder="nom de la boutique"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">localisation</label>
                                    <input
                                        type="text"
                                        placeholder="ville, région..."
                                        value={createForm.location}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
                                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">description</label>
                                    <textarea
                                        rows={2}
                                        placeholder="présentez votre boutique..."
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                        className="w-full resize-none border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                </div>

                                {/* Images */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-stone-400">bannière</label>
                                        <div className="h-16 border border-stone-200 bg-stone-50 overflow-hidden">
                                            {createBanner ? (
                                                <img src={URL.createObjectURL(createBanner)} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-stone-400"><ImageIcon size={16} /></div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setCreateBanner(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-stone-400">logo</label>
                                        <div className="h-16 w-16 border border-stone-200 bg-stone-50 overflow-hidden">
                                            {createLogo ? (
                                                <img src={URL.createObjectURL(createLogo)} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-stone-400"><ImageIcon size={16} /></div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setCreateLogo(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-stone-600 file:mr-2 file:border-0 file:bg-transparent file:text-xs file:text-stone-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                                    {creating && (
                                        <button
                                            onClick={() => setCreating(false)}
                                            className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                                        >
                                            annuler
                                        </button>
                                    )}
                                    <button
                                        onClick={saveNewShop}
                                        disabled={createSaving}
                                        className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                                    >
                                        {createSaving && <Loader size={12} className="animate-spin" />}
                                        {createSaving ? "création..." : "créer la boutique"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
