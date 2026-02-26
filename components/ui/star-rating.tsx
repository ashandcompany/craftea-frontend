import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  size = "md", 
  interactive = false, 
  onRate 
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "size-3" : "size-4";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          className={interactive ? "cursor-pointer" : ""}
          disabled={!interactive}
        >
          <Star
            className={`${sizeClass} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
