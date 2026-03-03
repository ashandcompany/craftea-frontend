import { AlertTriangle, User, Mail, Phone, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface BillingContactFormProps {
  givenName: string;
  familyName: string;
  billingEmail: string;
  phone: string;
  formErrors: Record<string, string>;
  onGivenNameChange: (value: string) => void;
  onFamilyNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  isVerifying?: boolean;
  isVerified?: boolean;
}

export function BillingContactForm({
  givenName,
  familyName,
  billingEmail,
  phone,
  formErrors,
  onGivenNameChange,
  onFamilyNameChange,
  onEmailChange,
  onPhoneChange,
  isVerifying = false,
  isVerified = false,
}: BillingContactFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleBlur = (fieldName: string) => {
    setFocusedField(null);
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const getFieldClassName = (fieldName: string) => {
    const baseClass = "w-full border px-3 py-2.5 text-sm font-mono outline-none transition-all duration-200 placeholder:text-stone-300";
    const focusClass = focusedField === fieldName 
      ? "border-sage-500 ring-1 ring-sage-200 shadow-sm bg-white" 
      : "border-sage-200 hover:border-sage-300";
    
    // Gestion des erreurs
    const hasError = formErrors[fieldName];
    const isTouched = touchedFields.has(fieldName);
    const errorClass = hasError && isTouched
      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200" 
      : "";
    
    // Champ valide
    const isValid = !hasError && isTouched && 
      ((fieldName === "givenName" && givenName) ||
       (fieldName === "familyName" && familyName) ||
       (fieldName === "billingEmail" && billingEmail) ||
       (fieldName === "phone" && phone));
    
    const validClass = isValid && !focusedField
      ? "border-sage-400 bg-sage-50/30 pr-10"
      : "";
    
    // Champ requis mais vide
    const requiredEmpty = isTouched && !hasError && 
      ((fieldName === "givenName" && !givenName) ||
       (fieldName === "familyName" && !familyName) ||
       (fieldName === "billingEmail" && !billingEmail));
    
    const requiredClass = requiredEmpty
      ? "border-amber-300 bg-amber-50/30"
      : "";
    
    return `${baseClass} ${focusClass} ${errorClass} ${validClass} ${requiredClass}`;
  };

  // Formatage automatique du téléphone
  const formatPhoneNumber = (value: string) => {
    // Nettoie le numéro (garde seulement les chiffres et le +)
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Formatage basique (à adapter selon les besoins)
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <div className="border border-sage-200 bg-white p-6 font-mono relative">
      {/* Header avec effet machine à écrire */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-sage-200">
        <User size={18} className="text-sage-600" strokeWidth={1.5} />
        <h2 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
          &gt; INFORMATIONS DE FACTURATION
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
            <span>Contact vérifié</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Prénom ] <span className="text-sage-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={givenName}
              onChange={(e) => onGivenNameChange(e.target.value)}
              onFocus={() => setFocusedField("givenName")}
              onBlur={() => handleBlur("givenName")}
              placeholder="Jean"
              autoComplete="given-name"
              className={getFieldClassName("givenName")}
              disabled={isVerifying}
              maxLength={50}
            />
            {!formErrors.givenName && givenName && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.givenName && touchedFields.has("givenName") && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.givenName}</span>
            </p>
          )}
          {!formErrors.givenName && touchedFields.has("givenName") && !givenName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">Ce champ est requis</span>
            </p>
          )}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Nom ] <span className="text-sage-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={familyName}
              onChange={(e) => onFamilyNameChange(e.target.value)}
              onFocus={() => setFocusedField("familyName")}
              onBlur={() => handleBlur("familyName")}
              placeholder="Dupont"
              autoComplete="family-name"
              className={getFieldClassName("familyName")}
              disabled={isVerifying}
              maxLength={50}
            />
            {!formErrors.familyName && familyName && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.familyName && touchedFields.has("familyName") && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.familyName}</span>
            </p>
          )}
          {!formErrors.familyName && touchedFields.has("familyName") && !familyName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">Ce champ est requis</span>
            </p>
          )}
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Email ] <span className="text-sage-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Mail 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400"
              strokeWidth={1.5}
            />
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setFocusedField("billingEmail")}
              onBlur={() => handleBlur("billingEmail")}
              placeholder="jean.dupont@example.com"
              autoComplete="email"
              className={`${getFieldClassName("billingEmail")} pl-10`}
              disabled={isVerifying}
              maxLength={100}
            />
            {!formErrors.billingEmail && billingEmail && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          {formErrors.billingEmail && touchedFields.has("billingEmail") && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">{formErrors.billingEmail}</span>
            </p>
          )}
          {!formErrors.billingEmail && touchedFields.has("billingEmail") && !billingEmail && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={12} strokeWidth={1.5} />
              <span className="font-mono">Ce champ est requis</span>
            </p>
          )}
        </div>

        {/* Téléphone */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1.5 tracking-wide">
            [ Téléphone ] <span className="text-stone-400 ml-1 text-[10px]">(optionnel)</span>
          </label>
          <div className="relative">
            <Phone 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400"
              strokeWidth={1.5}
            />
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => handleBlur("phone")}
              placeholder="+33 6 12 34 56 78"
              autoComplete="tel"
              className={`w-full border px-3 py-2.5 pl-10 text-sm font-mono outline-none transition-all duration-200 placeholder:text-stone-300
                ${focusedField === "phone" 
                  ? "border-sage-500 ring-1 ring-sage-200 shadow-sm" 
                  : "border-sage-200 hover:border-sage-300"
                }
                ${touchedFields.has("phone") && phone && !formErrors.phone
                  ? "border-sage-400 bg-sage-50/30"
                  : ""
                }
              `}
              disabled={isVerifying}
              maxLength={20}
            />
            {phone && !formErrors.phone && (
              <Check 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500"
                strokeWidth={1.5}
              />
            )}
          </div>
          
          {/* Indicateur de format */}
          {focusedField === "phone" && !phone && (
            <p className="mt-1.5 text-xs text-sage-500 font-mono">
              Format: +33XXXXXXXXX ou 06XXXXXXXX
            </p>
          )}
        </div>
      </div>

      {/* Indicateur de champs requis */}
      <div className="mt-4 pt-3 border-t border-sage-100 flex items-center gap-2 text-[10px] text-stone-400">
        <span className="text-sage-500">*</span>
        <span className="font-mono">Champs obligatoires</span>
        <span className="mx-2 text-sage-200">|</span>
        <span className="font-mono">Tous les champs sont vérifiés</span>
        <Check size={10} className="text-sage-400 ml-1" strokeWidth={2} />
      </div>

      {/* Effet machine à écrire */}
      <div className="absolute bottom-2 right-3 text-sage-300 text-xs select-none pointer-events-none">
        {isVerifying ? "..." : "⏎"}
      </div>
    </div>
  );
}