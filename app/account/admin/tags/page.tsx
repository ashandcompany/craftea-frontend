"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  tags as tagsApi,
  type Tag,
} from "@/lib/api";
import {
  Tag as TagIcon, Hourglass, Plus, Trash2, X, Check,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";

export default function AdminTagsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadTags();
  }, [user]);

  const loadTags = () => {
    setLoading(true);
    tagsApi.list()
      .then(setTagsList)
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
      const created = await tagsApi.create({ name: newName.trim() });
      setTagsList((prev) => [...prev, created]);
      setNewName("");
      setShowCreate(false);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce tag ?")) return;
    setActionLoading(true);
    try {
      await tagsApi.delete(id);
      setTagsList((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <AccountPageHeader
        icon={TagIcon}
        title="> Tags"
        description={`— ${tagsList.length} tag${tagsList.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700 transition-colors"
          >
            <Plus size={14} />
            ajouter
          </button>
        }
      />

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 border border-stone-200 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">nouveau tag</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="nom du tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
            />
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
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : tagsList.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <TagIcon size={28} className="mx-auto mb-3 text-stone-300" />
          <p className="text-sm">aucun tag</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tagsList.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-2 border border-stone-200 px-3 py-1.5 hover:border-stone-300 transition-colors"
            >
              <span className="text-sm text-stone-700">{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                disabled={actionLoading}
                className="text-stone-300 hover:text-red-500 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
