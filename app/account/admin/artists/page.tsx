"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  artists as artistsApi,
  type ArtistProfile,
} from "@/lib/api";
import {
  Palette, Hourglass, Search, CheckCircle2, XCircle,
  ShieldCheck, ShieldOff, ChevronDown,
} from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function AdminArtistsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [artistsList, setArtistsList] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadArtists();
  }, [user]);

  const loadArtists = () => {
    setLoading(true);
    artistsApi.adminListAll()
      .then(setArtistsList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const handleToggleValidation = async (artist: ArtistProfile) => {
    setActionLoading(artist.id);
    try {
      const updated = await artistsApi.toggleValidation(artist.id);
      setArtistsList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const filtered = artistsList.filter((a) => {
    const name = a.user
      ? `${a.user.firstname} ${a.user.lastname}`
      : `artiste #${a.user_id}`;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (a.bio || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "validated" ? a.validated : !a.validated);
    return matchSearch && matchStatus;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric", month: "short", day: "numeric",
    });

  const pendingCount = artistsList.filter((a) => !a.validated).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Palette size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Artistes
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — {artistsList.length} profil{artistsList.length > 1 ? "s" : ""}
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
            placeholder="rechercher par nom ou bio..."
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
            <option value="all">tous</option>
            <option value="validated">validés</option>
            <option value="pending">en attente</option>
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
          <Palette size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucun artiste trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((artist) => {
            const name = artist.user
              ? `${artist.user.firstname} ${artist.user.lastname}`
              : `Artiste #${artist.user_id}`;
            return (
              <div
                key={artist.id}
                className={`border p-4 transition-colors ${
                  !artist.validated
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-stone-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {artist.logo_url ? (
                    <img
                      src={assetUrl(artist.logo_url, "artist-images")}
                      alt={name}
                      className="h-12 w-12 border border-stone-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border border-stone-200 bg-stone-50 shrink-0">
                      <Palette size={18} className="text-stone-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-stone-800">{name}</p>
                      {artist.validated ? (
                        <span className="inline-flex items-center gap-1 border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                          <CheckCircle2 size={10} /> validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                          <XCircle size={10} /> en attente
                        </span>
                      )}
                    </div>
                    {artist.bio && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{artist.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400">
                      <span>ID: {artist.id}</span>
                      <span>user: #{artist.user_id}</span>
                      <span>{artist.shops?.length || 0} boutique{(artist.shops?.length || 0) > 1 ? "s" : ""}</span>
                      <span>inscrit le {formatDate(artist.created_at)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleToggleValidation(artist)}
                    disabled={actionLoading === artist.id}
                    className={`shrink-0 flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                      artist.validated
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {artist.validated ? (
                      <>
                        <ShieldOff size={12} />
                        révoquer
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={12} />
                        valider
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
