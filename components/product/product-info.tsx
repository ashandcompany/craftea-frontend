"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product, ShopShippingMethod, User } from "@/lib/api";

interface Props {
  product: Product;
  user: User | null;
  avgRating: { average: number; count: number } | null;
  shippingMethods: ShopShippingMethod[];
  isFav: boolean;
  favCount: number | null;
  onToggleFavorite: () => void;
  onVariantImageChange: (imageIndex: number) => void;
}

export function ProductInfo({
  product,
  user,
  avgRating,
  shippingMethods,
  isFav,
  favCount,
  onToggleFavorite,
  onVariantImageChange,
}: Props) {
  const { addItem, items: cartItems } = useCart();
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [addError, setAddError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const hasVariants = !!(product.variants && product.variants.length > 0);
  const allVariantsSelected = hasVariants
    ? product.variants!.every((v) => selectedOptions[v.name])
    : true;

  const effectiveStock = (() => {
    if (!hasVariants) return product.stock;
    if (!allVariantsSelected) return 0;
    return Math.min(
      ...product.variants!.map((v) => {
        const opt = v.options.find((o) => o.label === selectedOptions[v.name]);
        return opt?.stock ?? 0;
      }),
    );
  })();

  const effectivePrice = (() => {
    if (!hasVariants || !allVariantsSelected) return product.price ?? null;
    for (const v of product.variants!) {
      const opt = v.options.find((o) => o.label === selectedOptions[v.name]);
      if (opt?.price != null) return opt.price;
    }
    return product.price ?? null;
  })();

  const selectedOptionsStr =
    hasVariants && allVariantsSelected ? JSON.stringify(selectedOptions) : undefined;

  const inCart = cartItems
    .filter(
      (i) =>
        i.product_id === product.id &&
        (selectedOptionsStr ? i.selected_options === selectedOptionsStr : !i.selected_options),
    )
    .reduce((s, i) => s + i.quantity, 0);

  const maxQty = Math.max(0, effectiveStock - inCart);

  const estimatedDelivery = (() => {
    const procDays =
      (product.processing_time_max ?? product.processing_time_min ?? 0) *
      (product.processing_time_unit === "weeks" ? 7 : 1);
    let delivMax = product.delivery_time_max ?? product.delivery_time_min ?? 0;
    let delivUnit: "days" | "weeks" = product.delivery_time_unit ?? "days";
    if (!delivMax && shippingMethods.length > 0) {
      const m = shippingMethods[0];
      delivMax = m.delivery_time_max ?? m.delivery_time_min ?? 0;
      delivUnit = m.delivery_time_unit;
    }
    const delivDays = delivMax * (delivUnit === "weeks" ? 7 : 1);
    const totalDays = procDays + delivDays;
    if (totalDays === 0) return null;
    const date = new Date();
    date.setDate(date.getDate() + totalDays);
    return date;
  })();

  const handleAddToCart = async () => {
    if (!user) return;
    if (hasVariants && !allVariantsSelected) return;
    setAddingToCart(true);
    setCartSuccess(false);
    setAddError("");
    try {
      await addItem(product.id, qty, hasVariants ? JSON.stringify(selectedOptions) : undefined);
      setCartSuccess(true);
      setQty(1);
      setTimeout(() => setCartSuccess(false), 2000);
    } catch (err: any) {
      setAddError(err.message || "Erreur lors de l'ajout au panier");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-stone-400">prix</p>
        <p className="text-3xl text-stone-900">
          {effectivePrice != null ? `${Number(effectivePrice).toFixed(2)} €` : "—"}
        </p>
      </div>

      {/* Rating */}
      {avgRating && avgRating.count > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-stone-400">avis</p>
          <div className="flex items-center gap-2">
            <div className="flex text-stone-700">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">
                  {i < Math.round(avgRating.average) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className="text-xs text-stone-500">
              {avgRating.average.toFixed(1)} ({avgRating.count})
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-400">description</p>
          <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>
        </div>
      )}

      {/* Variant selectors */}
      {hasVariants && (
        <div className="space-y-4 border-t border-stone-200 pt-4">
          {product.variants!.map((variant) => (
            <div key={variant.name} className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-stone-400">{variant.name}</p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setSelectedOptions((prev) => ({ ...prev, [variant.name]: option.label }));
                      if (option.imageIndex != null) onVariantImageChange(option.imageIndex);
                    }}
                    disabled={option.stock === 0}
                    className={`border px-3 py-1.5 text-xs transition-colors ${
                      selectedOptions[variant.name] === option.label
                        ? "border-stone-800 bg-stone-800 text-stone-50"
                        : option.stock === 0
                        ? "cursor-not-allowed border-stone-100 text-stone-300 line-through"
                        : "border-stone-200 text-stone-600 hover:border-stone-600"
                    }`}
                  >
                    {option.label}
                    {option.stock > 0 && option.stock <= 3 && (
                      <span className="ml-1 opacity-60">({option.stock})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">stock</p>
          <p className="text-sm text-stone-700">
            {product.stock} unité{product.stock > 1 ? "s" : ""}
          </p>
        </div>
        {(product.processing_time_min || product.processing_time_max) && (
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400">fabrication</p>
            <p className="text-sm text-stone-700">
              {product.processing_time_min && product.processing_time_max
                ? `${product.processing_time_min} - ${product.processing_time_max}`
                : product.processing_time_min
                ? `à partir de ${product.processing_time_min}`
                : `jusqu'à ${product.processing_time_max}`}
              {" "}
              {product.processing_time_unit === "weeks" ? "semaines" : "jours"}
            </p>
          </div>
        )}
        {(product.delivery_time_min || product.delivery_time_max) && (
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400">livraison</p>
            <p className="text-sm text-stone-700">
              {product.delivery_time_min && product.delivery_time_max
                ? `${product.delivery_time_min} – ${product.delivery_time_max}`
                : product.delivery_time_min
                ? `à partir de ${product.delivery_time_min}`
                : `jusqu'à ${product.delivery_time_max}`}
              {" "}
              {product.delivery_time_unit === "weeks" ? "semaines" : "jours"}
            </p>
          </div>
        )}
      </div>

      {/* Shipping methods from shop */}
      {shippingMethods.length > 0 && !product.delivery_time_min && !product.delivery_time_max && (
        <div className="space-y-2 border-t border-stone-200 pt-4">
          <p className="text-xs uppercase tracking-wider text-stone-400">livraison</p>
          <div className="space-y-1.5">
            {shippingMethods.map((method) => (
              <div key={method.id} className="flex items-center gap-2 text-sm text-stone-700">
                <Truck className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                <span className="font-medium">{method.name}</span>
                <span className="text-xs text-stone-400">
                  (
                  {method.zones
                    .map((z) => (z === "france" ? "France" : z === "europe" ? "Europe" : "Monde"))
                    .join(", ")}
                  )
                </span>
                {(method.delivery_time_min || method.delivery_time_max) && (
                  <span className="ml-auto text-xs text-stone-500">
                    {method.delivery_time_min && method.delivery_time_max
                      ? `${method.delivery_time_min}–${method.delivery_time_max}`
                      : method.delivery_time_min
                      ? `à partir de ${method.delivery_time_min}`
                      : `jusqu'à ${method.delivery_time_max}`}
                    {" "}
                    {method.delivery_time_unit === "weeks" ? "sem." : "j."}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated delivery */}
      {estimatedDelivery && (
        <div className="border border-stone-200 bg-stone-50 px-4 py-3">
          <p className="text-xs text-stone-500">
            Commandez aujourd&apos;hui, recevez-le avant le{" "}
            <span className="font-medium text-stone-800">
              {estimatedDelivery.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </p>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-stone-400">tags</p>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag.id} className="text-xs text-stone-500">
                #{tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add to cart */}
      {user && product.is_active && (effectiveStock > 0 || (hasVariants && !allVariantsSelected)) && (
        <div className="space-y-3 border-t border-stone-200 pt-4">
          <p className="text-xs uppercase tracking-wider text-stone-400">ajouter au panier</p>
          {hasVariants && !allVariantsSelected && (
            <p className="text-xs italic text-stone-400">— sélectionnez toutes les options</p>
          )}
          {inCart > 0 && allVariantsSelected && (
            <p className="text-xs text-stone-500">
              déjà {inCart} dans le panier ·{" "}
              {maxQty > 0 ? `${maxQty} restant${maxQty > 1 ? "s" : ""}` : "stock atteint"}
            </p>
          )}
          {maxQty > 0 && allVariantsSelected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm text-stone-800">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                  disabled={qty >= maxQty}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 border border-stone-800 bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50"
              >
                {addingToCart ? "ajout..." : cartSuccess ? "✓ ajouté !" : "ajouter au panier"}
              </button>
            </div>
          ) : inCart > 0 ? (
            <p className="text-xs italic text-stone-400">stock maximum atteint</p>
          ) : null}
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </div>
      )}

      {/* Favorite */}
      <div className="flex flex-col gap-2 pt-4">
        <div className="flex gap-3">
          {user && (
            <button
              onClick={onToggleFavorite}
              className={`border px-4 py-2 text-sm transition-colors ${
                isFav
                  ? "border-stone-800 bg-stone-800 text-stone-50 hover:bg-stone-700"
                  : "border-stone-200 hover:border-stone-800 hover:text-stone-800"
              }`}
            >
              {isFav ? "★ favori" : "☆ ajouter aux favoris"}
            </button>
          )}
        </div>
        {favCount !== null && favCount > 0 && (
          <p className="text-xs text-stone-400">
            {favCount} personne{favCount > 1 ? "s ont" : " a"} mis en favoris
          </p>
        )}
      </div>
    </div>
  );
}
