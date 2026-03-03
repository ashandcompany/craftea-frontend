"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { products as productsApi, orders, payments, type Product } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Lock,
  CheckCircle,
  Loader2,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RotateCcw,
  User,
  MapPin,
} from "lucide-react";

// ── types minimaux pour le SDK Square ─────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId?: string) => Promise<SquarePayments>;
    };
  }
}
interface SquarePayments {
  card: (options?: { style?: object }) => Promise<SquareCard>;
}

interface BillingContact {
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  countryCode?: string;
  postalCode?: string;
}

interface VerificationDetails {
  amount: string;
  billingContact: BillingContact;
  currencyCode: string;
  intent: "CHARGE" | "STORE" | "CHARGE_AND_STORE";
  customerInitiated: boolean;
  sellerKeyedIn: boolean;
}

interface TokenResult {
  status: string;
  token?: string;
  errors?: { message: string; field?: string; type?: string }[];
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: (verificationDetails?: VerificationDetails) => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

const SQUARE_APP_ID =
  process.env.NEXT_PUBLIC_SQUARE_APP_ID || "sandbox-sq0idb-8E6lrkXWdWH4vJBf9ol8g";
const SQUARE_LOCATION_ID =
  process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
const SQUARE_SDK_URL =
  process.env.NEXT_PUBLIC_SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

type Step = "form" | "processing" | "success" | "error";

interface PaymentError {
  title: string;
  detail: string;
  retryable: boolean;
}

function parseSquareError(errors: { message: string; type?: string }[]): PaymentError {
  const first = errors[0];
  const type = first?.type || "";

  if (type === "VALIDATION_ERROR" || first?.message?.toLowerCase().includes("card number")) {
    return { title: "Numéro de carte invalide", detail: "Vérifiez le numéro de carte saisi.", retryable: true };
  }
  if (first?.message?.toLowerCase().includes("expir")) {
    return { title: "Carte expirée", detail: "La date d'expiration est dépassée.", retryable: true };
  }
  if (first?.message?.toLowerCase().includes("cvv") || first?.message?.toLowerCase().includes("cvc")) {
    return { title: "CVV incorrect", detail: "Le code de sécurité est invalide.", retryable: true };
  }
  return { title: "Erreur de carte", detail: first?.message || "Vérifiez les informations saisies.", retryable: true };
}

function parseApiError(message: string): PaymentError {
  const lower = message.toLowerCase();
  if (lower.includes("declined") || lower.includes("déclinée") || lower.includes("insufficient")) {
    return { title: "Paiement refusé", detail: "Votre banque a refusé la transaction. Contactez votre établissement bancaire.", retryable: false };
  }
  if (lower.includes("expired") || lower.includes("expiré")) {
    return { title: "Carte expirée", detail: "La date d'expiration est dépassée.", retryable: true };
  }
  if (lower.includes("cvv") || lower.includes("security code")) {
    return { title: "CVV invalide", detail: "Le code de sécurité de votre carte est incorrect.", retryable: true };
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return { title: "Erreur réseau", detail: "La connexion a échoué. Vérifiez votre connexion internet et réessayez.", retryable: true };
  }
  if (lower.includes("stock")) {
    return { title: "Stock insuffisant", detail: "Un ou plusieurs articles ne sont plus disponibles en quantité suffisante.", retryable: false };
  }
  return { title: "Erreur de paiement", detail: message || "Une erreur inattendue s'est produite.", retryable: true };
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, clear } = useCart();
  const router = useRouter();

  const [productMap, setProductMap] = useState<Record<number, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const cardRef = useRef<SquareCard | null>(null);
  const sdkLoadedRef = useRef(false);

