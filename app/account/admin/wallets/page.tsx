"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  artists as artistsApi,
  payments as paymentsApi,
  type ArtistProfile,
  type WalletTransaction,
} from "@/lib/api";
import { Wallet, Loader, Search, Banknote, Landmark } from "lucide-react";

function centsToEuro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function AdminWalletsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.push("/account");
      return;
    }

    Promise.all([artistsApi.adminListAll(), paymentsApi.adminWalletTransactions()])
      .then(([artistsData, txs]) => {
        setArtists(artistsData);
        setTransactions(txs);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  const artistName = (artist: ArtistProfile) =>
    artist.user ? `${artist.user.firstname} ${artist.user.lastname}` : `Artiste #${artist.user_id}`;

  const q = search.trim().toLowerCase();
  const filteredArtists = !q
    ? artists
    : artists.filter((artist) => {
        const name = artistName(artist).toLowerCase();
        return (
          name.includes(q) ||
          String(artist.id).includes(q) ||
          String(artist.user_id).includes(q) ||
          (artist.stripe_account_id || "").toLowerCase().includes(q)
        );
      });

  const txByArtist = new Map<number, WalletTransaction[]>();
  for (const tx of transactions) {
    const arr = txByArtist.get(tx.artist_id) || [];
    arr.push(tx);
    txByArtist.set(tx.artist_id, arr);
  }

  const totalAvailableCents = artists.reduce((sum, a) => sum + Number(a.wallet_balance ?? 0), 0);
  const totalPendingCents = artists.reduce((sum, a) => sum + Number(a.pending_balance ?? 0), 0);

  return (
    <div>
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="mb-1 flex items-center gap-3">
          <Wallet size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">Wallets artistes</h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">— vue admin des soldes et flux de retrait</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <Loader size={20} className="inline-block animate-spin" />
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">wallets artistes</p>
              <p className="mt-1 text-2xl text-stone-900">{artists.length}</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">solde total disponible</p>
              <p className="mt-1 text-2xl text-stone-900">{centsToEuro(totalAvailableCents)}</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">solde total en attente</p>
              <p className="mt-1 text-2xl text-stone-900">{centsToEuro(totalPendingCents)}</p>
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="rechercher artiste, id ou stripe account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-stone-200 py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-2">artiste</th>
                  <th className="px-4 py-2">stripe</th>
                  <th className="px-4 py-2 text-right">disponible</th>
                  <th className="px-4 py-2 text-right">en attente</th>
                  <th className="px-4 py-2 text-right">tx</th>
                  <th className="px-4 py-2 text-right">crédits</th>
                  <th className="px-4 py-2 text-right">débits</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtists.map((artist) => {
                  const artistTx = txByArtist.get(artist.id) || [];
                  const credits = artistTx
                    .filter((tx) => tx.type === "credit")
                    .reduce((sum, tx) => sum + tx.amount_cents, 0);
                  const debits = artistTx
                    .filter((tx) => tx.type === "debit")
                    .reduce((sum, tx) => sum + tx.amount_cents, 0);

                  return (
                    <tr key={artist.id} className="border-t border-stone-100">
                      <td className="px-4 py-3">
                        <p className="text-sm text-stone-800">{artistName(artist)}</p>
                        <p className="text-[10px] text-stone-400">artist #{artist.id} · user #{artist.user_id}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {artist.stripe_account_id ? (
                          <>
                            <p>{artist.stripe_account_id}</p>
                            <p className="text-[10px] text-stone-400">{artist.stripe_onboarded ? "onboarded" : "incomplet"}</p>
                          </>
                        ) : (
                          <span className="text-stone-400">non connecté</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-stone-800">{centsToEuro(Number(artist.wallet_balance ?? 0))}</td>
                      <td className="px-4 py-3 text-right font-mono text-stone-700">{centsToEuro(Number(artist.pending_balance ?? 0))}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{artistTx.length}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-700">{centsToEuro(credits)}</td>
                      <td className="px-4 py-3 text-right font-mono text-stone-700">{centsToEuro(debits)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border border-stone-200">
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <Landmark size={14} className="text-stone-400" />
              <p className="text-xs uppercase tracking-wider text-stone-500">transactions récentes</p>
            </div>
            {transactions.length === 0 ? (
              <div className="px-4 py-8 text-sm text-stone-500">Aucune transaction trouvée.</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {transactions.slice(0, 25).map((tx) => {
                  const artist = artists.find((a) => a.id === tx.artist_id);
                  return (
                    <div key={tx.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
                      <span className="text-stone-400">{formatDate(tx.created_at)}</span>
                      <span className="text-stone-700">{artist ? artistName(artist) : `artist #${tx.artist_id}`}</span>
                      <span className="text-stone-500">{tx.description}</span>
                      <span className="ml-auto inline-flex items-center gap-1 font-mono text-stone-700">
                        <Banknote size={12} />
                        {tx.type === "credit" ? "+" : "-"}{centsToEuro(tx.amount_cents)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
