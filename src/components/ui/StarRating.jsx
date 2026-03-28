import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, max = 5, onRate = null, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  const iconSize = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= rating
        
        return (
          <button
            key={i}
            type="button"
            disabled={!onRate}
            onClick={() => onRate && onRate(starValue)}
            className={`${onRate ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${iconSize} ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} transition-colors`}
            />
          </button>
        )
      })}
    </div>
  )
}
