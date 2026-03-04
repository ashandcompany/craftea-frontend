"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  shops as shopsApi,
  type Shop,
  type ShopShippingProfile,
  type ShopShippingMethod,
  type ShippingZone,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader,
  Check,
  Store,
  ArrowLeft,
  Truck,
  AlertTriangle,
  Info,
  Plus,
  X,
} from "lucide-react";

type ShippingZoneLabel = "france" | "europe" | "world";

const ZONE_LABELS: Record<ShippingZoneLabel, { name: string; description: string }> = {
  france: {
    name: "France",
    description: "France métropolitaine et DROM-COM",
  },
  europe: {
    name: "Europe",
    description: "Union Européenne et pays européens",
  },
  world: {
    name: "Monde",
    description: "Reste du monde",
  },
};

interface ZoneData {
  enabled: boolean;
  base_fee: string;
  additional_item_fee: string;
  free_shipping_threshold: string;
}

interface FormData {
  [key: string]: ZoneData;
}

export default function ShopShippingPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const shopId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [shop, setShop] = useState<Shop | null>(null);

  const [formData, setFormData] = useState<FormData>({
    france: { enabled: false, base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
    europe: { enabled: false, base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
    world: { enabled: false, base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
  });

  // Shipping methods (modes de livraison)
  type MethodForm = {
    id?: number;
    name: string;
    zones: string[];
    delivery_time_min: string;
    delivery_time_max: string;
    delivery_time_unit: 'days' | 'weeks';
  };
  const [methods, setMethods] = useState<MethodForm[]>([]);
  const [methodsSaving, setMethodsSaving] = useState(false);
  const [methodsSaved, setMethodsSaved] = useState(false);
  const [methodsError, setMethodsError] = useState("");

  // Load shop and shipping profiles
  useEffect(() => {
    if (!user || user.role !== "artist" || !shopId) return;

    const load = async () => {
      try {
        const [shopData, shippingData, methodsData] = await Promise.all([
          shopsApi.get(shopId),
          shopsApi.getShipping(shopId),
          shopsApi.getShippingMethods(shopId),
        ]);

        setShop(shopData);

        // Populate form with existing profiles
        const newForm: FormData = {
          france: {
            enabled: false,
            base_fee: "0",
            additional_item_fee: "0",
            free_shipping_threshold: "",
          },
          europe: {
            enabled: false,
            base_fee: "0",
            additional_item_fee: "0",
            free_shipping_threshold: "",
          },
          world: {
            enabled: false,
            base_fee: "0",
            additional_item_fee: "0",
            free_shipping_threshold: "",
          },
        };

        if (shippingData && Array.isArray(shippingData)) {
          for (const profile of shippingData) {
            const zone = profile.zone as ShippingZoneLabel;
            if (newForm[zone]) {
              newForm[zone] = {
                enabled: true,
                base_fee: String(Number(profile.base_fee) || 0),
                additional_item_fee: String(
                  Number(profile.additional_item_fee) || 0
                ),
                free_shipping_threshold: profile.free_shipping_threshold
                  ? String(Number(profile.free_shipping_threshold))
                  : "",
              };
            }
          }
        }

        setFormData(newForm);

        // Populate shipping methods
        if (methodsData && Array.isArray(methodsData)) {
          setMethods(
            methodsData.map((m) => ({
              id: m.id,
              name: m.name,
              zones: m.zones,
              delivery_time_min: m.delivery_time_min != null ? String(m.delivery_time_min) : "",
              delivery_time_max: m.delivery_time_max != null ? String(m.delivery_time_max) : "",
              delivery_time_unit: m.delivery_time_unit || 'days',
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, shopId]);

  // Redirect if not artist
  useEffect(() => {
    if (!loading && (!user || user.role !== "artist")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleChange = (
    zone: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [field]: value },
    }));
    setSaved(false);
  };

  const toggleZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], enabled: !prev[zone].enabled },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      // Only submit enabled zones
      const profiles = Object.entries(formData)
        .filter(([, data]) => data.enabled)
        .map(([zone, data]) => ({
          zone: zone as ShippingZoneLabel,
          base_fee: parseFloat(data.base_fee) || 0,
          additional_item_fee: parseFloat(data.additional_item_fee) || 0,
          free_shipping_threshold: data.free_shipping_threshold
            ? parseFloat(data.free_shipping_threshold)
            : null,
        }));

      await shopsApi.updateShipping(shopId, profiles);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // ─── Shipping methods handlers ───────────────────────────────────────

  const addMethod = () => {
    setMethods((prev) => [
      ...prev,
      { name: "", zones: ["france"], delivery_time_min: "", delivery_time_max: "", delivery_time_unit: "days" as const },
    ]);
    setMethodsSaved(false);
  };

  const removeMethod = (index: number) => {
    setMethods((prev) => prev.filter((_, i) => i !== index));
    setMethodsSaved(false);
  };

  const updateMethod = (index: number, field: string, value: any) => {
    setMethods((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
    setMethodsSaved(false);
  };

  const toggleMethodZone = (index: number, zone: string) => {
    setMethods((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const zones = m.zones.includes(zone)
          ? m.zones.filter((z) => z !== zone)
          : [...m.zones, zone];
        return { ...m, zones: zones.length > 0 ? zones : [zone] };
      })
    );
    setMethodsSaved(false);
  };

  const handleSaveMethods = async () => {
    setMethodsError("");
    setMethodsSaving(true);

    try {
      const payload = methods.map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        name: m.name,
        zones: m.zones,
        delivery_time_min: m.delivery_time_min ? parseInt(m.delivery_time_min, 10) : null,
        delivery_time_max: m.delivery_time_max ? parseInt(m.delivery_time_max, 10) : null,
        delivery_time_unit: m.delivery_time_unit,
      }));

      await shopsApi.updateShippingMethods(shopId, payload);
      setMethodsSaved(true);
      setTimeout(() => setMethodsSaved(false), 2000);
    } catch (err: any) {
      setMethodsError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setMethodsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-stone-400">
        <Loader className="mx-auto animate-spin" />
        <p className="mt-2 text-sm">chargement...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="mx-auto mb-3 text-stone-300" />
        <p className="text-sm text-stone-500">boutique introuvable</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/account/settings/shop/${shopId}`}
          className="text-stone-400 hover:text-stone-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-light tracking-tight text-stone-900">
            Frais de port
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">{shop.name}</p>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="text-red-600" size={16} />
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Info box */}
      <div className="mb-6 border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="flex-shrink-0 text-blue-600 mt-0.5" size={16} />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Comment fonctionnent les frais de port ?</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>
                <strong>Frais de base</strong> : prélevés sur le premier article de votre boutique
              </li>
              <li>
                <strong>Frais par article</strong> : prélevés sur chaque article supplémentaire
              </li>
              <li>
                <strong>Gratuité</strong> : port gratuit si le montant panier ≥ seuil (optionnel)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Zones form */}
      <div className="space-y-6">
        {(Object.entries(ZONE_LABELS) as Array<[ShippingZoneLabel, typeof ZONE_LABELS.france]>).map(
          ([zone, labels]) => (
            <div
              key={zone}
              className="border border-stone-200 rounded-lg overflow-hidden"
            >
              {/* Zone header with toggle */}
              <div className="bg-gradient-to-r from-sage-50 to-sage-25 border-b border-stone-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <Truck className={`flex-shrink-0 mt-0.5 ${formData[zone].enabled ? 'text-sage-600' : 'text-stone-300'}`} size={18} />
                    <div>
                      <h3 className={`font-medium ${formData[zone].enabled ? 'text-stone-900' : 'text-stone-400'}`}>{labels.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {labels.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      formData[zone].enabled ? 'bg-sage-600' : 'bg-stone-300'
                    }`}
                    role="switch"
                    aria-checked={formData[zone].enabled}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        formData[zone].enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Zone fields — only shown when enabled */}
              {formData[zone].enabled ? (
              <div className="p-4 space-y-4">
                {/* Base fee */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1">
                    Frais de base (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[zone].base_fee}
                    onChange={(e) =>
                      handleChange(zone, "base_fee", e.target.value)
                    }
                    className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Frais pour le premier article
                  </p>
                </div>

                {/* Additional item fee */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1">
                    Frais par article supplémentaire (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[zone].additional_item_fee}
                    onChange={(e) =>
                      handleChange(zone, "additional_item_fee", e.target.value)
                    }
                    className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Frais pour chaque article au-delà du premier
                  </p>
                </div>

                {/* Free shipping threshold */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1">
                    Seuil de gratuité (€) — optionnel
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[zone].free_shipping_threshold}
                    onChange={(e) =>
                      handleChange(zone, "free_shipping_threshold", e.target.value)
                    }
                    className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                    placeholder="aucun"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Port gratuit si le montant panier atteint ce seuil
                  </p>
                </div>

                {/* Example */}
                <div className="bg-stone-50 border border-stone-100 p-3 rounded text-xs">
                  <p className="font-medium text-stone-700 mb-2">Exemple :</p>
                  {(() => {
                    const base = parseFloat(formData[zone].base_fee) || 0;
                    const additional =
                      parseFloat(formData[zone].additional_item_fee) || 0;
                    const threshold = formData[zone].free_shipping_threshold
                      ? parseFloat(formData[zone].free_shipping_threshold)
                      : null;

                    const cost1 = base;
                    const cost2 = base + additional;
                    const cost3 = base + additional * 2;

                    return (
                      <div className="space-y-1 text-stone-600">
                        <div>1 article : <strong>{cost1.toFixed(2)} €</strong></div>
                        <div>2 articles : <strong>{cost2.toFixed(2)} €</strong></div>
                        <div>3 articles : <strong>{cost3.toFixed(2)} €</strong></div>
                        {threshold && (
                          <div className="text-green-600 pt-1 border-t border-stone-200 mt-1">
                            Gratuit si montant ≥ {threshold.toFixed(2)} €
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              ) : (
                <div className="px-4 py-3 text-xs text-stone-400 italic">
                  Livraison désactivée pour cette zone
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-6 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50"
        >
          {saving && <Loader size={14} className="animate-spin" />}
          {saved && <Check size={14} />}
          {saving ? "enregistrement..." : saved ? "sauvegardé" : "enregistrer"}
        </button>
      </div>

      {/* ─── Shipping Methods (Modes de livraison) ─────────────────── */}
      <div className="mt-12 border-t border-stone-200 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="text-sage-600" size={20} />
            <h2 className="text-xl font-light tracking-tight text-stone-900">
              Modes de livraison
            </h2>
          </div>
          <button
            onClick={addMethod}
            className="flex items-center gap-1 border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700"
          >
            <Plus size={14} /> ajouter
          </button>
        </div>

        {/* Info box */}
        <div className="mb-6 border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <Info className="flex-shrink-0 text-blue-600 mt-0.5" size={16} />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Modes de livraison</p>
              <p className="text-blue-800">
                Configurez les transporteurs que vous proposez, les zones desservies et
                le délai de livraison estimé. Ces informations seront affichées sur
                vos fiches produit.
              </p>
            </div>
          </div>
        </div>

        {methodsError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="text-red-600" size={16} />
            <AlertDescription className="text-red-700 text-sm">{methodsError}</AlertDescription>
          </Alert>
        )}

        {methods.length === 0 ? (
          <div className="border border-dashed border-stone-200 py-10 text-center">
            <Truck className="mx-auto mb-2 text-stone-300" size={28} strokeWidth={1} />
            <p className="text-sm text-stone-400 italic">— aucun mode de livraison —</p>
            <button
              onClick={addMethod}
              className="mt-3 inline-flex items-center gap-1 border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700"
            >
              <Plus size={14} /> ajouter un mode
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method, index) => (
              <div
                key={index}
                className="border border-stone-200 rounded-lg overflow-hidden"
              >
                {/* Method header */}
                <div className="flex items-center justify-between bg-stone-50 border-b border-stone-200 px-4 py-2.5">
                  <span className="text-xs uppercase tracking-wider text-stone-400">
                    mode #{index + 1}
                  </span>
                  <button
                    onClick={() => removeMethod(index)}
                    className="text-stone-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1">
                      Nom du transporteur
                    </label>
                    <input
                      type="text"
                      value={method.name}
                      onChange={(e) => updateMethod(index, "name", e.target.value)}
                      placeholder="ex : Lettre suivie, Colissimo, Mondial Relay..."
                      className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                    />
                  </div>

                  {/* Zones */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-2">
                      Zones desservies
                    </label>
                    <div className="flex gap-2">
                      {(["france", "europe", "world"] as const).map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => toggleMethodZone(index, zone)}
                          className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                            method.zones.includes(zone)
                              ? "border border-stone-800 bg-stone-800 text-stone-50"
                              : "border border-stone-200 text-stone-500 hover:border-stone-400"
                          }`}
                        >
                          {zone === "france" ? "France" : zone === "europe" ? "Europe" : "Monde"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery time */}
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-2">
                      Délai de livraison estimé
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">min</label>
                        <input
                          type="number"
                          min="0"
                          value={method.delivery_time_min}
                          onChange={(e) => updateMethod(index, "delivery_time_min", e.target.value)}
                          placeholder="—"
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">max</label>
                        <input
                          type="number"
                          min="0"
                          value={method.delivery_time_max}
                          onChange={(e) => updateMethod(index, "delivery_time_max", e.target.value)}
                          placeholder="—"
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">unité</label>
                        <div className="relative">
                          <select
                            value={method.delivery_time_unit}
                            onChange={(e) => updateMethod(index, "delivery_time_unit", e.target.value)}
                            className="w-full appearance-none border border-stone-200 px-3 py-2 pr-8 text-sm focus:outline-none focus:border-stone-400 bg-white"
                          >
                            <option value="days">jours</option>
                            <option value="weeks">semaines</option>
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▼</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save methods button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveMethods}
            disabled={methodsSaving || methodsSaved}
            className="flex items-center gap-2 border border-stone-800 bg-stone-800 px-6 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50"
          >
            {methodsSaving && <Loader size={14} className="animate-spin" />}
            {methodsSaved && <Check size={14} />}
            {methodsSaving ? "enregistrement..." : methodsSaved ? "sauvegardé" : "enregistrer les modes"}
          </button>
        </div>
      </div>
    </div>
  );
}
