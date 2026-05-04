import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RatingStars = ({
  rating,
  onRatingChange,
  interactive = false,
  size = "md",
}: RatingStarsProps) => {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRatingChange?.(star)}
          className={`transition-all ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          disabled={!interactive}
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
};
