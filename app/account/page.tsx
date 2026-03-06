"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  favorites as favoritesApi,
  products as productsApi,
  artists as artistsApi,
  reviews as reviewsApi,
  orders as ordersApi,
  type ArtistProfile,
  type Shop,
  ApiError,
} from "@/lib/api";
import {
  Heart, Box, Star, Store, TrendingUp,
  ArrowRight, Package, Settings, MessageSquare, ShoppingBag,
  Hourglass, Truck, Wallet
} from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function AccountDashboard() {
  const { user } = useAuth();

  const [favCount, setFavCount] = useState<number | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [artistOrderCount, setArtistOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loads: Promise<void>[] = [];

    // Favorites count
    loads.push(
      favoritesApi.list({ limit: 1 })
        .then((r) => setFavCount(r.total))
        .catch(() => setFavCount(0))
    );

    // Reviews count
    loads.push(
      reviewsApi.mine()
        .then((r) => setReviewCount(r.data.length))
        .catch(() => setReviewCount(0))
    );

    // Orders count
    loads.push(
      ordersApi.my()
        .then((r) => setOrderCount(r.length))
        .catch(() => setOrderCount(0))
    );

    // Artist-specific data
    if (user.role === "artist") {
      loads.push(
        artistsApi.me()
          .then((profile) => {
            setArtistProfile(profile);
            const allShops = profile.shops || [];
            setShops(allShops);

            // Count products across all shops
            if (allShops.length > 0) {
              return Promise.all(
                allShops.map((s) => productsApi.list({ shop_id: s.id, limit: 1 }))
              ).then((results) => {
                setProductCount(results.reduce((sum, r) => sum + r.total, 0));
              });
            } else {
              setProductCount(0);
            }
          })
          .catch((err) => {
            if (err instanceof ApiError && err.status === 404) {
              setArtistProfile(null);
              setShops([]);
              setProductCount(0);
            }
          })
      );

      // Artist orders count
      loads.push(
        ordersApi.artistOrders()
          .then((r) => setArtistOrderCount(r.length))
          .catch(() => setArtistOrderCount(0))
      );
    }

    Promise.allSettled(loads).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="text-2xl font-light tracking-tight text-stone-900">
          Bonjour, {user.firstname}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          — membre depuis le {formatDate(user.created_at)}
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement du tableau de bord...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-stone-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-stone-400">
                <Heart size={14} />
                <span className="text-[10px] uppercase tracking-wider">favoris</span>
              </div>
              <p className="text-2xl text-stone-800">{favCount ?? "—"}</p>
            </div>

            <div className="border border-stone-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-stone-400">
                <Star size={14} />
                <span className="text-[10px] uppercase tracking-wider">avis donnés</span>
              </div>
              <p className="text-2xl text-stone-800">{reviewCount ?? "—"}</p>
            </div>

            <div className="border border-stone-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-stone-400">
                <ShoppingBag size={14} />
                <span className="text-[10px] uppercase tracking-wider">commandes</span>
              </div>
              <p className="text-2xl text-stone-800">{orderCount ?? "—"}</p>
            </div>

            {user.role === "artist" && (
              <>
                <div className="border border-stone-200 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Store size={14} />
                    <span className="text-[10px] uppercase tracking-wider">boutiques</span>
                  </div>
                  <p className="text-2xl text-stone-800">{shops.length}</p>
                </div>

                <div className="border border-stone-200 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Box size={14} />
                    <span className="text-[10px] uppercase tracking-wider">produits</span>
                  </div>
                  <p className="text-2xl text-stone-800">{productCount ?? "—"}</p>
                </div>

                <div className="border border-stone-200 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Truck size={14} />
                    <span className="text-[10px] uppercase tracking-wider">commandes reçues</span>
                  </div>
                  <p className="text-2xl text-stone-800">{artistOrderCount ?? "—"}</p>
                </div>
              </>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-4 text-xs uppercase tracking-wider text-stone-400">actions rapides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/account/settings"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Mon profil</p>
                    <p className="text-[10px] text-stone-400">modifier mes informations</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/favorites"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Mes favoris</p>
                    <p className="text-[10px] text-stone-400">{favCount ?? 0} article{(favCount ?? 0) > 1 ? "s" : ""} sauvegardé{(favCount ?? 0) > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/orders"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Mes commandes</p>
                    <p className="text-[10px] text-stone-400">{orderCount ?? 0} commande{(orderCount ?? 0) > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              {user.role === "artist" && (
                <>
                  <Link
                    href="/account/settings/shop"
                    className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Store size={18} className="text-stone-400 group-hover:text-stone-600" />
                      <div>
                        <p className="text-sm text-stone-800">Ma boutique</p>
                        <p className="text-[10px] text-stone-400">
                          {shops.length > 0
                            ? `${shops.length} boutique${shops.length > 1 ? "s" : ""} active${shops.length > 1 ? "s" : ""}`
                            : "configurer votre boutique"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
                  </Link>

                  <Link
                    href="/account/products"
                    className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package size={18} className="text-stone-400 group-hover:text-stone-600" />
                      <div>
                        <p className="text-sm text-stone-800">Mes produits</p>
                        <p className="text-[10px] text-stone-400">{productCount ?? 0} produit{(productCount ?? 0) > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
                  </Link>

                  <Link
                    href="/account/wallet"
                    className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet size={18} className="text-stone-400 group-hover:text-stone-600" />
                      <div>
                        <p className="text-sm text-stone-800">Mon wallet artiste</p>
                        <p className="text-[10px] text-stone-400">solde, historique et retraits</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Artist: shops overview */}
          {user.role === "artist" && shops.length > 0 && (
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-wider text-stone-400">mes boutiques</h2>
              <div className="space-y-3">
                {shops.map((shop, index) => (
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
                          className="h-10 w-10 border border-stone-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center border border-stone-200 bg-stone-50">
                          <Store size={16} className="text-stone-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-stone-800 group-hover:text-stone-900">
                          {shop.name || "boutique sans nom"}
                        </p>
                        <p className="text-[10px] text-stone-400 truncate">
                          {[shop.location, `créée le ${formatDate(shop.created_at)}`].filter(Boolean).join(" — ")}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Artist without profile */}
          {user.role === "artist" && !artistProfile && (
            <div className="border border-dashed border-stone-300 p-8 text-center">
              <Store size={28} className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-600 mb-1">Profil artiste non configuré</p>
              <p className="text-xs text-stone-400 mb-4">Créez votre profil et ouvrez votre première boutique</p>
              <Link
                href="/account/settings/artist"
                className="inline-block border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
              >
                configurer →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
