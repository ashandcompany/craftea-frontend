import { CreditCard, Lock, Loader2, ShieldCheck } from "lucide-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useRef } from "react";
import { payments as paymentsApi } from "@/lib/api";

export interface PaymentError {
  title: string;
  detail: string;
  retryable: boolean;
}

interface PaymentFormProps {
  total: number;
  orderId: number;
  clientSecret: string;
  paymentIntentId: string;
  onSuccess: (orderId: number) => void;
  onError: (err: PaymentError) => void;
}

export function PaymentForm({
  total,
  orderId,
  clientSecret,
  paymentIntentId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const confirmingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || confirmingRef.current) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    confirmingRef.current = true;
    setProcessing(true);
    try {
      const confirmPromise = stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      // confirmCardPayment can hang indefinitely when a browser extension
      // (Firefox ETP, uBlock, Brave) blocks Stripe's iframe network calls.
      // Those requests come from the iframe and are invisible in DevTools.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "La connexion à Stripe a expiré. Désactivez votre bloqueur de publicités ou essayez un autre navigateur.",
              ),
            ),
          30_000,
        ),
      );
      const { error, paymentIntent } = await Promise.race([
        confirmPromise,
        timeoutPromise,
      ]);

      if (error) {
        onError({
          title: "Paiement échoué",
          detail: error.message || "Une erreur est survenue lors du paiement.",
          retryable:
            error.type === "card_error" || error.type === "validation_error",
        });
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await paymentsApi.confirm({ payment_intent_id: paymentIntentId });
        onSuccess(orderId);
        return;
      }

      // Statut inattendu (processing, requires_action non géré, etc.)
      onError({
        title: "Statut de paiement inattendu",
        detail: `Statut reçu : ${paymentIntent?.status ?? "inconnu"}. Vérifiez vos commandes ou réessayez.`,
        retryable: paymentIntent?.status === "processing",
      });
    } catch (err: unknown) {
      onError({
        title: "Erreur de paiement",
        detail:
          err instanceof Error
            ? err.message
            : "Une erreur inattendue s'est produite.",
        retryable: true,
      });
    } finally {
      setProcessing(false);
      confirmingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-sage-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-sage-600" />
          <h2 className="text-sm uppercase tracking-wider text-sage-700">
            Informations de paiement
          </h2>
        </div>
        <div className="border border-sage-200 px-3 py-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#292524",
                  "::placeholder": { color: "#a8a29e" },
                },
                invalid: { color: "#dc2626" },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full flex items-center justify-center gap-2 border-2 border-sage-700 bg-sage-700 px-6 py-4 text-sm text-white hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
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
        <span>Paiement sécurisé — propulsé par Stripe</span>
      </div>
    </form>
  );
}
