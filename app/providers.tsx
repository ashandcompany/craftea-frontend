"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import type { User } from "@/lib/api";
import { CookieManager } from "react-cookie-manager";
import { UmamiAnalytics } from "@/components/umami-analytics";

const frTranslations = {
  title: "Vos préférences cookies",
  message:
    "Nous utilisons des cookies pour améliorer votre expérience. Les cookies essentiels sont toujours activés car ils sont nécessaires au bon fonctionnement du site.",
  buttonText: "Tout accepter",
  declineButtonText: "Tout refuser",
  manageButtonText: "Personnaliser",
  privacyPolicyText: "Conditions générales",
  manageTitle: "Préférences cookies",
  manageMessage:
    "Gérez vos préférences ci-dessous. Les cookies essentiels sont toujours actifs.",
  manageEssentialTitle: "Essentiels",
  manageEssentialSubtitle: "Nécessaires au fonctionnement du site",
  manageEssentialStatus: "Statut : Toujours activés",
  manageEssentialStatusButtonText: "Toujours activé",
  manageAnalyticsTitle: "Analytiques",
  manageAnalyticsSubtitle:
    "Nous aident à comprendre comment vous utilisez le site",
  manageCookiesStatus: "Statut : {{status}} le {{date}}",
  manageCookiesStatusConsented: "Accepté",
  manageCookiesStatusDeclined: "Refusé",
  manageCancelButtonText: "Annuler",
  manageSaveButtonText: "Enregistrer",
  blockedContentTitle: "Contenu bloqué",
  blockedContentMessage:
    "Ce contenu nécessite des cookies actuellement bloqués par vos paramètres de confidentialité.",
  blockedContentInstruction:
    "Après avoir accepté les cookies, actualisez la page pour voir ce contenu.",
  blockedContentButtonText: "Gérer les cookies",
};

function CookieConsentWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <CookieManager
      translations={frTranslations}
      theme={theme}
      displayType="popup"
      showManageButton
      enableFloatingButton
      privacyPolicyUrl="/terms"
      cookieCategories={{ Analytics: true, Social: false, Advertising: false }}
      expirationDays={365}
    >
      <UmamiAnalytics />
      {children}
    </CookieManager>
  );
}

export function Providers({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  return (
    <ThemeProvider>
      <CookieConsentWrapper>
        <AuthProvider initialUser={initialUser}>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </CookieConsentWrapper>
    </ThemeProvider>
  );
}
