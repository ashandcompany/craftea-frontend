'use client';

import Link from 'next/link';
import { Home, Coffee, ArrowLeft, Compass, Sparkles, Heart, Squirrel } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white font-mono flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="border-2 border-sage-200 bg-white p-6 relative">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-sage-200">
            <Sparkles size={18} className="text-sage-600" strokeWidth={1.5} />
            <h1 className="text-sm uppercase tracking-[0.2em] text-sage-700 font-medium">
              &gt; 404 - PAGE INTROUVABLE
            </h1>
          </div>

          {/* Contenu */}
          <div className="space-y-5 text-center">
            {/* Petit dessin */}
            <div className="text-sage-300 text-4xl mb-8">
              (◕‸◕)
            </div>

            {/* Message */}
            <div className="border-2 border-sage-100 bg-sage-50/30 p-4">
              <div className="text-stone-700 text-xs space-y-3 font-light">
                <div>
                  <p>Il court, il court, le furet</p>
                  <p>Le furet du bois, mesdames,</p>
                  <p>Il court, il court, le furet</p>
                  <p>Le furet du bois joli.</p>
                </div>
                <div className="border-t border-sage-200 pt-3">
                  <p>Il est passé par ici</p>
                  <p>Le furet du bois, mesdames</p>
                  <p>Il est passé par ici</p>
                  <p>Le furet du bois joli.</p>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-3 italic flex items-center justify-center">
                Cette page aussi, elle court... <Squirrel width={15} strokeWidth={1.5}/>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href="/"
                className="flex items-center justify-between gap-3 border-2 border-sage-200 px-4 py-3 
                           hover:border-sage-400 hover:bg-sage-50/30 transition-all duration-200 group"
              >
                <span className="flex items-center gap-2">
                  <Home size={16} className="text-sage-400" strokeWidth={2} />
                  <span className="text-sm text-stone-700">Retour à l'accueil</span>
                </span>
                <span className="text-[10px] text-sage-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  [ entrer ]
                </span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-between gap-3 border-2 border-sage-100 px-4 py-2.5 
                           hover:border-sage-300 hover:bg-sage-50/30 transition-all duration-200 group w-full"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft size={14} className="text-stone-400" strokeWidth={1.5} />
                  <span className="text-xs text-stone-500">Page précédente</span>
                </span>
                <span className="text-[9px] text-stone-400 opacity-0 group-hover:opacity-100">←</span>
              </button>
            </div>

            {/* Petit mot doux */}
            <div className="pt-3 flex items-center justify-center gap-1 text-[10px] text-sage-400">
              <Heart size={10} strokeWidth={1.5} />
              <span>Ne cherche pas, elle reviendra peut-être un jour</span>
              <Heart size={10} strokeWidth={1.5} />
            </div>
          </div>

          {/* Effet machine à écrire */}
          <div className="absolute bottom-2 right-3 text-sage-300 text-xs select-none pointer-events-none">
            ⏎
          </div>
        </div>
      </div>
    </div>
  );
}