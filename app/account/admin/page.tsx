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
  type User,
  type ArtistProfile,
  type Order,
  type Category,
  type Tag,
  OrderStatus,
} from "@/lib/api";
import {
  Users, Palette, ShoppingBag, FolderOpen, Tag as TagIcon,
  ArrowRight, Hourglass, Shield, AlertTriangle,
  Clock, Wallet,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [artistsList, setArtistsList] = useState<ArtistProfile[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    Promise.allSettled([
      usersApi.list().then(setUsersList).catch(() => {}),
      artistsApi.adminListAll().then(setArtistsList).catch(() => {}),
      ordersApi.list().then(setOrdersList).catch(() => {}),
      categoriesApi.list().then(setCategoriesList).catch(() => {}),
      tagsApi.list().then(setTagsList).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const pendingArtists = artistsList.filter((a) => !a.validated).length;
  const pendingOrders = ordersList.filter((o) => o.status === OrderStatus.PENDING).length;
  const inactiveUsers = usersList.filter((u) => !u.is_active).length;

  const stats = [
    { label: "utilisateurs", value: usersList.length, icon: Users, href: "/account/admin/users", accent: inactiveUsers > 0 ? `${inactiveUsers} inactif${inactiveUsers > 1 ? "s" : ""}` : undefined },
    { label: "artistes", value: artistsList.length, icon: Palette, href: "/account/admin/artists", accent: pendingArtists > 0 ? `${pendingArtists} en attente` : undefined },
    { label: "wallets", value: artistsList.length, icon: Wallet, href: "/account/admin/wallets" },
    { label: "commandes", value: ordersList.length, icon: ShoppingBag, href: "/account/admin/orders", accent: pendingOrders > 0 ? `${pendingOrders} en attente` : undefined },
    { label: "catégories", value: categoriesList.length, icon: FolderOpen, href: "/account/admin/categories" },
    { label: "tags", value: tagsList.length, icon: TagIcon, href: "/account/admin/tags" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Administration
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — vue d&apos;ensemble de la plateforme
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Alerts */}
          {(pendingArtists > 0 || pendingOrders > 0) && (
            <div className="space-y-2">
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
