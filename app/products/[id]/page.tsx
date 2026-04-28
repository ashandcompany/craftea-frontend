"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { products, reviews, favorites, shops as shopsApi, type Product, type Review, type ShopShippingMethod } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { assetUrl } from "@/lib/utils";
import { Hourglass, Truck } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem, items: cartItems } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<{ average: number; count: number } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [shippingMethods, setShippingMethods] = useState<ShopShippingMethod[]>([]);

  // Cart
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const allVariantsSelected = hasVariants
    ? product!.variants!.every((v) => selectedOptions[v.name])
    : true;

  // Effective stock: if variants selected, min of selected options; else global stock
  const effectiveStock = (() => {
    if (!product) return 0;
    if (!hasVariants) return product.stock;
    if (!allVariantsSelected) return 0;
    return Math.min(
      ...product.variants!.map((v) => {
        const opt = v.options.find((o) => o.label === selectedOptions[v.name]);
        return opt?.stock ?? 0;
      }),
    );
  })();

  // Effective price: use the first variant option that has an explicit price, fallback to product.price
  const effectivePrice = (() => {
    if (!hasVariants || !allVariantsSelected || !product) return product?.price ?? null;
    for (const v of product.variants!) {
      const opt = v.options.find((o) => o.label === selectedOptions[v.name]);
      if (opt?.price != null) return opt.price;
    }
    return product.price ?? null;
  })();

  // Quantity already in cart for this product + selected options combo
  const selectedOptionsStr =
    hasVariants && allVariantsSelected ? JSON.stringify(selectedOptions) : undefined;
  const inCart = cartItems
    .filter(
      (i) =>
        i.product_id === Number(id) &&
        (selectedOptionsStr ? i.selected_options === selectedOptionsStr : !i.selected_options),
    )
    .reduce((s, i) => s + i.quantity, 0);
  const maxQty = Math.max(0, effectiveStock - inCart);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editReviewLoading, setEditReviewLoading] = useState(false);
  const [editReviewError, setEditReviewError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [p, rev, avg] = await Promise.all([
          products.get(Number(id)),
          reviews.listByProduct(Number(id)).catch(() => ({ data: [] })),
          reviews.average(Number(id)).catch(() => null),
        ]);
        setProduct(p);
        setProductReviews(rev.data);
        setAvgRating(avg);

        // Load shop shipping methods
        if (p.shop_id) {
          shopsApi.getShippingMethods(p.shop_id).then(setShippingMethods).catch(() => {});
        }

        if (user) {
          const fav = await favorites.check(Number(id)).catch(() => ({ isFavorite: false }));
          setIsFav(fav.isFavorite);
        }
      } catch (err: any) {
        setError(err.message || "Produit introuvable");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user || !product) return;
    if (hasVariants && !allVariantsSelected) return;
    setAddingToCart(true);
    setCartSuccess(false);
    try {
      await addItem(product.id, qty, hasVariants ? JSON.stringify(selectedOptions) : undefined);
      setCartSuccess(true);
      setQty(1);
      setTimeout(() => setCartSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout au panier");
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    try {
      if (isFav) {
        await favorites.remove(Number(id));
      } else {
        await favorites.add(Number(id));
      }
      setIsFav(!isFav);
    } catch {}
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewLoading(true);
    try {
      const r = await reviews.create({ product_id: Number(id), rating, comment: comment || undefined });
      setProductReviews((prev) => [r, ...prev]);
      setComment("");
      setRating(5);
      setShowReviewForm(false);
      const avg = await reviews.average(Number(id));
      setAvgRating(avg);
    } catch (err: any) {
      setReviewError(err.message || "Erreur");
    } finally {
      setReviewLoading(false);
    }
  };

  const openEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditReviewError("");
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewError("");
  };

  const submitEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId) return;

    setEditReviewError("");
    setEditReviewLoading(true);
    try {
      const updated = await reviews.update(editingReviewId, {
        rating: editRating,
        comment: editComment || undefined,
      });

      setProductReviews((prev) => prev.map((rev) => (rev.id === updated.id ? updated : rev)));
      setEditingReviewId(null);

      const avg = await reviews.average(Number(id));
      setAvgRating(avg);
    } catch (err: any) {
      setEditReviewError(err.message || "Erreur");
    } finally {
      setEditReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error || "Produit introuvable"}</AlertDescription>
        </Alert>
        <Link href="/products" className="mt-4 inline-block text-sm text-stone-500 hover:text-stone-800">
          ← retour au catalogue
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const imageUrl = images[selectedImage]?.image_url;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Back link */}
      <Link href="/products" className="mb-8 inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-800">
        ← retour au catalogue
      </Link>

      {/* Product header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-light tracking-tight text-stone-900">
          {product.title || "sans titre"}
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm">
          {product.category && (
            <span className="text-stone-500">#{product.category.name}</span>
          )}
          <span className={`text-xs ${product.is_active ? 'text-stone-600' : 'text-stone-400'}`}>
            {product.is_active ? '✓ disponible' : '○ indisponible'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square border border-stone-200 bg-stone-50">
            {imageUrl ? (
              <img
                src={assetUrl(imageUrl, "product-images")}
                alt={product.title || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <span className="text-sm">[image]</span>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`size-14 border transition-colors ${
                    i === selectedImage 
                      ? 'border-stone-800' 
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img src={assetUrl(img.image_url || "", "product-images")} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
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
                      {i < Math.round(avgRating.average) ? '★' : '☆'}
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
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [variant.name]: option.label }))
                        }
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
              <p className="text-sm text-stone-700">{product.stock} unité{product.stock > 1 ? 's' : ''}</p>
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
                  {' '}{product.processing_time_unit === 'weeks' ? 'semaines' : 'jours'}
                </p>
              </div>
            )}
            {(product.delivery_time_min || product.delivery_time_max) ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">livraison</p>
                <p className="text-sm text-stone-700">
                  {product.delivery_time_min && product.delivery_time_max
                    ? `${product.delivery_time_min} \u2013 ${product.delivery_time_max}`
                    : product.delivery_time_min
                    ? `\u00e0 partir de ${product.delivery_time_min}`
                    : `jusqu'\u00e0 ${product.delivery_time_max}`}
                  {' '}{product.delivery_time_unit === 'weeks' ? 'semaines' : 'jours'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Shipping methods from shop */}
          {shippingMethods.length > 0 && !product.delivery_time_min && !product.delivery_time_max && (
            <div className="border-t border-stone-200 pt-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-stone-400">livraison</p>
              <div className="space-y-1.5">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex items-center gap-2 text-sm text-stone-700">
                    <Truck className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="font-medium">{method.name}</span>
                    <span className="text-stone-400 text-xs">
                      ({method.zones.map(z => z === 'france' ? 'France' : z === 'europe' ? 'Europe' : 'Monde').join(', ')})
                    </span>
                    {(method.delivery_time_min || method.delivery_time_max) && (
                      <span className="text-xs text-stone-500 ml-auto">
                        {method.delivery_time_min && method.delivery_time_max
                          ? `${method.delivery_time_min}\u2013${method.delivery_time_max}`
                          : method.delivery_time_min
                          ? `\u00e0 partir de ${method.delivery_time_min}`
                          : `jusqu'\u00e0 ${method.delivery_time_max}`}
                        {' '}{method.delivery_time_unit === 'weeks' ? 'sem.' : 'j.'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs uppercase tracking-wider text-stone-400 mb-2">tags</p>
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
                  déjà {inCart} dans le panier · {maxQty > 0 ? `${maxQty} restant${maxQty > 1 ? 's' : ''}` : 'stock atteint'}
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
                    {addingToCart ? 'ajout...' : cartSuccess ? '✓ ajouté !' : 'ajouter au panier'}
                  </button>
                </div>
              ) : inCart > 0 ? (
                <p className="text-xs italic text-stone-400">stock maximum atteint</p>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {user && (
              <button
                onClick={toggleFavorite}
                className={`border px-4 py-2 text-sm transition-colors ${
                  isFav 
                    ? 'border-stone-800 bg-stone-800 text-stone-50 hover:bg-stone-700' 
                    : 'border-stone-200 hover:border-stone-800 hover:text-stone-800'
                }`}
              >
                {isFav ? '★ favori' : '☆ ajouter aux favoris'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <section className="mt-16 border-t border-stone-200 pt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-light tracking-tight text-stone-900">Avis clients</h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-xs text-stone-500 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
            >
              + écrire un avis
            </button>
          )}
        </div>

        {/* Review form */}
        {user && showReviewForm && (
          <div className="mb-8 border border-stone-200 bg-stone-50 p-5">
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-stone-400">nouvel avis</p>
                <button 
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              </div>

              {reviewError && (
                <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                  <AlertDescription>{reviewError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-xs text-stone-500">note</label>
                <div className="flex gap-1 text-lg">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRating(r)}
                      className={`text-2xl ${r <= rating ? 'text-stone-800' : 'text-stone-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-stone-500">commentaire</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="votre avis (minimum 10 caractères)..."
                  rows={3}
                  className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-stone-600"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
              >
                {reviewLoading ? 'envoi...' : 'publier l\'avis'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-4">
          {productReviews.length === 0 ? (
            <p className="text-sm text-stone-400 italic">— aucun avis pour ce produit —</p>
          ) : (
            productReviews.map((rev) => (
              <div key={rev.id} className="border border-stone-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex text-stone-600">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-sm">
                          {i < rev.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(rev.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="text-xs text-stone-500">
                      {user && rev.user_id === user.id ? "vous" : rev.reviewer_name || `utilisateur #${rev.user_id}`}
                    </span>
                  </div>
                  {user && rev.user_id === user.id && editingReviewId !== rev.id && (
                    <button
                      onClick={() => openEditReview(rev)}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      modifier
                    </button>
                  )}
                </div>

                {editingReviewId === rev.id ? (
                  <form onSubmit={submitEditReview} className="mt-3 space-y-3 border-t border-stone-200 pt-3">
                    {editReviewError && (
                      <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                        <AlertDescription>{editReviewError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs text-stone-500">note</label>
                      <div className="flex gap-1 text-lg">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setEditRating(r)}
                            className={`text-2xl ${r <= editRating ? 'text-stone-800' : 'text-stone-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-stone-500">commentaire</label>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={editReviewLoading}
                        className="border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                      >
                        {editReviewLoading ? "enregistrement..." : "sauvegarder"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditReview}
                        className="border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                      >
                        annuler
                      </button>
                    </div>
                  </form>
                ) : rev.comment ? (
                  <p className="mt-2 text-sm text-stone-600">{rev.comment}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}