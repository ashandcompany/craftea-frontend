"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { products, reviews, favorites, shops as shopsApi, artists as artistsApi, type Product, type Review, type ShopShippingMethod, type Shop, type ArtistProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { ProductImages } from "@/components/product/product-images";
import { ProductInfo } from "@/components/product/product-info";
import { ProductShopBlock } from "@/components/product/product-shop-block";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductShopProducts } from "@/components/product/product-shop-products";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<{ average: number; count: number } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [favCount, setFavCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [shippingMethods, setShippingMethods] = useState<ShopShippingMethod[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopArtist, setShopArtist] = useState<ArtistProfile | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [p, rev, avg] = await Promise.all([
          products.get(Number(id)),
          reviews.listByProduct(Number(id)).catch(() => ({ data: [] })),
          reviews.average(Number(id)).catch(() => null),
        ]);
        setProduct(p);
        setProductReviews(rev.data);
        setAvgRating(avg);

        if (p.shop_id) {
          shopsApi.getShippingMethods(p.shop_id).then(setShippingMethods).catch(() => {});
          shopsApi.get(p.shop_id).then((shopData) => {
            setShop(shopData);
            if (shopData.artist) {
              setShopArtist(shopData.artist);
            } else {
              artistsApi.get(shopData.artist_id).then(setShopArtist).catch(() => {});
            }
          }).catch(() => {});
          products.list({ shop_id: p.shop_id, limit: 7 }).then((res) => {
            setShopProducts(res.data.filter((pr) => pr.id !== Number(id)).slice(0, 6));
          }).catch(() => {});
        }

        if (user) {
          const fav = await favorites.check(Number(id)).catch(() => ({ isFavorite: false }));
          setIsFav(fav.isFavorite);
        }
        const fc = await favorites.count(Number(id)).catch(() => null);
        if (fc) setFavCount(fc.count);
      } catch (err: any) {
        setError(err.message || "Produit introuvable");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) return;
    try {
      if (isFav) {
        await favorites.remove(Number(id));
      } else {
        await favorites.add(Number(id));
      }
      setIsFav(!isFav);
      const fc = await favorites.count(Number(id)).catch(() => null);
      if (fc) setFavCount(fc.count);
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error || "Produit introuvable"}</AlertDescription>
        </Alert>
        <Link href="/products" className="mt-4 inline-block text-sm text-stone-500 hover:text-stone-800">
          ← retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      <Link href="/products" className="mb-8 inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-800">
        ← retour au catalogue
      </Link>

      <div className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-light tracking-tight text-stone-900">
          {product.title || "sans titre"}
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm">
          {product.category && (
            <span className="text-stone-500">#{product.category.name}</span>
          )}
          <span className={`text-xs ${product.is_active ? "text-stone-600" : "text-stone-400"}`}>
            {product.is_active ? "✓ disponible" : "○ indisponible"}
          </span>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductImages
          images={product.images || []}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
        />
        <ProductInfo
          product={product}
          user={user}
          avgRating={avgRating}
          shippingMethods={shippingMethods}
          isFav={isFav}
          favCount={favCount}
          onToggleFavorite={toggleFavorite}
          onVariantImageChange={setSelectedImage}
        />
      </div>

      <ProductShopBlock shop={shop} shopArtist={shopArtist} />

      <ProductReviews
        productId={Number(id)}
        user={user}
        initialReviews={productReviews}
        onAvgRatingChange={setAvgRating}
      />

      <ProductShopProducts products={shopProducts} shopArtist={shopArtist} />
    </div>
  );
}