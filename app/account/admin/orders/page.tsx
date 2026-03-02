"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  orders as ordersApi,
  type Order,
  OrderStatus,
} from "@/lib/api";
import {
  ShoppingBag, Hourglass, Search, ChevronDown,
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

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadOrders();
  }, [user]);

  const loadOrders = () => {
    setLoading(true);
    ordersApi.list()
      .then(setOrdersList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const filtered = ordersList.filter((o) => {
    const matchSearch = !search || String(o.id).includes(search) || String(o.user_id).includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const pendingCount = ordersList.filter((o) => o.status === OrderStatus.PENDING).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Commandes
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — {ordersList.length} commande{ordersList.length > 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="text-amber-600"> · {pendingCount} en attente</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="rechercher par n° commande ou user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-stone-200 pl-9 pr-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
          />
        </div>
        <div className="relative">
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

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <ShoppingBag size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune commande trouvée</p>
        </div>
      ) : (
        <div className="border border-stone-200 divide-y divide-stone-100">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
            <span>n°</span>
            <span>détails</span>
            <span>total</span>
            <span>statut</span>
          </div>

          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto] gap-2 md:gap-4 px-4 py-3 md:items-center"
            >
              {/* Order number */}
              <span className="text-sm font-mono text-stone-500">
                #{String(order.id).padStart(4, "0")}
              </span>

              {/* Details */}
              <div className="min-w-0">
                <p className="text-sm text-stone-700">
                  {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? "s" : ""}
                  <span className="text-stone-400"> · user #{order.user_id}</span>
                </p>
                <p className="text-[10px] text-stone-400">
                  {formatDate(order.created_at)}
                </p>
              </div>

              {/* Total */}
              <p className="text-sm font-medium text-stone-800">
                {Number(order.total).toFixed(2)} €
              </p>

              {/* Current status */}
              <span className={`inline-block border px-2 py-0.5 text-[10px] text-center ${STATUS_COLORS[order.status] || "bg-stone-50 text-stone-500 border-stone-200"}`}>
                {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
