"use client";

import Link from "next/link";
import type { ArtistProfile } from "@/lib/api";

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  const initial = artist.id ? String(artist.id).charAt(0) : "?";

  return (
    <div className="border border-stone-200 bg-paper-50 p-4 font-mono">
      {/* Banner & Avatar */}
      <div className="relative mb-8">
        {/* Banner */}
        <div className="h-16 border border-stone-200 bg-stone-100">
          {artist.banner_url && (
            <img src={artist.banner_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        
        {/* Avatar */}
        <div className="absolute -bottom-6 left-2 flex h-12 w-12 items-center justify-center border border-stone-300 bg-paper-50 text-xs uppercase text-stone-500">
          {artist.logo_url ? (
            <img src={artist.logo_url} alt={`Artist ${artist.id}`} className="h-full w-full object-cover" />
          ) : (
            <span>A{initial}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Name & Validation */}
        <div className="space-y-1">
          <Link href={`/artists/${artist.id}`} className="block">
            <h3 className="text-sm text-stone-800 hover:underline">
              {artist.user
                ? `${artist.user.firstname} ${artist.user.lastname}`
                : `Artiste #${artist.id}`}
            </h3>
          </Link>
          <p className="text-xs text-stone-400">
            {artist.validated ? "✓ vérifié" : "○ en attente"}
          </p>
        </div>

        {/* Separator */}
        <div className="h-px w-full bg-stone-200" />

        {/* Bio */}
        {artist.bio && (
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-600">
            {artist.bio}
          </p>
        )}

        {/* Shops */}
        {artist.shops && artist.shops.length > 0 && (
          <div className="flex items-center gap-1 border-t border-stone-200 pt-2 text-[10px] uppercase tracking-wider text-stone-400">
            <span>📍</span>
            <span>
              {artist.shops.length} boutique{artist.shops.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}