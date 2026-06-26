"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleLoginButton } from "@/components/google-login-button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await register({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
      });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md py-11">
        {/* Header */}
        <div className="mb-10 border-b border-stone-200 pb-6 text-center">
          <h1 className="text-3xl font-light tracking-tight text-stone-900">
            Créer un compte
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            — rejoignez la communauté —
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Login Button */}
          <GoogleLoginButton mode="register" onError={setError} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-stone-400">
                prénom
              </label>
              <input
                placeholder="Marie"
                value={form.firstname}
                onChange={update("firstname")}
                required
                className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-stone-400">
                nom
              </label>
              <input
                placeholder="Dupont"
                value={form.lastname}
                onChange={update("lastname")}
                required
                className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={update("email")}
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
              placeholder="min. 6 caractères"
              value={form.password}
              onChange={update("password")}
              required
              className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              confirmer le mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              required
              className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-stone-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-stone-800 bg-stone-800 px-4 py-3 text-sm text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "inscription..." : "s'inscrire"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-500">
            déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-stone-800 hover:underline border-b border-stone-200 hover:border-stone-800 pb-0.5"
            >
              se connecter
            </Link>
          </p>
        </div>

        {/* Lien retour */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-[10px] text-stone-400 hover:text-stone-600"
          >
            ← retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
