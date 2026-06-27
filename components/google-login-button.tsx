"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

let googleInitialized = false;

export function GoogleLoginButton({ mode = 'login', onError }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      onError?.('Erreur lors de la connexion avec Google');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      router.push('/');
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  const initAndRender = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || googleInitialized) return;

    googleInitialized = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const buttonDiv = document.getElementById('google-signin-button');
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 400,
        locale: 'fr',
      });
      setButtonReady(true);
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.('Configuration Google manquante');
      return;
    }

    // Script already loaded
    if (window.google) {
      initAndRender();
      return;
    }

    // Script already in DOM but not yet loaded
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', initAndRender, { once: true });
      return;
    }

    // First load
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initAndRender;
    script.onerror = () => onError?.('Impossible de charger Google Sign-In');
    document.body.appendChild(script);
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <div
          id="google-signin-button"
          className={`transition-opacity ${buttonReady ? 'opacity-100' : 'opacity-0'}`}
        />
        {!buttonReady && !loading && (
          <div className="h-10 flex items-center text-sm text-stone-400">
            Chargement...
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-sm text-stone-600">Connexion...</div>
          </div>
        )}
      </div>
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-stone-400">ou</span>
        </div>
      </div>
    </div>
  );
}
