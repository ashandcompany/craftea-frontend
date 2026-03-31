"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await auth.resetPassword(token as string, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
        <div className="w-full max-w-md">
          <div className="mb-10 border-b border-green-200 pb-6 text-center">
            <h1 className="text-3xl font-light tracking-tight text-green-900">
              Succès !
            </h1>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4">
            <p className="text-sm text-green-700">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <p className="text-xs text-green-600">
              Redirection vers la connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
        <div className="w-full max-w-md">
          <div className="mb-10 border-b border-stone-200 pb-6 text-center">
            <h1 className="text-3xl font-light tracking-tight text-stone-900">
              Lien invalide
            </h1>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-4">
            <p className="text-sm text-red-700">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <p className="text-xs text-red-600">
              Les liens sont valables 1 heure à partir de leur génération.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/forgot-password"
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              ← demander un nouveau lien
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
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            — créez un mot de passe sécurisé —
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors text-xs uppercase"
              >
                {showPassword ? "masquer" : "voir"}
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Minimum 8 caractères
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors text-xs uppercase"
              >
                {showConfirm ? "masquer" : "voir"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-stone-800 bg-stone-800 px-4 py-3 text-sm text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? 'réinitialisation...' : 'réinitialiser le mot de passe'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-500">
            <Link
              href="/login"
              className="text-stone-800 hover:underline border-b border-stone-200 hover:border-stone-800 pb-0.5"
            >
              retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
