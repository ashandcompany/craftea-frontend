"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { users } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Loader, Download, Trash2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// --- Local storage helpers --------------------------------------------------

function useLocalPref<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored ? (JSON.parse(stored) as T) : defaultValue;
        } catch {
            return defaultValue;
        }
    });
    const set = (v: T) => {
        setValue(v);
        localStorage.setItem(key, JSON.stringify(v));
    };
    return [value, set] as const;
}

// --- Collapsible section ----------------------------------------------------

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
        <div className={`mb-6 border ${danger ? "border-red-200" : "border-stone-200"}`}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={`flex w-full items-center justify-between border-b px-5 py-3 text-left ${danger ? "border-red-200 bg-red-50" : "border-stone-200 bg-stone-50"}`}
            >
                <span className={`text-sm uppercase tracking-wider ${danger ? "text-red-600" : "text-stone-600"}`}>{title}</span>
                {open ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </button>
            {open && <div className="p-5">{children}</div>}
        </div>
    );
}

export default function PrivacySettingsPage() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // ── Repérabilité ──────────────────────────────────────────────────────
    const [findableByEmail, setFindableByEmail] = useLocalPref("craftea_findable_by_email", true);

    // ── Consentement cookies ──────────────────────────────────────────────
    const [adPersonalization, setAdPersonalization] = useLocalPref("craftea_ad_personalization", true);
    const [analytics, setAnalytics] = useLocalPref("craftea_analytics", true);
    const [consentSaved, setConsentSaved] = useState(false);

    const saveConsent = () => {
        setConsentSaved(true);
        setTimeout(() => setConsentSaved(false), 3000);
    };

    // ── Historique ────────────────────────────────────────────────────────
    const [historyCleared, setHistoryCleared] = useState(false);

    const clearHistory = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("craftea_recently_viewed");
        }
        setHistoryCleared(true);
        setTimeout(() => setHistoryCleared(false), 3000);
    };

    // ── Suppression compte ────────────────────────────────────────────────
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    const deleteAccount = async () => {
        if (!user) return;
        if (deleteConfirm.toLowerCase() !== "supprimer") {
            setDeleteError('Veuillez taper "supprimer" pour confirmer');
            return;
        }
        setDeleteError("");
        setDeleting(true);
        try {
            await users.deactivateSelf();
            logout();
        } catch (err: any) {
            setDeleteError(err.message || "Erreur");
            setDeleting(false);
        }
    };

    if (!user) return null;

    return (
        <div>
            <AccountPageHeader
                icon={Lock}
                title="> Paramètres"
                description="— gestion de vos données et paramètres de confidentialité"
            />

            {/* Sub-nav tabs */}
            <div className="mb-8 flex gap-0 border-b border-stone-200">
                {[
                    { href: "/account/settings", label: "Mon profil" },
                    { href: "/account/settings/privacy", label: "Confidentialité" },
                ].map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                            pathname === tab.href
                                ? "border-stone-800 text-stone-800 font-medium"
                                : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* ── Articles consultés récemment ── */}
            <Section title="Articles consultés récemment">
                <p className="mb-4 text-sm text-stone-600">
                    Effacez la liste des articles consultés récemment. Les fiches produits que vous
                    consulterez par la suite seront à nouveau enregistrées.
                </p>
                {historyCleared && (
                    <Alert className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                        <AlertDescription className="text-stone-600">✓ Historique effacé</AlertDescription>
                    </Alert>
                )}
                <button
                    onClick={clearHistory}
                    className="flex items-center gap-2 border border-stone-300 px-4 py-2 text-xs text-stone-600 hover:border-stone-600 hover:text-stone-800"
                >
                    <Trash2 size={13} />
                    effacer l&apos;historique
                </button>
            </Section>

            {/* ── Télécharger les données ── */}
            <Section title="Télécharger mes données">
                <p className="mb-4 text-sm text-stone-600">
                    Téléchargez un fichier contenant vos informations personnelles enregistrées sur Craftea
                    (informations de profil, adresses, commandes).
                </p>
                <button
                    onClick={() => alert("Fonctionnalité à venir")}
                    className="flex items-center gap-2 border border-stone-300 px-4 py-2 text-xs text-stone-600 hover:border-stone-600 hover:text-stone-800"
                >
                    <Download size={13} />
                    télécharger mes données
                </button>
            </Section>

            {/* ── Repérabilité ── */}
            <Section title="Paramètres de repérabilité">
                <p className="mb-4 text-sm text-stone-600">
                    Souhaitez-vous pouvoir être retrouvé via votre adresse email ?
                    Celle-ci ne sera jamais affichée publiquement.
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-stone-700">Être trouvable par email</p>
                        <p className="mt-0.5 text-xs text-stone-400">
                            Permet à d&apos;autres utilisateurs de vous trouver à partir de votre adresse email
                        </p>
                    </div>
                    <button
                        role="switch"
                        aria-checked={findableByEmail}
                        onClick={() => setFindableByEmail(!findableByEmail)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${findableByEmail ? "bg-stone-800" : "bg-stone-200"}`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${findableByEmail ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                </div>
            </Section>

            {/* ── Consentement & cookies ── */}
            <Section title="Paramètres de confidentialité">
                <p className="mb-4 text-sm text-stone-600">
                    Afin de vous fournir la meilleure expérience possible, nous utilisons des cookies
                    et technologies similaires à des fins de performance, d&apos;analyse et de personnalisation.
                </p>

                <div className="space-y-4 mb-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-stone-700">Cookies essentiels</p>
                            <p className="mt-0.5 text-xs text-stone-400">
                                Nécessaires au fonctionnement du site — ne peuvent pas être désactivés
                            </p>
                        </div>
                        <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-stone-800 opacity-50 cursor-not-allowed">
                            <span className="inline-block h-3.5 w-3.5 translate-x-4 transform rounded-full bg-white shadow" />
                        </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-stone-700">Cookies analytiques</p>
                            <p className="mt-0.5 text-xs text-stone-400">
                                Nous aident à comprendre comment vous utilisez Craftea
                            </p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={analytics}
                            onClick={() => setAnalytics(!analytics)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${analytics ? "bg-stone-800" : "bg-stone-200"}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${analytics ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                    </div>

                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-stone-700">Personnalisation publicitaire</p>
                            <p className="mt-0.5 text-xs text-stone-400">
                                Désactivez pour refuser la « vente » ou le « partage » de vos données personnelles
                            </p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={adPersonalization}
                            onClick={() => setAdPersonalization(!adPersonalization)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${adPersonalization ? "bg-stone-800" : "bg-stone-200"}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${adPersonalization ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={saveConsent}
                        className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
                    >
                        enregistrer les préférences
                    </button>
                    {consentSaved && <span className="text-xs text-stone-400">✓ sauvegardé</span>}
                </div>
            </Section>

            {/* ── Suppression définitive du compte ── */}
            <Section title="Supprimer définitivement votre compte" danger>
                <div className="mb-4 space-y-1.5 text-sm text-stone-600">
                    <p className="font-medium text-stone-800">
                        Une fois supprimé, votre compte ne pourra pas être restauré.
                    </p>
                    <ul className="mt-2 space-y-1 pl-4 text-xs text-stone-500">
                        <li>— Toutes vos données personnelles seront effacées.</li>
                        <li>— Vos commandes et votre historique ne seront plus accessibles.</li>
                        <li>— Votre profil et vos fiches n&apos;apparaîtront plus sur Craftea.</li>
                        <li>— Cette action est irréversible.</li>
                    </ul>
                </div>

                {deleteError && (
                    <Alert variant="destructive" className="mb-4 rounded-none border border-red-200 bg-transparent font-mono">
                        <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-stone-400">
                            Tapez <span className="font-medium text-stone-600">supprimer</span> pour confirmer
                        </label>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="supprimer"
                            className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600 max-w-xs"
                        />
                    </div>
                    <button
                        onClick={deleteAccount}
                        disabled={deleting || deleteConfirm.toLowerCase() !== "supprimer"}
                        className="flex items-center gap-2 border border-red-400 bg-red-500 px-4 py-2 text-xs text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {deleting && <Loader size={12} className="animate-spin" />}
                        {deleting ? "suppression en cours..." : "supprimer définitivement mon compte"}
                    </button>
                </div>
            </Section>
        </div>
    );
}
