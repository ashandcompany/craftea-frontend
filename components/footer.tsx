import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-paper-50 font-mono">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="block text-lg tracking-tight text-stone-800">
              Craftea
            </Link>
            <div className="h-px w-12 bg-stone-300" />
            <p className="text-xs leading-relaxed text-stone-600">
              La marketplace des créateurs artisanaux.
              <br />
              Pièces uniques, faites main.
            </p>
          </div>

          {/* Découvrir */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400">découvrir</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  catalogue
                </Link>
              </li>
              <li>
                <Link href="/artists" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  artistes
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  catégories
                </Link>
              </li>
            </ul>
          </div>

          {/* Compte */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400">mon compte</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  profil
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  favoris
                </Link>
              </li>
              <li>
                <Link href="/profile/addresses" className="text-sm text-stone-600 hover:text-stone-800 hover:underline">
                  adresses
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400">informations</h4>
            <ul className="space-y-2">
              <li className="text-sm text-stone-500">à propos</li>
              <li className="text-sm text-stone-500">contact</li>
              <li className="text-sm text-stone-500">conditions</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 space-y-3">
          <div className="h-px w-full bg-stone-200" />
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-stone-400 sm:flex-row">
            <p>© {currentYear} craftea — tous droits réservés</p>
            <p className="tracking-wider">✦ tapé à la main, pensé pour durer ✦</p>
          </div>
        </div>
      </div>
    </footer>
  );
}