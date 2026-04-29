import Link from "next/link";
import { assetUrl } from "@/lib/utils";
import type { Shop, ArtistProfile } from "@/lib/api";

interface Props {
  shop: Shop | null;
  shopArtist: ArtistProfile | null;
}

export function ProductShopBlock({ shop, shopArtist }: Props) {
  if (!shop && !shopArtist) return null;

  return (
    <div className="mt-12 border border-stone-200 p-6">
      <p className="mb-4 text-xs uppercase tracking-wider text-stone-400">vendeur</p>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
          {shop?.logo_url ? (
            <img
              src={assetUrl(shop.logo_url, "artist-images")}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : shopArtist?.logo_url ? (
            <img
              src={assetUrl(shopArtist.logo_url, "artist-images")}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
              {(shop?.name ?? "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-stone-800">{shop?.name || "Boutique"}</h3>
          {shopArtist?.user && (
            <p className="mt-0.5 text-xs text-stone-500">
              par {shopArtist.user.firstname} {shopArtist.user.lastname}
            </p>
          )}
          {(shop?.description || shopArtist?.bio) && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-500">
              {shop?.description || shopArtist?.bio}
            </p>
          )}
          {shop?.location && (
            <p className="mt-1 text-xs text-stone-400">📍 {shop.location}</p>
          )}
          {shopArtist && (
            <Link
              href={`/artists/${shopArtist.id}`}
              className="mt-3 inline-block border-b border-stone-300 pb-0.5 text-xs text-stone-600 hover:border-stone-800 hover:text-stone-900"
            >
              voir la boutique →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
