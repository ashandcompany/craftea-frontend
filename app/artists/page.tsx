"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { artists as artistsApi, products as productsApi, type ArtistProfile, type Product } from "@/lib/api";
import { ArtistCard } from "@/components/artist-card";
import { ProductCard } from "@/components/product-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarketplacePage, MarketplacePageContent } from "@/components/page/marketplace-page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Hourglass, Search, ChevronLeft, ChevronRight, Filter, Sparkles } from "lucide-react";

const ARTISTS_PER_PAGE = 6;

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<ArtistProfile[]>([]);
  const [artistProducts, setArtistProducts] = useState<Record<number, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValidatedOnly, setShowValidatedOnly] = useState(false);

  // Chargement des artistes
  useEffect(() => {
    artistsApi
      .list()
      .then(setArtists)
      .catch((err) => setError(err.message || "Une erreur est survenue"))
      .finally(() => setLoading(false));
  }, []);

  // Chargement des produits pour chaque artiste
  useEffect(() => {
    if (artists.length === 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProducts(true);
    const productPromises = artists.map(async (artist) => {
      if (!artist.shops?.length) return { artistId: artist.id, products: [] };
      
      try {
        const allProducts: Product[] = [];
        for (const shop of artist.shops.slice(0, 2)) {
          const result = await productsApi.list({ 
            shop_id: shop.id, 
            limit: 2, 
            include_inactive: false 
          });
          allProducts.push(...result.data);
          if (allProducts.length >= 3) break;
        }
        return { artistId: artist.id, products: allProducts.slice(0, 3) };
      } catch {
        return { artistId: artist.id, products: [] };
      }
    });

    Promise.all(productPromises).then((results) => {
      const productsMap: Record<number, Product[]> = {};
      results.forEach(({ artistId, products }) => {
        productsMap[artistId] = products;
      });
      setArtistProducts(productsMap);
      setLoadingProducts(false);
    });
  }, [artists]);

  // Filtrage des artistes
  useEffect(() => {
    let filtered = [...artists];
    
    if (showValidatedOnly) {
      filtered = filtered.filter((artist) => artist.validated);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((artist) => {
        const fullName = artist.user 
          ? `${artist.user.firstname} ${artist.user.lastname}`.toLowerCase() 
          : "";
        const bio = artist.bio?.toLowerCase() || "";
        const shopNames = artist.shops?.map((shop) => shop.name?.toLowerCase() || "").join(" ") || "";
        
        return fullName.includes(query) || bio.includes(query) || shopNames.includes(query);
      });
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredArtists(filtered);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [artists, searchQuery, showValidatedOnly]);

  const totalPages = Math.ceil(filteredArtists.length / ARTISTS_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTISTS_PER_PAGE;
  const paginatedArtists = filteredArtists.slice(startIndex, startIndex + ARTISTS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery("");
    setShowValidatedOnly(false);
  };

  const getArtistDisplayName = (artist: ArtistProfile) => {
    if (artist.user) {
      return `${artist.user.firstname} ${artist.user.lastname}`;
    }
    return `Artiste ${artist.id}`;
  };

  return (
    <MarketplacePage
      title="Artistes"
      subtitle={`— ${loading ? "chargement..." : `${filteredArtists.length} artisan${filteredArtists.length > 1 ? "s" : ""}`}`}
    >
      <MarketplacePageContent>
        {/* Filtres et recherche */}
        {!loading && artists.length > 0 && (
          <div className="mb-8 space-y-4 border border-stone-200 bg-stone-50/50 p-4 font-mono dark:border-stone-700 dark:bg-stone-900/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Barre de recherche */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un artisan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-none border-stone-300 bg-white pl-10 font-mono text-sm dark:border-stone-600 dark:bg-stone-800"
                  aria-label="Rechercher un artisan"
                />
              </div>
              
              {/* Filtre validation */}
              <Button
                variant={showValidatedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowValidatedOnly(!showValidatedOnly)}
                className="rounded-none border-stone-300 font-mono text-xs dark:border-stone-600"
                aria-label={showValidatedOnly ? "Afficher tous les artistes" : "Afficher uniquement les artistes vérifiés"}
              >
                <Filter className="mr-2 h-3 w-3" />
                {showValidatedOnly ? "Vérifiés uniquement" : "Tous les artistes"}
              </Button>
            </div>

            {/* Filtres actifs */}
            {(searchQuery || showValidatedOnly) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span>Filtres actifs :</span>
                {showValidatedOnly && (
                  <span className="border border-stone-300 bg-white px-2 py-0.5 dark:border-stone-600 dark:bg-stone-800">
                    ✓ Vérifiés
                  </span>
                )}
                {searchQuery && (
                  <span className="border border-stone-300 bg-white px-2 py-0.5 dark:border-stone-600 dark:bg-stone-800">
                    &quot;{searchQuery}&quot;
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-2 underline hover:text-stone-700 dark:hover:text-stone-300"
                  aria-label="Effacer tous les filtres"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="py-20 text-center text-stone-400">
            <div className="inline-block h-6 w-6 animate-pulse">
              <Hourglass className="h-full w-full" />
            </div>
            <p className="mt-2 text-sm">Chargement des artistes...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredArtists.length === 0 ? (
          <div className="border border-stone-200 py-20 text-center">
            <p className="text-stone-500">— Aucun artisan trouvé —</p>
            <p className="mt-2 text-xs text-stone-400">
              {searchQuery || showValidatedOnly ? "Essayez d'autres filtres" : "Revenez plus tard"}
            </p>
          </div>
        ) : (
          <>
            {/* Liste des artistes avec leurs produits */}
            <div className="space-y-12">
              {paginatedArtists.map((artist) => {
                const products = artistProducts[artist.id] || [];
                const hasProducts = products.length > 0;
                const artistName = getArtistDisplayName(artist);

                return (
                  <div
                    key={artist.id}
                    className="border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/50 p-6 dark:border-stone-700 dark:from-stone-900 dark:to-stone-800/50"
                  >
                    <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
                      {/* Carte artiste */}
                      <div>
                        <ArtistCard artist={artist} />
                        
                        {/* Statistiques rapides */}
                        <div className="mt-4 border border-stone-200 bg-white/80 p-3 font-mono text-xs dark:border-stone-700 dark:bg-stone-900/80">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Boutiques :</span>
                            <span className="text-stone-800 dark:text-stone-200">
                              {artist.shops?.length || 0}
                            </span>
                          </div>
                          {hasProducts && (
                            <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 dark:border-stone-700">
                              <span className="text-stone-500">Produits :</span>
                              <Link
                                href={`/artists/${artist.id}`}
                                className="text-stone-800 hover:underline dark:text-stone-200"
                                aria-label={`Voir tous les produits de ${artistName}`}
                              >
                                Voir tout →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vitrine produits */}
                      <div className="min-w-0">
                        {loadingProducts ? (
                          <div className="flex h-40 items-center justify-center text-stone-400">
                            <div className="inline-block h-5 w-5 animate-pulse">
                              <Hourglass className="h-full w-full" />
                            </div>
                            <span className="ml-2 text-xs">Chargement des créations...</span>
                          </div>
                        ) : hasProducts ? (
                          <div>
                            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-stone-500">
                              <Sparkles className="h-3 w-3" />
                              <span>Créations récentes</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                              ))}
                            </div>
                            {products.length >= 3 && (
                              <Link
                                href={`/artists/${artist.id}`}
                                className="mt-4 block border border-stone-300 bg-white p-3 text-center font-mono text-xs uppercase tracking-wider text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                                aria-label={`Découvrir plus de créations de ${artistName}`}
                              >
                                Découvrir plus de créations →
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center border border-dashed border-stone-300 dark:border-stone-600">
                            <div className="text-center text-stone-400">
                              <p className="text-xs">— Pas encore de créations —</p>
                              <p className="mt-1 text-[10px] text-stone-400">
                                Cet artisan prépare sa collection
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 border-t border-stone-200 pt-8 dark:border-stone-700">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <div className="flex items-center gap-4 font-mono text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-none border-stone-300 dark:border-stone-600"
                      aria-label="Page précédente"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 border transition-colors ${
                            currentPage === page
                              ? "border-stone-800 bg-stone-800 text-white dark:border-stone-200 dark:bg-stone-200 dark:text-stone-900"
                              : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                          }`}
                          aria-label={`Aller à la page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-none border-stone-300 dark:border-stone-600"
                      aria-label="Page suivante"
                    >
                      Suivant
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-center text-xs text-stone-400 sm:text-left">
                    Page {currentPage} sur {totalPages} • {filteredArtists.length} artisan{filteredArtists.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Pied de page */}
            <div className="mt-12 border-t border-stone-200 pt-6 text-center dark:border-stone-700">
              <p className="text-xs text-stone-400">
                ✦ {filteredArtists.length} artisan{filteredArtists.length > 1 ? 's' : ''} enregistré{filteredArtists.length > 1 ? 's' : ''} ✦
              </p>
            </div>
          </>
        )}
      </MarketplacePageContent>
    </MarketplacePage>
  );
}