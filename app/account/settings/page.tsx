"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    users,
    addresses as addressesApi,
    type Address,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, X, Plus, Loader } from "lucide-react";

export default function SettingsProfilePage() {
    const { user } = useAuth();

    // Profile editing
    const [editing, setEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "", email: "" });
    const [profileError, setProfileError] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    // Addresses
    const [addressList, setAddressList] = useState<Address[]>([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressForm, setAddressForm] = useState({ label: "", street: "", city: "", postal_code: "", country: "" });
    const [addressError, setAddressError] = useState("");

    useEffect(() => {
        if (!user) return;
        setProfileForm({ firstname: user.firstname, lastname: user.lastname, email: user.email });

        addressesApi
            .list()
            .then(setAddressList)
            .catch(() => { })
            .finally(() => setAddressLoading(false));
    }, [user]);

    const saveProfile = async () => {
        if (!user) return;
        setProfileError("");
        setProfileSaving(true);
        try {
            await users.update(user.id, profileForm);
            setEditing(false);
            window.location.reload();
        } catch (err: any) {
            setProfileError(err.message || "Erreur");
        } finally {
            setProfileSaving(false);
        }
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user) return null;

    const roleLabels: Record<string, string> = {
        buyer: "acheteur",
        artist: "artiste",
        admin: "admin"
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8 border-b border-stone-200 pb-6">
                <h1 className="text-2xl font-light tracking-tight text-stone-900">Mon profil</h1>
                <p className="mt-1 text-sm text-stone-500">{"—"} informations personnelles et adresses</p>
            </div>

            {/* Profile Card */}
            <div className="mb-10 border border-stone-200">
                {/* Header */}
                <div className="border-b border-stone-200 bg-stone-50 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center border border-stone-300 bg-white text-sm uppercase text-stone-600">
                                {user.firstname?.[0] || "U"}{user.lastname?.[0] || ""}
                            </div>
                            <div>
                                <h2 className="text-lg text-stone-800">
                                    {user.firstname} {user.lastname}
                                </h2>
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                    <span className={user.role === 'admin' ? 'text-stone-600' : 'text-stone-500'}>
                                        #{roleLabels[user.role]}
                                    </span>
                                    <span className="text-stone-300">|</span>
                                    <span className={user.is_active ? "text-stone-600" : "text-stone-400"}>
                                        {user.is_active ? "✓ actif" : "○ inactif"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
                        >
                            {editing ? <><X size={12} /> annuler</> : <><Pencil size={12} /> modifier</>}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {profileError && (
                        <Alert variant="destructive" className="mb-4 rounded-none border border-stone-300 bg-transparent font-mono">
                            <AlertDescription>{profileError}</AlertDescription>
                        </Alert>
                    )}

                    {editing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">pr{"é"}nom</label>
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
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={saveProfile}
                                    disabled={profileSaving}
                                    className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                                >
                                    {profileSaving && <Loader size={12} className="animate-spin" />}
                                    {profileSaving ? "enregistrement..." : "enregistrer"}
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                                >
                                    annuler
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-16 text-xs uppercase tracking-wider text-stone-400">email</span>
                                <span className="text-stone-600">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-16 text-xs uppercase tracking-wider text-stone-400">r{"ô"}le</span>
                                <span className="text-stone-600">{roleLabels[user.role]}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-16 text-xs uppercase tracking-wider text-stone-400">inscrit</span>
                                <span className="text-stone-600">{formatDate(user.created_at)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Addresses */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-light tracking-tight text-stone-900">Adresses</h2>
                <button
                    onClick={() => openAddressModal()}
                    className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 border-b border-stone-200 hover:border-stone-800 pb-0.5"
                >
                    <Plus size={12} /> nouvelle
                </button>
            </div>

            {addressLoading ? (
                <div className="py-10 text-center text-stone-400">
                    <Loader size={20} className="inline-block animate-spin" />
                    <p className="mt-2 text-xs">chargement des adresses...</p>
                </div>
            ) : addressList.length === 0 ? (
                <div className="border border-stone-200 py-12 text-center">
                    <p className="text-stone-400 italic">{"—"} aucune adresse enregistr{"é"}e {"—"}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {addressList.map((addr, index) => (
                        <div key={addr.id} className="relative border border-stone-200 p-5">
                            <span className="absolute -left-3 -top-3 text-xs text-stone-300 bg-white px-1">
                                {String(index + 1).padStart(2, '0')}
                            </span>

                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    {addr.label && (
                                        <span className="text-xs uppercase tracking-wider text-stone-400">{addr.label}</span>
                                    )}
                                    <p className="text-sm text-stone-600">
                                        {[addr.street, addr.postal_code, addr.city, addr.country]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openAddressModal(addr)}
                                        className="text-stone-400 hover:text-stone-800"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteAddress(addr.id)}
                                        className="text-stone-400 hover:text-stone-800"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Address Modal */}
            {addressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                    <div className="w-full max-w-md border border-stone-300 bg-white p-6 font-mono">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-light text-stone-900">
                                {editingAddress ? "modifier l'adresse" : "nouvelle adresse"}
                            </h3>
                            <button
                                onClick={() => setAddressModalOpen(false)}
                                className="text-stone-400 hover:text-stone-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {addressError && (
                                <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                                    <AlertDescription>{addressError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">libell{"é"}</label>
                                <input
                                    placeholder="maison, bureau..."
                                    value={addressForm.label}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">rue</label>
                                <input
                                    placeholder="123 rue de la Paix"
                                    value={addressForm.street}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">code postal</label>
                                    <input
                                        placeholder="75001"
                                        value={addressForm.postal_code}
                                        onChange={(e) => setAddressForm((f) => ({ ...f, postal_code: e.target.value }))}
                                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-stone-400">ville</label>
                                    <input
                                        placeholder="Paris"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                                        className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-stone-400">pays</label>
                                <input
                                    placeholder="France"
                                    value={addressForm.country}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => setAddressModalOpen(false)}
                                    className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                                >
                                    annuler
                                </button>
                                <button
                                    onClick={saveAddress}
                                    className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
                                >
                                    {editingAddress ? "modifier" : "ajouter"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
