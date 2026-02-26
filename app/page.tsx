"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products, categories, type Product, type Category } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          products.list({ limit: 8 }),
          categories.list(),
        ]);
        setLatestProducts(prodRes.data);
        setCats(catRes);
      } catch (err: any) {
        setError(err.message || "Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const separator = "✦";

  return (
    <div className="min-h-screen bg-paper-50 font-mono">

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Hero - style machine à écrire */}
        <section className="mb-20 border-t border-stone-200 pt-12 flex gap-12">
          <div className="space-y-6">
            <p className="font-mono text-sm text-stone-400">v.01 — édition artisanale</p>
            <div className="space-y-4">
              <h2 className="font-mono text-5xl leading-tight text-stone-800">
                L'artisanat
                <br />
                <span className="italic text-stone-500">authentique</span>
              </h2>
              <div className="h-px w-24 bg-stone-300" />
              <p className="max-w-xl font-mono text-base leading-relaxed text-stone-600">
                Des créations uniques, faites main.
                <br />
                Bijoux, céramique, textile.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Link href="/products">
                <Button className="rounded-none border border-stone-800 bg-transparent px-6 py-2 font-mono text-sm text-stone-800 hover:bg-stone-800 hover:text-stone-100">
                  explorer →
                </Button>
              </Link>
              <Link href="/artists">
                <Button className="rounded-none border border-stone-300 bg-transparent px-6 py-2 font-mono text-sm text-stone-600 hover:border-stone-800 hover:text-stone-800">
                  artisans
                </Button>
              </Link>
            </div>
          </div>

          <img src={"/hihi.webp"} className="h-91 w-148 object-cover mx-auto" />
        </section>

        {/* Compteurs - style typographique */}
        <section className="mb-20 border-y border-stone-200 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="font-mono text-2xl text-stone-800">500+</p>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-400">créations</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl text-stone-800">50+</p>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-400">artisans</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl text-stone-800">98%</p>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-400">satisfaction</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl text-stone-800">{cats.length || "10"}+</p>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-400">catégories</p>
            </div>
          </div>
        </section>

        {/* Catégories - grille épurée */}
        {cats.length > 0 && (
          <section className="mb-20">
            <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-mono text-lg uppercase tracking-wider text-stone-500">
                catégories
              </h3>
              <Link href="/categories" className="font-mono text-xs text-stone-400 hover:text-stone-800">
                tout voir →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-stone-200 sm:grid-cols-3 md:grid-cols-6">
              {cats.slice(0, 6).map((cat, index) => (
                <Link
                  key={cat.id}
                  href={`/products?category_id=${cat.id}`}
                  className="bg-paper-50 p-6 transition-colors hover:bg-stone-100"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-xs text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                    <h4 className="font-mono text-sm text-stone-800">{cat.name}</h4>
                    {cat.description && (
                      <p className="font-mono text-xs text-stone-500 line-clamp-1">{cat.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Dernières créations - loading state stylisé */}
        <section className="mb-20">
          <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="font-mono text-lg uppercase tracking-wider text-stone-500">
              dernières créations
            </h3>
            <Link href="/products" className="font-mono text-xs text-stone-400 hover:text-stone-800">
              tout voir →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 py-12">
              <div className="h-4 w-32 animate-pulse bg-stone-200" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-stone-100" />
                    <div className="h-3 w-3/4 bg-stone-200" />
                    <div className="h-3 w-1/2 bg-stone-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : latestProducts.length === 0 ? (
            <div className="border border-stone-200 py-20 text-center font-mono text-stone-500">
              <p>— aucun produit pour le moment —</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product, index) => (
                <div key={product.id} className="space-y-3">
                  <div className="border border-stone-200 bg-stone-50 p-4 pb-6">
                    <span className="font-mono text-xs lt text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                    <ProductCard product={product} />

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA minimal */}
        <section className="border border-stone-200 p-12 text-center">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
              {separator} appel aux artisans {separator}
            </p>
            <h4 className="font-mono text-2xl text-stone-800">Vous êtes artisan ?</h4>
            <p className="mx-auto max-w-md font-mono text-sm text-stone-600">
              Rejoignez Craftea et partagez vos créations.
            </p>
            <div className="pt-4">
              <Link href="/register">
                <Button className="rounded-none border border-stone-800 bg-transparent px-8 py-3 font-mono text-sm text-stone-800 hover:bg-stone-800 hover:text-stone-100">
                  démarrer
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}