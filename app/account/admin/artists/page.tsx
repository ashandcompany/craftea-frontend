"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  artists as artistsApi,
  type ArtistProfile,
  type ArtistVerificationDocument,
} from "@/lib/api";
import {
  Palette, Hourglass, Search, CheckCircle2, XCircle,
  ShieldCheck, ShieldOff, ChevronDown, FileImage, Eye,
  ThumbsUp, ThumbsDown, X, Clock,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { assetUrl } from "@/lib/utils";

type VerificationRequest = ArtistProfile & { documents: ArtistVerificationDocument[] };

type Tab = "artists" | "verifications";

export default function AdminArtistsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("artists");

  // --- Artists list ---
  const [artistsList, setArtistsList] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // --- Verification requests ---
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [verifLoading, setVerifLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
  const [rejectOpen, setRejectOpen] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [verifFilter, setVerifFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadArtists();
    loadVerifications();
  }, [user]);

  const loadArtists = () => {
    setLoading(true);
    artistsApi.adminListAll()
      .then(setArtistsList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadVerifications = () => {
    setVerifLoading(true);
    artistsApi.adminGetVerifications()
      .then(setVerifications)
      .catch(() => {})
      .finally(() => setVerifLoading(false));
  };

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const handleToggleValidation = async (artist: ArtistProfile) => {
    setActionLoading(artist.id);
    try {
      const updated = await artistsApi.toggleValidation(artist.id);
      setArtistsList((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleApprove = async (artistId: number) => {
    setReviewLoading(artistId);
    try {
      await artistsApi.adminReviewVerification(artistId, "approve");
      setVerifications((prev) => prev.filter((v) => v.id !== artistId));
      // reflect in artists list
      setArtistsList((prev) =>
        prev.map((a) => a.id === artistId ? { ...a, validated: true, validation_status: "approved" } : a),
      );
    } catch { /* ignore */ }
    setReviewLoading(null);
  };

  const handleReject = async (artistId: number) => {
    setReviewLoading(artistId);
    try {
      const note = rejectNote[artistId] ?? "";
      await artistsApi.adminReviewVerification(artistId, "reject", note || undefined);
      setVerifications((prev) => prev.filter((v) => v.id !== artistId));
      setRejectOpen(null);
    } catch { /* ignore */ }
    setReviewLoading(null);
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
  const pendingVerificationsCount = verifications.filter((v) => v.validation_status === "pending").length;

  return (
    <div>
      {/* Header */}
      <AccountPageHeader
        icon={Palette}
        title="> Artistes"
        description={
          <>
            — {artistsList.length} profil{artistsList.length > 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="text-amber-600"> · {pendingCount} en attente</span>
            )}
            {verifications.length > 0 && (
              <span className="text-blue-600"> · {pendingVerificationsCount} demande{pendingVerificationsCount > 1 ? "s" : ""} à examiner</span>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-stone-200">
        <button
          onClick={() => setTab("artists")}
          className={`px-4 py-2 text-sm font-mono border-b-2 transition-colors ${
            tab === "artists"
              ? "border-stone-800 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Tous les artistes
        </button>
        <button
          onClick={() => setTab("verifications")}
          className={`px-4 py-2 text-sm font-mono border-b-2 transition-colors flex items-center gap-2 ${
            tab === "verifications"
              ? "border-stone-800 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Demandes de validation
          {pendingVerificationsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
              {pendingVerificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB: ARTISTS ===================== */}
      {tab === "artists" && (
        <>
          {/* Image preview lightbox */}
          {previewDoc && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setPreviewDoc(null)}
            >
              <button className="absolute top-4 right-4 text-white" onClick={() => setPreviewDoc(null)}>
                <X size={24} />
              </button>
              <img src={previewDoc} alt="preuve" className="max-h-[80vh] max-w-full object-contain" />
            </div>
          )}

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
                          {artist.validation_status === "pending" && (
                            <span className="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                              preuves soumises
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
                          <><ShieldOff size={12} /> révoquer</>
                        ) : (
                          <><ShieldCheck size={12} /> valider</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===================== TAB: VERIFICATIONS ===================== */}
      {tab === "verifications" && (
        <>
          {verifLoading ? (
            <div className="py-16 text-center text-stone-400">
              <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
              <p className="mt-2 text-sm">chargement...</p>
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {(["pending", "all", "approved", "rejected"] as const).map((f) => {
                  const labels = { all: "Toutes", pending: "En attente", approved: "Approuvées", rejected: "Refusées" };
                  const counts = { all: verifications.length, pending: verifications.filter(v => v.validation_status === "pending").length, approved: verifications.filter(v => v.validation_status === "approved").length, rejected: verifications.filter(v => v.validation_status === "rejected").length };
                  return (
                    <button
                      key={f}
                      onClick={() => setVerifFilter(f)}
                      className={`px-3 py-1 text-xs font-mono border transition-colors ${verifFilter === f ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
                    >
                      {labels[f]} ({counts[f]})
                    </button>
                  );
                })}
              </div>

              {(() => {
                const filtered = verifFilter === "all" ? verifications : verifications.filter(v => v.validation_status === verifFilter);
                if (filtered.length === 0) return (
                  <div className="py-16 text-center text-stone-400">
                    <ShieldCheck size={28} className="mx-auto mb-3 text-stone-300" />
                    <p className="text-sm">Aucune demande{verifFilter !== "all" ? ` ${verifFilter === "pending" ? "en attente" : verifFilter === "approved" ? "approuvée" : "refusée"}` : ""}</p>
                  </div>
                );
                return (
                  <div className="space-y-6">
                    {filtered.map((req) => {
                      const name = req.user
                        ? `${req.user.firstname} ${req.user.lastname}`
                        : `Artiste #${req.user_id}`;
                      const isOpen = rejectOpen === req.id;
                      const isPending = req.validation_status === "pending";
                      const globalDescription = req.documents[0]?.description;
                      return (
                        <div key={req.id} className="border border-stone-200 p-5">
                          {/* Artist info + status badge */}
                          <div className="flex items-center gap-3 mb-4">
                            {req.logo_url ? (
                              <img
                                src={assetUrl(req.logo_url, "artist-images")}
                                alt={name}
                                className="h-10 w-10 border border-stone-200 object-cover shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center border border-stone-200 bg-stone-50 shrink-0">
                                <Palette size={16} className="text-stone-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-stone-800">{name}</p>
                              <p className="text-[10px] text-stone-400 font-mono">ID #{req.id} · user #{req.user_id}</p>
                            </div>
                            {req.validation_status === "pending" && (
                              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700">
                                <Clock size={9} /> En attente
                              </span>
                            )}
                            {req.validation_status === "approved" && (
                              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700">
                                <ShieldCheck size={9} /> Approuvée
                              </span>
                            )}
                            {req.validation_status === "rejected" && (
                              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-red-50 border border-red-200 text-red-600">
                                <ShieldOff size={9} /> Refusée
                              </span>
                            )}
                          </div>

                          {/* Global description */}
                          {globalDescription && (
                            <p className="text-xs text-stone-600 mb-4 leading-relaxed border-l-2 border-stone-300 pl-3 italic">
                              {globalDescription}
                            </p>
                          )}

                          {/* Rejection note */}
                          {req.validation_status === "rejected" && req.validation_note && (
                            <p className="text-xs text-red-600 mb-4 border-l-2 border-red-300 pl-3">
                              Motif du refus : {req.validation_note}
                            </p>
                          )}

                          {/* Documents */}
                          {req.documents.length > 0 ? (
                            <div className="mb-4">
                              <p className="text-xs font-mono tracking-widest text-stone-400 uppercase mb-2">
                                Documents soumis ({req.documents.length})
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {req.documents.map((doc) => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => setPreviewDoc(assetUrl(doc.file_url, "artist-images"))}
                                    className="group relative border border-stone-200 hover:border-stone-500 transition-colors overflow-hidden text-left"
                                  >
                                    <img
                                      src={assetUrl(doc.file_url, "artist-images")}
                                      alt="preuve"
                                      className="w-full h-28 object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                    <div className="p-2 bg-stone-50 text-xs text-stone-500 font-mono flex items-center gap-1 truncate">
                                      <Eye size={11} className="shrink-0" strokeWidth={1.5} />
                                      <span className="truncate">{doc.name ?? doc.description ?? "document"}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 mb-4 italic">Aucun document soumis</p>
                          )}

                          {/* Actions — only for pending */}
                          {isPending && (
                            <div className="flex flex-wrap gap-3 items-start">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={reviewLoading === req.id}
                                className="flex items-center gap-1.5 border border-green-200 text-green-700 px-3 py-1.5 text-xs hover:bg-green-50 transition-colors disabled:opacity-50"
                              >
                                <ThumbsUp size={12} strokeWidth={1.5} />
                                Approuver
                              </button>

                              {!isOpen ? (
                                <button
                                  onClick={() => setRejectOpen(req.id)}
                                  disabled={reviewLoading === req.id}
                                  className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-1.5 text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  <ThumbsDown size={12} strokeWidth={1.5} />
                                  Refuser
                                </button>
                              ) : (
                                <div className="flex-1 min-w-60 space-y-2">
                                  <textarea
                                    placeholder="Motif du refus (optionnel)..."
                                    rows={2}
                                    value={rejectNote[req.id] ?? ""}
                                    onChange={(e) =>
                                      setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                                    }
                                    className="w-full border border-red-200 px-3 py-2 text-xs font-mono text-stone-800 placeholder-stone-300 focus:outline-none focus:border-red-400 resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleReject(req.id)}
                                      disabled={reviewLoading === req.id}
                                      className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      <ThumbsDown size={12} strokeWidth={1.5} />
                                      Confirmer le refus
                                    </button>
                                    <button
                                      onClick={() => setRejectOpen(null)}
                                      className="border border-stone-200 text-stone-500 px-3 py-1.5 text-xs hover:bg-stone-50"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}
