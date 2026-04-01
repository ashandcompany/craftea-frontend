"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  orders as ordersApi,
  products as productsApi,
  type Order,
  OrderStatus,
} from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import {
  ShoppingBag,
  Package,
  Calendar,
  Truck,
  Check,
  Loader2,
  X,
  AlertTriangle,
  Hourglass,
  Hash,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import Link from "next/link";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: OrderStatus.PENDING, label: "en attente" },
  { value: OrderStatus.CONFIRMED, label: "confirmée" },
  { value: OrderStatus.PREPARING, label: "en préparation" },
  { value: OrderStatus.SHIPPED, label: "expédiée" },
  { value: OrderStatus.DELIVERED, label: "livrée" },
  { value: OrderStatus.CANCELLED, label: "annulée" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "border-amber-300 bg-amber-100 text-amber-700",
  [OrderStatus.CONFIRMED]: "border-sage-300 bg-sage-100 text-sage-700",
  [OrderStatus.PREPARING]: "border-purple-300 bg-purple-100 text-purple-700",
  [OrderStatus.SHIPPED]: "border-blue-300 bg-blue-100 text-blue-700",
  [OrderStatus.DELIVERED]: "border-emerald-300 bg-emerald-100 text-emerald-700",
  [OrderStatus.CANCELLED]: "border-stone-200 bg-stone-100 text-stone-500",
};

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: OrderStatus.PENDING, label: "Commande reçue" },
  { status: OrderStatus.CONFIRMED, label: "Confirmée" },
  { status: OrderStatus.PREPARING, label: "En préparation" },
  { status: OrderStatus.SHIPPED, label: "Expédiée" },
  { status: OrderStatus.DELIVERED, label: "Livrée" },
];

