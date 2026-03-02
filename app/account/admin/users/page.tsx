"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  users as usersApi,
  type User,
} from "@/lib/api";
import {
  Users, Shield, Hourglass, Search,
  UserCheck, UserX, ChevronDown,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "buyer" | "artist" | "admin">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadUsers();
  }, [user]);

  const loadUsers = () => {
    setLoading(true);
    usersApi.list()
      .then(setUsersList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const handleToggleActive = async (targetUser: User) => {
    setActionLoading(targetUser.id);
    try {
      const updated = await usersApi.toggleActive(targetUser.id);
      setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleChangeRole = async (targetUser: User, newRole: User["role"]) => {
    if (newRole === targetUser.role) return;
    setActionLoading(targetUser.id);
    try {
      const updated = await usersApi.changeRole(targetUser.id, newRole);
      setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const filtered = usersList.filter((u) => {
    const matchSearch =
      !search ||
      `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { buyer: "acheteur", artist: "artiste", admin: "admin" };
    return map[role] || role;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString.replace(" ", "T")).toLocaleDateString("fr-FR", {
      year: "numeric", month: "short", day: "numeric",
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Users size={20} className="text-stone-400" />
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Utilisateurs
          </h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          — {usersList.length} compte{usersList.length > 1 ? "s" : ""} enregistré{usersList.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-stone-200 pl-9 pr-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="appearance-none border border-stone-200 px-3 py-2 pr-8 text-sm text-stone-700 focus:outline-none focus:border-stone-400 bg-white"
          >
            <option value="all">tous les rôles</option>
            <option value="buyer">acheteurs</option>
            <option value="artist">artistes</option>
            <option value="admin">admins</option>
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
          <Users size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="border border-stone-200 divide-y divide-stone-100">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
            <span>nom</span>
            <span>email</span>
            <span>rôle</span>
            <span>statut</span>
            <span>actions</span>
          </div>

          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex flex-col md:grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-4 py-3 md:items-center"
            >
              {/* Name */}
              <div className="min-w-0">
                <p className="text-sm text-stone-800 truncate">
                  {u.firstname} {u.lastname}
                </p>
                <p className="text-[10px] text-stone-400 md:hidden">{u.email}</p>
                <p className="text-[10px] text-stone-400">inscrit le {formatDate(u.created_at)}</p>
              </div>

              {/* Email */}
              <p className="hidden md:block text-sm text-stone-600 truncate">{u.email}</p>

              {/* Role */}
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u, e.target.value as User["role"])}
                  disabled={actionLoading === u.id || u.id === user.id}
                  className="appearance-none border border-stone-200 px-2 py-1 text-xs text-stone-600 bg-white disabled:opacity-50 focus:outline-none focus:border-stone-400"
                >
                  <option value="buyer">acheteur</option>
                  <option value="artist">artiste</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              {/* Status */}
              <div>
                {u.is_active ? (
                  <span className="inline-flex items-center gap-1 border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                    <UserCheck size={10} /> actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                    <UserX size={10} /> inactif
                  </span>
                )}
              </div>

              {/* Actions */}
              <div>
                <button
                  onClick={() => handleToggleActive(u)}
                  disabled={actionLoading === u.id || u.id === user.id}
                  className={`border px-2 py-1 text-[10px] transition-colors disabled:opacity-50 ${
                    u.is_active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {u.is_active ? "désactiver" : "activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
