"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/settings/artist?stripe=refresh");
  }, [router]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm text-stone-600">Retour Stripe en cours...</p>
    </main>
  );
}
