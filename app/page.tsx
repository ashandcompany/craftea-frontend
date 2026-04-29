"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products, categories, artists, type Product, type Category } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as LucideIcons from "lucide-react";

// Fonction pour obtenir un composant icône par son nom
function getLucideIcon(iconName?: string) {
  if (!iconName) return null;
  return (LucideIcons as any)[iconName] || null;
}

function formatCount(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalArtists, setTotalArtists] = useState<number | null>(null);
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
        const [prodRes, catRes, artistRes] = await Promise.all([
          products.list({ limit: 8 }),
          categories.list(),
          artists.list(),
        ]);
        if (cancelled) return;
        setLatestProducts(prodRes.data);
        setTotalProducts(prodRes.total);
        setCats(catRes);
        setTotalArtists(artistRes.length);
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

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header avec effet parallaxe */}
      <div className="relative border-b-2 border-sage-200 bg-linear-to-r from-sage-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <LucideIcons.Sparkles size={28} className="text-sage-500" strokeWidth={1.5} />
                <span className="text-xs text-sage-500 uppercase tracking-wider">// marketplace artisanale</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-stone-900 leading-tight">
                  <span className="relative">
                    {displayText}
                    <span className={`absolute -right-5 ${showCursor ? 'opacity-100' : 'opacity-0'} text-sage-600`}>_</span>
                  </span>
                  <span className="block text-sage-600">fait main & unique</span>
                </h1>
                <div className="h-px w-16 bg-sage-200" />
                <p className="text-stone-500 text-sm leading-relaxed max-w-md">
                  Des créations uniques, faites main avec passion.
                  <br />
                  Bijoux, céramique, textile — chaque pièce raconte une histoire.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-sage-100 flex items-center justify-center">
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-stone-400">
                  {cats.length} catégories · {formatCount(totalProducts)} créations
                </span>
              </div>
              <div className="flex gap-3 pt-6">
                <Link href="/products">
                  <Button className="rounded-none border-2 border-sage-700 bg-sage-700 px-6 py-2 text-sm text-white hover:bg-sage-800 transition-all hover:scale-105">
                    explorer →
                  </Button>
                </Link>
                <Link href="/artists">
                  <Button className="rounded-none border-2 border-sage-200 bg-transparent px-6 py-2 text-sm text-sage-700 hover:border-sage-700 hover:text-sage-800 transition-all">
                    artisans
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Image effet polaroid */}
            <div className="relative group">
              <div className="absolute -top-3 -left-3 w-full h-full border-2 border-sage-200 bg-sage-100/30 group-hover:rotate-2 transition-transform duration-300" />
              <div className="relative bg-white border-2 border-sage-200 p-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="aspect-square bg-linear-to-br from-sage-100 to-sage-50 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/hihi.webp"
                    className="w-full h-full object-cover"
                    alt="Artisanat authentique"
                  />
                  <div className="absolute bottom-2 right-2 text-[8px] text-sage-400 bg-white/80 px-1">
                    📸 [atelier_artisan.jpg]
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-stone-400 font-mono">_savoir_faire.jpg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          
          {/* Compteurs - style chiffres clés */}
          <div className="relative bg-linear-to-r from-sage-50/50 to-white border-2 border-sage-200 p-8">
            <div className="absolute top-2 right-3 text-[10px] text-sage-300">⏎</div>
            <div className="text-center mb-8">
              <span className="text-xs text-sage-500 uppercase tracking-wider">// en chiffres</span>
              <h2 className="text-xl font-light text-stone-800 mt-2">Quelques repères</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: totalProducts !== null ? formatCount(totalProducts) : '—', label: "Créations", icon: LucideIcons.Heart, desc: 'pièces uniques' },
                { value: totalArtists !== null ? formatCount(totalArtists) : '—', label: "Artisans", icon: LucideIcons.Users, desc: 'créateurs passionnés' },
                { value: "98%", label: "Satisfaction", icon: LucideIcons.Star, desc: 'clients enchantés' },
                { value: cats.length > 0 ? String(cats.length) : '—', label: "Catégories", icon: LucideIcons.Palette, desc: 'univers créatifs' },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-sage-200 rounded-full bg-white mb-3 group-hover:border-sage-400 transition-colors">
                    <stat.icon size={20} className="text-sage-500" strokeWidth={1.5} />
                  </div>
                  <div className="text-2xl font-light text-sage-700">{stat.value}</div>
                  <div className="text-[11px] font-medium text-stone-600 mt-1">{stat.label}</div>
                  <div className="text-[9px] text-stone-400">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Catégories - grille créative */}
          {cats.length > 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 border-2 border-sage-200 px-4 py-2 bg-sage-50/30">
                  <LucideIcons.Grid size={14} className="text-sage-500" />
                  <span className="text-xs uppercase tracking-wider text-sage-700">explorer par univers</span>
                </div>
                <h2 className="text-2xl font-light text-stone-800 mt-4">Catégories</h2>
                <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
                  Découvrez nos univers artisanaux
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cats.slice(0, 6).map((cat, index) => {
                  const IconComponent = getLucideIcon(cat.icon);
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category_id=${cat.id}`}
                      className="group relative border-2 border-sage-200 bg-white p-6 hover:border-sage-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-sage-100 to-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          {IconComponent ? (
                            <IconComponent strokeWidth={1.5} className="w-6 h-6 text-sage-600" />
                          ) : (
                            <span className="text-2xl">✨</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-stone-800 group-hover:text-sage-700 transition-colors">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] text-sage-400">#{String(index + 1).padStart(2, '0')}</span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                              {cat.description}
                            </p>
                          )}
                          <span className="inline-block text-[10px] text-sage-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            découvrir →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {cats.length > 6 && (
                  <div className="flex items-center justify-center border-2 border-dashed border-sage-200 p-6 hover:border-sage-300 transition-colors">
                    <Link href="/categories" className="text-center group">
                      <LucideIcons.Compass size={32} className="text-sage-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] text-sage-500 uppercase tracking-wider">
                        + {cats.length - 6} autres univers
                      </p>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dernières créations */}
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 border-2 border-sage-200 px-4 py-2 bg-sage-50/30">
                <LucideIcons.Sparkles size={14} className="text-sage-500" />
                <span className="text-xs uppercase tracking-wider text-sage-700">fraîchement sorties</span>
              </div>
              <h2 className="text-2xl font-light text-stone-800 mt-4">Dernières créations</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
                Les pièces récemment ajoutées par nos artisans
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-2 border-sage-200 bg-white p-4 space-y-3">
                    <div className="aspect-square bg-sage-100 animate-pulse" />
                    <div className="h-3 w-3/4 bg-sage-200 animate-pulse" />
                    <div className="h-3 w-1/2 bg-sage-200 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <Alert variant={retrying ? "default" : "destructive"} className="rounded-none border-2 border-sage-200 bg-sage-50 font-mono">
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
                      className="rounded-none border-2 border-sage-700 bg-transparent px-4 py-1 text-xs text-sage-700 hover:bg-sage-700 hover:text-white"
                    >
                      réessayer
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : latestProducts.length === 0 ? (
              <div className="border-2 border-sage-200 bg-sage-50 py-16 text-center font-mono text-sage-600">
                <p>— aucun produit pour le moment —</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestProducts.map((product, index) => (
                  <div key={product.id} className="group relative border-2 border-sage-200 bg-white hover:border-sage-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="absolute top-2 right-2 z-10 bg-white/90 px-2 py-0.5 border border-sage-200">
                      <span className="text-[9px] text-sage-600 font-mono">#{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-center mt-8">
              <Link href="/products">
                <Button className="rounded-none border-2 border-sage-200 bg-transparent px-8 py-2 text-sm text-sage-700 hover:border-sage-700 hover:text-sage-800 transition-all">
                  voir toutes les créations →
                </Button>
              </Link>
            </div>
          </div>

          {/* CTA - appel aux artisans */}
          <div className="border-2 border-sage-200 bg-white overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 bg-linear-to-br from-sage-50/30 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <LucideIcons.Rocket size={18} className="text-sage-500" strokeWidth={1.5} />
                  <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700">&gt; Appel aux artisans</h2>
                </div>
                <h3 className="text-xl font-light text-stone-800 mb-3">
                  Vous êtes <span className="text-sage-600">artisan</span> ?
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-6">
                  Rejoignez notre communauté et partagez vos créations uniques avec des milliers de passionnés. 
                  Déjà plus de 50 artisans nous ont rejoints.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/register">
                    <Button className="rounded-none border-2 border-sage-700 bg-sage-700 px-6 py-2 text-sm text-white hover:bg-sage-800 transition-all hover:scale-105">
                      démarrer l'aventure →
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button className="rounded-none border-2 border-sage-200 bg-transparent px-6 py-2 text-sm text-sage-700 hover:border-sage-700 hover:text-sage-800 transition-all">
                      en savoir plus
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="border-l-2 border-sage-200 bg-linear-to-br from-amber-50 to-sage-50 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-sage-200 bg-white mb-4">
                    <LucideIcons.Award size={32} className="text-sage-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-[11px] text-sage-600 italic">
                    "Rejoindre Craftea, c'est donner une vitrine authentique à son savoir-faire"
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1 text-[9px] text-sage-400">
                    <span className="w-4 h-px bg-sage-200" />
                    <span>témoignage artisan</span>
                    <span className="w-4 h-px bg-sage-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer signature */}
          <div className="text-center space-y-4 pt-8">
            <div className="flex items-center justify-center gap-2 text-[10px] text-sage-400">
              <span className="w-8 h-px bg-sage-200" />
              <span>///</span>
              <span className="text-stone-400">Fait avec ♥ par des passionnés pour des passionnés</span>
              <span>///</span>
              <span className="w-8 h-px bg-sage-200" />
            </div>
            <div className="flex items-center justify-center gap-2 text-[9px] text-stone-400">
              <span>⏎</span>
              <span>v.01 — édition artisanale</span>
              <span>⏎</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}