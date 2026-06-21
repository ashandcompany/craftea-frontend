import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white font-mono">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 border-b border-sage-200 text-xs text-sage-600 transition-colors hover:border-sage-400 hover:text-sage-800"
        >
          <span className="text-sage-400">←</span>
          <span className="uppercase tracking-wider">retour à l'accueil</span>
        </Link>

        <h1 className="mt-6 text-3xl font-light tracking-tight text-stone-900">
          Nous contacter
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Une question, un problème, une suggestion ? Nous sommes à votre
          écoute.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="border-2 border-sage-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={16} className="text-sage-500" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider text-sage-700">
                Email
              </span>
            </div>
            <a
              href="mailto:hello@craftea.fr"
              className="border-b border-sage-200 text-sm text-sage-600 transition-colors hover:border-sage-400 hover:text-sage-800"
            >
              hello@craftea.fr
            </a>
            <p className="mt-2 text-xs text-stone-400">
              Réponse sous 24–48 h ouvrées
            </p>
          </div>

          <div className="border-2 border-sage-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Phone size={16} className="text-sage-500" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider text-sage-700">
                Téléphone
              </span>
            </div>
            <span className="text-sm text-stone-700">
              +33 (0)1 84 17 92 10
            </span>
            <p className="mt-2 text-xs text-stone-400">
              Du lundi au vendredi, 9h–18h
            </p>
          </div>

          <div className="border-2 border-sage-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-sage-500" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider text-sage-700">
                Adresse
              </span>
            </div>
            <p className="text-sm text-stone-700">15 Rue des Artisans</p>
            <p className="text-sm text-stone-700">75011 Paris, France</p>
          </div>

          <div className="border-2 border-sage-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={16} className="text-sage-500" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider text-sage-700">
                Horaires
              </span>
            </div>
            <p className="text-sm text-stone-700">Lun – Ven : 9h–18h</p>
            <p className="mt-1 text-xs text-stone-400">Fermé les week-ends</p>
          </div>
        </div>
      </div>
    </div>
  );
}
