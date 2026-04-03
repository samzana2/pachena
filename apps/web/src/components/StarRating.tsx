import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const stars = Array.from({ length: maxRating }, (_, i) => {
    const starValue = i + 1;
    const fillPercentage = Math.min(1, Math.max(0, rating - i));

    if (fillPercentage === 1) {
      // Fully filled star
      return (
        <Star
          key={i}
          className={cn(sizeClasses[size], "fill-star text-star")}
        />
      );
    } else if (fillPercentage === 0) {
      // Empty star
      return (
        <Star
          key={i}
          className={cn(sizeClasses[size], "fill-star-empty text-star-empty")}
        />
      );
    } else {
      // Partially filled star - use gradient mask
      const percentFilled = Math.round(fillPercentage * 100);
      return (
        <div key={i} className={cn("relative", sizeClasses[size])}>
          {/* Background empty star */}
          <Star
            className={cn(
              "absolute inset-0",
              sizeClasses[size],
              "fill-star-empty text-star-empty"
            )}
          />
          {/* Foreground filled star with clip */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${percentFilled}%` }}
          >
            <Star
              className={cn(sizeClasses[size], "fill-star text-star")}
            />
          </div>
        </div>
      );
    }
  });

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
