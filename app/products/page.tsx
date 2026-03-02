"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { products, categories, tags as tagsApi, type Product, type Category, type Tag, type PaginatedProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hourglass } from "lucide-react";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cacheRef = useRef<Map<string, PaginatedProducts>>(new Map());

  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") || "");
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const getCacheKey = () => {
    return `${page}:${search}:${categoryId}:${selectedTag}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const cacheKey = getCacheKey();
      const cached = cacheRef.current.get(cacheKey);
      
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const params: Record<string, any> = { page, limit: 12 };
      if (search) params.search = search;
      if (categoryId) params.category_id = Number(categoryId);
      if (selectedTag) params.tag = Number(selectedTag);
      const res = await products.list(params);
      
      cacheRef.current.set(cacheKey, res);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([categories.list(), tagsApi.list()])
      .then(([c, t]) => { setCats(c); setAllTags(t); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryId, selectedTag, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
    setSelectedTag("");
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const hasFilters = search || categoryId || selectedTag;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-10 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-light tracking-tight text-stone-900">Catalogue</h1>
        <p className="mt-2 text-sm text-stone-500">
          {data ? `— ${data.total} création${data.total > 1 ? 's' : ''}` : '— chargement...'}
        </p>
      </div>

      {/* Filter toggle - mobile first */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <span className="text-lg leading-none">{filtersVisible ? '▼' : '▶'}</span>
          filtres
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ✕ réinitialiser
          </button>
        )}
      </div>

      {/* Filters */}
      {(filtersVisible || hasFilters) && (
        <div className="mb-8 border border-stone-200 bg-stone-50 p-5">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="rechercher..."
                className="w-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-stone-600"
              />
            </div>

            {/* Category & Tag selects */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Category */}
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                  className="w-full appearance-none border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                >
                  <option value="">toutes catégories</option>
                  {cats.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">▼</span>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedTag}
                    onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
                    className="w-full appearance-none border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                  >
                    <option value="">tous tags</option>
                    {allTags.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        #{t.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">▼</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtle reload indicator */}
      {loading && data && (
        <div className="mb-4 text-xs text-stone-400 animate-pulse">mise à jour...</div>
      )}

      {/* Results */}
      {loading && !data ? (
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !data || data.data.length === 0 ? (
        <div className="border border-stone-200 py-20 text-center">
          <p className="text-stone-500">— aucun produit trouvé —</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-stone-400 hover:text-stone-600 underline"
            >
              effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          {/* Product grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((product, index) => (
              <div key={product.id} className="relative">
                <span className="absolute -left-3 -top-3 text-xs text-stone-300 bg-white px-1">
                  {String(index + 1 + (page - 1) * 12).padStart(2, '0')}
                </span>
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4 border-t border-stone-200 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-sm text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← précédent
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-6 h-6 flex items-center justify-center transition-colors ${
                        p === page 
                          ? 'bg-stone-800 text-stone-50' 
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                suivant →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}