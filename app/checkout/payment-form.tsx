import { CreditCard, Lock, Loader2, ShieldCheck } from "lucide-react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

export interface PaymentError {
  title: string;
  detail: string;
  retryable: boolean;
}

interface PaymentFormProps {
  total: number;
  orderId: number;
  paymentIntentId: string;
  onSuccess: (orderId: number) => void;
  onError: (err: PaymentError) => void;
}

export function PaymentForm({
  total,
  orderId,
  paymentIntentId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/checkout",
        },
        redirect: "if_required",
      });

      if (error) {
        onError({
          title: "Paiement échoué",
          detail: error.message || "Une erreur est survenue lors du paiement.",
          retryable:
            error.type === "card_error" ||
            error.type === "validation_error",
        });
        setProcessing(false);
        return;
      }

      // Payment succeeded
      onSuccess(orderId);
    } catch (err: any) {
      onError({
        title: "Erreur de paiement",
        detail: err.message || "Une erreur inattendue s'est produite.",
        retryable: true,
      });
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="border-2 border-sage-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-sage-600" />
          <h2 className="text-sm uppercase tracking-wider text-sage-700">
            Informations de paiement
          </h2>
        </div>
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{ layout: "tabs" }}
        />
        {!elementReady && (
          <div className="flex items-center gap-2 text-xs text-sage-500 mt-2">
            <Loader2 size={12} className="animate-spin" />
            Chargement du formulaire de paiement…
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={processing || !stripe || !elements || !elementReady}
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
