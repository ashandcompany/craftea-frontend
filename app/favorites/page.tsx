"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { favorites as favoritesApi, products as productsApi, type Favorite, type Product } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const res = await favoritesApi.list({ limit: 50 });
        const ids = new Set(res.data.map((f: Favorite) => f.product_id));
        setFavIds(ids);

        // Fetch all products in parallel
        const results = await Promise.allSettled(
          res.data.map((fav) => productsApi.get(fav.product_id))
        );
        setFavProducts(
          results
            .filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled")
            .map((r) => r.value)
        );
      } catch (err: any) {
        setError(err.message || "Erreur");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, authLoading, router]);

  const handleToggleFav = async (productId: number) => {
    try {
      await favoritesApi.remove(productId);
      setFavProducts((prev) => prev.filter((p) => p.id !== productId));
      setFavIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      // Notify navbar to update count
      window.dispatchEvent(new Event("favorites-updated"));
    } catch {}
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <Loader size={20} className="inline-block animate-spin" />
          <p className="mt-2 text-xs">chargement des favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 font-mono">
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes favoris</h1>
        <p className="mt-1 text-sm text-stone-500">
          {"—"} {favProducts.length} création{favProducts.length > 1 ? "s" : ""} sauvegardée{favProducts.length > 1 ? "s" : ""}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : favProducts.length === 0 ? (
        <div className="border border-stone-200 py-16 text-center">
          <Heart size={28} className="mx-auto text-stone-300 mb-3" />
          <p className="text-sm text-stone-600 mb-1">Aucun favori pour le moment</p>
          <p className="text-xs text-stone-400 mb-4">Explorez le catalogue et ajoutez des créations à vos favoris</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
          >
            découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favIds.has(product.id)}
              onToggleFavorite={handleToggleFav}
            />
          ))}
        </div>
      )}
    </div>
  );
}
