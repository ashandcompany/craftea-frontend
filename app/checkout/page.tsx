"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import {
  products as productsApi,
  shops as shopsApi,
  orders,
  payments,
  addresses as addressesApi,
  type Product,
  type Shop,
  type ShopShippingProfile,
  type ShippingZone,
  type Address,
} from "@/lib/api";
import { countryToZone, computeShopShipping } from "@/app/cart/page";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Store,
} from "lucide-react";
import { BillingContactForm } from "./billing-contact-form";
import { SavedAddressesList } from "./saved-addresses-list";
import { AddressForm } from "./address-form";
import { PaymentForm, type PaymentError } from "./payment-form";
import { OrderSummary, type CartItem } from "./order-summary";
import { SuccessScreen, ErrorScreen } from "./checkout-screens";

// ── Stripe publishable key ────────────────────────────────────────────────────
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = "form" | "processing" | "success" | "error";

function parseApiError(message: string): PaymentError {
  const lower = message.toLowerCase();
  if (
    lower.includes("declined") ||
    lower.includes("déclinée") ||
    lower.includes("insufficient")
  ) {
    return {
      title: "Paiement refusé",
      detail:
        "Votre banque a refusé la transaction. Contactez votre établissement bancaire.",
      retryable: false,
    };
  }
  if (lower.includes("expired") || lower.includes("expiré")) {
    return {
      title: "Carte expirée",
      detail: "La date d'expiration est dépassée.",
      retryable: true,
    };
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("timeout")
  ) {
    return {
      title: "Erreur réseau",
      detail:
        "La connexion a échoué. Vérifiez votre connexion internet et réessayez.",
      retryable: true,
    };
  }
  if (lower.includes("stock")) {
    return {
      title: "Stock insuffisant",
      detail:
        "Un ou plusieurs articles ne sont plus disponibles en quantité suffisante.",
      retryable: false,
    };
  }
  return {
    title: "Erreur de paiement",
    detail: message || "Une erreur inattendue s'est produite.",
    retryable: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, refresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const countryParam = searchParams.get("country") || "FR";
  const shopParam = searchParams.get("shop");
  const filterShopId = shopParam ? parseInt(shopParam, 10) : null;

  const [productMap, setProductMap] = useState<Record<number, Product>>({});
  const [shopMap, setShopMap] = useState<Record<number, Shop>>({});
  const [shippingProfiles, setShippingProfiles] = useState<
    Record<number, ShopShippingProfile[]>
  >({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [step, setStep] = useState<Step>("form");
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  // Stripe PaymentIntent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);

  // Billing fields
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState(countryParam);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const zone: ShippingZone = countryToZone(countryCode);

  // Pre-fill from user profile and load saved addresses
  useEffect(() => {
    if (user) {
      setGivenName((prev) => prev || user.firstname || "");
      setFamilyName((prev) => prev || user.lastname || "");
      setBillingEmail((prev) => prev || user.email || "");

      // Load saved addresses
      setLoadingAddresses(true);
      addressesApi
        .list()
        .then(setSavedAddresses)
        .catch(() => {})
        .finally(() => setLoadingAddresses(false));
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Redirect if cart empty (only when on form step)
  useEffect(() => {
    if (!cartLoading && items.length === 0 && step === "form") {
      router.push("/cart");
    }
  }, [cartLoading, items, step, router]);

  // Load products + shops + shipping
  useEffect(() => {
    if (cartLoading || items.length === 0) {
      setLoadingProducts(false);
      return;
    }
    async function loadData() {
      try {
        const ids = [...new Set(items.map((i) => i.product_id))];
        const results = await Promise.allSettled(
          ids.map((id) => productsApi.get(id)),
        );
        const pMap: Record<number, Product> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") pMap[r.value.id] = r.value;
        });
        setProductMap(pMap);

        const shopIds = [
          ...new Set(
            Object.values(pMap)
              .map((p) => p.shop_id)
              .filter(Boolean),
          ),
        ];

        if (shopIds.length > 0) {
          const [shopResults, shippingResult] = await Promise.allSettled([
            Promise.allSettled(shopIds.map((id) => shopsApi.get(id))),
            shopsApi.getShippingBulk(shopIds),
          ]);

          const sMap: Record<number, Shop> = {};
          if (shopResults.status === "fulfilled") {
            shopResults.value.forEach((r) => {
              if (r.status === "fulfilled") sMap[r.value.id] = r.value;
            });
          }
          setShopMap(sMap);

          if (shippingResult.status === "fulfilled") {
            setShippingProfiles(shippingResult.value);
          }
        }
      } catch {
        // silent
      } finally {
        setLoadingProducts(false);
      }
    }
    loadData();
  }, [items, cartLoading]);

  // Filter items by shop if per-shop checkout
  const checkoutItems = useMemo(() => {
    if (filterShopId === null) return items;
    return items.filter((item) => {
      const product = productMap[item.product_id];
      return product?.shop_id === filterShopId;
    });
  }, [items, productMap, filterShopId]);

  // Group items by shop
  const shopGroups = useMemo(() => {
    const groups = new Map<number, typeof checkoutItems>();
    for (const item of checkoutItems) {
      const product = productMap[item.product_id];
      const shopId = product?.shop_id ?? 0;
      if (!groups.has(shopId)) groups.set(shopId, []);
      groups.get(shopId)!.push(item);
    }
    return groups;
  }, [checkoutItems, productMap]);

  // Compute totals
  const subtotal = checkoutItems.reduce((sum, item) => {
    const p = productMap[item.product_id];
    return sum + (p ? Number(p.price) * item.quantity : 0);
  }, 0);

  const totalShipping = useMemo(() => {
    let total = 0;
    for (const [shopId, shopItems] of shopGroups) {
      const enriched = shopItems
        .map((i) => ({
          product: productMap[i.product_id],
          quantity: i.quantity,
        }))
        .filter((i) => i.product) as { product: Product; quantity: number }[];
      total += computeShopShipping(
        enriched,
        shippingProfiles[shopId] || [],
        zone,
      );
    }
    return total;
  }, [shopGroups, productMap, shippingProfiles, zone]);

  const grandTotal = subtotal + totalShipping;

  // Apply selected address to form
  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    if (address.street) setAddressLine(address.street);
    if (address.city) setCity(address.city);
    if (address.postal_code) setPostalCode(address.postal_code);
    if (address.country) setCountryCode(address.country);
  };

  // Create order + PaymentIntent
  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const errors: Record<string, string> = {};
    if (!givenName.trim()) errors.givenName = "Le prénom est requis.";
    if (!familyName.trim()) errors.familyName = "Le nom est requis.";
    if (!billingEmail.trim()) errors.billingEmail = "L'email est requis.";
    if (!addressLine.trim()) errors.addressLine = "L'adresse est requise.";
    if (!city.trim()) errors.city = "La ville est requise.";
    if (!postalCode.trim()) errors.postalCode = "Le code postal est requis.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIntentLoading(true);

    try {
      // 1. Create the order with shipping zone
      const orderItems = checkoutItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(productMap[item.product_id]?.price ?? 0),
      }));
      const shopIds = filterShopId ? [filterShopId] : undefined;
      const order = await orders.create(orderItems, zone, shopIds);

      // 2. Create Stripe PaymentIntent (total includes shipping)
      const payment = await payments.createIntent({
        order_id: order.id,
        amount: Number(order.total),
        currency: "EUR",
      });

      setOrderId(order.id);
      setPaymentIntentId(payment.stripe_payment_intent_id!);
      setClientSecret(payment.stripe_client_secret!);
    } catch (err: any) {
      setPaymentError(parseApiError(err.message || ""));
    } finally {
      setIntentLoading(false);
    }
  };

  const handleRetry = () => {
    setPaymentError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    setOrderId(null);
    setStep("form");
  };

  const handlePaymentSuccess = useCallback((oid: number) => {
    setSuccessOrderId(oid);
    setStep("success");
  }, []);

  const handlePaymentError = useCallback((err: PaymentError) => {
    setPaymentError(err);
    if (!err.retryable) setStep("error");
  }, []);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#6b7c6e",
                fontFamily: "ui-monospace, monospace",
                borderRadius: "0px",
              },
            },
          }
        : null,
    [clientSecret],
  );

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

  // ── Success screen ──
  if (step === "success") {
    return <SuccessScreen orderId={successOrderId || 0} />;
  }

  // ── Non-retryable error screen ──
  if (step === "error" && paymentError && !paymentError.retryable) {
    return <ErrorScreen title={paymentError.title} detail={paymentError.detail} />;
  }

  // ── Main checkout layout ──
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
        <h1 className="text-2xl font-light tracking-tight text-stone-900">
          Paiement sécurisé
        </h1>
        {filterShopId && shopMap[filterShopId] && (
          <p className="mt-1 text-sm text-sage-600 flex items-center gap-2">
            <Store size={14} />
            Commande pour la boutique : {shopMap[filterShopId].name}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column — forms */}
        <div className="lg:col-span-3">
          {/* ── Step 1: Billing info ── */}
          {!clientSecret && (
            <form onSubmit={handleBillingSubmit} className="space-y-6">
              {/* Billing contact */}
              <BillingContactForm
                givenName={givenName}
                familyName={familyName}
                billingEmail={billingEmail}
                phone={phone}
                formErrors={formErrors}
                onGivenNameChange={(value) => {
                  setGivenName(value);
                  if (formErrors.givenName) {
                    setFormErrors((p) => ({ ...p, givenName: "" }));
                  }
                }}
                onFamilyNameChange={(value) => {
                  setFamilyName(value);
                  if (formErrors.familyName) {
                    setFormErrors((p) => ({ ...p, familyName: "" }));
                  }
                }}
                onEmailChange={(value) => {
                  setBillingEmail(value);
                  if (formErrors.billingEmail) {
                    setFormErrors((p) => ({ ...p, billingEmail: "" }));
                  }
                }}
                onPhoneChange={setPhone}
              />

              {/* Saved addresses */}
              <SavedAddressesList
                savedAddresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={handleSelectAddress}
                onDeselect={() => {
                  setSelectedAddressId(null);
                  setAddressLine("");
                  setCity("");
                  setPostalCode("");
                  setCountryCode("FR");
                }}
              />

              {/* Billing address */}
              <AddressForm
                addressLine={addressLine}
                city={city}
                postalCode={postalCode}
                countryCode={countryCode}
                zone={zone}
                formErrors={formErrors}
                savedAddressSelected={selectedAddressId !== null}
                onAddressLineChange={(value) => {
                  setAddressLine(value);
                  if (formErrors.addressLine) {
                    setFormErrors((p) => ({ ...p, addressLine: "" }));
                  }
                }}
                onCityChange={(value) => {
                  setCity(value);
                  if (formErrors.city) {
                    setFormErrors((p) => ({ ...p, city: "" }));
                  }
                }}
                onPostalCodeChange={(value) => {
                  setPostalCode(value);
                  if (formErrors.postalCode) {
                    setFormErrors((p) => ({ ...p, postalCode: "" }));
                  }
                }}
                onCountryCodeChange={setCountryCode}
              />

              {/* Inline error */}
              {paymentError && paymentError.retryable && (
                <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        {paymentError.title}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {paymentError.detail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={intentLoading}
                className="w-full flex items-center justify-center gap-2 border-2 border-sage-700 bg-sage-700 px-6 py-4 text-sm text-white hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {intentLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    préparation du paiement…
                  </>
                ) : (
                  <>continuer vers le paiement</>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: Stripe Payment Element ── */}
          {clientSecret && stripePromise && elementsOptions && (
            <div className="space-y-6">
              {/* Retryable error */}
              {paymentError && paymentError.retryable && (
                <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        {paymentError.title}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {paymentError.detail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="shrink-0 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 px-2 py-1 transition-colors"
                    >
                      <RotateCcw size={12} />
                      réessayer
                    </button>
                  </div>
                </div>
              )}

              <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentForm
                  total={grandTotal}
                  orderId={orderId!}
                  paymentIntentId={paymentIntentId!}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          )}
        </div>

        {/* Right column — Order summary */}
        <div className="lg:col-span-2">
          <OrderSummary
            items={checkoutItems as CartItem[]}
            productMap={productMap}
            shopMap={shopMap}
            shippingProfiles={shippingProfiles}
            subtotal={subtotal}
            totalShipping={totalShipping}
            grandTotal={grandTotal}
            zone={zone}
            computeShopShipping={computeShopShipping}
          />
        </div>
      </div>
    </div>
  );
}
