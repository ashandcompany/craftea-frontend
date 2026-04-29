import { assetUrl } from "@/lib/utils";
import type { ProductImage } from "@/lib/api";

interface Props {
  images: ProductImage[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

export function ProductImages({ images, selectedImage, onSelectImage }: Props) {
  const imageUrl = images[selectedImage]?.image_url;

  return (
    <div className="space-y-3">
      <div className="aspect-square border border-stone-200 bg-stone-50">
        {imageUrl ? (
          <img
            src={assetUrl(imageUrl, "product-images")}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <span className="text-sm">[image]</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => onSelectImage(i)}
              className={`size-14 border transition-colors ${
                i === selectedImage
                  ? "border-stone-800"
                  : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <img
                src={assetUrl(img.image_url || "", "product-images")}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
