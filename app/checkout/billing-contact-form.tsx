import { AlertTriangle, User } from "lucide-react";

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
}: BillingContactFormProps) {
  return (
    <div className="border-2 border-sage-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <User size={16} className="text-sage-600" />
        <h2 className="text-sm uppercase tracking-wider text-sage-700">
          Informations de facturation
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            value={givenName}
            onChange={(e) => {
              onGivenNameChange(e.target.value);
            }}
            placeholder="Jean"
            autoComplete="given-name"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.givenName
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.givenName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.givenName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-stone-500 mb-1">
            Nom *
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => {
              onFamilyNameChange(e.target.value);
            }}
            placeholder="Dupont"
            autoComplete="family-name"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.familyName
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.familyName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.familyName}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => {
              onEmailChange(e.target.value);
            }}
            placeholder="jean.dupont@example.com"
            autoComplete="email"
            className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
              formErrors.billingEmail
                ? "border-red-300 bg-red-50"
                : "border-sage-200 bg-white"
            }`}
          />
          {formErrors.billingEmail && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              {formErrors.billingEmail}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-500 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            autoComplete="tel"
            className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400"
          />
        </div>
      </div>
    </div>
  );
}
