"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  users as usersApi,
  artists as artistsApi,
  orders as ordersApi,
  categories as categoriesApi,
  tags as tagsApi,
  artistRequests as artistRequestsApi,
  type User,
  type ArtistProfile,
  type Order,
  type Category,
  type Tag,
  type ArtistRequest,
  OrderStatus,
} from "@/lib/api";
import { COMMISSION } from "@/lib/utils";
import {
  Users, Palette, ShoppingBag, FolderOpen, Tag as TagIcon,
  ArrowRight, Hourglass, Shield, AlertTriangle,
  Clock, Wallet, MessageSquare, TrendingUp,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [artistsList, setArtistsList] = useState<ArtistProfile[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [artistRequestsList, setArtistRequestsList] = useState<ArtistRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    Promise.allSettled([
      usersApi.list().then(setUsersList).catch(() => {}),
      artistsApi.adminListAll().then(setArtistsList).catch(() => {}),
      ordersApi.list().then(setOrdersList).catch(() => {}),
      categoriesApi.list().then(setCategoriesList).catch(() => {}),
      tagsApi.list().then(setTagsList).catch(() => {}),
      artistRequestsApi.adminList().then(setArtistRequestsList).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (user.role !== "admin") {
    router.push("/account");
    return null;
  }

  // ── Derived operational counters ──────────────────────────────────────────
  const pendingArtists = artistsList.filter((a) => !a.validated).length;
  const pendingOrders = ordersList.filter((o) => o.status === OrderStatus.PENDING).length;
  const inactiveUsers = usersList.filter((u) => !u.is_active).length;
  const pendingRequests = artistRequestsList.filter((r) => r.status === "pending" || r.status === "info_requested").length;

  // ── KPI computations ──────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeOrders = ordersList.filter((o) => o.status !== OrderStatus.CANCELLED);
  const monthOrders = activeOrders.filter((o) => new Date(o.created_at) >= monthStart);

  const gmvMonth = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const commissionMonth = monthOrders.reduce(
    (sum, o) => sum + Number(o.total) * COMMISSION.RATE + COMMISSION.FIXED_EUR,
    0,
  );
  const panierMoyen =
    activeOrders.length > 0
      ? activeOrders.reduce((sum, o) => sum + Number(o.total), 0) / activeOrders.length
      : 0;

  const artistesVerifies = artistsList.filter((a) => a.validated).length;

  const approvedRequests = artistRequestsList.filter((r) => r.status === "approved");
  const avgDelayHours =
    approvedRequests.length > 0
      ? approvedRequests.reduce((sum, r) => {
          return (
            sum +
            (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) /
              (1000 * 60 * 60)
          );
        }, 0) / approvedRequests.length
      : null;

  const formatDelay = (hours: number) =>
    hours < 24 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} j`;

  // ── Stats grid ────────────────────────────────────────────────────────────
  const stats = [
    { label: "utilisateurs", value: usersList.length, icon: Users, href: "/account/admin/users", accent: inactiveUsers > 0 ? `${inactiveUsers} inactif${inactiveUsers > 1 ? "s" : ""}` : undefined },
    { label: "candidatures", value: artistRequestsList.length, icon: MessageSquare, href: "/account/admin/artist-requests", accent: pendingRequests > 0 ? `${pendingRequests} en attente` : undefined },
    { label: "artistes", value: artistsList.length, icon: Palette, href: "/account/admin/artists", accent: pendingArtists > 0 ? `${pendingArtists} en attente` : undefined },
    { label: "wallets", value: artistsList.length, icon: Wallet, href: "/account/admin/wallets" },
    { label: "commandes", value: ordersList.length, icon: ShoppingBag, href: "/account/admin/orders", accent: pendingOrders > 0 ? `${pendingOrders} en attente` : undefined },
    { label: "catégories", value: categoriesList.length, icon: FolderOpen, href: "/account/admin/categories" },
    { label: "tags", value: tagsList.length, icon: TagIcon, href: "/account/admin/tags" },
  ];

  return (
    <div>
      {/* Header */}
      <AccountPageHeader icon={Shield} title="> Administration" description="— vue d'ensemble de la plateforme" />

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Alerts */}
          {(pendingRequests > 0 || pendingArtists > 0 || pendingOrders > 0) && (
            <div className="space-y-2">
              {pendingRequests > 0 && (
                <Link
                  href="/account/admin/artist-requests"
                  className="flex items-center gap-3 border border-amber-200 bg-amber-50 p-3 hover:border-amber-300 transition-colors"
                >
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-800">
                    {pendingRequests} candidature{pendingRequests > 1 ? "s" : ""} artiste{pendingRequests > 1 ? "s" : ""} en attente
                  </p>
                  <ArrowRight size={14} className="text-amber-400 ml-auto shrink-0" />
                </Link>
              )}
              {pendingArtists > 0 && (
                <Link
                  href="/account/admin/artists"
                  className="flex items-center gap-3 border border-amber-200 bg-amber-50 p-3 hover:border-amber-300 transition-colors"
                >
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-800">
                    {pendingArtists} profil{pendingArtists > 1 ? "s" : ""} artiste{pendingArtists > 1 ? "s" : ""} en attente de validation
                  </p>
                  <ArrowRight size={14} className="text-amber-400 ml-auto shrink-0" />
                </Link>
              )}
              {pendingOrders > 0 && (
                <Link
                  href="/account/admin/orders"
                  className="flex items-center gap-3 border border-blue-200 bg-blue-50 p-3 hover:border-blue-300 transition-colors"
                >
                  <Clock size={16} className="text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-800">
                    {pendingOrders} commande{pendingOrders > 1 ? "s" : ""} en attente de traitement
                  </p>
                  <ArrowRight size={14} className="text-blue-400 ml-auto shrink-0" />
                </Link>
              )}
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group border border-stone-200 p-4 space-y-1 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-600">
                  <stat.icon size={14} />
                  <span className="text-[10px] uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl text-stone-800">{stat.value}</p>
                {stat.accent && (
                  <p className="text-[10px] text-amber-600">{stat.accent}</p>
                )}
              </Link>
            ))}
          </div>

          {/* KPIs */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-stone-400" />
              <h2 className="text-xs uppercase tracking-wider text-stone-400">indicateurs clés de performance</h2>
            </div>

            <div className="space-y-3">
              {/* Métier */}
              <div>
                <p className="mb-1.5 px-1 text-[10px] text-stone-300 uppercase tracking-wider">— métier</p>
                <div className="border border-stone-200 divide-y divide-stone-100">
                  <KpiRow
                    label="Artisans vérifiés actifs"
                    value={String(artistesVerifies)}
                    target="50 (mois 3)"
                    progress={artistesVerifies / 50}
                  />
                  <KpiRow
                    label={`GMV — ${now.toLocaleString("fr-FR", { month: "long" })}`}
                    value={`${gmvMonth.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
                    target="10 000 € (mois 6)"
                    progress={gmvMonth / 10000}
                  />
                  <KpiRow
                    label="Commission générée (mois)"
                    value={`${commissionMonth.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
                    target="500 € (mois 6)"
                    progress={commissionMonth / 500}
                  />
                  <KpiRow
                    label="Délai moyen vérification artisan"
                    value={avgDelayHours !== null ? formatDelay(avgDelayHours) : "—"}
                    target="< 48 h"
                    progress={avgDelayHours !== null ? Math.min(1, 48 / Math.max(avgDelayHours, 0.1)) : null}
                  />
                </div>
              </div>

              {/* Produit */}
              <div>
                <p className="mb-1.5 px-1 text-[10px] text-stone-300 uppercase tracking-wider">— produit</p>
                <div className="border border-stone-200 divide-y divide-stone-100">
                  <KpiRow
                    label="Panier moyen"
                    value={activeOrders.length > 0 ? `${panierMoyen.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "—"}
                    target="≥ 40 €"
                    progress={activeOrders.length > 0 ? panierMoyen / 40 : null}
                  />
                  <KpiRow
                    label="Note moyenne produits"
                    value="N/D"
                    target="≥ 4,2 / 5"
                    progress={null}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-4 text-xs uppercase tracking-wider text-stone-400">gestion</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/account/admin/users"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Utilisateurs</p>
                    <p className="text-[10px] text-stone-400">gérer les comptes</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/admin/artist-requests"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Candidatures artistes</p>
                    <p className="text-[10px] text-stone-400">
                      {pendingRequests > 0 ? `${pendingRequests} en attente` : "examiner les demandes"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/admin/artists"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Artistes</p>
                    <p className="text-[10px] text-stone-400">valider les profils</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/admin/orders"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Commandes</p>
                    <p className="text-[10px] text-stone-400">suivre et gérer</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/admin/wallets"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Wallet size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Wallets artistes</p>
                    <p className="text-[10px] text-stone-400">suivre soldes et retraits</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>

              <Link
                href="/account/admin/categories"
                className="group flex items-center justify-between border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen size={18} className="text-stone-400 group-hover:text-stone-600" />
                  <div>
                    <p className="text-sm text-stone-800">Catégories & Tags</p>
                    <p className="text-[10px] text-stone-400">organiser le catalogue</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500" />
              </Link>
            </div>
          </div>

          {/* Recent orders */}
          {ordersList.length > 0 && (
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-wider text-stone-400">commandes récentes</h2>
              <div className="border border-stone-200 divide-y divide-stone-100">
                {ordersList.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/admin/orders`}
                    className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-stone-400 font-mono">#{String(order.id).padStart(4, "0")}</span>
                      <div>
                        <p className="text-sm text-stone-700">{Number(order.total).toFixed(2)} €</p>
                        <p className="text-[10px] text-stone-400">{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KpiRow({
  label,
  value,
  target,
  progress,
}: {
  label: string;
  value: string;
  target: string;
  progress: number | null;
}) {
  const pct = progress !== null ? Math.min(1, Math.max(0, progress)) : null;
  const status = pct === null ? "na" : pct >= 1 ? "ok" : pct >= 0.5 ? "warn" : "miss";

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 text-[11px] ${
            status === "ok"
              ? "text-green-500"
              : status === "warn"
                ? "text-amber-400"
                : status === "miss"
                  ? "text-red-400"
                  : "text-stone-300"
          }`}
        >
          {status === "ok" ? "✓" : status === "na" ? "—" : "○"}
        </span>
        <span className="text-xs text-stone-600 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span
          className={`text-sm font-mono ${
            status === "ok"
              ? "text-green-700"
              : status === "warn"
                ? "text-amber-700"
                : status === "na"
                  ? "text-stone-400"
                  : "text-stone-700"
          }`}
        >
          {value}
        </span>
        <span className="w-28 text-right text-[10px] text-stone-300">{target}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<OrderStatus, { label: string; className: string }> = {
    [OrderStatus.PENDING]: { label: "en attente", className: "bg-amber-50 text-amber-700 border-amber-200" },
    [OrderStatus.CONFIRMED]: { label: "confirmée", className: "bg-blue-50 text-blue-700 border-blue-200" },
    [OrderStatus.PREPARING]: { label: "en préparation", className: "bg-purple-50 text-purple-700 border-purple-200" },
    [OrderStatus.SHIPPED]: { label: "expédiée", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    [OrderStatus.DELIVERED]: { label: "livrée", className: "bg-green-50 text-green-700 border-green-200" },
    [OrderStatus.CANCELLED]: { label: "annulée", className: "bg-stone-50 text-stone-500 border-stone-200" },
  };
  const config = configs[status] || { label: status, className: "bg-stone-50 text-stone-500 border-stone-200" };
  return (
    <span className={`inline-block border px-2 py-0.5 text-[10px] ${config.className}`}>
      {config.label}
    </span>
  );
}
