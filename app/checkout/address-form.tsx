import { AlertTriangle, MapPin } from "lucide-react";
import { type ShippingZone } from "@/lib/api";

interface AddressFormProps {
  addressLine: string;
  city: string;
  postalCode: string;
  countryCode: string;
  zone: ShippingZone;
  formErrors: Record<string, string>;
  savedAddressSelected: boolean;
  onAddressLineChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
}

export function AddressForm({
  addressLine,
  city,
  postalCode,
  countryCode,
  zone,
  formErrors,
  savedAddressSelected,
  onAddressLineChange,
  onCityChange,
  onPostalCodeChange,
  onCountryCodeChange,
}: AddressFormProps) {
  return (
    <div className="border-2 border-sage-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={16} className="text-sage-600" />
        <h2 className="text-sm uppercase tracking-wider text-sage-700">
          {savedAddressSelected
            ? "Vérifier l'adresse"
            : "Adresse de livraison"}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1">
            Adresse
          </label>
          <input
            type="text"
            value={addressLine}
            onChange={(e) => {
              onAddressLineChange(e.target.value);
            }}
            placeholder="123 rue Principale"
            autoComplete="address-line1"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.addressLine
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.addressLine && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.addressLine}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">
            Ville
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              onCityChange(e.target.value);
            }}
            placeholder="Paris"
            autoComplete="address-level2"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.city
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.city}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">
            Code postal
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => {
              onPostalCodeChange(e.target.value);
            }}
            placeholder="75001"
            autoComplete="postal-code"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.postalCode
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.postalCode && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.postalCode}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1">
            Pays
          </label>
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            autoComplete="country"
            className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition-colors focus:border-sage-400"
          >
            <option value="FR">France</option>
            <option value="BE">Belgique</option>
            <option value="CH">Suisse</option>
            <option value="LU">Luxembourg</option>
            <option value="DE">Allemagne</option>
            <option value="ES">Espagne</option>
            <option value="IT">Italie</option>
            <option value="GB">Royaume-Uni</option>
            <option value="US">États-Unis</option>
            <option value="CA">Canada</option>
            <option value="JP">Japon</option>
            <option value="AU">Australie</option>
          </select>
          <p className="mt-1 text-xs text-sage-500">
            Zone de livraison :{" "}
            {zone === "france"
              ? "France"
              : zone === "europe"
                ? "Europe"
                : "Monde"}
          </p>
        </div>
      </div>
    </div>
  );
}
