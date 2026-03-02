"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { products as productsApi, type Product } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assetUrl } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Trash2, X, ArrowLeft, Package, Truck, Shield, CheckCircle, Sparkle } from "lucide-react";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, count, loading: cartLoading, updateItem, removeItem, clear } = useCart();
  const router = useRouter();

  const [productMap, setProductMap] = useState<Record<number, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Fonction pour afficher une notification
  const showNotification = (message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Redirect si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Charger les infos produits pour chaque item du panier
  useEffect(() => {
    if (cartLoading || items.length === 0) {
      setLoadingProducts(false);
      return;
    }

    async function loadProducts() {
      try {
        const productIds = [...new Set(items.map((i) => i.product_id))];
        const results = await Promise.allSettled(
          productIds.map((id) => productsApi.get(id))
        );
        const map: Record<number, Product> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") map[r.value.id] = r.value;
        });
        setProductMap(map);
      } catch {
        setError("Erreur lors du chargement des produits");
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, [items, cartLoading]);

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setActionLoading(itemId);
    try {
      await updateItem(itemId, newQty);
      showNotification("Quantité mise à jour");
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setActionLoading(itemId);
    try {
      await removeItem(itemId);
      showNotification("Article supprimé du panier");
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    setClearLoading(true);
    try {
      await clear();
      showNotification("Panier vidé");
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setClearLoading(false);
    }
  };

  const total = items.reduce((sum, item) => {
    const product = productMap[item.product_id];
    if (!product?.price) return sum;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const loading = authLoading || cartLoading || loadingProducts;

  // Calcul pour la livraison gratuite
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const shippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 font-mono">
        <div className="py-20 text-center">
          <div className="relative inline-flex">
            <div className="h-12 w-12 rounded-full border-2 border-sage-200 border-t-sage-600 animate-spin"></div>
          </div>
          <p className="mt-4 text-sm text-sage-600 animate-pulse">chargement du panier...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Notification flottante */}
      <div
        className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
          notification.visible 
            ? "translate-y-0 opacity-100" 
            : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 bg-white border-2 border-sage-200 shadow-lg px-4 py-3 min-w-[280px]">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-sage-700" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-stone-700">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
            className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Header avec breadcrumb */}
      <div className="mb-8 sm:mb-12">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-xs text-sage-600 hover:text-sage-800 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>continuer mes achats</span>
        </Link>
        
        <div className="border-b border-sage-200 pb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-stone-900">
              Mon panier
            </h1>
            {count > 0 && (
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs text-sage-700">
                {count} article{count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages d'erreur seulement */}
      {error && (
        <Alert className="mb-6 rounded-none border border-red-200 bg-red-50 font-mono">
          <AlertDescription className="text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-gradient-to-b from-white to-sage-50/30 rounded-lg border border-sage-200">
          <div className="relative inline-block">
            <ShoppingCart size={64} strokeWidth={1} className="text-sage-300" />
            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-sage-100 flex items-center justify-center">
              <span className="text-sage-600 text-xs">0</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-sage-600 mb-6">
            — votre panier est vide, découvrez nos créations —
          </p>
          <Link
            href="/products"
            className="inline-block border-2 border-sage-700 bg-sage-700 px-8 py-3 text-sm text-white hover:bg-sage-800 transition-all hover:scale-105"
          >
            découvrir les créations
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Liste des items */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const product = productMap[item.product_id];
              const image = product?.images?.[0]?.image_url;
              const isLoading = actionLoading === item.id;

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col sm:flex-row gap-4 border border-sage-200 bg-white p-4 transition-all hover:border-sage-400 hover:shadow-md ${
                    isLoading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Badge de chargement */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                      <div className="h-8 w-8 rounded-full border-2 border-sage-200 border-t-sage-600 animate-spin"></div>
                    </div>
                  )}

                  {/* Image */}
                  <Link
                    href={`/products/${item.product_id}`}
                    className="block h-32 w-32 sm:h-28 sm:w-28 shrink-0 border border-sage-200 bg-sage-50 overflow-hidden group-hover:border-sage-300 transition-colors"
                  >
                    {image ? (
                      <img
                        src={assetUrl(image, "product-images")}
                        alt={product?.title || ""}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sage-400">
                        <Package size={24} strokeWidth={1} />
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="text-base font-medium text-stone-800 hover:text-sage-700 transition-colors"
                        >
                          {product?.title || `Produit #${item.product_id}`}
                        </Link>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isLoading}
                          className="text-sage-400 hover:text-red-500 transition-colors disabled:opacity-30 ml-2"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      {product?.price != null && (
                        <p className="mt-1 text-sm text-sage-600">
                          {Number(product.price).toFixed(2)} € / unité
                        </p>
                      )}

                      {product?.stock && product.stock < 5 && (
                        <p className="mt-1 text-xs text-amber-600">
                          ⚡ Plus que {product.stock} en stock
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantité */}
                      <div className="flex items-center gap-2 border border-sage-200 p-1">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center text-sage-600 hover:bg-sage-50 hover:text-sage-800 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={isLoading || (product && item.quantity >= product.stock)}
                          className="flex h-8 w-8 items-center justify-center text-sage-600 hover:bg-sage-50 hover:text-sage-800 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Prix ligne */}
                      {product?.price != null && (
                        <span className="text-lg font-medium text-sage-800">
                          {(Number(product.price) * item.quantity).toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Actions du panier */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-sage-200">
              <Link
                href="/products"
                className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>ajouter d'autres articles</span>
              </Link>

              <button
                onClick={handleClear}
                disabled={clearLoading}
                className="flex items-center gap-2 text-sm text-sage-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                {clearLoading ? "suppression..." : "vider le panier"}
              </button>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Barre de progression livraison gratuite */}
              {total < freeShippingThreshold && (
                <div className="mb-4 p-4 bg-sage-50 border border-sage-200">
                  <p className="text-xs text-sage-700 mb-2">
                    Plus que <span className="font-bold">{remainingForFreeShipping.toFixed(2)} €</span> pour la livraison offerte
                  </p>
                  <div className="h-1 bg-sage-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sage-600 transition-all duration-500"
                      style={{ width: `${shippingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="border-2 border-sage-200 bg-white p-6">
                <h2 className="mb-4 text-sm uppercase tracking-wider text-sage-700 border-b border-sage-100 pb-2">
                  récapitulatif
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Sous-total</span>
                    <span className="font-medium">{total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Livraison</span>
                    <span className={`text-xs ${total >= 50 ? 'text-sage-600' : 'text-stone-400'}`}>
                      {total >= 50 ? "offerte" : "à calculer"}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600 border-t border-sage-100 pt-3">
                    <span className="font-medium">Total TTC</span>
                    <span className="text-xl font-light text-sage-800">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <button
                  disabled
                  className="mt-6 w-full border-2 border-sage-700 bg-sage-700 px-6 py-3 text-sm text-white hover:bg-sage-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage-700"
                >
                  passer commande
                </button>

                <p className="mt-3 text-center text-xs text-stone-400">
                  (paiement sécurisé bientôt disponible)
                </p>

                {/* Garanties */}
                <div className="mt-6 pt-4 border-t border-sage-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-sage-600">
                    <Truck size={14} />
                    <span>Livraison offerte dès 50€</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sage-600">
                    <Shield size={14} />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                </div>
              </div>

              {/* Produits recommandés (optionnel) */}
              <div className="mt-6 p-4 bg-sage-50/50 border border-sage-200">
                <p className="text-xs text-sage-700 mb-2 flex items-center gap-3"><Sparkle width={10} /> Vous aimerez aussi</p>
                <Link 
                  href="/products?category=featured"
                  className="text-sm text-sage-600 hover:text-sage-800 flex items-center justify-between group"
                >
                  <span>Découvrir nos sélections</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}