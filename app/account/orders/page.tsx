"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  orders as ordersApi,
  type Order,
  OrderStatus,
} from "@/lib/api";
import {
  ShoppingBag, Hourglass, Package, ChevronDown,
} from "lucide-react";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: OrderStatus.PENDING, label: "en attente" },
  { value: OrderStatus.CONFIRMED, label: "confirmée" },
  { value: OrderStatus.PREPARING, label: "en préparation" },
  { value: OrderStatus.SHIPPED, label: "expédiée" },
  { value: OrderStatus.DELIVERED, label: "livrée" },
  { value: OrderStatus.CANCELLED, label: "annulée" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-amber-50 text-amber-700 border-amber-200",
  [OrderStatus.CONFIRMED]: "bg-blue-50 text-blue-700 border-blue-200",
  [OrderStatus.PREPARING]: "bg-purple-50 text-purple-700 border-purple-200",
  [OrderStatus.SHIPPED]: "bg-indigo-50 text-indigo-700 border-indigo-200",
  [OrderStatus.DELIVERED]: "bg-green-50 text-green-700 border-green-200",
  [OrderStatus.CANCELLED]: "bg-stone-50 text-stone-500 border-stone-200",
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    ordersApi.my()
      .then(setOrdersList)
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
    } catch { /* ignore */ }
    setCancelLoading(null);
  };

  const filtered = ordersList.filter((o) =>
    statusFilter === "all" || o.status === statusFilter
  );

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric", month: "long", day: "numeric",
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Mes commandes
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — {ordersList.length} commande{ordersList.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter */}
      {ordersList.length > 0 && (
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="appearance-none border border-stone-200 px-3 py-2 pr-8 text-sm text-stone-700 focus:outline-none focus:border-stone-400 bg-white"
            >
              <option value="all">tous les statuts</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Package size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune commande pour le moment</p>
          <p className="text-[10px] mt-1">vos achats apparaîtront ici</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Package size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune commande avec ce statut</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="border border-stone-200">
              {/* Order header */}
              <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-stone-500">
                    #{String(order.id).padStart(4, "0")}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-block border px-2 py-0.5 text-[10px] ${STATUS_COLORS[order.status] || "bg-stone-50 text-stone-500 border-stone-200"}`}>
                    {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-stone-50">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm text-stone-700">
                        Produit #{item.product_id}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {item.quantity} × {Number(item.price).toFixed(2)} €
                      </p>
                    </div>
                    <p className="text-sm text-stone-800">
                      {(Number(item.price) * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                ))}
              </div>

              {/* Order footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50">
                <p className="text-sm font-medium text-stone-800">
                  Total : {Number(order.total).toFixed(2)} €
                </p>
                {order.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={cancelLoading === order.id}
                    className="border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
