"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories as categoriesApi, type Category } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hourglass } from "lucide-react";

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCats)
      .catch((err) => setError(err.message || "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-10 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-light tracking-tight text-stone-900">Catégories</h1>
        <p className="mt-2 text-sm text-stone-500">
          — {loading ? 'chargement...' : `${cats.length} catégorie${cats.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement des catégories...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : cats.length === 0 ? (
        <div className="border border-stone-200 py-20 text-center">
          <p className="text-stone-400 italic">— aucune catégorie pour le moment —</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat, index) => (
            <Link 
              key={cat.id} 
              href={`/products?category_id=${cat.id}`}
              className="group"
            >
              <div className="relative border border-stone-200 p-5 transition-colors hover:border-stone-800 hover:bg-stone-50">
                <span className="absolute -left-3 -top-3 text-xs text-stone-300 bg-white px-1 group-hover:text-stone-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-light tracking-tight text-stone-800 group-hover:text-stone-900">
                    {cat.name}
                  </h3>
                  
                  {cat.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 border-t border-stone-100 pt-2">
                      {cat.description}
                    </p>
                  )}
                  
                  <div className="text-right text-xs text-stone-400 group-hover:text-stone-600">
                    explorer →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer note */}
      {!loading && cats.length > 0 && (
        <div className="mt-12 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-400">
            ✦ {cats.length} catégorie{cats.length > 1 ? 's' : ''} disponibles ✦
          </p>
        </div>
      )}
    </div>
  );
}