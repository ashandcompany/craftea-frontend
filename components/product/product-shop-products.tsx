import Link from "next/link";
import { assetUrl } from "@/lib/utils";
import type { Product, ArtistProfile } from "@/lib/api";

interface Props {
  products: Product[];
  shopArtist: ArtistProfile | null;
}

export function ProductShopProducts({ products, shopArtist }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 border-t border-stone-200 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-light tracking-tight text-stone-900">
          Autres créations de la boutique
        </h2>
        {shopArtist && (
          <Link
            href={`/artists/${shopArtist.id}`}
            className="text-xs text-stone-400 hover:text-stone-800"
          >
            voir tout →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="group block border border-stone-200 p-3 transition-colors hover:border-stone-400"
          >
            <div className="mb-3 aspect-square overflow-hidden border border-stone-100 bg-stone-50">
              {p.images?.[0]?.image_url ? (
                <img
                  src={assetUrl(p.images[0].image_url, "product-images")}
                  alt={p.title || ""}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-stone-300">
                  [image]
                </div>
              )}
            </div>
            <p className="truncate text-xs text-stone-700">{p.title || "sans titre"}</p>
            {p.price != null && (
              <p className="mt-0.5 text-xs text-stone-500">{Number(p.price).toFixed(2)} €</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
