"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  categories as categoriesApi,
  type Category,
} from "@/lib/api";
import {
  FolderOpen, Hourglass, Plus, Pencil, Trash2, X, Check,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit form
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadCategories();
  }, [user]);

  const loadCategories = () => {
    setLoading(true);
    categoriesApi.list()
      .then(setCategoriesList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setActionLoading(true);
    try {
      const created = await categoriesApi.create({ name: newName.trim(), description: newDescription.trim() || undefined });
      setCategoriesList((prev) => [...prev, created]);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    setActionLoading(true);
    try {
      const updated = await categoriesApi.update(editId, { name: editName.trim(), description: editDescription.trim() || undefined });
      setCategoriesList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditId(null);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    setActionLoading(true);
    try {
      await categoriesApi.delete(id);
      setCategoriesList((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setShowCreate(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FolderOpen size={20} className="text-stone-400" />
              <h1 className="text-2xl font-light tracking-tight text-stone-900">
                Catégories
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              — {categoriesList.length} catégorie{categoriesList.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); setEditId(null); }}
            className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700 transition-colors"
          >
            <Plus size={14} />
            ajouter
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 border border-stone-200 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">nouvelle catégorie</p>
          <input
            type="text"
            placeholder="nom de la catégorie"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
          />
          <input
            type="text"
            placeholder="description (optionnel)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={actionLoading || !newName.trim()}
              className="flex items-center gap-1.5 border border-green-600 bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check size={12} /> créer
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-1.5 border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <X size={12} /> annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <FolderOpen size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucune catégorie</p>
        </div>
      ) : (
        <div className="border border-stone-200 divide-y divide-stone-100">
          {categoriesList.map((cat) => (
            <div key={cat.id} className="px-4 py-3">
              {editId === cat.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-stone-200 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="description (optionnel)"
                    className="w-full border border-stone-200 px-3 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={actionLoading || !editName.trim()}
                      className="flex items-center gap-1.5 border border-green-600 bg-green-600 px-2 py-1 text-[10px] text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check size={10} /> enregistrer
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 border border-stone-200 px-2 py-1 text-[10px] text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      <X size={10} /> annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-800">{cat.name}</p>
                    {cat.description && (
                      <p className="text-[10px] text-stone-400 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(cat)}
                      className="border border-stone-200 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={actionLoading}
                      className="border border-red-200 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
