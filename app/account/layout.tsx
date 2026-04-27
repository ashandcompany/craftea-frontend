"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { assetUrl } from "@/lib/utils";
import {
  LayoutDashboard, User, MapPin, Store, Settings, LogOut,
  Box, TrendingUp, MessageSquare, Heart, Palette,
  Hourglass, Shield, Users, ShoppingBag, FolderOpen, Tag, Truck, Wallet
} from "lucide-react";
import { type ReactNode, useEffect } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // Pour "mon profil" et "administration", seulement actif si on est exactement sur ces routes
    if (href === "/account/settings" || href === "/account/admin") {
      return pathname === href;
    }
    // Pour d'autres routes, vérifier le prefix (sauf /account qui a sa propre logique)
    return pathname.startsWith(href + "/") && href !== "/account";
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
      isActive(href)
        ? "bg-stone-100 text-stone-900 font-medium border-l-2 border-stone-800"
        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50 border-l-2 border-transparent"
    }`;

  const buyerNav = [
    { href: "/account", icon: LayoutDashboard, label: "tableau de bord" },
    { href: "/account/settings", icon: User, label: "mon profil" },
    { href: "/account/orders", icon: ShoppingBag, label: "mes commandes" },
    { href: "/favorites", icon: Heart, label: "mes favoris" },
  ];

  const artistNav = [
    { href: "/account", icon: LayoutDashboard, label: "tableau de bord" },
    { href: "/account/settings", icon: User, label: "mon profil" },
    { href: "/account/settings/artist", icon: Palette, label: "profil artiste" },
    { href: "/account/verification", icon: Shield, label: "validation artiste" },
    { href: "/account/wallet", icon: Wallet, label: "wallet artiste" },
    { href: "/account/settings/shop", icon: Store, label: "mes boutiques" },
    { href: "/account/products", icon: Box, label: "mes produits" },
    { href: "/account/artist-orders", icon: Truck, label: "commandes reçues" },
    { href: "/account/orders", icon: ShoppingBag, label: "mes achats" },
    { href: "/favorites", icon: Heart, label: "mes favoris" },
  ];

  const navItems = user.role === "artist" ? artistNav : buyerNav;

  const adminNav = [
    { href: "/account/admin", icon: Shield, label: "administration" },
    { href: "/account/admin/users", icon: Users, label: "utilisateurs" },
    { href: "/account/admin/artists", icon: Palette, label: "artistes" },
    { href: "/account/admin/wallets", icon: Wallet, label: "wallets" },
    { href: "/account/admin/orders", icon: ShoppingBag, label: "commandes" },
    { href: "/account/admin/categories", icon: FolderOpen, label: "catégories" },
    { href: "/account/admin/tags", icon: Tag, label: "tags" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 font-mono">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          {/* User info */}
          <div className="mb-6 border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-stone-300 bg-stone-50 text-sm uppercase text-stone-600 overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={assetUrl(user.avatar_url, "user-images")}
                    alt={`${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user.firstname?.[0] || "U"}{user.lastname?.[0] || ""}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {user.firstname} {user.lastname}
                </p>
                <p className="text-[10px] text-stone-400">
                  #{user.role === "artist" ? "artiste" : user.role === "admin" ? "admin" : "acheteur"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Admin navigation */}
          {user.role === "admin" && (
            <div className="mt-6 border-t border-stone-200 pt-4">
              <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-stone-400">admin</p>
              <nav className="space-y-1">
                {adminNav.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Logout */}
          <div className="mt-6 border-t border-stone-200 pt-4">
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-stone-400 hover:text-stone-800 transition-colors w-full"
            >
              <LogOut size={16} />
              <span>déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
