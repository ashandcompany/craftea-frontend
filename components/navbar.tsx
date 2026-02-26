"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { categories as categoriesApi, favorites as favoritesApi, type Category } from "@/lib/api";
import { 
  Star, ShoppingCart, BarChart3, Store, Box, User,
  MessageSquare, Settings, X, Sparkles, Users, Gift, FileText, Bell
} from "lucide-react";

export function Navbar() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Dynamic data
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories from API
  useEffect(() => {
    categoriesApi.list()
      .then(setCategoriesList)
      .catch(() => {});
  }, []);

  // Fetch favorites count when user is logged in
  const refreshFavoritesCount = useCallback(async () => {
    if (!user) { setFavoritesCount(0); return; }
    try {
      const res = await favoritesApi.list({ limit: 1 });
      setFavoritesCount(res.total);
    } catch {
      setFavoritesCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshFavoritesCount();
  }, [refreshFavoritesCount]);

  // Listen for custom event to refresh favorites count (from product pages)
  useEffect(() => {
    const handler = () => refreshFavoritesCount();
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, [refreshFavoritesCount]);

  // Close mobile menu & dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoriesOpen(false);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
      if (userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
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

  // Helper to check if a nav link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) =>
    `text-stone-600 hover:text-stone-900 border-b pb-0.5 ${
      isActive(href) ? "border-stone-800 text-stone-900 font-medium" : "border-transparent hover:border-stone-300"
    }`;

  return (
    <>
      <nav 
        className={`sticky top-0 z-50 font-mono transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-sm border-b border-stone-200" 
            : "bg-white border-b border-stone-200"
        }`}
      >
        <div className="mx-auto max-w-5xl px-4">
          {/* Première ligne */}
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl font-light tracking-[-0.02em] text-stone-900">
                Craftea
              </span>
              {user?.role === "artist" && (
                <span className="text-[10px] uppercase tracking-wider text-stone-500 border border-stone-200 px-2 py-0.5">
                  artiste
                </span>
              )}
            </Link>

            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:block md:w-80">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="rechercher une création..."
                  className="w-full border border-stone-200 bg-stone-50 px-4 py-1.5 pr-8 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-400 focus:bg-white"
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 transition-colors group-hover:text-stone-600"
                >
                  ↵
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Favoris */}
              {user && (
                <Link 
                  href="/favorites" 
                  className={`hidden sm:flex items-center relative ${isActive("/favorites") ? "text-stone-900" : "text-stone-600 hover:text-stone-900"}`}
                  title="Favoris"
                >
                  <Star size={20} strokeWidth={isActive("/favorites") ? 2 : 1} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 min-w-4 h-4 bg-stone-800 text-stone-50 text-[10px] flex items-center justify-center px-0.5">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Panier */}
              <Link 
                href="/cart" 
                className={`hidden sm:block relative ${isActive("/cart") ? "text-stone-900" : "text-stone-600 hover:text-stone-900"}`}
                title="Panier"
              >
                <ShoppingCart size={20} strokeWidth={isActive("/cart") ? 2 : 1} />
              </Link>

              {/* Menu utilisateur ou connexion */}
              {authLoading ? (
                <div className="flex h-7 w-7 items-center justify-center border border-stone-100 bg-stone-50 animate-pulse" />
              ) : user ? (
                <div 
                  className="relative"
                  ref={userMenuDropdownRef}
                  onMouseEnter={() => {
                    if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
                    setUserMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    userMenuTimeoutRef.current = setTimeout(() => setUserMenuOpen(false), 200);
                  }}
                >
                  <button 
                    className="flex items-center gap-1"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center border border-stone-200 bg-stone-50 text-xs font-medium text-stone-700 transition-all hover:border-stone-400">
                      {getInitials()}
                    </div>
                    <span className="text-xs text-stone-400">▼</span>
                  </button>

                  {/* Dropdown utilisateur */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 border border-stone-200 bg-white p-2 shadow-sm">
                      <div className="border-b border-stone-100 pb-2 mb-2">
                        <p className="text-xs font-medium text-stone-800">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-[10px] text-stone-500">{user.email}</p>
                      </div>

                      {user.role === "artist" ? (
                        <>
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                            <BarChart3 size={16} /> tableau de bord
                          </Link>
                          <Link href="/account/settings/shop" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                            <Store size={16} /> ma boutique
                          </Link>
                          <Link href="/account/products" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                            <Box size={16} /> mes produits
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                            <User size={16} /> mon compte
                          </Link>
                        </>
                      )}

                      <Link href="/favorites" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                        <Star size={16} /> mes favoris
                      </Link>
                      <Link href="/account/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900">
                        <Settings size={16} /> paramètres
                      </Link>

                      <div className="border-t border-stone-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                        >
                          <X size={16} /> déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="text-xs text-stone-600 hover:text-stone-900 border-b border-transparent hover:border-stone-300 pb-0.5"
                  >
                    connexion
                  </Link>
                  <Link 
                    href="/register" 
                    className="text-xs bg-stone-900 text-stone-50 px-3 py-1 hover:bg-stone-800"
                  >
                    inscription
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-stone-600 hover:text-stone-900 md:hidden text-xl leading-none"
                aria-label="Menu"
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Deuxième ligne : Catégories et navigation (desktop) */}
          <div className={`hidden items-center justify-between border-t border-stone-100 py-2 text-xs transition-all duration-200 ${
            scrolled ? 'opacity-0 h-0 overflow-hidden py-0 md:hidden' : 'opacity-100 md:flex'
          }`}>
            {/* Bouton catégories avec mega menu */}
            <div 
              className="relative"
              ref={categoryDropdownRef}
              onMouseEnter={() => {
                if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
                setCategoriesOpen(true);
              }}
              onMouseLeave={() => {
                categoryTimeoutRef.current = setTimeout(() => setCategoriesOpen(false), 200);
              }}
            >
              <button 
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
              >
                <span className="text-sm">☰</span>
                <span>catégories</span>
                <span className={`text-[10px] text-stone-400 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {/* Mega menu catégories */}
              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-2 w-150 border border-stone-200 bg-white p-4 shadow-sm z-50">
                  {categoriesList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {categoriesList.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category_id=${cat.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic py-2">chargement...</p>
                  )}
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <Link href="/categories" className="text-[10px] text-stone-500 hover:text-stone-800">
                      toutes les catégories →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation principale */}
            <div className="flex items-center gap-6">
              <Link href="/products" className={navLinkClass("/products")}>
                découvrir
              </Link>
              <Link href="/artists" className={navLinkClass("/artists")}>
                artistes
              </Link>
              <Link href="/gifts" className={navLinkClass("/gifts")}>
                idées cadeaux
              </Link>
              <Link href="/blog" className={navLinkClass("/blog")}>
                blog
              </Link>
            </div>

            {/* Promo badge */}
            <div className="text-[10px] uppercase tracking-wider text-stone-500 border border-stone-200 px-2 py-0.5">
              ✦ livraison offerte dès 50€ ✦
            </div>
          </div>

          {/* Barre de recherche mobile */}
          <div className="md:hidden border-t border-stone-100 py-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="rechercher..."
                className="w-full border border-stone-200 bg-stone-50 px-4 py-2 pr-8 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-stone-400 focus:bg-white"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400"
              >
                ↵
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Menu mobile complet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white font-mono md:hidden overflow-y-auto" style={{ top: '64px' }}>
          <div className="p-5 space-y-6">
            {/* Profil */}
            {user && (
              <div className="border-b border-stone-200 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-stone-300 bg-stone-50 text-sm font-medium text-stone-700">
                    {getInitials()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-xs text-stone-500">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/account"
                    className="flex items-center justify-center gap-2 border border-stone-200 px-3 py-2 text-center text-xs text-stone-600 hover:bg-stone-50"
                  >
                    <User size={16} /> compte
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 border border-stone-200 px-3 py-2 text-center text-xs text-stone-500 hover:bg-stone-50"
                  >
                    <X size={16} /> déconnexion
                  </button>
                </div>
              </div>
            )}

            {!user && !authLoading && (
              <div className="border-b border-stone-200 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    className="border border-stone-200 px-3 py-2 text-center text-xs text-stone-600 hover:bg-stone-50"
                  >
                    connexion
                  </Link>
                  <Link
                    href="/register"
                    className="bg-stone-900 text-stone-50 px-3 py-2 text-center text-xs hover:bg-stone-800"
                  >
                    inscription
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation mobile */}
            <div>
              <h3 className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">navigation</h3>
              <div className="space-y-1">
                {[
                  { href: "/products", Icon: Sparkles, label: "découvrir" },
                  { href: "/artists", Icon: Users, label: "artistes" },
                  { href: "/gifts", Icon: Gift, label: "idées cadeaux" },
                  { href: "/blog", Icon: FileText, label: "blog" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 text-sm hover:bg-stone-50 border-l-2 ${
                      isActive(item.href)
                        ? "border-stone-800 text-stone-900 bg-stone-50 font-medium"
                        : "border-transparent text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <item.Icon size={18} /> {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Catégories mobile */}
            <div>
              <h3 className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">catégories</h3>
              {categoriesList.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {categoriesList.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category_id=${cat.id}`}
                      className="flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50"
                    >
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">chargement...</p>
              )}
              <Link
                href="/categories"
                className="mt-3 block text-[10px] text-stone-500 hover:text-stone-800"
              >
                toutes les catégories →
              </Link>
            </div>

            {/* Actions rapides */}
            <div>
              <h3 className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">mes actions</h3>
              <div className="grid grid-cols-4 gap-2">
                <Link
                  href="/favorites"
                  className={`flex flex-col items-center border p-3 hover:bg-stone-50 ${
                    isActive("/favorites") ? "border-stone-800 text-stone-900" : "border-stone-200 text-stone-600"
                  }`}
                >
                  <Star size={20} className="mb-1" />
                  <span className="text-[10px]">favoris{favoritesCount > 0 ? ` (${favoritesCount})` : ""}</span>
                </Link>
                <Link
                  href="/cart"
                  className={`flex flex-col items-center border p-3 hover:bg-stone-50 ${
                    isActive("/cart") ? "border-stone-800 text-stone-900" : "border-stone-200 text-stone-600"
                  }`}
                >
                  <ShoppingCart size={20} className="mb-1" />
                  <span className="text-[10px]">panier</span>
                </Link>
                <Link
                  href="/account/messages"
                  className="flex flex-col items-center border border-stone-200 p-3 text-stone-600 hover:bg-stone-50"
                >
                  <MessageSquare size={20} className="mb-1" />
                  <span className="text-[10px]">messages</span>
                </Link>
                <Link
                  href="/notifications"
                  className="flex flex-col items-center border border-stone-200 p-3 text-stone-600 hover:bg-stone-50"
                >
                  <Bell size={20} className="mb-1" />
                  <span className="text-[10px]">notifs</span>
                </Link>
              </div>
            </div>

            {/* Vendre */}
            {user?.role === "buyer" && (
              <div className="border-t border-stone-200 pt-4">
                <Link
                  href="/become-artist"
                  className="flex items-center justify-center gap-2 border border-stone-800 bg-stone-800 px-4 py-3 text-center text-sm text-stone-50 hover:bg-stone-700"
                >
                  <Sparkles size={18} /> devenir artiste
                </Link>
              </div>
            )}

            {/* Liens secondaires */}
            <div className="border-t border-stone-200 pt-4 text-xs text-stone-400">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/about" className="hover:text-stone-800">à propos</Link>
                <Link href="/help" className="hover:text-stone-800">aide</Link>
                <Link href="/contact" className="hover:text-stone-800">contact</Link>
                <Link href="/terms" className="hover:text-stone-800">conditions</Link>
              </div>
              <p className="mt-4 text-[10px]">© {new Date().getFullYear()} craftea</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}