  // Pré-remplir les champs billing depuis le profil utilisateur
  useEffect(() => {
    if (user) {
      setGivenName((prev) => prev || user.firstname || "");
      setFamilyName((prev) => prev || user.lastname || "");
      setBillingEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  // Redirect si pas connecté
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Redirect si panier vide
  useEffect(() => {
    if (!cartLoading && items.length === 0 && step === "form") {
      router.push("/cart");
    }
  }, [cartLoading, items, step, router]);

  // Charger les produits
  useEffect(() => {
    if (cartLoading || items.length === 0) {
      setLoadingProducts(false);
      return;
    }
    const ids = [...new Set(items.map((i) => i.product_id))];
    Promise.allSettled(ids.map((id) => productsApi.get(id))).then((results) => {
      const map: Record<number, Product> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") map[r.value.id] = r.value;
      });
      setProductMap(map);
      setLoadingProducts(false);
    });
  }, [items, cartLoading]);

  // Charger le SDK Square
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    sdkLoadedRef.current = true;

    const existing = document.getElementById("square-sdk");
    if (existing) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "square-sdk";
    script.src = SQUARE_SDK_URL;
    script.onload = () => setSdkReady(true);
    script.onerror = () =>
      setPaymentError({
        title: "Module de paiement indisponible",
        detail: "Impossible de charger le module Square. Vérifiez votre connexion et rechargez la page.",
        retryable: false,
      });
    document.head.appendChild(script);
  }, []);

  // Monter le formulaire carte une fois le SDK prêt
  useEffect(() => {
    if (!sdkReady || step !== "form" || !window.Square) return;

    let mounted = true;
    (async () => {
      try {
        if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
          throw new Error(
            `Configuration Square manquante : ${!SQUARE_APP_ID ? "APP_ID" : ""}${!SQUARE_APP_ID && !SQUARE_LOCATION_ID ? " et " : ""}${!SQUARE_LOCATION_ID ? "LOCATION_ID" : ""}`,
          );
        }
        const paymentsInstance = await window.Square!.payments(
          SQUARE_APP_ID,
          SQUARE_LOCATION_ID,
        );
        const card = await paymentsInstance.card();
        await card.attach("#square-card-container");
        if (mounted) cardRef.current = card;
      } catch (err) {
        console.error("[Square SDK] Initialisation échouée :", err);
        if (mounted)
          setPaymentError({
            title: "Initialisation échouée",
            detail:
              err instanceof Error
                ? err.message
                : "Le formulaire de paiement n'a pas pu s'initialiser. Rechargez la page.",
            retryable: false,
          });
      }
    })();

    return () => {
      mounted = false;
      cardRef.current?.destroy().catch(() => {});
      cardRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, step]);

  const total = items.reduce((sum, item) => {
    const p = productMap[item.product_id];
    return sum + (p ? Number(p.price) * item.quantity : 0);
  }, 0);

  const handleRetry = () => {
    setPaymentError(null);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    // Valider les champs de facturation
    const errors: Record<string, string> = {};
    if (!givenName.trim()) errors.givenName = "Le prénom est requis.";
    if (!familyName.trim()) errors.familyName = "Le nom est requis.";
    if (!billingEmail.trim()) errors.billingEmail = "L'email est requis.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (!cardRef.current) {
      setPaymentError({
        title: "Formulaire non prêt",
        detail: "Le formulaire de carte n'est pas encore chargé. Patientez quelques secondes.",
        retryable: true,
      });
      return;
    }

    setStep("processing");

    try {
      // 1. Construire verificationDetails conformément à la doc Square
      const billingContact: BillingContact = {
        givenName: givenName.trim(),
        familyName: familyName.trim(),
        email: billingEmail.trim(),
      };
      if (phone.trim()) billingContact.phone = phone.trim();
      if (addressLine.trim()) billingContact.addressLines = [addressLine.trim()];
      if (city.trim()) billingContact.city = city.trim();
      if (postalCode.trim()) billingContact.postalCode = postalCode.trim();
      if (countryCode.trim()) billingContact.countryCode = countryCode.trim();

      const verificationDetails: VerificationDetails = {
        amount: total.toFixed(2),
        billingContact,
        currencyCode: "EUR",
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      // 2. Tokeniser la carte via Square SDK avec verificationDetails
      const result = await cardRef.current.tokenize(verificationDetails);
      if (result.status !== "OK" || !result.token) {
        setPaymentError(
          result.errors?.length
            ? parseSquareError(result.errors)
            : { title: "Erreur de tokenisation", detail: "Impossible de lire les informations de carte.", retryable: true }
        );
        setStep("form");
        return;
      }
      const sourceId = result.token;

      // 3. Créer la commande
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(productMap[item.product_id]?.price ?? 0),
      }));
      const order = await orders.create(orderItems);

      // 4. Créer le paiement
      await payments.create({
        order_id: order.id,
        amount: total,
        currency: "EUR",
        source_id: sourceId,
      });

      // 5. Vider le panier
      await clear();

      setSuccessOrderId(order.id);
      setStep("success");
    } catch (err: any) {
      const parsed = parseApiError(err.message || "");
      setPaymentError(parsed);
      setStep("error");
    }
  };

  const loading = authLoading || cartLoading || loadingProducts;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 font-mono text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-sage-400" />
        <p className="mt-4 text-sm text-sage-600">chargement...</p>
      </div>
    );
  }

  if (!user) return null;

  if (step === "success") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 font-mono text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
          <CheckCircle className="h-8 w-8 text-sage-700" />
        </div>
        <h1 className="mt-6 text-2xl font-light text-stone-900">Paiement confirmé</h1>
        <p className="mt-2 text-sm text-sage-600">
          Votre commande n°{successOrderId} a bien été enregistrée.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="border-2 border-sage-700 bg-sage-700 px-6 py-3 text-sm text-white hover:bg-sage-800 transition-colors"
          >
            voir mes commandes
          </Link>
          <Link
            href="/products"
            className="border-2 border-sage-200 px-6 py-3 text-sm text-sage-700 hover:border-sage-400 transition-colors"
          >
            continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  // ── Écran d'erreur non-retryable ───────────────────────────────────────────────────────────────────
  if (step === "error" && paymentError && !paymentError.retryable) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 font-mono text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-light text-stone-900">{paymentError.title}</h1>
        <p className="mt-2 text-sm text-stone-500">{paymentError.detail}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cart"
            className="border-2 border-sage-200 px-6 py-3 text-sm text-sage-700 hover:border-sage-400 transition-colors"
          >
            retour au panier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8 border-b border-sage-200 pb-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs text-sage-600 hover:text-sage-800 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          retour au panier
        </Link>
        <h1 className="text-2xl font-light tracking-tight text-stone-900">Paiement sécurisé</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Formulaire paiement */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de facturation (billingContact) */}
            <div className="border-2 border-sage-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-sage-600" />
                <h2 className="text-sm uppercase tracking-wider text-sage-700">
                  Informations de facturation
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prénom */}
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={givenName}
                    onChange={(e) => {
                      setGivenName(e.target.value);
                      if (formErrors.givenName) setFormErrors((prev) => ({ ...prev, givenName: "" }));
                    }}
                    placeholder="Jean"
                    autoComplete="given-name"
                    className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
                      formErrors.givenName ? "border-red-300 bg-red-50" : "border-sage-200 bg-white"
                    }`}
                  />
                  {formErrors.givenName && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle size={12} />
                      {formErrors.givenName}
                    </p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => {
                      setFamilyName(e.target.value);
                      if (formErrors.familyName) setFormErrors((prev) => ({ ...prev, familyName: "" }));
                    }}
                    placeholder="Dupont"
                    autoComplete="family-name"
                    className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
                      formErrors.familyName ? "border-red-300 bg-red-50" : "border-sage-200 bg-white"
                    }`}
                  />
                  {formErrors.familyName && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle size={12} />
                      {formErrors.familyName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => {
                      setBillingEmail(e.target.value);
                      if (formErrors.billingEmail) setFormErrors((prev) => ({ ...prev, billingEmail: "" }));
                    }}
                    placeholder="jean.dupont@example.com"
                    autoComplete="email"
                    className={`w-full border px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400 ${
                      formErrors.billingEmail ? "border-red-300 bg-red-50" : "border-sage-200 bg-white"
                    }`}
                  />
                  {formErrors.billingEmail && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle size={12} />
                      {formErrors.billingEmail}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-500 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    autoComplete="tel"
                    className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400"
                  />
                </div>
              </div>
            </div>

            {/* Adresse de facturation */}
            <div className="border-2 border-sage-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-sage-600" />
                <h2 className="text-sm uppercase tracking-wider text-sage-700">
                  Adresse de facturation
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-500 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="123 rue Principale"
                    autoComplete="address-line1"
                    className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    autoComplete="address-level2"
                    className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    autoComplete="postal-code"
                    className="w-full border border-sage-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 transition-colors focus:border-sage-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-500 mb-1">Pays</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
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
                  </select>
                </div>
              </div>
            </div>

            {/* Carte Square */}
            <div className="border-2 border-sage-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-sage-600" />
                <h2 className="text-sm uppercase tracking-wider text-sage-700">
                  Informations de carte
                </h2>
              </div>

              {/* Conteneur Square Card — le SDK injecte le formulaire ici */}
              <div id="square-card-container" className="min-h-25" />

              {!sdkReady && (
                <div className="flex items-center gap-2 text-xs text-sage-500 mt-2">
                  <Loader2 size={12} className="animate-spin" />
                  Chargement du module de paiement…
                </div>
              )}
            </div>

            {/* Erreur retryable (inline) */}
            {paymentError && (step === "form" || (step === "error" && paymentError.retryable)) && (
              <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">{paymentError.title}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{paymentError.detail}</p>
                  </div>
                  {step === "error" && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="shrink-0 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 px-2 py-1 transition-colors"
                    >
                      <RotateCcw size={12} />
                      réessayer
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={step === "processing" || !sdkReady}
              className="w-full flex items-center justify-center gap-2 border-2 border-sage-700 bg-sage-700 px-6 py-4 text-sm text-white hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "processing" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  traitement en cours…
                </>
              ) : (
                <>
                  <Lock size={16} />
                  payer {total.toFixed(2)} €
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
              <ShieldCheck size={14} />
              <span>Paiement chiffré — propulsé par Square</span>
            </div>
          </form>
        </div>

        {/* Récapitulatif commande */}
        <div className="lg:col-span-2">
          <div className="border-2 border-sage-200 bg-white p-6 sticky top-24">
            <h2 className="mb-4 text-sm uppercase tracking-wider text-sage-700 border-b border-sage-100 pb-2">
              récapitulatif
            </h2>

            <div className="space-y-4 mb-4">
              {items.map((item) => {
                const product = productMap[item.product_id];
                const image = product?.images?.[0]?.image_url;
                return (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="h-12 w-12 shrink-0 border border-sage-200 bg-sage-50 overflow-hidden">
                      {image ? (
                        <img
                          src={assetUrl(image, "product-images")}
                          alt={product?.title || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sage-300">
                          <Package size={16} strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700 truncate">
                        {product?.title || `Produit #${item.product_id}`}
                      </p>
                      <p className="text-xs text-sage-500">x{item.quantity}</p>
                    </div>
                    {product?.price != null && (
                      <span className="text-xs font-medium text-stone-700 shrink-0">
                        {(Number(product.price) * item.quantity).toFixed(2)} €
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-sage-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Livraison</span>
                <span className="text-xs text-sage-600">
                  {total >= 50 ? "offerte" : "à calculer"}
                </span>
              </div>
              <div className="flex justify-between text-stone-800 font-medium border-t border-sage-100 pt-2">
                <span>Total TTC</span>
                <span className="text-lg font-light text-sage-800">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


