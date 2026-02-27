"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { artists as artistsApi, products as productsApi, type ArtistProfile, type Product } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assetUrl } from "@/lib/utils";
import { Pin } from 'lucide-react';

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedShop, setSelectedShop] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const a = await artistsApi.get(Number(id));
        setArtist(a);

        if (a.shops && a.shops.length > 0) {
          setSelectedShop(a.shops[0].id);
        } else {
          setSelectedShop(null);
          setShopProducts([]);
        }
      } catch (err: any) {
        setError(err.message || "Artiste introuvable");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadShopProducts() {
      if (!selectedShop) {
        setShopProducts([]);
        return;
      }

      setProductsLoading(true);
      try {
        const res = await productsApi.list({ shop_id: selectedShop, limit: 8 });
        setShopProducts(res.data);
      } catch {
        setShopProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }

    loadShopProducts();
  }, [selectedShop]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse">⏳</div>
          <p className="mt-2 text-sm">chargement de l'artiste...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error || "Artiste introuvable"}</AlertDescription>
        </Alert>
        <Link href="/artists" className="mt-4 inline-block text-sm text-stone-500 hover:text-stone-800">
          ← retour aux artistes
        </Link>
      </div>
    );
  }

  let socialLinks: Record<string, string> = {};
  try {
    if (artist.social_links) socialLinks = JSON.parse(artist.social_links);
  } catch { }

  const currentShop = artist.shops?.find(s => s.id === selectedShop);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Back link */}
      <Link href="/artists" className="mb-8 inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-800">
        ← retour aux artistes
      </Link>

      {/* Artist Banner */}
      <div className="mb-6 border border-stone-200 bg-stone-100 h-48 sm:h-56">
        {artist.banner_url ? (
          <img src={assetUrl(artist.banner_url, "artist-images")} alt={`Bannière artiste #${artist.id}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <span className="text-sm">[bannière artiste]</span>
          </div>
        )}
      </div>

      {/* Artist Profile header */}
      <div className="border-b border-stone-200 pb-6">
        <div className="flex items-start gap-4">
          {/* Artist Avatar */}
          <div className="flex h-20 w-20 items-center justify-center border border-stone-300 bg-stone-50 text-lg uppercase text-stone-500">
            {artist.logo_url ? (
              <img src={assetUrl(artist.logo_url, "artist-images")} alt={`Artiste ${artist.id}`} className="h-full w-full object-cover" />
            ) : (
              <span>A{artist.id}</span>
            )}
          </div>

          {/* Artist Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-light tracking-tight text-stone-900">
              {artist.user ? artist.user?.firstname + " " + artist.user?.lastname : "Artiste #" + artist.id}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className={artist.validated ? "text-stone-600" : "text-stone-400"}>
                {artist.validated ? "✓ vérifié" : "○ en attente"}
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">
                membre depuis {formatDate(artist.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-stone-600">{artist.bio}</p>
          </div>
        )}

        {/* Social links */}
        {Object.entries(socialLinks).filter(([, url]) => url && url.trim()).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(socialLinks).map(([name, url]) => (
              url && url.trim() && (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-500 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
                >
                  {name} ↗
                </a>
              )
            ))}
          </div>
        )}
      </div>

      {/* Shops */}
      {artist.shops && artist.shops.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-light tracking-tight text-stone-900">
            Boutiques
          </h2>

          {/* Shop selector - tabs style */}
          {artist.shops.length > 1 && (
            <div className="mb-6 flex gap-4 border-b border-stone-200">
              {artist.shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShop(shop.id)}
                  className={`text-xs py-2 px-1 transition-colors border-b-2 ${selectedShop === shop.id
                      ? 'border-stone-800 text-stone-800'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                >
                  {shop.name || `Boutique #${shop.id}`}
                </button>
              ))}
            </div>
          )}

          {/* Current shop details - compact version */}
          {currentShop && (
            <div className="border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                {/* Shop Logo - smaller */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-stone-300 bg-stone-50 text-xs uppercase text-stone-500">
                  {currentShop.logo_url ? (
                    <img src={assetUrl(currentShop.logo_url, "artist-images")} alt={currentShop.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>S{currentShop.id}</span>
                  )}
                </div>

                {/* Shop Info - condensed */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-light tracking-tight text-stone-900 truncate">
                      {currentShop.name || `Boutique #${currentShop.id}`}
                    </h3>
                  </div>

                  {currentShop.description && (
                    <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">{currentShop.description}</p>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-xs">
                    {currentShop.location && (
                      <span className="flex items-center gap-1 text-stone-400">
                        <Pin width={12} strokeWidth={1.5} /> {currentShop.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Shop Banner - small preview (optional) */}
              {currentShop.banner_url && (
                <div className="mt-3 h-16 border border-stone-200 bg-stone-100 overflow-hidden">
                  <img src={assetUrl(currentShop.banner_url, "artist-images")} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Products */}
      {productsLoading ? (
        <section className="mt-10">
          <div className="py-10 text-center text-stone-400">
            <div className="inline-block h-5 w-5 animate-pulse">⏳</div>
            <p className="mt-1 text-xs">chargement des créations...</p>
          </div>
        </section>
      ) : shopProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-light tracking-tight text-stone-900">
            Créations {currentShop && `· ${currentShop.name}`}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shopProducts.map((product, index) => (
              <div key={product.id} className="relative">
                <span className="absolute -left-3 -top-3 text-xs text-stone-300 bg-white px-1">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* If no shops/products */}
      {(!artist.shops || artist.shops.length === 0) && shopProducts.length === 0 && (
        <div className="mt-10 border border-stone-200 py-12 text-center">
          <p className="text-stone-400 italic">— cet artisan n'a pas encore de boutique —</p>
        </div>
      )}
    </div>
  );
}