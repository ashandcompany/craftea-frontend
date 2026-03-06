"use client";

import Link from "next/link";
import type { Product } from "@/lib/api";
import { assetUrl } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  onToggleFavorite?: (id: number) => void;
  isFavorite?: boolean;
};

export function ProductCard({ product, onToggleFavorite, isFavorite }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.image_url;

  return (
    <div className="group border border-stone-200 bg-paper-50 p-4 font-mono transition-colors dark:border-stone-700 dark:bg-stone-900">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative mb-4 aspect-square border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
          {imageUrl ? (
            <img
              src={assetUrl(imageUrl, "product-images")}
              alt={product.title || "Produit"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-stone-500">
              <span className="text-xs">[image]</span>
            </div>
          )}
          {!product.is_active && (
            <div className="absolute inset-0 border-2 border-stone-600 bg-stone-50/90 dark:border-stone-400 dark:bg-stone-900/90">
              <div className="flex h-full items-center justify-center">
                <span className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  indisponible
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/products/${product.id}`} className="block">
              <h3 className="truncate text-sm text-stone-800 hover:underline dark:text-stone-200">
                {product.title || "sans titre"}
              </h3>
            </Link>
            {product.category && (
              <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                {product.category.name}
              </p>
            )}
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(product.id);
              }}
              className="shrink-0 p-1 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
            >
              <span className={`text-sm ${
                isFavorite 
                  ? "text-stone-800 dark:text-stone-200" 
                  : "text-stone-400 dark:text-stone-500"
              }`}>
                {isFavorite ? "★" : "☆"}
              </span>
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-px w-full bg-stone-200 dark:bg-stone-700" />

        {/* Price & Stock */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-800 dark:text-stone-200">
            {product.price != null ? `${Number(product.price).toFixed(2)} €` : "—"}
          </span>
          <span className={
            product.stock > 0 
              ? "text-stone-600 dark:text-stone-400" 
              : "text-stone-400 dark:text-stone-600"
          }>
            {product.stock > 0 ? "en stock" : "rupture"}
          </span>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-stone-200 pt-2 text-[10px] uppercase tracking-wider text-stone-400 dark:border-stone-700 dark:text-stone-500">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag.id}>#{tag.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}