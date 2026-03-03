import { MapPin, X, Check, ChevronRight, Home, Building2, MapPinned } from "lucide-react";
import { type Address } from "@/lib/api";
import { useState } from "react";

interface SavedAddressesListProps {
  savedAddresses: Address[];
  selectedAddressId: number | null;
  onSelectAddress: (address: Address) => void;
  onDeselect: () => void;
  isExpanded?: boolean;
}

export function SavedAddressesList({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onDeselect,
  isExpanded = true,
}: SavedAddressesListProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (savedAddresses.length === 0) return null;

  // Fonction pour obtenir l'icône en fonction du label
  const getAddressIcon = (label?: string) => {
    if (!label) return <MapPin size={14} className="text-sage-400" strokeWidth={1.5} />;
    
    const labelLower = label.toLowerCase();
    if (labelLower.includes("maison") || labelLower.includes("domicile")) {
      return <Home size={14} className="text-sage-500" strokeWidth={1.5} />;
    }
    if (labelLower.includes("travail") || labelLower.includes("bureau")) {
      return <Building2 size={14} className="text-sage-500" strokeWidth={1.5} />;
    }
    return <MapPinned size={14} className="text-sage-500" strokeWidth={1.5} />;
  };

  // Formater l'adresse pour l'affichage
  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      [address.postal_code, address.city].filter(Boolean).join(" "),
      address.country
    ].filter(Boolean);
    
    return parts.join(" — ");
  };

  return (
    <div 
      className={`border border-sage-200 bg-white p-6 font-mono relative transition-all duration-300 ${
        isExpanded ? "opacity-100" : "opacity-95"
      }`}
    >
      {/* Header avec effet machine à écrire */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-sage-200">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-sage-600" strokeWidth={1.5} />
          <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
            {selectedAddressId ? "> ADRESSE SÉLECTIONNÉE" : "> MES ADRESSES"}
          </h2>
          <span className="text-xs text-sage-500 ml-2">
            [{savedAddresses.length} enregistrée{savedAddresses.length > 1 ? "s" : ""}]
          </span>
        </div>
        
        {selectedAddressId && (
          <button
            type="button"
            onClick={onDeselect}
            className="group flex items-center gap-1.5 text-xs text-sage-600 hover:text-sage-800 transition-all duration-200 border-b border-sage-200 hover:border-sage-400 py-0.5"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform duration-200" strokeWidth={1.5} />
            <span className="uppercase tracking-wider">désélectionner</span>
          </button>
        )}
      </div>

      {/* Liste des adresses avec effet machine à écrire */}
      <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-sage-200 scrollbar-track-transparent">
        {savedAddresses.map((addr, index) => {
          const isSelected = selectedAddressId === addr.id;
          const isHovered = hoveredId === addr.id;
          
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelectAddress(addr)}
              onMouseEnter={() => setHoveredId(addr.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative w-full text-left border px-4 py-3.5 text-xs transition-all duration-200
                ${isSelected 
                  ? "border-sage-400 bg-sage-50/80 shadow-sm" 
                  : "border-sage-200 bg-white hover:border-sage-300 hover:bg-sage-50/30"
                }
                ${index === 0 ? "animate-fadeIn" : ""}
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Indicateur de sélection avec effet machine à écrire */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage-400" />
              )}
              
              {/* Contenu principal */}
              <div className="flex items-start gap-3">
                {/* Icône avec effet de survol */}
                <div className={`
                  mt-0.5 transition-all duration-200
                  ${isHovered ? "scale-110" : ""}
                `}>
                  {getAddressIcon(addr.label)}
                </div>

                {/* Détails de l'adresse */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`
                      font-medium text-xs uppercase tracking-wider
                      ${isSelected ? "text-sage-800" : "text-stone-700"}
                    `}>
                      [{addr.label ? addr.label.toUpperCase() : "SANS LABEL"}]
                    </span>
                    
                    {/* Badge "sélectionnée" */}
                    {isSelected && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] uppercase tracking-wider border border-sage-200">
                        <Check size={10} strokeWidth={2} />
                        active
                      </span>
                    )}

                    {/* Séparateur machine à écrire */}
                    <span className="text-sage-300 text-[10px]">///</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-stone-800 font-mono text-xs leading-relaxed">
                      {addr.street}
                    </p>
                    <p className="text-stone-500 font-mono text-[11px]">
                      {addr.postal_code} {addr.city}
                    </p>
                    <p className="text-stone-400 font-mono text-[11px] uppercase tracking-wider">
                      {addr.country}
                    </p>
                  </div>
                </div>

                {/* Flèche de sélection avec effet machine à écrire */}
                <ChevronRight 
                  size={16} 
                  className={`
                    transition-all duration-200
                    ${isSelected 
                      ? "text-sage-500 translate-x-0.5" 
                      : "text-sage-300 opacity-0 group-hover:opacity-100"
                    }
                    ${isHovered && !isSelected ? "translate-x-0.5 opacity-100" : ""}
                  `}
                  strokeWidth={1.5}
                />
              </div>

              {/* Effet de fin de ligne au survol */}
              {isHovered && !isSelected && (
                <div className="absolute bottom-1 right-3 text-[10px] text-sage-400">
                  ↙ sélectionner
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pied de page avec effet machine à écrire */}
      <div className="border-t-2 border-sage-100 pt-4 mt-2">
        <div className="flex items-center gap-2 text-xs text-sage-600">
          <span className="text-sage-400">⏎</span>
          <span className="uppercase tracking-wider text-[10px]">
            ou remplir une nouvelle adresse ci-dessous
          </span>
          <span className="flex-1 border-b border-sage-200 border-dashed mx-2" />
          <span className="text-sage-400 animate-pulse">▌</span>
        </div>
      </div>

      {/* Style personnalisé pour la scrollbar */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5c0;
          border-radius: 0;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9aa88f;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}