"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 border-b border-stone-200 pb-6 text-center">
          <h1 className="text-3xl font-light tracking-tight text-stone-900">
            Connexion
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            — accédez à votre espace —
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

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-stone-800 bg-stone-800 px-4 py-3 text-sm text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? 'connexion...' : 'se connecter'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-500">
            pas encore de compte ?{' '}
            <Link 
              href="/register" 
              className="text-stone-800 hover:underline border-b border-stone-200 hover:border-stone-800 pb-0.5"
            >
              créer un compte
            </Link>
          </p>
        </div>

        {/* Lien retour (optionnel) */}
        <div className="mt-4 text-center">
          <Link 
            href="/" 
            className="text-[10px] text-stone-400 hover:text-stone-600"
          >
            ← retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}