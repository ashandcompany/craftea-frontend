"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { categories as categoriesApi, favorites as favoritesApi, type Category } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-context";
import {
  Search, Star, ShoppingCart, BarChart3, Store, Box, User,
  ChevronDown, Settings, LogOut, Sparkles, Users, Gift, FileText,
  Menu, X, Sun, Moon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  ThemeSwitch                                                        */
/* ------------------------------------------------------------------ */
function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      aria-label="Changer de thème"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
export function Navbar() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { count: cartCount } = useCart();
  const { theme } = useTheme();

  /* --- local state ------------------------------------------------ */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* --- dynamic data ----------------------------------------------- */
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  /* --- refs ------------------------------------------------------- */
  const navRef = useRef<HTMLElement>(null);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  /* --- scroll: shadow only, no layout change, uses ref to avoid rerenders */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (navRef.current) {
            const scrolled = window.scrollY > 2;
            navRef.current.classList.toggle("shadow-sm", scrolled);
            navRef.current.classList.toggle("shadow-black/5", scrolled);
            navRef.current.classList.toggle("border-transparent", scrolled);
            navRef.current.classList.toggle("border-stone-200", !scrolled);
            navRef.current.classList.toggle("dark:border-stone-800", !scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --- fetch categories ------------------------------------------- */
  useEffect(() => {
    categoriesApi.list().then(setCategoriesList).catch(() => {});
  }, []);

  /* --- favorites count -------------------------------------------- */
  const refreshFavoritesCount = useCallback(async () => {
    if (!user) { setFavoritesCount(0); return; }
    try {
      const res = await favoritesApi.list({ limit: 1 });
      setFavoritesCount(res.total);
    } catch { setFavoritesCount(0); }
  }, [user]);

  useEffect(() => { refreshFavoritesCount(); }, [refreshFavoritesCount]);

  useEffect(() => {
    const handler = () => refreshFavoritesCount();
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, [refreshFavoritesCount]);

  /* --- close everything on route change --------------------------- */
  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  /* --- keyboard & outside click ----------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoriesOpen(false);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node))
        setCategoriesOpen(false);
      if (userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* --- lock body scroll when mobile menu open --------------------- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* --- helpers ---------------------------------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchFocused(false);
      setMobileOpen(false);
    }
  };

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* -- Main navbar ------------------------------------------------- */}
      <nav
        ref={navRef}
        className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80 font-mono transition-shadow duration-200"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center gap-6">

            {/* -- Logo --------------------------------------------------- */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <img src="/craftea-logo-nobg.svg" alt="Craftea" className="h-12" />
              {user?.role === "artist" && (
                <span className="bg-stone-100 px-2 py-px text-[10px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  artiste
                </span>
              )}
            </Link>

            {/* -- Desktop nav links -------------------------------------- */}
            <div className="hidden items-center gap-1 md:flex">
              {/* Categories dropdown */}
              <div
                className="relative"
                ref={categoryDropdownRef}
                onMouseEnter={() => {
                  if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
                  setCategoriesOpen(true);
                }}
                onMouseLeave={() => {
                  categoryTimeoutRef.current = setTimeout(() => setCategoriesOpen(false), 150);
                }}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${
                    categoriesOpen 
                      ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100" 
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                  }`}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                >
                  catégories
                  <ChevronDown size={14} className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute left-0 top-full pt-2 transition-all duration-150 ${
                    categoriesOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="w-72 border border-stone-200 bg-white p-2 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/20">
                    {categoriesList.length > 0 ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {categoriesList.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/products?category_id=${cat.id}`}
                            className="px-3 py-2 text-xs text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-4 text-xs italic text-stone-400 dark:text-stone-500">chargement...</p>
                    )}
                    <div className="mt-1 border-t border-stone-100 pt-2 dark:border-stone-700">
                      <Link
                        href="/categories"
                        className="block px-3 py-1.5 text-[11px] text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      >
                        toutes les catégories →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {[
                { href: "/products", label: "découvrir" },
                { href: "/artists", label: "artistes" },
                { href: "/gifts", label: "idées cadeaux" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    isActive(link.href)
                      ? "bg-stone-100 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* -- Spacer ------------------------------------------------- */}
            <div className="flex-1" />

            {/* -- Search (desktop) --------------------------------------- */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="rechercher…"
                  className={`border bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-800 placeholder-stone-400 outline-none transition-all dark:bg-stone-900 dark:text-stone-200 dark:placeholder-stone-500 ${
                    searchFocused
                      ? "w-64 border-stone-400 bg-white ring-2 ring-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:ring-stone-800"
                      : "w-44 border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                  }`}
                />
              </div>
            </form>

            {/* -- Action icons ------------------------------------------- */}
            <div className="flex items-center gap-1">
              {/* Theme Switch */}
              <ThemeSwitch />

              {/* Favorites */}
              {user && (
                <Link
                  href="/favorites"
                  className={`relative hidden p-2 transition-colors sm:block ${
                    isActive("/favorites")
                      ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                  }`}
                  title="Favoris"
                >
                  <Star size={18} strokeWidth={isActive("/favorites") ? 2 : 1.5} />
                  {favoritesCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-800 px-1 text-[10px] font-medium text-white dark:bg-stone-200 dark:text-stone-900">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className={`relative hidden p-2 transition-colors sm:block ${
                  isActive("/cart")
                    ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                }`}
                title="Panier"
              >
                <ShoppingCart size={18} strokeWidth={isActive("/cart") ? 2 : 1.5} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-800 px-1 text-[10px] font-medium text-white dark:bg-stone-200 dark:text-stone-900">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* -- User menu / auth ------------------------------------- */}
              {authLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
              ) : user ? (
                <div
                  className="relative"
                  ref={userMenuDropdownRef}
                  onMouseEnter={() => {
                    if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
                    setUserMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    userMenuTimeoutRef.current = setTimeout(() => setUserMenuOpen(false), 150);
                  }}
                >
                  <button
                    className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-medium transition-colors ms-4 ${
                      userMenuOpen
                        ? "bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                    }`}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {user.avatar_url ? (
                      <img
                        src={assetUrl(user.avatar_url, "user-images")}
                        alt={getInitials()}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials()
                    )}
                  </button>

                  {/* User dropdown */}
                  <div
                    className={`absolute right-0 top-full pt-2 transition-all duration-150 ${
                      userMenuOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="w-56 border border-stone-200 bg-white p-1.5 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/20">
                      {/* User info */}
                      <div className="mb-1 bg-stone-50 px-3 py-2.5 dark:bg-stone-800/50">
                        <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">{user.email}</p>
                      </div>

                      {/* Links */}
                      {user.role === "artist" ? (
                        <>
                          <DropdownLink href="/account" icon={<BarChart3 size={15} />} label="tableau de bord" />
                          <DropdownLink href="/account/settings/shop" icon={<Store size={15} />} label="ma boutique" />
                          <DropdownLink href="/account/products" icon={<Box size={15} />} label="mes produits" />
                        </>
                      ) : (
                        <DropdownLink href="/account" icon={<User size={15} />} label="mon compte" />
                      )}

                      <DropdownLink href="/favorites" icon={<Star size={15} />} label="mes favoris" />
                      <DropdownLink href="/account/settings" icon={<Settings size={15} />} label="paramètres" />

                      <div className="my-1 border-t border-stone-100 dark:border-stone-700" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                      >
                        <LogOut size={15} /> déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                  >
                    connexion
                  </Link>
                  <Link
                    href="/register"
                    className="bg-stone-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    inscription
                  </Link>
                </div>
              )}

              {/* -- Mobile hamburger ------------------------------------- */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100 md:hidden"
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* -- Mobile overlay (backdrop) ----------------------------------- */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/40 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* -- Mobile slide-over drawer ------------------------------------ */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white font-mono shadow-xl transition-transform duration-300 ease-out dark:bg-stone-950 dark:shadow-black/40 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between border-b border-stone-100 px-5 dark:border-stone-800">
          <img src="/craftea-logo-nobg.svg" alt="Craftea" className="h-10" />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100%-3.5rem)] overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
          <div className="space-y-6">
            {/* Search mobile */}
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="rechercher une création…"
                className="w-full border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-4 text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:placeholder-stone-500 dark:focus:border-stone-600 dark:focus:bg-stone-800"
              />
            </form>

            {/* Profile section */}
            {user && (
              <div className="flex items-center gap-3 bg-stone-50 p-3 dark:bg-stone-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                  {getInitials()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {user.firstname} {user.lastname}
                  </p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">{user.email}</p>
                </div>
              </div>
            )}

            {!user && !authLoading && (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="border border-stone-200 px-3 py-2.5 text-center text-sm text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-stone-900 px-3 py-2.5 text-center text-sm text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  inscription
                </Link>
              </div>
            )}

            {/* Quick actions grid */}
            <div className="grid grid-cols-2 gap-2">
              <MobileQuickAction 
                href="/favorites" 
                icon={<Star size={18} />} 
                label="favoris" 
                badge={favoritesCount} 
                active={isActive("/favorites")} 
              />
              <MobileQuickAction 
                href="/cart" 
                icon={<ShoppingCart size={18} />} 
                label="panier" 
                badge={cartCount} 
                active={isActive("/cart")} 
              />
              {user?.role === "artist" && (
                <>
                  <MobileQuickAction 
                    href="/account" 
                    icon={<BarChart3 size={18} />} 
                    label="tableau de bord" 
                    active={isActive("/account")} 
                  />
                  <MobileQuickAction 
                    href="/account/products" 
                    icon={<Box size={18} />} 
                    label="mes produits" 
                    active={pathname.startsWith("/account/products")} 
                  />
                </>
              )}
            </div>

            {/* Navigation */}
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">navigation</p>
              <div className="space-y-0.5">
                {[
                  { href: "/products", Icon: Sparkles, label: "découvrir" },
                  { href: "/artists", Icon: Users, label: "artistes" },
                  { href: "/gifts", Icon: Gift, label: "idées cadeaux" },
                  { href: "/categories", Icon: FileText, label: "catégories" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-stone-100 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                    }`}
                  >
                    <item.Icon size={18} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categoriesList.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">catégories</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesList.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category_id=${cat.id}`}
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-200"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Become artist CTA */}
            {user?.role === "buyer" && (
              <Link
                href="/become-artist"
                className="flex items-center justify-center gap-2 bg-stone-900 px-4 py-3 text-sm text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                <Sparkles size={16} /> devenir artiste
              </Link>
            )}

            {/* Account links */}
            {user && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">compte</p>
                <div className="space-y-0.5">
                  <Link
                    href="/account/settings"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
                  >
                    <Settings size={18} strokeWidth={1.5} /> paramètres
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-200"
                  >
                    <LogOut size={18} strokeWidth={1.5} /> déconnexion
                  </button>
                </div>
              </div>
            )}

            {/* Promo */}
            <div className="border border-dashed border-stone-200 px-4 py-3 text-center text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
              ✦ livraison offerte dès 50€ ✦
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DropdownLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-xs text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      {icon} {label}
    </Link>
  );
}

function MobileQuickAction({
  href, icon, label, badge = 0, active = false,
}: {
  href: string; icon: React.ReactNode; label: string; badge?: number; active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 border p-3 transition-colors ${
        active
          ? "border-stone-300 bg-stone-50 text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:bg-stone-800/50"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
      {badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-800 px-1 text-[10px] font-medium text-white dark:bg-stone-200 dark:text-stone-900">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}