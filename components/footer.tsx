import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-paper-50 font-mono transition-colors dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="block text-lg tracking-tight text-stone-800 transition-colors hover:text-stone-600 dark:text-stone-200 dark:hover:text-stone-400">
              Craftea
            </Link>
            <div className="h-px w-12 bg-stone-300 dark:bg-stone-700" />
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              La marketplace des créateurs artisanaux.
              <br />
              Pièces uniques, faites main.
            </p>
          </div>

          {/* Découvrir */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500">découvrir</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  catalogue
                </Link>
              </li>
              <li>
                <Link 
                  href="/artists" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  artistes
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  catégories
                </Link>
              </li>
            </ul>
          </div>

          {/* Compte */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500">mon compte</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/profile" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  profil
                </Link>
              </li>
              <li>
                <Link 
                  href="/favorites" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  favoris
                </Link>
              </li>
              <li>
                <Link 
                  href="/profile/addresses" 
                  className="text-sm text-stone-600 transition-colors hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
                >
                  adresses
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500">informations</h4>
            <ul className="space-y-2">
              <li className="text-sm text-stone-500 transition-colors dark:text-stone-500">
                <Link 
                  href="/about" 
                  className="text-stone-500 hover:text-stone-800 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
                >
                  à propos
                </Link>
              </li>
              <li className="text-sm text-stone-500 transition-colors dark:text-stone-500">
                <Link 
                  href="/contact" 
                  className="text-stone-500 hover:text-stone-800 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
                >
                  contact
                </Link>
              </li>
              <li className="text-sm text-stone-500 transition-colors dark:text-stone-500">
                <Link 
                  href="/terms" 
                  className="text-stone-500 hover:text-stone-800 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
                >
                  conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 space-y-3">
          <div className="h-px w-full bg-stone-200 dark:bg-stone-800" />
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-stone-400 transition-colors sm:flex-row dark:text-stone-500">
            <p>© {currentYear} craftea — tous droits réservés</p>
            <p className="tracking-wider">✦ tapé à la main, pensé pour durer ✦</p>
          </div>
        </div>
      </div>
    </footer>
  );
}