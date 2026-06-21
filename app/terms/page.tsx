import Link from "next/link";

export default function TermsPage() {
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
          Conditions générales
        </h1>
        <p className="mt-2 text-xs text-stone-400">
          Dernière mise à jour : juin 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-stone-600">
          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              1. Objet
            </h2>
            <p>
              Les présentes conditions générales régissent l'utilisation de la
              plateforme Craftea, marketplace dédiée aux créateurs artisanaux.
              En accédant au site, vous acceptez sans réserve les présentes
              conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              2. Inscription et comptes
            </h2>
            <p>
              L'inscription est gratuite et ouverte à toute personne physique
              majeure ou morale. Vous êtes responsable de la confidentialité de
              vos identifiants et de toutes les actions effectuées depuis votre
              compte.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              3. Rôle de la plateforme
            </h2>
            <p>
              Craftea agit en qualité d'intermédiaire entre acheteurs et
              vendeurs artisans. Les contrats de vente sont conclus directement
              entre les parties. Craftea n'est pas vendeur des produits listés
              sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              4. Commandes et paiements
            </h2>
            <p>
              Les paiements sont traités de manière sécurisée via Stripe. Le
              montant est débité au moment de la confirmation de commande. En
              cas de litige, contactez notre support à{" "}
              <a
                href="mailto:hello@craftea.fr"
                className="border-b border-sage-200 text-sage-600 hover:border-sage-400"
              >
                hello@craftea.fr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              5. Données personnelles
            </h2>
            <p>
              Vos données sont traitées conformément au RGPD. Elles sont
              utilisées uniquement pour le fonctionnement de la plateforme et ne
              sont pas cédées à des tiers sans votre consentement. Vous disposez
              d'un droit d'accès, de rectification et de suppression.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              6. Propriété intellectuelle
            </h2>
            <p>
              Les contenus publiés par les artisans (photos, descriptions,
              logos) leur appartiennent. En les publiant sur Craftea, ils
              accordent une licence non exclusive pour leur affichage sur la
              plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-sage-100 pb-1 text-xs uppercase tracking-wider text-sage-700">
              7. Droit applicable
            </h2>
            <p>
              Les présentes conditions sont soumises au droit français. Tout
              litige relève de la compétence des tribunaux de Paris.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-sage-100 pt-6 text-xs text-stone-400">
          Pour toute question relative à ces conditions :{" "}
          <a
            href="mailto:hello@craftea.fr"
            className="border-b border-sage-200 text-sage-500 hover:border-sage-400"
          >
            hello@craftea.fr
          </a>
        </div>
      </div>
    </div>
  );
}
