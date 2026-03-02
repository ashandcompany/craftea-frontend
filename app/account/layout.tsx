"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, User, MapPin, Store, Settings, LogOut,
  Box, TrendingUp, MessageSquare, Heart, Palette,
  Hourglass
} from "lucide-react";
import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // Pour "mon profil", seulement actif si on est exactement sur cette route
    if (href === "/account/settings") {
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
    { href: "/favorites", icon: Heart, label: "mes favoris" },
  ];

  const artistNav = [
    { href: "/account", icon: LayoutDashboard, label: "tableau de bord" },
    { href: "/account/settings", icon: User, label: "mon profil" },
    { href: "/account/settings/artist", icon: Palette, label: "profil artiste" },
    { href: "/account/settings/shop", icon: Store, label: "mes boutiques" },
    { href: "/account/products", icon: Box, label: "mes produits" },
    { href: "/favorites", icon: Heart, label: "mes favoris" },
  ];

  const navItems = user.role === "artist" ? artistNav : buyerNav;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 font-mono">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          {/* User info */}
          <div className="mb-6 border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-stone-300 bg-stone-50 text-sm uppercase text-stone-600">
                {user.firstname?.[0] || "U"}{user.lastname?.[0] || ""}
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
