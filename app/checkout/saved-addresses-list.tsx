import { MapPin, X } from "lucide-react";
import { type Address } from "@/lib/api";

interface SavedAddressesListProps {
  savedAddresses: Address[];
  selectedAddressId: number | null;
  onSelectAddress: (address: Address) => void;
  onDeselect: () => void;
}

export function SavedAddressesList({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onDeselect,
}: SavedAddressesListProps) {
  if (savedAddresses.length === 0) return null;

  return (
    <div className="border-2 border-sage-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-sage-600" />
          <h2 className="text-sm uppercase tracking-wider text-sage-700">
            Mes adresses
          </h2>
        </div>
        {selectedAddressId && (
          <button
            type="button"
            onClick={onDeselect}
            className="text-xs text-sage-600 hover:text-sage-800 border-b border-sage-200 hover:border-sage-400 transition-colors flex items-center gap-1"
          >
            <X size={12} />
            déselectionner
          </button>
        )}
      </div>
      <div className="space-y-2 mb-4">
        {savedAddresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelectAddress(addr)}
            className={`w-full text-left border px-3 py-3 text-xs transition-colors ${
              selectedAddressId === addr.id
                ? "border-sage-400 bg-sage-50"
                : "border-sage-200 bg-white hover:border-sage-300"
            }`}
          >
            <div className="font-medium text-stone-800">
              {addr.label || "Adresse sans label"}
            </div>
            <div className="text-stone-600 mt-1">
              {addr.street}
            </div>
            <div className="text-stone-500">
              {addr.postal_code} {addr.city} — {addr.country}
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-sage-100 pt-4">
        <p className="text-xs text-sage-600 mb-3">
          Ou remplir une nouvelle adresse :
        </p>
      </div>
    </div>
  );
}
