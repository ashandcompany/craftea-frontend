"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
        <div className="w-full max-w-md">
          <div className="mb-10 border-b border-stone-200 pb-6 text-center">
            <h1 className="text-3xl font-light tracking-tight text-stone-900">
              Email envoyé
            </h1>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center space-y-4">
            <p className="text-sm text-stone-700">
              Nous avons envoyé un lien de réinitialisation à{' '}
              <strong>{email}</strong>
            </p>
            <p className="text-xs text-stone-500">
              Le lien est valable <strong>1 heure</strong>. Vérifiez votre dossier spam si vous ne recevez pas l'email.
            </p>
          </div>

          <div className="mt-8 space-y-4 text-center">
            <Link
              href="/login"
              className="block text-xs text-stone-500 hover:text-stone-700"
            >
              ← retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 border-b border-stone-200 pb-6 text-center">
          <h1 className="text-3xl font-light tracking-tight text-stone-900">
            Mot de passe oublié
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            — réinitialiser votre mot de passe —
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <p className="text-xs text-stone-500 mb-4">
              Entrez l'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-stone-800 bg-stone-800 px-4 py-3 text-sm text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? 'envoi en cours...' : 'envoyer le lien'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-500">
            vous vous souvenez de votre mot de passe ?{' '}
            <Link
              href="/login"
              className="text-stone-800 hover:underline border-b border-stone-200 hover:border-stone-800 pb-0.5"
            >
              se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
