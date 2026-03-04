import { Package, Store, Truck, ChevronDown, ChevronUp, Clock, Shield } from "lucide-react";
import { type Product, type Shop, type ShopShippingProfile } from "@/lib/api";
import { type ShippingZone } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { useState } from "react";

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  productMap: Record<number, Product>;
  shopMap: Record<number, Shop>;
  shippingProfiles: Record<number, ShopShippingProfile[]>;
  subtotal: number;
  totalShipping: number;
  grandTotal: number;
  zone: ShippingZone;
  computeShopShipping: (
    enriched: { product: Product; quantity: number }[],
    profiles: ShopShippingProfile[],
    zone: ShippingZone,
  ) => number | null;
  isCheckoutStep?: boolean;
}

export function OrderSummary({
  items,
  productMap,
  shopMap,
  shippingProfiles,
  subtotal,
  totalShipping,
  grandTotal,
  zone,
  computeShopShipping,
  isCheckoutStep = false,
}: OrderSummaryProps) {
  const [expandedShops, setExpandedShops] = useState<Set<number>>(new Set());
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  // Group items by shop
  const shopGroups = new Map<number, CartItem[]>();
  for (const item of items) {
    const product = productMap[item.product_id];
    const shopId = product?.shop_id ?? 0;
    if (!shopGroups.has(shopId)) shopGroups.set(shopId, []);
    shopGroups.get(shopId)!.push(item);
  }

  const toggleShop = (shopId: number) => {
    setExpandedShops(prev => {
      const next = new Set(prev);
      if (next.has(shopId)) {
        next.delete(shopId);
      } else {
        next.add(shopId);
      }
      return next;
    });
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const uniqueShops = shopGroups.size;

  // Zone labels
  const zoneLabels = {
    france: "France",
    europe: "Europe",
    world: "Monde",
  };

  // Estimation de livraison (simulée)
  const getDeliveryEstimate = (zone: ShippingZone) => {
    const estimates = {
      france: "24-48h",
      europe: "3-5 jours",
      world: "7-10 jours",
    };
    return estimates[zone] || "5-7 jours";
  };

  return (
    <div 
      className={`
        border border-sage-200 bg-white p-6 font-mono
        ${isCheckoutStep ? "sticky top-24" : ""}
        transition-all duration-300
      `}
    >
      {/* Header avec effet machine à écrire */}
      <div 
        className="flex items-center justify-between mb-4 pb-3 border-b border-sage-200 cursor-pointer"
        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
      >
        <div className="flex items-center gap-2">
          <Package size={18} className="text-sage-600" strokeWidth={1.5} />
          <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
            RÉCAPITULATIF
          </h2>
          <span className="text-xs text-sage-500 ml-2">
            [{totalItems} article{totalItems > 1 ? "s" : ""}]
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-sage-500">
            {uniqueShops} boutique{uniqueShops > 1 ? "s" : ""}
          </span>
          {isSummaryExpanded ? (
            <ChevronUp size={14} className="text-sage-400" />
          ) : (
            <ChevronDown size={14} className="text-sage-400" />
          )}
        </div>
      </div>

      {/* Contenu pliable */}
      {isSummaryExpanded && (
        <>
          {/* Items grouped by shop */}
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {[...shopGroups.entries()].map(([shopId, shopItems]) => {
              const isExpanded = expandedShops.has(shopId);
              const shopItemCount = shopItems.reduce((acc, item) => acc + item.quantity, 0);
              
              return (
                <div 
                  key={shopId} 
                  className="border border-sage-100 bg-white overflow-hidden"
                >
                  {/* Shop header - toujours visible */}
                  <div 
                    className="flex items-center justify-between p-3 bg-sage-50/30 cursor-pointer hover:bg-sage-50 transition-colors border-b border-sage-100"
                    onClick={() => toggleShop(shopId)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Store size={14} className="text-sage-500 shrink-0" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-sage-700 truncate">
                        {shopMap[shopId]?.name || `Boutique #${shopId}`}
                      </span>
                      <span className="text-[10px] text-sage-400 ml-1">
                        ({shopItemCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Shipping badge */}
                      {(() => {
                        const enriched = shopItems
                          .map((i) => ({
                            product: productMap[i.product_id],
                            quantity: i.quantity,
                          }))
                          .filter((i) => i.product) as {
                          product: Product;
                          quantity: number;
                        }[];
                        const shopShip = computeShopShipping(
                          enriched,
                          shippingProfiles[shopId] || [],
                          zone,
                        );
                        const isUnavailable = shopShip === null;
                        return (
                          <span className={`text-[10px] px-2 py-0.5 border ${
                            isUnavailable
                              ? "border-amber-200 bg-amber-50 text-amber-600"
                              : shopShip === 0 
                                ? "border-sage-200 bg-sage-100 text-sage-700" 
                                : "border-sage-100 text-sage-600"
                          }`}>
                            {(() => {
                              const shopTotal = shopItems.reduce((acc, item) => {
                                const product = productMap[item.product_id];
                                return acc + (Number(product?.price || 0) * item.quantity);
                              }, 0);
                              return `${shopTotal.toFixed(2)} €`;
                            })()}
                          </span>
                        );
                      })()}
                      {isExpanded ? (
                        <ChevronUp size={12} className="text-sage-400" />
                      ) : (
                        <ChevronDown size={12} className="text-sage-400" />
                      )}
                    </div>
                  </div>

                  {/* Shop items - expandable */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-white">
                      {shopItems.map((item) => {
                        const product = productMap[item.product_id];
                        const image = product?.images?.[0]?.image_url;
                        return (
                          <div key={item.id} className="flex gap-3 items-center">
                            {/* Image produit */}
                            <div className="h-12 w-12 shrink-0 border border-sage-200 bg-sage-50 overflow-hidden">
                              {image ? (
                                <img
                                  src={assetUrl(image, "product-images")}
                                  alt={product?.title || ""}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sage-300">
                                  <Package size={16} strokeWidth={1} />
                                </div>
                              )}
                            </div>
                            
                            {/* Détails produit */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-stone-700 truncate font-mono">
                                {product?.title || `Produit #${item.product_id}`}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-sage-500 border border-sage-100 px-1.5 py-0.5">
                                  x{item.quantity}
                                </span>
                              </div>
                            </div>
                            
                            {/* Prix */}
                            {product?.price != null && (
                              <div className="text-right shrink-0">
                                <span className="text-xs font-medium text-stone-700 block">
                                  {(Number(product.price) * item.quantity).toFixed(2)} €
                                </span>
                                <span className="text-[9px] text-stone-400">
                                  {Number(product.price).toFixed(2)} €/u
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zone de livraison */}
          <div className="mb-4 p-3 border border-sage-100 bg-sage-50/30 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-sage-700">
                <Truck size={12} strokeWidth={1.5} />
                Zone de livraison
              </span>
              <code className="bg-white px-2 py-0.5 border border-sage-200 text-sage-700 text-[10px]">
                {zoneLabels[zone]}
              </code>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-500">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Estimation
              </span>
              <span>{getDeliveryEstimate(zone)}</span>
            </div>
          </div>

          {/* Totaux */}
          <div className="border-t-2 border-sage-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600 text-xs">
              <span className="font-mono">Sous-total</span>
              <span className="font-mono">{subtotal.toFixed(2)} €</span>
            </div>
            
            <div className="flex justify-between text-stone-600 text-xs">
              <span className="flex items-center gap-1 font-mono">
                <Truck size={10} strokeWidth={1.5} />
                Livraison totale
              </span>
              <span className={`font-mono ${
                totalShipping === 0 ? "text-sage-600" : ""
              }`}>
                {totalShipping === 0
                  ? "OFFERTE"
                  : `${totalShipping.toFixed(2)} €`}
              </span>
            </div>

            {/* Économies si livraison offerte */}
            {totalShipping === 0 && subtotal > 0 && (
              <div className="flex justify-between text-[10px] text-sage-600 bg-sage-50 p-2 border border-sage-200">
                <span className="flex items-center gap-1">
                  <Shield size={10} />
                  Économies
                </span>
                <span className="font-mono">- {totalShipping.toFixed(2)} €</span>
              </div>
            )}

            {/* Total général avec effet machine à écrire */}
            <div className="flex justify-between items-center border-t-2 border-sage-200 pt-3 mt-2">
              <span className="text-sm font-mono text-stone-700">
                TOTAL TTC
              </span>
              <div className="text-right">
                <span className="text-xl font-light text-sage-800 font-mono">
                  {grandTotal.toFixed(2)} €
                </span>
                <span className="text-[9px] text-stone-400 block">
                  TVA incluse
                </span>
              </div>
            </div>
          </div>

          {/* Pied de page machine à écrire */}
          <div className="mt-4 pt-2 flex items-center gap-2 text-[9px] text-sage-400 border-t border-sage-100">
            <span>{"///"}</span>
            <span className="font-mono">Commande sécurisée</span>
            <span className="flex-1 text-right">⏎</span>
          </div>
        </>
      )}

      {/* Version réduite */}
      {!isSummaryExpanded && (
        <div className="py-2 text-center text-xs text-sage-600 font-mono border-t border-sage-100">
          <span className="block">
            {totalItems} article{totalItems > 1 ? "s" : ""} · {grandTotal.toFixed(2)} € TTC
          </span>
          <span className="text-[9px] text-sage-400 mt-1 block">
            Cliquer pour développer
          </span>
        </div>
      )}

      {/* Style personnalisé pour la scrollbar */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f3ef;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5c0;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9aa88f;
        }
      `}</style>
    </div>
  );
}