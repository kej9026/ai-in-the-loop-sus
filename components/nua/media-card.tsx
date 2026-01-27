"use client"

import { cn } from "@/lib/utils"
import { Film, Gamepad2, BookOpen, Star, Clock, CheckCircle2, Bookmark } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface MediaItem {
  id: string
  title: string
  type: "movie" | "game" | "book"
  posterUrl: string
  rating: number
  status: "wishlist" | "in-progress" | "completed"
  moods: string[]
  startDate?: string
  endDate?: string
  oneLineReview?: string
  detailedReview?: string
}

interface MediaCardProps {
  item: MediaItem
  onClick?: () => void
}

const typeIcons = {
  movie: Film,
  game: Gamepad2,
  book: BookOpen,
}

const statusConfig = {
  wishlist: {
    icon: Bookmark,
    label: "Wishlist",
    className: "bg-muted text-muted-foreground",
  },
  "in-progress": {
    icon: Clock,
    label: "In Progress",
    className: "bg-neon-purple/20 text-neon-purple border border-neon-purple/30",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  },
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const TypeIcon = typeIcons[item.type]
  const status = statusConfig[item.status]
  const StatusIcon = status.icon

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const calculateProgress = () => {
    if (!item.startDate) return 0
    if (item.status === "completed") return 100
    if (!item.endDate) {
      const start = new Date(item.startDate).getTime()
      const now = Date.now()
      const elapsed = now - start
      const estimatedDuration = 14 * 24 * 60 * 60 * 1000 // 14 days estimate
      return Math.min(Math.round((elapsed / estimatedDuration) * 100), 90)
    }
    return 100
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden border border-border",
        "hover:border-neon-purple/50 hover:shadow-lg hover:shadow-neon-purple/5",
        "transition-all duration-300 cursor-pointer"
      )}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={item.posterUrl || "/placeholder.svg"}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Type Icon Badge */}
        <div className="absolute top-3 left-3">
          <div className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border">
            <TypeIcon className="w-4 h-4 text-foreground" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={cn("text-xs font-medium", status.className)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-neon-purple transition-colors">
          {item.title}
        </h3>

        {/* Rating with half-star support */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isFilled = starIndex <= item.rating
            const isHalfStar = !isFilled && starIndex - 0.5 === item.rating

            return (
              <div key={starIndex} className="relative">
                {isHalfStar ? (
                  // Half star with glowing outline
                  <Star
                    className="w-4 h-4 text-transparent"
                    style={{
                      stroke: '#a855f7',
                      strokeWidth: 2.5,
                      filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))',
                    }}
                  />
                ) : (
                  <Star
                    className={cn(
                      "w-4 h-4 transition-all",
                      isFilled
                        ? "fill-neon-purple text-neon-purple"
                        : "text-muted-foreground/40"
                    )}
                    style={isFilled ? {
                      filter: 'drop-shadow(0 0 3px rgba(168, 85, 247, 0.5))',
                    } : undefined}
                  />
                )}
              </div>
            )
          })}
          <span className="text-sm font-medium text-neon-purple ml-1.5">
            {item.rating % 1 === 0 ? `${item.rating}.0` : item.rating.toFixed(1)}
          </span>
        </div>

        {/* Mood Tags */}
        <div className="flex flex-wrap gap-1.5">
          {item.moods.slice(0, 3).map((mood) => (
            <Badge
              key={mood}
              variant="outline"
              className="text-xs bg-muted/50 border-border text-muted-foreground"
            >
              {mood}
            </Badge>
          ))}
        </div>

        {/* Period Bar */}
        {item.startDate && (
          <div className="pt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate(item.startDate)}</span>
              {item.endDate && <span>{formatDate(item.endDate)}</span>}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  item.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-neon-purple"
                )}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
