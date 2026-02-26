"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Palette } from "lucide-react";

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
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Palette className="mx-auto size-10 text-primary-500" />
          <h1 className="mt-4 text-2xl font-bold text-title-50">Créer un compte</h1>
          <p className="mt-2 text-sm text-text-100">
            Rejoignez la communauté Craftea
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prénom</label>
              <Input
                placeholder="Marie"
                value={form.firstname}
                onChange={update("firstname")}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                placeholder="Dupont"
                value={form.lastname}
                onChange={update("lastname")}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mot de passe</label>
            <Input
              type="password"
              placeholder="Min. 6 caractères"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmer le mot de passe</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-100">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
