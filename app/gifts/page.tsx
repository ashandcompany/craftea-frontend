"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { products, categories, type Category, type PaginatedProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Gift, Hourglass, ChevronLeft, ChevronRight, Filter, X, Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RECIPIENT_TABS = [
  { key: "all", label: "Tout", icon: "★" },
  { key: "him", label: "Pour lui", icon: "♂" },
  { key: "her", label: "Pour elle", icon: "♀" },
  { key: "kids", label: "Kids", icon: "☆" },
] as const;

type RecipientKey = (typeof RECIPIENT_TABS)[number]["key"];

const BUDGET_RANGES = [
  { key: "all", label: "Tous les prix", min: 0, max: Infinity },
  { key: "under25", label: "< 25 €", min: 0, max: 25 },
  { key: "25to50", label: "25 € – 50 €", min: 25, max: 50 },
  { key: "50to100", label: "50 € – 100 €", min: 50, max: 100 },
  { key: "over100", label: "> 100 €", min: 100, max: Infinity },
] as const;

type BudgetKey = (typeof BUDGET_RANGES)[number]["key"];

const ITEMS_PER_PAGE = 12;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function GiftsPage() {
  /* --- data state ------------------------------------------------- */
  const [allProducts, setAllProducts] = useState<PaginatedProducts | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- filter state ----------------------------------------------- */
  const [recipient, setRecipient] = useState<RecipientKey>("all");
  const [budget, setBudget] = useState<BudgetKey>("all");
  const [categoryId, setCategoryId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* --- fetch ------------------------------------------------------ */
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    setLoading(true);
    Promise.all([products.list({ limit: 200 }), categories.list()])
      .then(([p, c]) => {
        setAllProducts(p);
        setCats(c);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des données:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  /* --- derived filtered list ------------------------------------- */
  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let list = allProducts.data.filter((p) => p.is_active && p.stock > 0);

    // Recipient keywords search
    if (recipient === "him") {
      list = list.filter(
        (p) =>
          /homme|lui|masculin|monsieur/i.test(p.title || "") ||
          /homme|lui|masculin|monsieur/i.test(p.description || "") ||
          p.tags?.some((t) => /homme|lui|masculin/i.test(t.name))
      );
    } else if (recipient === "her") {
      list = list.filter(
        (p) =>
          /femme|elle|féminin|madame/i.test(p.title || "") ||
          /femme|elle|féminin|madame/i.test(p.description || "") ||
          p.tags?.some((t) => /femme|elle|féminin/i.test(t.name))
      );
    } else if (recipient === "kids") {
      list = list.filter(
        (p) =>
          /enfant|kid|bébé|junior|petit/i.test(p.title || "") ||
          /enfant|kid|bébé|junior|petit/i.test(p.description || "") ||
          p.tags?.some((t) => /enfant|kid|bébé|junior/i.test(t.name))
      );
    }

    // Budget
    if (budget !== "all") {
      const range = BUDGET_RANGES.find((b) => b.key === budget);
      if (range) {
        list = list.filter((p) => {
          const price = Number(p.price ?? 0);
          return price >= range.min && price < range.max;
        });
      }
    }

    // Category
    if (categoryId) {
      list = list.filter((p) => p.category?.id === Number(categoryId));
    }

    return list;
  }, [allProducts, recipient, budget, categoryId]);

  /* --- pagination ------------------------------------------------- */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* --- reset page when filters change ---------------------------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [recipient, budget, categoryId]);

  const hasFilters = recipient !== "all" || budget !== "all" || categoryId !== "";

  const clearFilters = () => {
    setRecipient("all");
    setBudget("all");
    setCategoryId("");
    setFiltersOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (recipient !== "all") count++;
    if (budget !== "all") count++;
    if (categoryId) count++;
    return count;
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-white font-mono">
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono transition-colors">
        
        {/* Hero - style machine à écrire */}
        <div className="mb-12 border-b-2 border-sage-200 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <Gift size={28} className="text-sage-500" strokeWidth={1.5} />
            <h1 className="text-3xl font-light tracking-tight text-stone-900">
              &gt; IDÉES CADEAUX
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="text-sage-600">[</span>
            Offrir en toute simplicité. Une sélection d&apos;idées cadeaux qui égayent le quotidien.
            <span className="text-sage-600">]</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-sage-400">
            <Sparkles size={10} strokeWidth={1.5} />
            <span>toutes sélectionnées avec soin par notre équipe</span>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between border-2 border-sage-200 px-4 py-3 bg-white hover:border-sage-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-sage-500" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider text-stone-600">Filtrer</span>
              {getActiveFilterCount() > 0 && (
                <span className="text-[10px] text-sage-500 bg-sage-50 px-1.5 py-0.5 border border-sage-200">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <span className="text-sage-400 text-xs">{filtersOpen ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* Filters section */}
        <div className={`lg:block ${filtersOpen ? "block" : "hidden"} mb-8 space-y-6`}>
          {/* Recipient tabs */}
          <div className="border-2 border-sage-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sage-100">
              <span className="text-[10px] uppercase tracking-wider text-sage-500">[ destinataire ]</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRecipient(tab.key)}
                  className={`px-3 py-1.5 text-xs transition-all duration-200 font-mono ${
                    recipient === tab.key
                      ? "border-2 border-sage-500 bg-sage-50 text-sage-700"
                      : "border border-sage-200 text-stone-500 hover:border-sage-300 hover:bg-sage-50/30"
                  }`}
                >
                  <span className="mr-1 text-sage-400">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="border-2 border-sage-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sage-100">
              <span className="text-[10px] uppercase tracking-wider text-sage-500">[ budget ]</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setBudget(range.key)}
                  className={`px-3 py-1.5 text-xs transition-all duration-200 font-mono ${
                    budget === range.key
                      ? "border-2 border-sage-500 bg-sage-50 text-sage-700"
                      : "border border-sage-200 text-stone-500 hover:border-sage-300 hover:bg-sage-50/30"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="border-2 border-sage-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sage-100">
              <span className="text-[10px] uppercase tracking-wider text-sage-500">[ profil ]</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin">
              <button
                onClick={() => setCategoryId("")}
                className={`px-3 py-1.5 text-xs transition-all duration-200 font-mono ${
                  !categoryId
                    ? "border-2 border-sage-500 bg-sage-50 text-sage-700"
                    : "border border-sage-200 text-stone-500 hover:border-sage-300 hover:bg-sage-50/30"
                }`}
              >
                Tous
              </button>
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(String(cat.id))}
                  className={`px-3 py-1.5 text-xs transition-all duration-200 font-mono ${
                    categoryId === String(cat.id)
                      ? "border-2 border-sage-500 bg-sage-50 text-sage-700"
                      : "border border-sage-200 text-stone-500 hover:border-sage-300 hover:bg-sage-50/30"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-sage-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sage-500 uppercase tracking-wider">[ filtres actifs ]</span>
              <div className="flex flex-wrap gap-1">
                {recipient !== "all" && (
                  <span className="text-[10px] bg-sage-50 border border-sage-200 px-2 py-0.5 text-sage-600">
                    {RECIPIENT_TABS.find(t => t.key === recipient)?.label}
                  </span>
                )}
                {budget !== "all" && (
                  <span className="text-[10px] bg-sage-50 border border-sage-200 px-2 py-0.5 text-sage-600">
                    {BUDGET_RANGES.find(b => b.key === budget)?.label}
                  </span>
                )}
                {categoryId && (
                  <span className="text-[10px] bg-sage-50 border border-sage-200 px-2 py-0.5 text-sage-600">
                    {cats.find(c => String(c.id) === categoryId)?.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider"
            >
              <X size={10} strokeWidth={1.5} />
              effacer
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <span className="text-sage-600">[</span>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            <span className="text-sage-600">]</span>
          </div>
          {filtered.length > 0 && (
            <div className="text-[9px] text-stone-400">
              page {currentPage} / {totalPages}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="border-2 border-sage-200 bg-white py-20 text-center">
            <div className="inline-flex items-center gap-2">
              <Hourglass size={16} className="animate-pulse text-sage-500" strokeWidth={1.5} />
              <span className="text-xs font-mono text-stone-500">chargement...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-sage-200 bg-white py-20 text-center">
            <Gift size={40} className="mx-auto mb-4 text-sage-300" strokeWidth={1} />
            <p className="text-sm text-stone-500 font-mono">[ aucune idée cadeau trouvée ]</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-[10px] text-sage-500 hover:text-sage-700 border-b border-sage-200 hover:border-sage-400 transition-colors"
              >
                effacer les filtres
              </button>
            )}
            <div className="mt-4 text-sage-300 text-[10px]">⏎</div>
          </div>
        ) : (
          <>
            {/* Products grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedItems.map((product, index) => (
                <div key={product.id} className="relative group">
                  <span className="absolute -left-2 -top-2 z-10 bg-white px-1.5 text-[9px] text-sage-400 font-mono border border-sage-200">
                    {(index + 1 + (currentPage - 1) * ITEMS_PER_PAGE).toString().padStart(2, "0")}
                  </span>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination - style machine à écrire */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 border-2 border-sage-200 px-3 py-2 text-xs text-stone-600 hover:border-sage-400 hover:bg-sage-50/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={12} strokeWidth={1.5} />
                  <span className="uppercase tracking-wider">précédent</span>
                </button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => goToPage(1)}
                          className="w-8 h-8 border-2 border-sage-200 text-xs text-stone-500 hover:border-sage-400 hover:bg-sage-50/30 transition-all duration-200"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="dots-start" className="text-sage-400 text-xs px-1">...</span>);
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`w-8 h-8 border-2 text-xs transition-all duration-200 ${
                            currentPage === i
                              ? "border-sage-500 bg-sage-50 text-sage-700"
                              : "border-sage-200 text-stone-500 hover:border-sage-400 hover:bg-sage-50/30"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="dots-end" className="text-sage-400 text-xs px-1">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => goToPage(totalPages)}
                          className="w-8 h-8 border-2 border-sage-200 text-xs text-stone-500 hover:border-sage-400 hover:bg-sage-50/30 transition-all duration-200"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 border-2 border-sage-200 px-3 py-2 text-xs text-stone-600 hover:border-sage-400 hover:bg-sage-50/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <span className="uppercase tracking-wider">suivant</span>
                  <ChevronRight size={12} strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Footer effect */}
            <div className="mt-8 text-center text-[9px] text-sage-400">
              <span className="flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-sage-200" />
                <span>///</span>
                <span>{filtered.length} idées cadeaux</span>
                <span>///</span>
                <span className="w-8 h-px bg-sage-200" />
              </span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f3ef;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5c0;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}