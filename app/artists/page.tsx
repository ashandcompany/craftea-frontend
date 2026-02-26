"use client";

import { useEffect, useState } from "react";
import { artists as artistsApi, type ArtistProfile } from "@/lib/api";
import { ArtistCard } from "@/components/artist-card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    artistsApi
      .list()
      .then(setArtists)
      .catch((err) => setError(err.message || "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-10 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-light tracking-tight text-stone-900">Artistes</h1>
        <p className="mt-2 text-sm text-stone-500">
          — {loading ? 'chargement...' : `${artists.length} artisan${artists.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block h-6 w-6 animate-pulse">⏳</div>
          <p className="mt-2 text-sm">chargement des artisans...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent font-mono">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : artists.length === 0 ? (
        <div className="border border-stone-200 py-20 text-center">
          <p className="text-stone-500">— aucun artisan pour le moment —</p>
          <p className="mt-2 text-xs text-stone-400">revenez plus tard</p>
        </div>
      ) : (
        <>
          {/* Artist grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <div key={artist.id} className="relative">
                <ArtistCard artist={artist} />
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 border-t border-stone-200 pt-6 text-center">
            <p className="text-xs text-stone-400">
              ✦ {artists.length} artisan{artists.length > 1 ? 's' : ''} enregistré{artists.length > 1 ? 's' : ''} ✦
            </p>
          </div>
        </>
      )}
    </div>
  );
}