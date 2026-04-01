"use client";

import { useEffect, useState } from "react";
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
  Hourglass,
  Package,
  ChevronDown,
  User,
  Calendar,
  Truck,
  AlertTriangle,
  Check,
  Loader2,
  X,
  ArrowRight,
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

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<number, OrderStatus>>({});
  const [productMap, setProductMap] = useState<Record<number, { title: string; imageUrl: string }>>({})

  useEffect(() => {
    if (!user) return;
    ordersApi
      .my()
      .then(async (fetchedOrders) => {
        setOrdersList(fetchedOrders);
        const uniqueIds = [...new Set(fetchedOrders.flatMap((o) => o.items.map((i) => i.product_id)))];
        const entries = await Promise.all(
          uniqueIds.map((id) =>
            productsApi.get(id)
              .then((p) => [id, { title: p.title ?? `Produit #${id}`, imageUrl: assetUrl(p.images?.[0]?.image_url, "product-images") }] as const)
              .catch(() => [id, { title: `Produit #${id}`, imageUrl: "" }] as const)
          )
        );
        setProductMap(Object.fromEntries(entries));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleCancel = async (order: Order) => {
    if (!confirm("Annuler cette commande ?")) return;
    setCancelLoading(order.id);
    try {
      const updated = await ordersApi.updateStatus(order.id, OrderStatus.CANCELLED);
      setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      /* ignore */
    }
    setCancelLoading(null);
  };

  const filtered = ordersList.filter((o) => statusFilter === "all" || o.status === statusFilter);

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

  const getOrderStats = () => {
    const total = ordersList.length;
    const pending = ordersList.filter((o) => o.status === OrderStatus.PENDING).length;
    const delivered = ordersList.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const totalSpent = ordersList
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + Number(o.total), 0);
    return { total, pending, delivered, totalSpent };
  };

  const stats = getOrderStats();

  return (
    <div className="font-mono">
      {/* Header */}
      <AccountPageHeader icon={ShoppingBag} title="> MES COMMANDES">
        <div className="flex items-center gap-4 text-sm text-stone-500 mt-2">
          <p className="flex items-center gap-1.5">
            <span className="text-sage-600">[</span>
            {stats.total} commande{stats.total > 1 ? "s" : ""}
            <span className="text-sage-600">]</span>
          </p>
          {stats.pending > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              {stats.pending} en attente
            </p>
          )}
          {stats.delivered > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Check size={12} strokeWidth={1.5} />
              {stats.delivered} livrée{stats.delivered > 1 ? "s" : ""}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-sage-600 ml-auto">
            total dépensé : {stats.totalSpent.toFixed(2)} €
          </p>
        </div>
      </AccountPageHeader>

      {/* Filter */}
      {ordersList.length > 0 && (
        <div className="mb-6">
          <div className="relative inline-block">
            <label className="text-[10px] text-stone-400 uppercase tracking-wider mr-2">
              [ filtre ]
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="appearance-none border-2 border-sage-200 bg-white px-3 py-2 pr-8 text-xs font-mono text-stone-600 
                         focus:outline-none focus:border-sage-400 transition-colors hover:border-sage-300"
            >
              <option value="all">tous les statuts</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 border-2 border-sage-200 bg-white p-8">
          <div className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-sage-500" strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-wide">chargement...</span>
          </div>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="py-16 text-center border-2 border-sage-200 bg-white p-8">
          <Package size={32} className="mx-auto mb-4 text-sage-300" strokeWidth={1.5} />
          <p className="text-sm font-mono text-stone-500">[ aucune commande ]</p>
          <p className="text-[10px] font-mono text-stone-400 mt-2">vos achats apparaîtront ici</p>
          <div className="mt-4 text-sage-300 text-[10px]">⏎</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-sage-200 bg-white p-8">
          <Package size={32} className="mx-auto mb-4 text-sage-300" strokeWidth={1.5} />
          <p className="text-sm font-mono text-stone-500">[ aucun résultat ]</p>
          <p className="text-[10px] font-mono text-stone-400 mt-2">aucune commande avec ce statut</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className={`border-2 font-mono transition-all duration-200 relative ${
                order.status === OrderStatus.PENDING
                  ? "border-amber-200 bg-amber-50/10"
                  : "border-sage-200 bg-white"
              }`}
            >
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-sage-100 bg-sage-50/30">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-mono text-stone-600 tracking-wide">
                    #{String(order.id).padStart(4, "0")}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Calendar size={10} strokeWidth={1.5} />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Hourglass size={10} strokeWidth={1.5} />
                    <span>{formatTime(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                      STATUS_COLORS[order.status] || "border-stone-200 bg-stone-100 text-stone-600"
                    }`}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                  </span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-1 text-[10px] font-mono text-stone-400 hover:text-sage-700 border border-sage-200 hover:border-sage-400 px-2 py-0.5 transition-colors"
                  >
                    voir
                    <ArrowRight size={10} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-sage-50">
                {order.items?.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-sage-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 shrink-0 border border-sage-100 bg-stone-50 overflow-hidden">
                        {productMap[item.product_id]?.imageUrl ? (
                          <img
                            src={productMap[item.product_id].imageUrl}
                            alt={productMap[item.product_id].title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={14} className="text-stone-300" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700 font-mono truncate">
                          {productMap[item.product_id]?.title || `Produit #${item.product_id}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-stone-400 font-mono border border-sage-100 px-1.5 py-0.5">
                            x{item.quantity}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {Number(item.price).toFixed(2)} €/u
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-mono text-stone-800 ml-4 shrink-0">
                      {(Number(item.price) * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                ))}
              </div>

              {/* Order footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t-2 border-sage-100 bg-sage-50/20">
                <div className="flex flex-col gap-1">
                  {Number(order.shipping_total) > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                      <Truck size={11} strokeWidth={1.5} />
                      <span className="font-mono">
                        dont {Number(order.shipping_total).toFixed(2)} € de frais de port
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-mono text-stone-500">Total TTC :</span>
                    <span className="text-base font-mono font-medium text-sage-800">
                      {Number(order.total).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {order.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={cancelLoading === order.id}
                    className="group flex items-center gap-1.5 border-2 border-red-200 px-3 py-1.5 text-xs font-mono 
                               text-red-600 hover:border-red-300 hover:bg-red-50 
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {cancelLoading === order.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <X size={12} strokeWidth={1.5} />
                        <span className="uppercase tracking-wider">annuler</span>
                      </>
                    )}
                  </button>
                )}

                {order.status === OrderStatus.DELIVERED && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 border border-emerald-200 px-2 py-1">
                    <Check size={10} strokeWidth={2} />
                    <span className="font-mono">commande livrée</span>
                  </div>
                )}

                {order.status === OrderStatus.SHIPPED && (
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
                    <Truck size={10} strokeWidth={1.5} />
                    <span className="font-mono">en cours de livraison</span>
                  </div>
                )}
              </div>

              {/* Effet machine à écrire pour les commandes en attente */}
              {order.status === OrderStatus.PENDING && (
                <div className="absolute right-3 bottom-2 text-[8px] text-amber-300 select-none pointer-events-none">
                  ⏎
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}