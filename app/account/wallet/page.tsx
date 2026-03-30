"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  payments as paymentsApi,
  type WalletSnapshot,
  type WalletTransaction,
} from "@/lib/api";
import { BanknoteArrowDown, Loader, Wallet, Landmark, ShieldCheck, ArrowRight } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";

function formatMoneyFromCents(value: number) {
  return (value / 100).toLocaleString("fr-FR", {
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

export default function ArtistWalletPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutEuros, setPayoutEuros] = useState("50");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [wallet, txs] = await Promise.all([
        paymentsApi.walletMe(),
        paymentsApi.myWalletTransactions(),
      ]);
      setSnapshot(wallet);
      setTransactions(txs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger le wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "artist") {
      router.push("/account");
      return;
    }
    void load();
  }, [user, router]);

  if (!user) return null;
  if (user.role !== "artist") return null;

  const payoutCents = Math.round((Number(payoutEuros) || 0) * 100);
  const canPayout =
    !submitting &&
    !!snapshot &&
    snapshot.walletBalance >= payoutCents &&
    payoutCents >= 1000 &&
    snapshot.stripeOnboarded;

  const creditsTotal = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const debitsTotal = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const submitPayout = async () => {
    if (!canPayout) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await paymentsApi.requestPayout(payoutCents);
      setMessage("Retrait envoyé. Le virement Stripe est en cours.");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d'effectuer ce retrait");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AccountPageHeader icon={Wallet} title="> Wallet artiste" description="— solde, retraits et historique des flux" />

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <Loader size={20} className="inline-block animate-spin" />
          <p className="mt-2 text-sm">chargement du wallet...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">solde disponible</p>
              <p className="mt-1 text-2xl text-stone-900">{formatMoneyFromCents(snapshot?.walletBalance ?? 0)}</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">solde en attente</p>
              <p className="mt-1 text-2xl text-stone-900">{formatMoneyFromCents(snapshot?.pendingBalance ?? 0)}</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">état stripe</p>
              <p className="mt-1 text-sm text-stone-800">
                {snapshot?.stripeOnboarded ? "connecté" : "incomplet"}
              </p>
              {snapshot?.stripeAccountId && (
                <p className="mt-1 text-[10px] text-stone-500">{snapshot.stripeAccountId}</p>
              )}
            </div>
          </div>

          {!snapshot?.stripeOnboarded && (
            <div className="border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-amber-800">Stripe Connect n&apos;est pas finalisé.</p>
                  <p className="text-xs text-amber-700">Active ton compte pour autoriser les retraits.</p>
                </div>
                <Link
                  href="/account/settings/artist"
                  className="inline-flex items-center gap-2 border border-amber-400 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100"
                >
                  configurer Stripe <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          <div className="border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-stone-600">
              <Landmark size={16} />
              <p className="text-xs uppercase tracking-wider">demander un retrait</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-60">
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-400">montant (EUR)</label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  value={payoutEuros}
                  onChange={(e) => setPayoutEuros(e.target.value)}
                  className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500"
                />
              </div>
              <button
                onClick={() => void submitPayout()}
                disabled={!canPayout}
                className="inline-flex items-center justify-center gap-2 border border-stone-900 bg-stone-900 px-4 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader size={12} className="animate-spin" /> : <BanknoteArrowDown size={12} />}
                demander le retrait
              </button>
            </div>
            <p className="mt-2 text-[10px] text-stone-500">Minimum de retrait: 10,00 EUR</p>
          </div>

          <div className="border border-stone-200">
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
              <ShieldCheck size={14} className="text-stone-400" />
              <p className="text-xs uppercase tracking-wider text-stone-500">historique wallet</p>
              <p className="ml-auto text-[10px] text-stone-400">
                crédits: {formatMoneyFromCents(creditsTotal)} · débits: {formatMoneyFromCents(debitsTotal)}
              </p>
            </div>

            {transactions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-stone-500">Aucune transaction pour le moment.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-2">date</th>
                      <th className="px-4 py-2">type</th>
                      <th className="px-4 py-2">statut</th>
                      <th className="px-4 py-2">description</th>
                      <th className="px-4 py-2 text-right">montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-stone-100">
                        <td className="px-4 py-2 text-xs text-stone-500">{formatDate(tx.created_at)}</td>
                        <td className="px-4 py-2 text-xs text-stone-700">{tx.type}</td>
                        <td className="px-4 py-2 text-xs text-stone-600">{tx.status}</td>
                        <td className="px-4 py-2 text-xs text-stone-700">{tx.description}</td>
                        <td className={`px-4 py-2 text-right font-mono ${tx.type === "credit" ? "text-green-700" : "text-stone-700"}`}>
                          {tx.type === "credit" ? "+" : "-"}{formatMoneyFromCents(tx.amount_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
