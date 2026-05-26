"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from "react";
import type { User } from "@/lib/api";

export function Providers({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <ThemeProvider>
        <AuthProvider initialUser={initialUser}>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
