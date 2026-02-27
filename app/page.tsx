"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products, categories, type Product, type Category } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as LucideIcons from "lucide-react";

// Fonction para obtenir un composant icône par son nom
function getLucideIcon(iconName?: string) {
  if (!iconName) return null;
  return (LucideIcons as any)[iconName] || null;
}

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [retryStartTime, setRetryStartTime] = useState<number | null>(null);
  const [retryDelayMs, setRetryDelayMs] = useState(0);
  const [, setForceUpdate] = useState(0);

  // Effet machine à écrire
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "L'artisanat authentique";
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => {
      clearInterval(timer);
      clearInterval(cursorTimer);
    };
  }, []);

  // Force re-render tous les 100ms pour mettre à jour le countdown
  useEffect(() => {
    if (!retrying) return;
    const interval = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [retrying]);

  const retryCountdown = retryStartTime && retryDelayMs
    ? Math.max(0, Math.ceil((retryStartTime + retryDelayMs - Date.now()) / 1000))
    : 0;

  useEffect(() => {
    let cancelled = false;
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1500;

    async function load(attempt = 0) {
      try {
        if (attempt > 0) setRetrying(true);
        const [prodRes, catRes] = await Promise.all([
          products.list({ limit: 8 }),
          categories.list(),
        ]);
        if (cancelled) return;
        setLatestProducts(prodRes.data);
        setCats(catRes);
        setError("");
        setRetrying(false);
        setRetryStartTime(null);
        setRetryDelayMs(0);
      } catch (err: any) {
        if (cancelled) return;
        if (attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY * Math.pow(2, attempt);
          const delaySecs = Math.round(delayMs / 1000);
          setRetryStartTime(Date.now());
          setRetryDelayMs(delayMs);
          setError(`Connexion en cours… nouvelle tentative dans ${delaySecs}s (${attempt + 1}/${MAX_RETRIES})`);
          setRetrying(true);
          await new Promise((r) => setTimeout(r, delayMs));
          if (!cancelled) load(attempt + 1);
        } else {
          setError(err.message || "Impossible de charger les données");
          setRetrying(false);
          setRetryStartTime(null);
          setRetryDelayMs(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, []);

  const separator = "✦";

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-sage-50/30 font-mono">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-18 py-8 sm:py-12 lg:py-16">
        {/* Hero - responsive */}
        <section className="mb-16 sm:mb-20 lg:mb-24 border-t border-sage-200 pt-8 sm:pt-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="space-y-4 sm:space-y-6 flex-1">
            <p className="font-mono text-xs sm:text-sm text-sage-600">v.01 — édition artisanale</p>
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-mono text-3xl sm:text-4xl lg:text-5xl leading-tight text-stone-800">
                <span className="relative">
                  {displayText}
                  <span className={`absolute -right-3 ${showCursor ? 'opacity-100' : 'opacity-0'} text-sage-600`}>_</span>
                </span>
                <br />
              </h2>
              <div className="h-px w-16 sm:w-24 bg-sage-300" />
              <p className="max-w-xl font-mono text-sm sm:text-base leading-relaxed text-stone-600">
                Des créations uniques, faites main.
                <br />
                Bijoux, céramique, textile.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link href="/products" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-none border border-sage-700 bg-sage-700 px-6 py-2 font-mono text-sm text-white hover:bg-sage-800 transition-colors">
                  explorer →
                </Button>
              </Link>
              <Link href="/artists" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-none border border-sage-300 bg-transparent px-6 py-2 font-mono text-sm text-sage-700 hover:border-sage-700 hover:text-sage-800">
                  artisans
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden flex-1">
            <img 
              src={"/hihi.webp"} 
              className="w-full h-auto max-h-100 object-cover rounded-sm border-2 border-sage-200" 
              alt="Artisanat authentique"
            />
            <div className="absolute inset-0 border-2 border-sage-500/20 pointer-events-none rounded-sm"></div>
          </div>
        </section>

        {/* Compteurs - responsive grid */}
        <section className="mb-16 sm:mb-20 lg:mb-24 border-y border-sage-200 bg-sage-50/50 py-6 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: "500+", label: "créations" },
              { value: "50+", label: "artisans" },
              { value: "98%", label: "satisfaction" },
              { value: `${cats.length || "10"}+`, label: "catégories" },
            ].map((stat, index) => (
              <div key={index} className="space-y-1 border-l-2 border-sage-300 pl-3 sm:pl-4">
                <p className="font-mono text-xl sm:text-2xl text-sage-800">{stat.value}</p>
                <p className="font-mono text-xs uppercase tracking-wider text-sage-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Catégories - responsive masonry */}
        {cats.length > 0 && (
          <section className="mb-16 sm:mb-20 lg:mb-24">
            <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-sage-200 pb-2">
              <h3 className="font-mono text-base sm:text-lg uppercase tracking-wider text-sage-700">
                catégories
              </h3>
              <Link href="/categories" className="font-mono text-xs text-sage-500 hover:text-sage-700 transition-colors">
                tout voir →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {cats.slice(0, 6).map((cat, index) => {
                const IconComponent = getLucideIcon(cat.icon);
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category_id=${cat.id}`}
                    className="group relative bg-white border border-sage-200 p-4 sm:p-6 transition-all hover:border-sage-400 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-sage-100 rounded-full flex items-center justify-center text-sage-700 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-sage-100 rounded-full flex items-center justify-center text-sage-700">
                        {IconComponent ? (
                          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <span className="text-xl sm:text-2xl">✨</span>
                        )}
                      </div>
                      <h4 className="font-mono text-xs sm:text-sm font-medium text-stone-800 group-hover:text-sage-700">
                        {cat.name}
                      </h4>
                      {cat.description && (
                        <p className="font-mono text-xs text-stone-500 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                      <span className="inline-block text-xs text-sage-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        découvrir →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Dernières créations - responsive grid */}
        <section className="mb-16 sm:mb-20 lg:mb-24">
          <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-sage-200 pb-2">
            <h3 className="font-mono text-base sm:text-lg uppercase tracking-wider text-sage-700">
              dernières créations
            </h3>
            <Link href="/products" className="font-mono text-xs text-sage-500 hover:text-sage-700 transition-colors">
              tout voir →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 py-8 sm:py-12">
              <div className="h-4 w-32 animate-pulse bg-sage-200" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-sage-100 animate-pulse" />
                    <div className="h-3 w-3/4 bg-sage-200 animate-pulse" />
                    <div className="h-3 w-1/2 bg-sage-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <Alert variant={retrying ? "default" : "destructive"} className="rounded-none border border-sage-300 bg-sage-50 font-mono">
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sage-800 text-sm">
                  {retrying
                    ? error.replace(/dans \d+s/, `dans ${retryCountdown}s`)
                    : error}
                </span>
                {retrying ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent" />
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    className="rounded-none border border-sage-700 bg-transparent px-4 py-1 font-mono text-xs text-sage-700 hover:bg-sage-700 hover:text-white"
                  >
                    réessayer
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ) : latestProducts.length === 0 ? (
            <div className="border border-sage-200 bg-sage-50 py-16 sm:py-20 text-center font-mono text-sage-600">
              <p>— aucun produit pour le moment —</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {latestProducts.map((product, index) => (
                <div key={product.id} className="group space-y-3">
                  <div className="relative border border-sage-200 bg-white p-3 sm:p-4 pb-4 sm:pb-6 transition-all group-hover:border-sage-400 group-hover:shadow-md">
                    <span className="absolute top-2 left-2 font-mono text-xs text-sage-600 bg-sage-50 px-2 py-1">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA - responsive avec nouvelle palette */}
        <section className="relative overflow-hidden border-2 border-sage-300 bg-linear-to-br from-sage-50 to-white p-8 sm:p-12 lg:p-16 text-center">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-sage-200/20 rounded-full -translate-x-12 sm:-translate-x-16 -translate-y-12 sm:-translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-36 sm:w-48 h-36 sm:h-48 bg-sage-200/20 rounded-full translate-x-16 sm:translate-x-24 translate-y-16 sm:translate-y-24"></div>
          
          <div className="relative space-y-4 sm:space-y-6">
            <div className="flex justify-center gap-2 text-sage-600">
              <span className="text-xl sm:text-2xl]">✦</span>
              <span className="font-mono mt-2 text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">appel aux artisans</span>
              <span className="text-xl sm:text-2xl">✦</span>
            </div>
            
            <h4 className="font-mono text-2xl sm:text-3xl text-stone-800">
              Vous êtes <span className="text-sage-700 italic">artisan</span> ?
            </h4>
            
            <p className="mx-auto max-w-md font-mono text-xs sm:text-sm text-stone-600 px-4">
              Rejoignez notre communauté et partagez vos créations uniques avec des milliers de passionnés.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-none border-2 border-sage-700 bg-sage-700 px-6 sm:px-10 py-3 sm:py-4 font-mono text-sm text-white hover:bg-sage-800 transition-all hover:scale-105">
                  démarrer l'aventure →
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-none border-2 border-sage-300 bg-transparent px-6 sm:px-8 py-3 sm:py-4 font-mono text-sm text-sage-700 hover:border-sage-700 hover:text-sage-800 transition-all">
                  en savoir plus
                </Button>
              </Link>
            </div>
            
            {/* Témoignage minimal */}
            <p className="text-xs text-sage-500 italic mt-6 sm:mt-8">
              "Déjà plus de 50 artisans nous ont rejoints"
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}