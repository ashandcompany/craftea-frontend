import { AlertTriangle, MapPin, Check, Loader2 } from "lucide-react";
import { type ShippingZone } from "@/lib/api";
import { useState } from "react";

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
  isVerifying?: boolean;
  isVerified?: boolean;
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
  isVerifying = false,
  isVerified = false,
}: AddressFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Mapping des zones de livraison
  const zoneLabels = {
    france: "France métropolitaine",
    europe: "Union Européenne",
    world: "Monde",
  };

  // Mapping des pays par zone
  const countriesByZone = {
    france: ["FR"],
    europe: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "GB"],
    world: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "GB", "US", "CA", "JP", "AU"],
  };

  // Filtrer les pays disponibles selon la zone
  const availableCountries = countriesByZone[zone] || countriesByZone.world;

  const countryOptions = {
    FR: "France",
    BE: "Belgique",
    CH: "Suisse",
    LU: "Luxembourg",
    DE: "Allemagne",
    ES: "Espagne",
    IT: "Italie",
    GB: "Royaume-Uni",
    US: "États-Unis",
    CA: "Canada",
    JP: "Japon",
    AU: "Australie",
  };

  const getFieldClassName = (fieldName: string) => {
    const baseClass = "w-full border px-3 py-2.5 text-sm font-mono outline-none transition-all duration-200 placeholder:text-stone-300";
    const focusClass = focusedField === fieldName 
      ? "border-sage-500 ring-1 ring-sage-200 shadow-sm" 
      : "border-sage-200 hover:border-sage-300";
    const errorClass = formErrors[fieldName] 
      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200" 
      : "bg-white";
    const verifiedClass = isVerified && !formErrors[fieldName] && fieldName !== "countryCode"
      ? "border-sage-400 pr-10"
      : "";
    
    return `${baseClass} ${focusClass} ${errorClass} ${verifiedClass}`;
  };

  return (
    <div className="border-2 border-sage-200 bg-white p-6 font-mono relative">
      {/* Header avec effet machine à écrire */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-sage-200">
        <MapPin size={18} className="text-sage-600" strokeWidth={1.5} />
        <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
          {savedAddressSelected
            ? "> VÉRIFIER L'ADRESSE"
            : "> ADRESSE DE LIVRAISON"}
        </h2>
        {isVerifying && (
          <div className="ml-auto flex items-center gap-1 text-xs text-sage-600">
            <Loader2 size={14} className="animate-spin" />
            <span>Vérification...</span>
          </div>
        )}
        {isVerified && !isVerifying && (
          <div className="ml-auto flex items-center gap-1 text-xs text-sage-600">
            <Check size={14} />
            <span>Adresse vérifiée</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Adresse */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Adresse ]
          </label>
          <div className="relative">
            <input
              type="text"
              value={addressLine}
              onChange={(e) => onAddressLineChange(e.target.value)}
              onFocus={() => setFocusedField("addressLine")}
              onBlur={() => setFocusedField(null)}
              placeholder="123 rue Principale"
              autoComplete="address-line1"
              className={getFieldClassName("addressLine")}
              disabled={isVerifying}
            />
            {isVerified && !formErrors.addressLine && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.addressLine && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.addressLine}</span>
            </p>
          )}
        </div>

        {/* Ville */}
        <div>
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Ville ]
          </label>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              onFocus={() => setFocusedField("city")}
              onBlur={() => setFocusedField(null)}
              placeholder="Paris"
              autoComplete="address-level2"
              className={getFieldClassName("city")}
              disabled={isVerifying}
            />
            {isVerified && !formErrors.city && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.city && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.city}</span>
            </p>
          )}
        </div>

        {/* Code postal */}
        <div>
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Code postal ]
          </label>
          <div className="relative">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              onFocus={() => setFocusedField("postalCode")}
              onBlur={() => setFocusedField(null)}
              placeholder="75001"
              autoComplete="postal-code"
              className={getFieldClassName("postalCode")}
              disabled={isVerifying}
              maxLength={10}
            />
            {isVerified && !formErrors.postalCode && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.postalCode && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.postalCode}</span>
            </p>
          )}
        </div>

        {/* Pays */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Pays ]
          </label>
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            onFocus={() => setFocusedField("countryCode")}
            onBlur={() => setFocusedField(null)}
            autoComplete="country"
            className={`w-full border px-3 py-2.5 text-sm font-mono outline-none transition-all duration-200 appearance-none bg-white
              ${focusedField === "countryCode" 
                ? "border-sage-500 ring-1 ring-sage-200 shadow-sm" 
                : "border-sage-200 hover:border-sage-300"}
              ${!availableCountries.includes(countryCode) ? "border-amber-300 bg-amber-50/50" : ""}
            `}
            disabled={isVerifying}
            style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '16px',
        }}
          >
            {Object.entries(countryOptions).map(([code, name]) => (
              <option 
                key={code} 
                value={code}
                disabled={!availableCountries.includes(code)}
                className="font-mono"
              >
                {name} {!availableCountries.includes(code) ? "(non disponible)" : ""}
              </option>
            ))}
          </select>
          
          {/* Indicateur de zone avec effet machine à écrire */}
          <div className="mt-3 flex items-center gap-2 text-xs border border-sage-200 bg-sage-50/50 px-3 py-2">
            <span className="text-sage-600">Zone de livraison :</span>
            <code className="bg-white px-2 py-0.5 border border-sage-200 text-sage-700">
              {zoneLabels[zone]}
            </code>
            {!availableCountries.includes(countryCode) && (
              <span className="flex items-center gap-1 ml-auto text-amber-600">
                <AlertTriangle size={12} />
                Pays non disponible dans cette zone
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Effets de fin de ligne machine à écrire */}
      <div className="absolute bottom-2 right-3 text-sage-300 text-xs select-none pointer-events-none">
        {isVerifying ? "..." : "⏎"}
      </div>
    </div>
  );
}