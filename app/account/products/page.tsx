"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, X, Package, Search, Loader, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  artists as artistsApi,
  products as productsApi,
  shops as shopsApi,
  categories as categoriesApi,
  tags as tagsApi,
  type ArtistProfile,
  type Shop,
  type Product,
  type Category,
  type Tag,
  ApiError,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assetUrl } from "@/lib/utils";

type ProductFormData = {
  shop_id: number;
  category_id: number | undefined;
  title: string;
  description: string;
  price: string;
  stock: string;
  creation_time: string;
  delivery_time: string;
  tags: number[];
};

const emptyForm: ProductFormData = {
  shop_id: 0,
  category_id: undefined,
  title: "",
  description: "",
  price: "",
  stock: "",
  creation_time: "",
  delivery_time: "",
  tags: [],
};

export default function AccountProductsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [noProfile, setNoProfile] = useState(false);

  // Filters
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  
  // Images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [orderedExistingImages, setOrderedExistingImages] = useState<{ id: number; image_url?: string }[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    if (!user || user.role !== "artist") return;

    const init = async () => {
      try {
        const [profile, cats, tagsList] = await Promise.all([
          artistsApi.me(),
          categoriesApi.list(),
          tagsApi.list(),
        ]);
        setArtistProfile(profile);
        setCategories(cats);
        setAllTags(tagsList);

        const shopsList = profile.shops || [];
        setShops(shopsList);

        if (shopsList.length > 0) {
          setSelectedShopId(shopsList[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNoProfile(true);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  // Load products when shop changes
  const loadProducts = useCallback(async () => {
    if (!selectedShopId) {
      setProductsList([]);
      return;
    }
    setProductsLoading(true);
    try {
      const res = await productsApi.list({ shop_id: selectedShopId, limit: 100, include_inactive: true });
      setProductsList(res.data);
    } catch {
      setProductsList([]);
    } finally {
      setProductsLoading(false);
    }
  }, [selectedShopId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Open modal for create/edit
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setOrderedExistingImages(
        [...(product.images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      );
      setForm({
        shop_id: product.shop_id,
        category_id: product.category_id || undefined,
        title: product.title || "",
        description: product.description || "",
        price: product.price != null ? String(product.price) : "",
        stock: String(product.stock ?? 0),
        creation_time: product.creation_time != null ? String(product.creation_time) : "",
        delivery_time: product.delivery_time != null ? String(product.delivery_time) : "",
        tags: product.tags?.map((t) => t.id) || [],
      });
    } else {
      setEditingProduct(null);
      setOrderedExistingImages([]);
      setForm({ ...emptyForm, shop_id: selectedShopId || shops[0]?.id || 0 });
    }
    setSelectedImages([]);
    setImagesToDelete([]);
    setFormError("");
    setImageUploadError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setSelectedImages([]);
    setImagesToDelete([]);
    setOrderedExistingImages([]);
    setFormError("");
    setImageUploadError(null);
    setDragOverIndex(null);
  };

  const saveProduct = async () => {
    setFormError("");
    
    // Validation
    if (!form.title.trim()) {
      setFormError("Le titre est requis");
      return;
    }
    if (!form.shop_id) {
      setFormError("Sélectionnez une boutique");
      return;
    }
    if (form.price && isNaN(parseFloat(form.price))) {
      setFormError("Le prix doit être un nombre valide");
      return;
    }
    if (form.stock && isNaN(parseInt(form.stock, 10))) {
      setFormError("Le stock doit être un nombre valide");
      return;
    }

    setFormSaving(true);
    try {
      const payload: any = {
        shop_id: form.shop_id,
        category_id: form.category_id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        stock: form.stock ? parseInt(form.stock, 10) : 0,
        creation_time: form.creation_time ? parseInt(form.creation_time, 10) : undefined,
        delivery_time: form.delivery_time ? parseInt(form.delivery_time, 10) : undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
      };

      // Add selected images
      if (selectedImages.length > 0) {
        payload.images = selectedImages;
      }

      if (editingProduct) {
        // Send images to delete
        if (imagesToDelete.length > 0) {
          payload.images_to_delete = imagesToDelete;
        }
        // Send the current image order (existing images not marked for deletion)
        const remainingImages = orderedExistingImages
          .filter((img) => !imagesToDelete.includes(img.id));
        if (remainingImages.length > 0) {
          payload.image_order = remainingImages.map((img) => img.id);
        }
        const updated = await productsApi.update(editingProduct.id, payload);
        setProductsList((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      } else {
        await productsApi.create(payload);
        // Reload to get full product data with relations
        await loadProducts();
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setFormSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await productsApi.toggleActive(product.id);
      setProductsList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch {}
  };

  const deleteProduct = async (id: number) => {
    try {
      await productsApi.delete(id);
      setProductsList((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    } catch {}
  };

  const toggleTag = (tagId: number) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter((t) => t !== tagId) : [...f.tags, tagId],
    }));
  };

  // Image handling
  const handleImagesSelect = (files: FileList | null) => {
    if (!files) return;
    
    setImageUploadError(null);
    
    // Validate file types and sizes
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setImageUploadError("Seuls les fichiers image sont acceptés");
        return;
      }
      if (file.size > maxSize) {
        setImageUploadError("Les images ne doivent pas dépasser 5MB");
        return;
      }
      validFiles.push(file);
    });
    
    setSelectedImages((prev) => [...prev, ...validFiles]);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    if (editingProduct) {
      setImagesToDelete((prev) => [...prev, imageId]);
    }
  };

  const undoRemoveExistingImage = (imageId: number) => {
    setImagesToDelete((prev) => prev.filter((id) => id !== imageId));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setOrderedExistingImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      moveImage(sourceIndex, targetIndex);
    }
    
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Filter products
  const filteredProducts = productsList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  });

  if (!user) return null;

  if (user.role !== "artist") {
    return (
      <div className="font-mono">
        <div className="mb-8 border-b border-stone-200 pb-6">
          <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes produits</h1>
        </div>
        <div className="border border-stone-200 p-12 text-center">
          <p className="text-sm text-stone-600 mb-1">Section réservée aux artistes</p>
          <p className="text-xs text-stone-400">Passez en compte artiste pour gérer vos produits</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="font-mono">
        <div className="mb-8 border-b border-stone-200 pb-6">
          <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes produits</h1>
          <p className="mt-1 text-sm text-stone-500">— gestion du catalogue</p>
        </div>
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block"><Loader className="h-5 w-5 animate-spin" /></div>
          <p className="mt-2 text-xs">chargement...</p>
        </div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="font-mono">
        <div className="mb-8 border-b border-stone-200 pb-6">
          <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes produits</h1>
          <p className="mt-1 text-sm text-stone-500">— gestion du catalogue</p>
        </div>
        <div className="border border-stone-200 p-12 text-center">
          <p className="text-sm text-stone-600 mb-1">Profil artiste non configuré</p>
          <p className="text-xs text-stone-400 mb-4">Créez d'abord votre profil artiste et une boutique</p>
          <Link
            href="/account/settings/shop"
            className="inline-block border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
          >
            configurer mon profil →
          </Link>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="font-mono">
        <div className="mb-8 border-b border-stone-200 pb-6">
          <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes produits</h1>
          <p className="mt-1 text-sm text-stone-500">— gestion du catalogue</p>
        </div>
        <div className="border border-stone-200 p-12 text-center">
          <p className="text-sm text-stone-600 mb-1">Aucune boutique</p>
          <p className="text-xs text-stone-400 mb-4">Créez une boutique avant d'ajouter des produits</p>
          <Link
            href="/account/settings/shop"
            className="inline-block border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
          >
            créer une boutique →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono">
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-stone-900">Mes produits</h1>
            <p className="mt-1 text-sm text-stone-500">— gestion du catalogue</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
          >
            <span className="text-sm">+</span> nouveau produit
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Shop selector */}
        {shops.length > 1 && (
          <div className="relative">
            <select
              value={selectedShopId || ""}
              onChange={(e) => setSelectedShopId(Number(e.target.value))}
              className="appearance-none border border-stone-200 bg-white px-3 py-2 pr-8 text-xs text-stone-700 outline-none focus:border-stone-400"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || `Boutique #${s.id}`}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
              ▼
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"><Search className="h-4 w-4" /></span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="rechercher un produit..."
            className="w-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-700 outline-none focus:border-stone-400"
          />
        </div>

        <p className="text-[10px] text-stone-400">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Products list */}
      {productsLoading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block"><Loader className="h-5 w-5 animate-spin" /></div>
          <p className="mt-2 text-xs">chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-stone-200 py-16 text-center">
          {searchQuery ? (
            <>
              <p className="text-stone-400 text-sm">— aucun résultat pour "{searchQuery}" —</p>
            </>
          ) : (
            <>
              <p className="text-stone-400 italic text-sm">— aucun produit —</p>
              <button
                onClick={() => openModal()}
                className="mt-4 inline-flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700"
              >
                <span className="text-sm">+</span> créer mon premier produit
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header - desktop only */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-stone-400">
            <div className="col-span-1">#</div>
            <div className="col-span-4">titre</div>
            <div className="col-span-2">catégorie</div>
            <div className="col-span-1 text-right">prix</div>
            <div className="col-span-1 text-right">stock</div>
            <div className="col-span-1 text-center">statut</div>
            <div className="col-span-2 text-right">actions</div>
          </div>

          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`relative border border-stone-200 p-4 transition-colors hover:border-stone-300 ${
                !product.is_active ? "opacity-60" : ""
              }`}
            >
              {/* Desktop row */}
              <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-1 text-xs text-stone-300">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-3">
                    {product.images?.[0]?.image_url ? (
                      <img
                        src={assetUrl(product.images[0].image_url, "product-images")}
                        alt=""
                        className="h-10 w-10 shrink-0 border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-stone-200 bg-stone-50">
                        <Package className="h-5 w-5 text-stone-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/products/${product.id}`}
                        className="block truncate text-sm text-stone-800 hover:underline"
                      >
                        {product.title || "sans titre"}
                      </Link>
                      {product.tags && product.tags.length > 0 && (
                        <div className="mt-0.5 flex gap-1">
                          {product.tags.slice(0, 2).map((t) => (
                            <span key={t.id} className="text-[10px] text-stone-400">
                              #{t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-stone-500 truncate">
                  {product.category?.name || "—"}
                </div>
                <div className="col-span-1 text-right text-sm text-stone-800">
                  {product.price != null ? `${Number(product.price).toFixed(2)}€` : "—"}
                </div>
                <div className="col-span-1 text-right">
                  <span
                    className={`text-xs ${
                      product.stock > 0 ? "text-stone-600" : "text-stone-400"
                    }`}
                  >
                    {product.stock}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      product.is_active ? "text-stone-600" : "text-stone-400"
                    }`}
                  >
                    {product.is_active ? "✓ actif" : "inactif"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => toggleActive(product)}
                    className="p-1.5 text-stone-400 hover:text-stone-700"
                    title={product.is_active ? "Désactiver" : "Activer"}
                  >
                    {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openModal(product)}
                    className="p-1.5 text-stone-400 hover:text-stone-700"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {deletingId === product.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 text-[10px]"
                      >
                        oui
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 text-[10px]"
                      >
                        non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(product.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500"
                      title="Supprimer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile card */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-start gap-3">
                  {product.images?.[0]?.image_url ? (
                    <img
                      src={assetUrl(product.images[0].image_url, "product-images")}
                      alt=""
                      className="h-14 w-14 shrink-0 border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-stone-200 bg-stone-50">
                      <Package className="h-6 w-6 text-stone-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.id}`}
                      className="block text-sm text-stone-800 hover:underline"
                    >
                      {product.title || "sans titre"}
                    </Link>
                    <p className="text-xs text-stone-500">{product.category?.name || "—"}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-stone-800">
                        {product.price != null ? `${Number(product.price).toFixed(2)}€` : "—"}
                      </span>
                      <span className={product.stock > 0 ? "text-stone-600" : "text-stone-400"}>
                        stock: {product.stock}
                      </span>
                      <span className={`text-[10px] ${product.is_active ? "text-stone-600" : "text-stone-400"}`}>
                        {product.is_active ? "✓" : "○"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-stone-100 pt-2">
                  <button
                    onClick={() => toggleActive(product)}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700"
                  >
                    {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {product.is_active ? "désactiver" : "activer"}
                  </button>
                  <span className="text-stone-200">|</span>
                  <button
                    onClick={() => openModal(product)}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700"
                  >
                    <Pencil className="h-4 w-4" /> modifier
                  </button>
                  <span className="text-stone-200">|</span>
                  <button
                    onClick={() =>
                      deletingId === product.id
                        ? deleteProduct(product.id)
                        : setDeletingId(product.id)
                    }
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" /> {deletingId === product.id ? "confirmer ?" : "supprimer"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 pt-16">
          <div className="w-full max-w-lg border border-stone-300 bg-white p-6 font-mono">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-light text-stone-900">
                {editingProduct ? "modifier le produit" : "nouveau produit"}
              </h3>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {formError && (
                <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {/* Shop selector */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-400">boutique *</label>
                <div className="relative">
                  <select
                    value={form.shop_id}
                    onChange={(e) => setForm((f) => ({ ...f, shop_id: Number(e.target.value) }))}
                    className="w-full appearance-none border border-stone-200 bg-white px-3 py-2 pr-8 text-sm text-stone-800 outline-none focus:border-stone-600"
                  >
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Boutique #${s.id}`}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-400">titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="nom du produit"
                  className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-400">description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="description du produit..."
                  className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600 resize-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-stone-400">catégorie</label>
                <div className="relative">
                  <select
                    value={form.category_id || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category_id: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full appearance-none border border-stone-200 bg-white px-3 py-2 pr-8 text-sm text-stone-800 outline-none focus:border-stone-600"
                  >
                    <option value="">— aucune —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-stone-400">prix (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-stone-400">stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                  />
                </div>
              </div>

              {/* Creation time + Delivery time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-stone-400">fabrication (jours)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.creation_time}
                    onChange={(e) => setForm((f) => ({ ...f, creation_time: e.target.value }))}
                    placeholder="—"
                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-stone-400">livraison (jours)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.delivery_time}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_time: e.target.value }))}
                    placeholder="—"
                    className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                  />
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-stone-400">tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                          form.tags.includes(tag.id)
                            ? "border border-stone-800 bg-stone-800 text-stone-50"
                            : "border border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing images */}
              {editingProduct && orderedExistingImages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-stone-400">
                    images actuelles <span className="normal-case text-stone-300">— glissez pour réordonner</span>
                  </label>
                  <div className="space-y-1.5">
                    {orderedExistingImages.map((img, index) => {
                      const isDeleted = imagesToDelete.includes(img.id);
                      return (
                        <div
                          key={img.id}
                          draggable={!isDeleted}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragLeave={handleDragLeave}
                          className={`flex items-center gap-2 border border-stone-200 p-1.5 transition-all ${
                            isDeleted ? "opacity-30" : "hover:border-stone-300"
                          } ${dragOverIndex === index ? "border-stone-600 bg-stone-50" : ""}`}
                        >
                          {/* Drag handle */}
<div className="cursor-grab text-stone-300 hover:text-stone-500 shrink-0">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="4" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16" r="1.5" />
                          </svg>
                          </div>

                          {/* Thumbnail */}
                          <img
                            src={assetUrl(img.image_url, "product-images")}
                            alt=""
                            className="h-16 w-16 shrink-0 object-cover border border-stone-100"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {index === 0 && !isDeleted && (
                              <span className="text-[10px] uppercase tracking-wider text-stone-500 bg-stone-100 px-1.5 py-0.5">
                                principale
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          {isDeleted ? (
                            <button
                              type="button"
                              onClick={() => undoRemoveExistingImage(img.id)}
                              className="text-[10px] text-stone-500 hover:text-stone-800 px-2 py-1 border border-stone-200 shrink-0"
                            >
                              annuler
                            </button>
                          ) : (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => index > 0 && moveImage(index, index - 1)}
                                disabled={index === 0}
                                className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Monter"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => index < orderedExistingImages.length - 1 && moveImage(index, index + 1)}
                                disabled={index === orderedExistingImages.length - 1}
                                className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Descendre"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(img.id)}
                                className="p-1 text-stone-300 hover:text-red-500"
                                title="Supprimer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New images */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-stone-400">
                  ajouter des images
                </label>
                
                {imageUploadError && (
                  <p className="text-[10px] text-red-500">{imageUploadError}</p>
                )}
                
                <div 
                  className="relative border-2 border-dashed border-stone-200 p-4 text-center bg-stone-50 hover:border-stone-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImagesSelect(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImagesSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="text-stone-400 hover:text-stone-600 transition-colors">
                    <div className="text-2xl mb-1"><Package className="h-8 w-8 mb-2 mx-auto" strokeWidth={1}/></div>
                    <p className="text-[11px]">cliquez ou glissez des images</p>
                    <p className="text-[9px] text-stone-300 mt-1">PNG, JPG jusqu'à 5MB</p>
                  </div>
                </div>

                {/* Selected images preview */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-stone-500">nouvelles images ({selectedImages.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative border border-stone-200 overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1"
                            title="Supprimer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 py-0.5 truncate">
                            {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={closeModal}
                className="border border-stone-200 px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
              >
                annuler
              </button>
              <button
                onClick={saveProduct}
                disabled={formSaving}
                className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
              >
                {formSaving && <Loader className="h-4 w-4 animate-spin" />}
                {formSaving
                  ? "enregistrement..."
                  : editingProduct
                  ? "modifier"
                  : "créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}