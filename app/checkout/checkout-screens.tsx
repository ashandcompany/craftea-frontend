import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

interface SuccessScreenProps {
  orderId: number;
}

export function SuccessScreen({ orderId }: SuccessScreenProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 font-mono text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
        <CheckCircle className="h-8 w-8 text-sage-700" />
      </div>
      <h1 className="mt-6 text-2xl font-light text-stone-900">
        Paiement confirmé
      </h1>
      <p className="mt-2 text-sm text-sage-600">
        Votre commande n°{orderId} a bien été enregistrée.
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

interface ErrorScreenProps {
  title: string;
  detail: string;
}

export function ErrorScreen({ title, detail }: ErrorScreenProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 font-mono text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <XCircle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="mt-6 text-2xl font-light text-stone-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
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
