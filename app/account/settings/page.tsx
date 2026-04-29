"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    users,
    auth,
    addresses as addressesApi,
    type Address,
} from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, X, Plus, Loader, User, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePhotonSearch } from "@/hooks/usePhotonSearch";
import { formatPhotonLabel, photonToAddressFields } from "@/utils/photon";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="mb-6 border border-stone-200">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-3 text-left"
            >
                <span className="text-sm uppercase tracking-wider text-stone-600">{title}</span>
                {open ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </button>
            {open && <div className="p-5">{children}</div>}
        </div>
    );
}

// --- Field row (read-only) --------------------------------------------------

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 text-xs uppercase tracking-wider text-stone-400">{label}</span>
            <span className="text-stone-600">{value}</span>
        </div>
    );
}

export default function SettingsProfilePage() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // -- Profile -------------------------------------------------------------
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "" });
    const [profileError, setProfileError] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // -- Localisation --------------------------------------------------------
    const [locale, setLocale] = useLocalPref("craftea_locale", { country: "France", language: "fr", currency: "EUR" });
    const [editingLocale, setEditingLocale] = useState(false);
    const [localeForm, setLocaleForm] = useState(locale);
    const [localeSaved, setLocaleSaved] = useState(false);

    // -- Password ------------------------------------------------------------
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    // -- Email ----------------------------------------------------------------
    const [editingEmail, setEditingEmail] = useState(false);
    const [emailForm, setEmailForm] = useState({ newEmail: "", confirmEmail: "" });
    const [emailError, setEmailError] = useState("");
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false);

    // -- Communication -------------------------------------------------------
    const [allowPostal, setAllowPostal] = useLocalPref("craftea_allow_postal", false);
    const [allowPhone, setAllowPhone] = useLocalPref("craftea_allow_phone", false);

    // -- Close account -------------------------------------------------------
    const [closeExpanded, setCloseExpanded] = useState(false);
    const [closeConfirm, setCloseConfirm] = useState("");
    const [closeError, setCloseError] = useState("");
    const [closing, setClosing] = useState(false);

    // -- Addresses -----------------------------------------------------------
    const [addressList, setAddressList] = useState<Address[]>([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressForm, setAddressForm] = useState({ label: "", street: "", city: "", postal_code: "", country: "" });
    const [addressError, setAddressError] = useState("");
    const { results: photonResults, search: photonSearch, setResults: photonSetResults } = usePhotonSearch();

    useEffect(() => {
        if (!user) return;
        setProfileForm({ firstname: user.firstname, lastname: user.lastname });

        addressesApi
            .list()
            .then(setAddressList)
            .catch(() => { })
            .finally(() => setAddressLoading(false));
    }, [user]);

    // -- Profile handlers -----------------------------------------------------

    const saveProfile = async () => {
        if (!user) return;
        setProfileError("");
        setProfileSaving(true);
        try {
            await users.update(user.id, profileForm);
            setEditingProfile(false);
            window.location.reload();
        } catch (err: any) {
            setProfileError(err.message || "Erreur");
        } finally {
            setProfileSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setAvatarUploading(true);
        try {
            await users.uploadAvatar(user.id, file);
            window.location.reload();
        } catch {
        } finally {
            setAvatarUploading(false);
        }
    };

    // -- Localisation handlers ------------------------------------------------

    const saveLocale = () => {
        setLocale(localeForm);
        setEditingLocale(false);
        setLocaleSaved(true);
        setTimeout(() => setLocaleSaved(false), 3000);
    };

    // -- Password handlers ----------------------------------------------------

    const savePassword = async () => {
        setPasswordError("");
        setPasswordSuccess(false);
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("Les mots de passe ne correspondent pas");
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères");
            return;
        }
        setPasswordSaving(true);
        try {
            await auth.changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordSuccess(true);
            setTimeout(() => setPasswordSuccess(false), 4000);
        } catch (err: any) {
            setPasswordError(err.message || "Erreur");
        } finally {
            setPasswordSaving(false);
        }
    };

    // -- Email handlers -------------------------------------------------------

    const saveEmail = async () => {
        if (!user) return;
        setEmailError("");
        setEmailSuccess(false);
        if (!emailForm.newEmail || !emailForm.confirmEmail) {
            setEmailError("Veuillez remplir tous les champs");
            return;
        }
        if (emailForm.newEmail !== emailForm.confirmEmail) {
            setEmailError("Les adresses email ne correspondent pas");
            return;
        }
        setEmailSaving(true);
        try {
            await users.update(user.id, { email: emailForm.newEmail });
            setEmailForm({ newEmail: "", confirmEmail: "" });
            setEditingEmail(false);
            setEmailSuccess(true);
            setTimeout(() => { setEmailSuccess(false); window.location.reload(); }, 2000);
        } catch (err: any) {
            setEmailError(err.message || "Erreur");
        } finally {
            setEmailSaving(false);
        }
    };

    // -- Close account handler ------------------------------------------------

    const closeAccount = async () => {
        if (!user) return;
        if (closeConfirm.toLowerCase() !== "fermer") {
            setCloseError("Veuillez taper \"fermer\" pour confirmer");
            return;
        }
        setCloseError("");
        setClosing(true);
        try {
            await users.deactivateSelf();
            logout();
        } catch (err: any) {
            setCloseError(err.message || "Erreur");
            setClosing(false);
        }
    };

    // -- Address handlers -----------------------------------------------------

    const openAddressModal = (address?: Address) => {
        if (address) {
            setEditingAddress(address);
            setAddressForm({
                label: address.label || "",
                street: address.street || "",
                city: address.city || "",
                postal_code: address.postal_code || "",
                country: address.country || "",
            });
        } else {
            setEditingAddress(null);
            setAddressForm({ label: "", street: "", city: "", postal_code: "", country: "" });
        }
        setAddressError("");
        setAddressModalOpen(true);
    };

    const saveAddress = async () => {
        setAddressError("");
        try {
            if (editingAddress) {
                const updated = await addressesApi.update(editingAddress.id, addressForm);
                setAddressList((prev) => prev.map((a) => (a.id === editingAddress.id ? updated : a)));
            } else {
                const created = await addressesApi.create(addressForm);
                setAddressList((prev) => [...prev, created]);
            }
            setAddressModalOpen(false);
        } catch (err: any) {
            setAddressError(err.message || "Erreur");
        }
    };

    const deleteAddress = async (id: number) => {
        try {
            await addressesApi.delete(id);
            setAddressList((prev) => prev.filter((a) => a.id !== id));
        } catch { }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
            year: "numeric", month: "long", day: "numeric",
        });

    if (!user) return null;

    const roleLabels: Record<string, string> = { buyer: "acheteur", artist: "artiste", admin: "admin" };

    return (
        <div>
            <AccountPageHeader icon={User} title="> Paramètres" description="— informations personnelles et paramètres" />

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

            {/* -- Profil -- */}
            <Section title="À propos de vous">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center border border-stone-300 bg-white text-sm uppercase text-stone-600 overflow-hidden">
                            {user.avatar_url ? (
                                <img src={assetUrl(user.avatar_url, "user-images")} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span>{user.firstname?.[0] || "U"}{user.lastname?.[0] || ""}</span>
                            )}
                        </div>
                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            {avatarUploading ? <Loader size={14} className="animate-spin text-white" /> : <Camera size={14} className="text-white" />}
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                        </label>
                    </div>

                    <div className="flex-1 space-y-3">
                        {profileError && (
                            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
                                <AlertDescription>{profileError}</AlertDescription>
                            </Alert>
                        )}

                        {editingProfile ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-wider text-stone-400">prénom</label>
                                        <input
                                            type="text"
                                            value={profileForm.firstname}
                                            onChange={(e) => setProfileForm((f) => ({ ...f, firstname: e.target.value }))}
                                            className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase tracking-wider text-stone-400">nom</label>
                                        <input
                                            type="text"
                                            value={profileForm.lastname}
                                            onChange={(e) => setProfileForm((f) => ({ ...f, lastname: e.target.value }))}
                                            className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={saveProfile} disabled={profileSaving} className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50">
                                        {profileSaving && <Loader size={12} className="animate-spin" />}
                                        {profileSaving ? "enregistrement..." : "enregistrer"}
                                    </button>
                                    <button onClick={() => setEditingProfile(false)} className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800">annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <FieldRow label="nom" value={`${user.firstname} ${user.lastname}`} />
                                        <FieldRow label="membre depuis" value={formatDate(user.created_at)} />
                                        <FieldRow label="rôle" value={roleLabels[user.role]} />
                                        <FieldRow label="statut" value={user.is_active ? "✓ actif" : "○ inactif"} />
                                    </div>
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="flex items-center gap-1.5 self-start text-xs text-stone-400 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
                                    >
                                        <Pencil size={12} /> modifier
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* -- Localisation -- */}
            <Section title="Paramètres de localisation">
                <p className="mb-4 text-xs text-stone-400">Configurez votre pays, votre langue et la devise que vous utilisez.</p>
                {editingLocale ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">pays</label>
                                <select value={localeForm.country} onChange={(e) => setLocaleForm((f) => ({ ...f, country: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600">
                                    {["France", "Belgique", "Suisse", "Canada", "Luxembourg", "Maroc", "Tunisie", "Algérie"].map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">langue</label>
                                <select value={localeForm.language} onChange={(e) => setLocaleForm((f) => ({ ...f, language: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600">
                                    <option value="fr">Français</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">devise</label>
                                <select value={localeForm.currency} onChange={(e) => setLocaleForm((f) => ({ ...f, currency: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600">
                                    <option value="EUR">EUR — €</option>
                                    <option value="USD">USD — $</option>
                                    <option value="GBP">GBP — £</option>
                                    <option value="CHF">CHF — Fr</option>
                                    <option value="CAD">CAD — $</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={saveLocale} className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700">enregistrer</button>
                            <button onClick={() => { setLocaleForm(locale); setEditingLocale(false); }} className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800">annuler</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <FieldRow label="région" value={locale.country} />
                            <FieldRow label="langue" value={locale.language === "fr" ? "Français" : "English"} />
                            <FieldRow label="devise" value={locale.currency} />
                        </div>
                        <div className="flex items-center gap-3">
                            {localeSaved && <span className="text-xs text-stone-400">✓ sauvegardé</span>}
                            <button onClick={() => { setLocaleForm(locale); setEditingLocale(true); }} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5">
                                <Pencil size={12} /> modifier
                            </button>
                        </div>
                    </div>
                )}
            </Section>

            {/* -- Mot de passe -- */}
            <Section title="Mot de passe">
                {passwordSuccess && (
                    <Alert className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                        <AlertDescription className="text-stone-600">✓ Mot de passe modifié avec succès</AlertDescription>
                    </Alert>
                )}
                {passwordError && (
                    <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                        <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-3">
                    {(["current", "new", "confirm"] as const).map((field) => {
                        const labels = { current: "mot de passe actuel", new: "nouveau mot de passe", confirm: "confirmer le nouveau" };
                        const keys = { current: "currentPassword", new: "newPassword", confirm: "confirmPassword" } as const;
                        return (
                            <div key={field} className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">{labels[field]}</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showPasswords[field] ? "text" : "password"}
                                        value={passwordForm[keys[field]]}
                                        onChange={(e) => setPasswordForm((f) => ({ ...f, [keys[field]]: e.target.value }))}
                                        className="flex-1 border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                    <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, [field]: !s[field] }))} className="border border-stone-200 px-3 py-2 text-xs text-stone-400 hover:text-stone-800">
                                        {showPasswords[field] ? "masquer" : "afficher"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-2">
                        <button onClick={savePassword} disabled={passwordSaving} className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50">
                            {passwordSaving && <Loader size={12} className="animate-spin" />}
                            {passwordSaving ? "enregistrement..." : "modifier le mot de passe"}
                        </button>
                    </div>
                </div>
            </Section>

            {/* -- Email -- */}
            <Section title="Email">
                <div className="mb-4 space-y-2">
                    <FieldRow label="email actuel" value={user.email} />
                    <FieldRow label="statut" value={<span className="text-stone-500">confirmé</span>} />
                </div>

                {!editingEmail ? (
                    <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5">
                        <Pencil size={12} /> modifier mon email
                    </button>
                ) : (
                    <div className="space-y-3">
                        {emailSuccess && (
                            <Alert className="rounded-none border border-stone-300 bg-transparent font-mono">
                                <AlertDescription className="text-stone-600">✓ Email modifié avec succès</AlertDescription>
                            </Alert>
                        )}
                        {emailError && (
                            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
                                <AlertDescription>{emailError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">nouvel email</label>
                            <input type="email" value={emailForm.newEmail} onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-stone-400">confirmer le nouvel email</label>
                            <input type="email" value={emailForm.confirmEmail} onChange={(e) => setEmailForm((f) => ({ ...f, confirmEmail: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                        </div>
                        <p className="text-xs text-stone-400">Votre adresse ne changera pas tant que vous ne l&apos;aurez pas confirmée.</p>
                        <div className="flex gap-2">
                            <button onClick={saveEmail} disabled={emailSaving} className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50">
                                {emailSaving && <Loader size={12} className="animate-spin" />}
                                {emailSaving ? "enregistrement..." : "modifier l'email"}
                            </button>
                            <button onClick={() => { setEditingEmail(false); setEmailError(""); setEmailForm({ newEmail: "", confirmEmail: "" }); }} className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800">annuler</button>
                        </div>
                    </div>
                )}
            </Section>

            {/* -- Communication -- */}
            <Section title="Communication">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-stone-700">Courrier postal</p>
                            <p className="mt-0.5 text-xs text-stone-400">Autoriser Craftea à m&apos;envoyer du courrier postal</p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={allowPostal}
                            onClick={() => setAllowPostal(!allowPostal)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${allowPostal ? "bg-stone-800" : "bg-stone-200"}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${allowPostal ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-stone-700">Appels téléphoniques</p>
                            <p className="mt-0.5 text-xs text-stone-400">Autoriser Craftea à me contacter par téléphone</p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={allowPhone}
                            onClick={() => setAllowPhone(!allowPhone)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${allowPhone ? "bg-stone-800" : "bg-stone-200"}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${allowPhone ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                </div>
            </Section>

            {/* -- Adresses -- */}
            <div className="mb-6 border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-3">
                    <span className="text-sm uppercase tracking-wider text-stone-600">Adresses</span>
                    <button onClick={() => openAddressModal()} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5">
                        <Plus size={12} /> nouvelle
                    </button>
                </div>
                <div className="p-5">
                    {addressLoading ? (
                        <div className="py-6 text-center text-stone-400">
                            <Loader size={18} className="inline-block animate-spin" />
                            <p className="mt-2 text-xs">chargement...</p>
                        </div>
                    ) : addressList.length === 0 ? (
                        <p className="py-6 text-center italic text-stone-400">— aucune adresse enregistrée —</p>
                    ) : (
                        <div className="space-y-3">
                            {addressList.map((addr, index) => (
                                <div key={addr.id} className="relative border border-stone-200 p-4">
                                    <span className="absolute -left-3 -top-3 bg-white px-1 text-xs text-stone-300">{String(index + 1).padStart(2, "0")}</span>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            {addr.label && <span className="text-xs uppercase tracking-wider text-stone-400">{addr.label}</span>}
                                            <p className="text-sm text-stone-600">{[addr.street, addr.postal_code, addr.city, addr.country].filter(Boolean).join(", ")}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openAddressModal(addr)} className="text-stone-400 hover:text-stone-800"><Pencil size={13} /></button>
                                            <button onClick={() => deleteAddress(addr.id)} className="text-stone-400 hover:text-stone-800"><X size={13} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* -- Fermer le compte -- */}
            <div className="border border-stone-200">
                <button
                    onClick={() => setCloseExpanded((o) => !o)}
                    className="flex w-full items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-3"
                >
                    <span className="text-sm uppercase tracking-wider text-stone-600">Fermer votre compte</span>
                    {closeExpanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                </button>
                {closeExpanded && (
                    <div className="p-5">
                        <div className="mb-4 space-y-1.5 text-xs text-stone-500">
                            <p className="font-medium text-stone-700">Que se passe-t-il lorsque vous fermez votre compte ?</p>
                            <ul className="mt-2 space-y-1 pl-4">
                                <li>— Votre compte sera inactif, jusqu&apos;à ce que vous procédiez à sa réouverture.</li>
                                <li>— Votre profil et vos fiches n&apos;apparaîtront plus sur Craftea.</li>
                                <li>— Les paramètres de votre compte resteront inchangés.</li>
                                <li>— Personne ne pourra se servir de votre identifiant.</li>
                            </ul>
                            <p className="mt-3">Vous pouvez rouvrir votre compte à tout moment en vous reconnectant.</p>
                        </div>
                        {closeError && (
                            <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                                <AlertDescription>{closeError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">
                                    Tapez <span className="font-medium text-stone-600">fermer</span> pour confirmer
                                </label>
                                <input
                                    type="text"
                                    value={closeConfirm}
                                    onChange={(e) => setCloseConfirm(e.target.value)}
                                    placeholder="fermer"
                                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                />
                            </div>
                            <button
                                onClick={closeAccount}
                                disabled={closing || closeConfirm.toLowerCase() !== "fermer"}
                                className="flex items-center gap-2 border border-red-300 bg-white px-4 py-2 text-xs text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {closing && <Loader size={12} className="animate-spin" />}
                                {closing ? "fermeture en cours..." : "fermer mon compte"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* -- Address Modal -- */}
            {addressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                    <div className="w-full max-w-md border border-stone-300 bg-white p-6 font-mono">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-light text-stone-900">{editingAddress ? "modifier l'adresse" : "nouvelle adresse"}</h3>
                            <button onClick={() => setAddressModalOpen(false)} className="text-stone-400 hover:text-stone-800"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            {addressError && (
                                <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                                    <AlertDescription>{addressError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">libellé</label>
                                <input placeholder="maison, bureau..." value={addressForm.label} onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">rue</label>
                                <div className="relative">
                                    <input
                                        placeholder="123 rue de la Paix"
                                        value={addressForm.street}
                                        onChange={(e) => { setAddressForm((f) => ({ ...f, street: e.target.value })); photonSearch(e.target.value); }}
                                        onBlur={() => setTimeout(() => photonSetResults([]), 150)}
                                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                    {photonResults.length > 0 && (
                                        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto border border-stone-200 bg-white shadow-lg">
                                            {photonResults.map((r, i) => (
                                                <li key={i} onMouseDown={(e) => { e.preventDefault(); const fields = photonToAddressFields(r); setAddressForm((f) => ({ ...f, ...fields })); photonSetResults([]); }} className="cursor-pointer px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">
                                                    {formatPhotonLabel(r)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">code postal</label>
                                    <input placeholder="75001" value={addressForm.postal_code} onChange={(e) => setAddressForm((f) => ({ ...f, postal_code: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">ville</label>
                                    <input placeholder="Paris" value={addressForm.city} onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">pays</label>
                                <input placeholder="France" value={addressForm.country} onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))} className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setAddressModalOpen(false)} className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800">annuler</button>
                                <button onClick={saveAddress} className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700">{editingAddress ? "modifier" : "ajouter"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}