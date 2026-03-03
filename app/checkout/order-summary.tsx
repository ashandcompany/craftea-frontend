import { Package, Store, Truck } from "lucide-react";
import { type Product, type Shop, type ShopShippingProfile } from "@/lib/api";
import { type ShippingZone } from "@/lib/api";
import { assetUrl } from "@/lib/utils";

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
  ) => number;
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
}: OrderSummaryProps) {
  // Group items by shop
  const shopGroups = new Map<number, CartItem[]>();
  for (const item of items) {
    const product = productMap[item.product_id];
    const shopId = product?.shop_id ?? 0;
    if (!shopGroups.has(shopId)) shopGroups.set(shopId, []);
    shopGroups.get(shopId)!.push(item);
  }

  return (
    <div className="border-2 border-sage-200 bg-white p-6 sticky top-24">
      <h2 className="mb-4 text-sm uppercase tracking-wider text-sage-700 border-b border-sage-100 pb-2">
        récapitulatif
      </h2>

      {/* Items grouped by shop */}
      <div className="space-y-4 mb-4">
        {[...shopGroups.entries()].map(([shopId, shopItems]) => (
          <div key={shopId}>
            {/* Shop name */}
            <div className="flex items-center gap-2 mb-2">
              <Store size={12} className="text-sage-500" />
              <span className="text-xs font-medium text-sage-700">
                {shopMap[shopId]?.name || `Boutique #${shopId}`}
              </span>
            </div>

            {/* Shop items */}
            {shopItems.map((item) => {
              const product = productMap[item.product_id];
              const image = product?.images?.[0]?.image_url;
              return (
                <div key={item.id} className="flex gap-3 items-center mb-2">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-700 truncate">
                      {product?.title || `Produit #${item.product_id}`}
                    </p>
                    <p className="text-xs text-sage-500">
                      x{item.quantity}
                    </p>
                  </div>
                  {product?.price != null && (
                    <span className="text-xs font-medium text-stone-700 shrink-0">
                      {(Number(product.price) * item.quantity).toFixed(2)} €
                    </span>
                  )}
                </div>
              );
            })}

            {/* Shop shipping */}
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
              return (
                <div className="flex justify-between text-xs text-stone-500 pl-2 mt-1">
                  <span className="flex items-center gap-1">
                    <Truck size={10} />
                    Livraison
                  </span>
                  <span
                    className={
                      shopShip === 0 ? "text-sage-600 font-medium" : ""
                    }
                  >
                    {shopShip === 0
                      ? "offerte"
                      : `${shopShip.toFixed(2)} €`}
                  </span>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      <div className="border-t border-sage-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Sous-total</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span className="flex items-center gap-1">
            <Truck size={12} />
            Livraison
          </span>
          <span
            className={
              totalShipping === 0
                ? "text-xs text-sage-600 font-medium"
                : "text-xs"
            }
          >
            {totalShipping === 0
              ? "offerte"
              : `${totalShipping.toFixed(2)} €`}
          </span>
        </div>
        <div className="flex justify-between text-stone-800 font-medium border-t border-sage-100 pt-2">
          <span>Total TTC</span>
          <span className="text-lg font-light text-sage-800">
            {grandTotal.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
}