const STATUS_ORDER = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export default function OrderDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [productMap, setProductMap] = useState<
    Record<number, { title: string; imageUrl: string; slug?: string }>
  >({});

  useEffect(() => {
    if (!user || !orderId) return;
    ordersApi
      .get(orderId)
      .then(async (fetchedOrder) => {
        setOrder(fetchedOrder);
        const uniqueIds = [...new Set(fetchedOrder.items.map((i) => i.product_id))];
        const entries = await Promise.all(
          uniqueIds.map((id) =>
            productsApi
              .get(id)
              .then(
                (p) =>
                  [
                    id,
                    {
                      title: p.title ?? `Produit #${id}`,
                      imageUrl: assetUrl(p.images?.[0]?.image_url, "product-images"),
                      slug: p.slug,
                    },
                  ] as const
              )
              .catch(() => [id, { title: `Produit #${id}`, imageUrl: "", slug: undefined }] as const)
          )
        );
        setProductMap(Object.fromEntries(entries));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [user, orderId]);

  if (!user) return null;

  const handleCancel = async () => {
    if (!order || !confirm("Annuler cette commande ?")) return;
    setCancelLoading(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, OrderStatus.CANCELLED);
      setOrder(updated);
    } catch {
      /* ignore */
    }
    setCancelLoading(false);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const currentStepIndex = order ? STATUS_ORDER.indexOf(order.status) : -1;
  const isCancelled = order?.status === OrderStatus.CANCELLED;

  return (
    <div className="font-mono">
      <AccountPageHeader
        icon={ShoppingBag}
        title={
          order
            ? `> COMMANDE #${String(order.id).padStart(4, "0")}`
            : "> DÉTAIL COMMANDE"
        }
        backHref="/account/orders"
        backLabel="retour aux commandes"
      >
        {order && (
          <div className="flex items-center gap-4 text-sm text-stone-500 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
              <Calendar size={10} strokeWidth={1.5} />
              {formatDate(order.created_at)} à {formatTime(order.created_at)}
            </span>
            <span
              className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                STATUS_COLORS[order.status] || "border-stone-200 bg-stone-100 text-stone-600"
              }`}
            >
              {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
            </span>
          </div>
        )}
      </AccountPageHeader>

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center border-2 border-sage-200 bg-white">
          <div className="inline-flex items-center gap-2 text-stone-400">
            <Loader2 size={16} className="animate-spin text-sage-500" strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-wide">chargement...</span>
          </div>
        </div>
      )}

      {/* Not found */}
      {!loading && notFound && (
        <div className="py-20 text-center border-2 border-sage-200 bg-white p-8">
          <Package size={32} className="mx-auto mb-4 text-sage-300" strokeWidth={1.5} />
          <p className="text-sm font-mono text-stone-500">[ commande introuvable ]</p>
          <p className="text-[10px] font-mono text-stone-400 mt-2">
            cette commande n'existe pas ou ne vous appartient pas
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && order && (
        <div className="space-y-6">

          {/* Timeline */}
          {!isCancelled && (
            <div className="border-2 border-sage-200 bg-white p-5">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-4">
                [ suivi de commande ]
              </p>
              <div className="flex items-start gap-0">
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  const isLast = index === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step.status} className="flex-1 flex flex-col items-center relative">
                      {/* Line before */}
                      {index > 0 && (
                        <div
                          className={`absolute top-3 right-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-300 ${
                            isCompleted ? "bg-sage-400" : "bg-sage-100"
                          }`}
                        />
                      )}
                      {/* Dot */}
                      <div
                        className={`relative z-10 w-6 h-6 flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? isCurrent
                              ? "border-sage-500 bg-sage-500"
                              : "border-sage-400 bg-sage-400"
                            : "border-sage-200 bg-white"
                        }`}
                      >
                        {isCompleted && (
                          <Check size={10} strokeWidth={2.5} className="text-white" />
                        )}
                      </div>
                      {/* Label */}
                      <p
                        className={`mt-2 text-center text-[9px] leading-tight font-mono px-1 ${
                          isCurrent
                            ? "text-sage-700 font-medium"
                            : isCompleted
                            ? "text-stone-500"
                            : "text-stone-300"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="border-2 border-stone-200 bg-stone-50 p-4 flex items-center gap-3">
              <X size={16} strokeWidth={1.5} className="text-stone-400 shrink-0" />
              <p className="text-xs font-mono text-stone-500">
                cette commande a été annulée
              </p>
            </div>
          )}

          {/* Items */}
          <div className="border-2 border-sage-200 bg-white">
            <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/30">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                [ articles ({order.items.length}) ]
              </p>
            </div>
            <div className="divide-y divide-sage-50">
              {order.items.map((item) => {
                const product = productMap[item.product_id];
                const itemTotal = Number(item.price) * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-4 gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 shrink-0 border border-sage-100 bg-stone-50 overflow-hidden">
                        {product?.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-stone-300" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {product?.slug ? (
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-sm font-mono text-stone-800 hover:text-sage-700 hover:underline underline-offset-2 truncate block"
                          >
                            {product.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-mono text-stone-800 truncate">
                            {product?.title || `Produit #${item.product_id}`}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[10px] text-stone-400 border border-sage-100 px-1.5 py-0.5">
                            x{item.quantity}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {Number(item.price).toFixed(2)} € / unité
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm font-mono font-medium text-stone-800 shrink-0">
                      {itemTotal.toFixed(2)} €
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="border-2 border-sage-200 bg-white">
            <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/30">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                [ récapitulatif ]
              </p>
            </div>
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                <span>Sous-total articles</span>
                <span>
                  {(Number(order.total) - Number(order.shipping_total)).toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Truck size={11} strokeWidth={1.5} />
                  Frais de port
                  {order.shipping_zone && (
                    <span className="text-[10px] text-stone-400 border border-sage-100 px-1.5 py-0.5 ml-1">
                      {order.shipping_zone}
                    </span>
                  )}
                </span>
                <span>
                  {Number(order.shipping_total) === 0
                    ? "offerts"
                    : `${Number(order.shipping_total).toFixed(2)} €`}
                </span>
              </div>
              <div className="border-t border-sage-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-mono text-stone-700 font-medium">Total TTC</span>
                <span className="text-lg font-mono font-medium text-sage-800">
                  {Number(order.total).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {order.status === OrderStatus.PENDING && (
            <div className="flex justify-end">
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="group flex items-center gap-1.5 border-2 border-red-200 px-4 py-2 text-xs font-mono 
                           text-red-600 hover:border-red-300 hover:bg-red-50 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {cancelLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <X size={12} strokeWidth={1.5} />
                    <span className="uppercase tracking-wider">annuler la commande</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
