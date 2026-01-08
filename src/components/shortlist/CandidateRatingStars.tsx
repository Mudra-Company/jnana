import React from 'react';
import { Star } from 'lucide-react';

// Simple cn utility for classnames
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface CandidateRatingStarsProps {
  rating?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export const CandidateRatingStars: React.FC<CandidateRatingStarsProps> = ({
  rating = 0,
  onChange,
  readonly = false,
  size = 'md'
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      // Toggle off if clicking the same rating
      onChange(rating === value ? 0 : value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div 
      className={cn(
        "flex gap-0.5",
        !readonly && "cursor-pointer"
      )}
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(value)}
          onMouseEnter={() => !readonly && setHoverRating(value)}
          className={cn(
            "transition-colors focus:outline-none",
            readonly ? "cursor-default" : "hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              value <= displayRating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};
