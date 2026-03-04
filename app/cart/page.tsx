"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import {
  products as productsApi,
  shops as shopsApi,
  type Product,
  type Shop,
  type ShopShippingProfile,
  type ShippingZone,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assetUrl } from "@/lib/utils";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  CheckCircle,
  Sparkle,
  ArrowRight,
  Store,
  MapPin,
} from "lucide-react";

// ── Mapping pays → zone ──────────────────────────────────────────────────
const COUNTRY_ZONE_MAP: Record<string, ShippingZone> = {
  FR: "france",
  GP: "france", RE: "france", MQ: "france", GF: "france", YT: "france",
  BE: "europe", CH: "europe", LU: "europe", DE: "europe", ES: "europe",
  IT: "europe", GB: "europe", NL: "europe", AT: "europe", PT: "europe",
  IE: "europe", PL: "europe", SE: "europe", DK: "europe", FI: "europe",
  NO: "europe", CZ: "europe", GR: "europe", HU: "europe", RO: "europe",
  BG: "europe", HR: "europe", SK: "europe", SI: "europe", EE: "europe",
  LV: "europe", LT: "europe",
};

export function countryToZone(countryCode: string): ShippingZone {
  return COUNTRY_ZONE_MAP[countryCode] || "world";
}

// ── Calcul shipping côté client (preview) ────────────────────────────
export function computeShopShipping(
  shopItems: { product: Product; quantity: number }[],
  profiles: ShopShippingProfile[],
  zone: ShippingZone,
): number | null {
  const profile = profiles.find((p) => p.zone === zone);

  // No profile for this zone → shipping unavailable
  if (!profile) return null;

  const baseFee = Number(profile.base_fee);
  const additionalFee = Number(profile.additional_item_fee);
  const freeThreshold =
    profile.free_shipping_threshold != null
      ? Number(profile.free_shipping_threshold)
      : null;

  const shopSubtotal = shopItems.reduce(
    (sum, i) => sum + Number(i.product.price ?? 0) * i.quantity,
    0,
  );

  if (freeThreshold !== null && shopSubtotal >= freeThreshold) return 0;

  let shipping = 0;
  let isFirst = true;

  for (const item of shopItems) {
    const productOverride = item.product.shipping_fee;
    if (productOverride != null) {
      shipping += Number(productOverride) * item.quantity;
    } else {
      for (let q = 0; q < item.quantity; q++) {
        if (isFirst) {
          shipping += baseFee;
          isFirst = false;
        } else {
          shipping += additionalFee;
        }
      }
    }
  }

  return shipping;
}

