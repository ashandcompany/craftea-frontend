"use client";

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ mode = 'login', onError }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.('Erreur lors de la connexion avec Google');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push('/');
    } catch (err: any) {
      onError?.(err.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-stone-400">ou</span>
        </div>
      </div>
      
      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleResponse}
          onError={() => onError?.('Erreur lors de la connexion avec Google')}
          text={mode === 'register' ? 'signup_with' : 'signin_with'}
          theme="outline"
          size="large"
          locale="fr"
        />
        
        <style jsx global>{`
          .google-login-wrapper {
            width: 100%;
          }
          .google-login-wrapper > div {
            width: 100% !important;
          }
          .google-login-wrapper iframe {
            width: 100% !important;
          }
          /* Custom styling to match the site theme */
          .google-login-wrapper [role="button"] {
            font-family: ui-monospace, monospace !important;
            border-color: rgb(231 229 228) !important;
            font-size: 0.875rem !important;
            text-transform: lowercase !important;
          }
        `}</style>
      </div>
    </div>
  );
}
