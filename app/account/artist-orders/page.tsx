"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  orders as ordersApi,
  products as productsApi,
  type Order,
  OrderStatus,
} from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { User, Calendar, Package, Truck, AlertTriangle, Check, Loader2, ChevronDown, Search, Hourglass } from "lucide-react";

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

// Statuts que l'artiste peut définir (workflow de traitement)
const ARTIST_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export default function ArtistOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<number, OrderStatus>>({});
  const [productMap, setProductMap] = useState<Record<number, { title: string; imageUrl: string }>>({});

  useEffect(() => {
    if (!user || user.role !== "artist") return;
    loadOrders();
  }, [user]);

  const loadOrders = () => {
    setLoading(true);
    ordersApi.artistOrders()
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
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== "artist") {
    router.push("/account");
    return null;
  }

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    setActionLoading(order.id);
    try {
      const updated = await ordersApi.updateStatus(order.id, newStatus);
      setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedStatus((prev) => {
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
      });
    } catch { /* ignore */ }
    setActionLoading(null);
  };

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
          <Truck size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Commandes reçues
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — {ordersList.length} commande{ordersList.length > 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="text-amber-600"> · {pendingCount} en attente de confirmation</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="rechercher par n° commande..."
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
      ) : ordersList.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Package size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune commande reçue pour le moment</p>
          <p className="text-[10px] mt-1">les commandes de vos clients apparaîtront ici</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Package size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune commande trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className={`border-2 font-mono transition-all duration-200 ${order.status === OrderStatus.PENDING
                  ? "border-amber-200 bg-amber-50/10"
                  : "border-sage-200 bg-white"
                }`}
            >
              {/* Order header - style machine à écrire */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-sage-100 bg-sage-50/30">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-mono text-stone-600 tracking-wide">
                    #{String(order.id).padStart(4, "0")}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <User size={10} strokeWidth={1.5} />
                    <span>client #{order.user_id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Calendar size={10} strokeWidth={1.5} />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${order.status === OrderStatus.PENDING
                      ? "border-amber-300 bg-amber-100 text-amber-700"
                      : order.status === OrderStatus.CONFIRMED
                        ? "border-sage-300 bg-sage-100 text-sage-700"
                        : order.status === OrderStatus.SHIPPED
                          ? "border-blue-300 bg-blue-100 text-blue-700"
                          : order.status === OrderStatus.DELIVERED
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                            : order.status === OrderStatus.CANCELLED
                              ? "border-red-300 bg-red-100 text-red-700"
                              : "border-stone-200 bg-stone-100 text-stone-600"
                    }`}>
                    {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                  </span>
                </div>
              </div>

              {/* Items - style terminal */}
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

              {/* Order footer - style machine à écrire */}
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

                  <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                    <AlertTriangle size={10} strokeWidth={1.5} />
                    <span className="font-mono">
                      − commission site (7,5 %) : {(Number(order.total) * 0.075).toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono">
                    <Check size={10} strokeWidth={2} />
                    <span className="font-medium">
                      votre part : {(Number(order.total) * 0.925).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-stone-400 font-mono tracking-wide">
                      [ statut ]
                    </span>
                    <div className="relative">
                      <select
                        value={selectedStatus[order.id] || order.status}
                        onChange={(e) => setSelectedStatus((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))}
                        disabled={actionLoading === order.id}
                        className="appearance-none border-2 border-sage-200 bg-white px-2 py-1.5 pr-6 text-xs font-mono text-stone-600 
                           disabled:opacity-50 focus:outline-none focus:border-sage-400 transition-colors
                           hover:border-sage-300"
                      >
                        {ARTIST_STATUS_FLOW.map((s) => (
                          <option key={s} value={s} className="font-mono">
                            {STATUS_OPTIONS.find((o) => o.value === s)?.label || s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => handleStatusChange(order, selectedStatus[order.id] || order.status)}
                      disabled={actionLoading === order.id || (selectedStatus[order.id] || order.status) === order.status}
                      className="group border-2 border-sage-200 px-3 py-1.5 text-xs font-mono text-stone-600 
                         hover:border-sage-400 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200"
                    >
                      {actionLoading === order.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <span className="uppercase tracking-wider">confirmer</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Effet machine à écrire */}
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