// ── Shop Group Component ──────────────────────────────────────────────
function ShopGroup({
  shopId,
  shopInfo,
  items,
  productMap,
  shippingProfiles,
  zone,
  actionLoading,
  onUpdateQty,
  onRemove,
}: {
  shopId: number;
  shopInfo: Shop | null;
  items: { id: number; product_id: number; quantity: number }[];
  productMap: Record<number, Product>;
  shippingProfiles: ShopShippingProfile[];
  zone: ShippingZone;
  actionLoading: number | null;
  onUpdateQty: (itemId: number, qty: number) => void;
  onRemove: (itemId: number) => void;
}) {
  const shopItems = items
    .map((item) => ({
      ...item,
      product: productMap[item.product_id],
    }))
    .filter((i) => i.product);

  const shopSubtotal = shopItems.reduce(
    (sum, i) => sum + Number(i.product.price ?? 0) * i.quantity,
    0,
  );

  const shopShipping = computeShopShipping(
    shopItems.map((i) => ({ product: i.product, quantity: i.quantity })),
    shippingProfiles,
    zone,
  );

  const shippingUnavailable = shopShipping === null;

  const profile = shippingProfiles.find((p) => p.zone === zone);
  const freeThreshold =
    profile?.free_shipping_threshold != null
      ? Number(profile.free_shipping_threshold)
      : null;
  const remainingForFree =
    freeThreshold !== null ? Math.max(0, freeThreshold - shopSubtotal) : null;

  return (
    <div className={`border bg-white ${shippingUnavailable ? 'border-amber-300' : 'border-sage-200'}`}>
      {/* Shop header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-sage-50/50 border-b border-sage-200">
        <Store size={16} className="text-sage-600" />
        <Link
          href={`/artists/${shopInfo?.artist_id || ""}`}
          className="text-sm font-medium text-stone-800 hover:text-sage-700 transition-colors"
        >
          {shopInfo?.name || `Boutique #${shopId}`}
        </Link>
        {shopInfo?.location && (
          <span className="flex items-center gap-1 text-xs text-sage-500">
            <MapPin size={10} />
            {shopInfo.location}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-sage-100">
        {items.map((item) => {
          const product = productMap[item.product_id];
          const image = product?.images?.[0]?.image_url;
          const isLoading = actionLoading === item.id;

          return (
            <div
              key={item.id}
              className={`relative flex flex-col sm:flex-row gap-4 p-4 transition-all hover:bg-sage-50/30 ${
                isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="h-8 w-8 rounded-full border-2 border-sage-200 border-t-sage-600 animate-spin" />
                </div>
              )}

              {/* Image */}
              <Link
                href={`/products/${item.product_id}`}
                className="block h-28 w-28 shrink-0 border border-sage-200 bg-sage-50 overflow-hidden hover:border-sage-300 transition-colors"
              >
                {image ? (
                  <img
                    src={assetUrl(image, "product-images")}
                    alt={product?.title || ""}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
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
                      onClick={() => onRemove(item.id)}
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

                  {product?.shipping_fee != null && (
                    <p className="mt-1 text-xs text-sage-500">
                      <Truck size={10} className="inline mr-1" />
                      Livraison : {Number(product.shipping_fee).toFixed(2)} € / article
                    </p>
                  )}

                  {product?.stock != null && product.stock < 5 && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚡ Plus que {product.stock} en stock
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-sage-200 p-1">
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      disabled={isLoading || item.quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center text-sage-600 hover:bg-sage-50 hover:text-sage-800 disabled:opacity-30 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      disabled={isLoading || !!(product && item.quantity >= product.stock)}
                      className="flex h-8 w-8 items-center justify-center text-sage-600 hover:bg-sage-50 hover:text-sage-800 disabled:opacity-30 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

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
      </div>

      {/* Shop shipping summary */}
      <div className={`px-4 py-3 border-t space-y-1 ${shippingUnavailable ? 'bg-amber-50/50 border-amber-200' : 'bg-sage-50/30 border-sage-200'}`}>
        <div className="flex justify-between text-sm text-stone-600">
          <span>Sous-total boutique</span>
          <span className="font-medium">{shopSubtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm text-stone-600">
          <span className="flex items-center gap-1">
            <Truck size={12} />
            Livraison
          </span>
          {shippingUnavailable ? (
            <span className="text-amber-600 font-medium">indisponible</span>
          ) : (
            <span className={shopShipping === 0 ? "text-sage-600 font-medium" : ""}>
              {shopShipping === 0 ? "offerte" : `${shopShipping.toFixed(2)} €`}
            </span>
          )}
        </div>
        {shippingUnavailable && (
          <p className="text-xs text-amber-600 pt-1 flex items-center gap-1">
            ⚠ Cette boutique ne livre pas dans la zone sélectionnée
          </p>
        )}
        {!shippingUnavailable && remainingForFree !== null && remainingForFree > 0 && (
          <p className="text-xs text-sage-600 pt-1">
            Plus que{" "}
            <span className="font-bold">{remainingForFree.toFixed(2)} €</span>{" "}
            pour la livraison offerte dans cette boutique
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Cart Page
// ═══════════════════════════════════════════════════════════════════════
export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    count,
    loading: cartLoading,
    updateItem,
    removeItem,
    clear,
  } = useCart();
  const router = useRouter();

  const [productMap, setProductMap] = useState<Record<number, Product>>({});
  const [shopMap, setShopMap] = useState<Record<number, Shop>>({});
  const [shippingProfiles, setShippingProfiles] = useState<
    Record<number, ShopShippingProfile[]>
  >({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("FR");

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    visible: boolean;
  }>({ message: "", visible: false });

  const showNotification = (message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const zone = countryToZone(selectedCountry);

  // Redirect si pas connecté
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Charger les infos produits + boutiques + profils livraison
  useEffect(() => {
    if (cartLoading || items.length === 0) {
      setLoadingProducts(false);
      return;
    }

    async function loadData() {
      try {
        // 1. Load products
        const productIds = [...new Set(items.map((i) => i.product_id))];
        const results = await Promise.allSettled(
          productIds.map((id) => productsApi.get(id)),
        );
        const pMap: Record<number, Product> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") pMap[r.value.id] = r.value;
        });
        setProductMap(pMap);

        // 2. Get unique shop IDs
        const shopIds = [
          ...new Set(
            Object.values(pMap)
              .map((p) => p.shop_id)
              .filter(Boolean),
          ),
        ];

        // 3. Load shop info + shipping profiles in parallel
        if (shopIds.length > 0) {
          const [shopResults, shippingResult] = await Promise.allSettled([
            Promise.allSettled(shopIds.map((id) => shopsApi.get(id))),
            shopsApi.getShippingBulk(shopIds),
          ]);

          // Shop info
          const sMap: Record<number, Shop> = {};
          if (shopResults.status === "fulfilled") {
            shopResults.value.forEach((r) => {
              if (r.status === "fulfilled") sMap[r.value.id] = r.value;
            });
          }
          setShopMap(sMap);

          // Shipping profiles
          if (shippingResult.status === "fulfilled") {
            setShippingProfiles(shippingResult.value);
          }
        }
      } catch {
        setError("Erreur lors du chargement des produits");
      } finally {
        setLoadingProducts(false);
      }
    }
    loadData();
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

  // Grouper les items par shop_id
  const shopGroups = useMemo(() => {
    const groups = new Map<number, typeof items>();
    for (const item of items) {
      const product = productMap[item.product_id];
      const shopId = product?.shop_id ?? 0;
      if (!groups.has(shopId)) groups.set(shopId, []);
      groups.get(shopId)!.push(item);
    }
    return groups;
  }, [items, productMap]);

  // Calculs totaux
  const subtotal = items.reduce((sum, item) => {
    const product = productMap[item.product_id];
    if (!product?.price) return sum;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const { totalShipping, hasUnavailableShipping, unavailableShopIds } = useMemo(() => {
    let total = 0;
    let hasUnavailable = false;
    const unavailableIds: number[] = [];
    for (const [shopId, shopItems] of shopGroups) {
      const enriched = shopItems
        .map((i) => ({
          product: productMap[i.product_id],
          quantity: i.quantity,
        }))
        .filter((i) => i.product);
      const cost = computeShopShipping(
        enriched as { product: Product; quantity: number }[],
        shippingProfiles[shopId] || [],
        zone,
      );
      if (cost === null) {
        hasUnavailable = true;
        unavailableIds.push(shopId);
      } else {
        total += cost;
      }
    }
    return { totalShipping: total, hasUnavailableShipping: hasUnavailable, unavailableShopIds: unavailableIds };
  }, [shopGroups, productMap, shippingProfiles, zone]);

  const grandTotal = subtotal + totalShipping;

  const loading = authLoading || cartLoading || loadingProducts;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 font-mono">
        <div className="py-20 text-center">
          <div className="relative inline-flex">
            <div className="h-12 w-12 rounded-full border-2 border-sage-200 border-t-sage-600 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-sage-600 animate-pulse">
            chargement du panier...
          </p>
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
        <div className="flex items-center gap-3 bg-white border-2 border-sage-200 shadow-lg px-4 py-3 min-w-70">
          <div className="shrink-0">
            <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-sage-700" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-stone-700">{notification.message}</p>
          </div>
          <button
            onClick={() =>
              setNotification((prev) => ({ ...prev, visible: false }))
            }
            className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Header */}
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
                {count} article{count > 1 ? "s" : ""} ·{" "}
                {shopGroups.size} boutique{shopGroups.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert className="mb-6 rounded-none border border-red-200 bg-red-50 font-mono">
          <AlertDescription className="text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-linear-to-b from-white to-sage-50/30 rounded-lg border border-sage-200">
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
          {/* Liste des items groupés par boutique */}
          <div className="space-y-6 lg:col-span-2">
            {[...shopGroups.entries()].map(([shopId, shopItems]) => (
              <ShopGroup
                key={shopId}
                shopId={shopId}
                shopInfo={shopMap[shopId] || null}
                items={shopItems}
                productMap={productMap}
                shippingProfiles={shippingProfiles[shopId] || []}
                zone={zone}
                actionLoading={actionLoading}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}

            {/* Actions du panier */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-sage-200">
              <Link
                href="/products"
                className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>ajouter d&apos;autres articles</span>
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
            <div className="sticky top-24 space-y-4">
              {/* Zone de livraison */}
              <div className="border-2 border-sage-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-sage-600" />
                  <h3 className="text-xs uppercase tracking-wider text-sage-700">
                    Livraison vers
                  </h3>
                </div>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-sage-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition-colors focus:border-sage-400"
                >
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="LU">Luxembourg</option>
                  <option value="DE">Allemagne</option>
                  <option value="ES">Espagne</option>
                  <option value="IT">Italie</option>
                  <option value="GB">Royaume-Uni</option>
                  <option value="US">États-Unis</option>
                  <option value="CA">Canada</option>
                  <option value="JP">Japon</option>
                  <option value="AU">Australie</option>
                </select>
                <p className="mt-1 text-xs text-sage-500">
                  Zone :{" "}
                  {zone === "france"
                    ? "France"
                    : zone === "europe"
                      ? "Europe"
                      : "Monde"}
                </p>
              </div>

              {/* Récapitulatif */}
              <div className="border-2 border-sage-200 bg-white p-6">
                <h2 className="mb-4 text-sm uppercase tracking-wider text-sage-700 border-b border-sage-100 pb-2">
                  récapitulatif
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Sous-total articles</span>
                    <span className="font-medium">
                      {subtotal.toFixed(2)} €
                    </span>
                  </div>

                  {/* Frais par boutique */}
                  {[...shopGroups.entries()].map(([shopId, shopItems]) => {
                    const enriched = shopItems
                      .map((i) => ({
                        product: productMap[i.product_id],
                        quantity: i.quantity,
                      }))
                      .filter((i) => i.product) as {
                      product: Product;
                      quantity: number;
                    }[];
                    const shopShipping = computeShopShipping(
                      enriched,
                      shippingProfiles[shopId] || [],
                      zone,
                    );
                    const isUnavailable = shopShipping === null;
                    return (
                      <div
                        key={shopId}
                        className={`flex justify-between text-xs pl-2 ${isUnavailable ? 'text-amber-600' : 'text-stone-500'}`}
                      >
                        <span className="flex items-center gap-1">
                          <Truck size={10} />
                          {shopMap[shopId]?.name || `Boutique #${shopId}`}
                        </span>
                        <span
                          className={
                            isUnavailable
                              ? "font-medium"
                              : shopShipping === 0
                                ? "text-sage-600 font-medium"
                                : ""
                          }
                        >
                          {isUnavailable
                            ? "indisponible"
                            : shopShipping === 0
                              ? "offerte"
                              : `${shopShipping.toFixed(2)} €`}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between text-stone-600">
                    <span className="flex items-center gap-1">
                      <Truck size={12} />
                      Livraison totale
                    </span>
                    {hasUnavailableShipping ? (
                      <span className="text-amber-600 font-medium">—</span>
                    ) : (
                      <span
                        className={
                          totalShipping === 0
                            ? "text-sage-600 font-medium"
                            : "font-medium"
                        }
                      >
                        {totalShipping === 0
                          ? "offerte"
                          : `${totalShipping.toFixed(2)} €`}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-stone-600 border-t border-sage-100 pt-3">
                    <span className="font-medium">Total TTC</span>
                    <span className="text-xl font-light text-sage-800">
                      {grandTotal.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Shipping unavailable warning */}
                {hasUnavailableShipping && (
                  <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 space-y-1">
                    <p className="font-medium flex items-center gap-1">⚠ Livraison indisponible</p>
                    <p>
                      {unavailableShopIds.length === 1 ? "La boutique" : "Les boutiques"}{" "}
                      <strong>
                        {unavailableShopIds
                          .map((id) => shopMap[id]?.name || `#${id}`)
                          .join(", ")}
                      </strong>{" "}
                      {unavailableShopIds.length === 1 ? "ne livre pas" : "ne livrent pas"} dans la zone{" "}
                      <strong>
                        {zone === "france" ? "France" : zone === "europe" ? "Europe" : "Monde"}
                      </strong>.
                      Changez de pays ou retirez ces articles.
                    </p>
                  </div>
                )}

                {/* Checkout tout le panier */}
                {hasUnavailableShipping ? (
                  <button
                    disabled
                    className="mt-6 w-full flex items-center justify-center gap-2 border-2 border-stone-300 bg-stone-200 px-6 py-3 text-sm text-stone-400 cursor-not-allowed"
                  >
                    commander tout le panier
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <Link
                    href={`/checkout?country=${selectedCountry}`}
                    className="mt-6 w-full flex items-center justify-center gap-2 border-2 border-sage-700 bg-sage-700 px-6 py-3 text-sm text-white hover:bg-sage-800 transition-all"
                  >
                    commander tout le panier
                    <ArrowRight size={14} />
                  </Link>
                )}

                {/* Checkout par boutique (si plus d'une boutique) */}
                {shopGroups.size > 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-sage-500 text-center">
                      — ou commander par boutique —
                    </p>
                    {[...shopGroups.entries()].map(([shopId, shopItems]) => {
                      const enriched = shopItems
                        .map((i) => ({
                          product: productMap[i.product_id],
                          quantity: i.quantity,
                        }))
                        .filter((i) => i.product) as {
                        product: Product;
                        quantity: number;
                      }[];
                      const shopSub = enriched.reduce(
                        (s, i) =>
                          s + Number(i.product.price ?? 0) * i.quantity,
                        0,
                      );
                      const shopShip = computeShopShipping(
                        enriched,
                        shippingProfiles[shopId] || [],
                        zone,
                      );
                      const isUnavailable = shopShip === null;
                      return isUnavailable ? (
                        <button
                          key={shopId}
                          disabled
                          className="w-full flex items-center justify-between gap-2 border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-500 cursor-not-allowed"
                        >
                          <span className="flex items-center gap-2">
                            <Store size={12} />
                            {shopMap[shopId]?.name || `Boutique #${shopId}`}
                          </span>
                          <span className="font-medium">indisponible</span>
                        </button>
                      ) : (
                        <Link
                          key={shopId}
                          href={`/checkout?country=${selectedCountry}&shop=${shopId}`}
                          className="w-full flex items-center justify-between gap-2 border border-sage-200 px-4 py-2.5 text-xs text-sage-700 hover:border-sage-400 hover:bg-sage-50 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <Store size={12} />
                            {shopMap[shopId]?.name || `Boutique #${shopId}`}
                          </span>
                          <span className="font-medium">
                            {(shopSub + shopShip).toFixed(2)} €
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <p className="mt-3 text-center text-xs text-stone-400">
                  Paiement sécurisé par Stripe
                </p>

                {/* Garanties */}
                <div className="mt-6 pt-4 border-t border-sage-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-sage-600">
                    <Truck size={14} />
                    <span>Frais de port calculés par boutique</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sage-600">
                    <Shield size={14} />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                </div>
              </div>

              {/* Suggestion */}
              <div className="p-4 bg-sage-50/50 border border-sage-200">
                <p className="text-xs text-sage-700 mb-2 flex items-center gap-3">
                  <Sparkle width={10} /> Vous aimerez aussi
                </p>
                <Link
                  href="/products?category=featured"
                  className="text-sm text-sage-600 hover:text-sage-800 flex items-center justify-between group"
                >
                  <span>Découvrir nos sélections</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
