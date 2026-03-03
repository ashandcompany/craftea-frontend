"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  shops as shopsApi,
  type Shop,
  type ShopShippingProfile,
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

interface FormData {
  [key: string]: {
    base_fee: string;
    additional_item_fee: string;
    free_shipping_threshold: string;
  };
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
    france: { base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
    europe: { base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
    world: { base_fee: "0", additional_item_fee: "0", free_shipping_threshold: "" },
  });

  // Load shop and shipping profiles
  useEffect(() => {
    if (!user || user.role !== "artist" || !shopId) return;

    const load = async () => {
      try {
        const [shopData, shippingData] = await Promise.all([
          shopsApi.get(shopId),
          shopsApi.getShipping(shopId),
        ]);

        setShop(shopData);

        // Populate form with existing profiles
        const newForm: FormData = {
          france: {
            base_fee: "0",
            additional_item_fee: "0",
            free_shipping_threshold: "",
          },
          europe: {
            base_fee: "0",
            additional_item_fee: "0",
            free_shipping_threshold: "",
          },
          world: {
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

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      // Prepare profiles for submission
      const profiles = Object.entries(formData).map(([zone, data]) => ({
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
              {/* Zone header */}
              <div className="bg-gradient-to-r from-sage-50 to-sage-25 border-b border-stone-200 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Truck className="text-sage-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <h3 className="font-medium text-stone-900">{labels.name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {labels.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zone fields */}
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
    </div>
  );
}
