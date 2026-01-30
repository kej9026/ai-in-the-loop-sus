// Shared types aligned with Supabase schema + current UI needs.

export type MediaType = "movie" | "game" | "book"
export type MediaStatus = "wishlist" | "in-progress" | "completed"

export interface Profile {
  id: string // uuid
  display_name: string | null
  email: string | null
  avatar_url: string | null
  role: "user" | "admin" | string
  created_at: string // timestamptz ISO
  updated_at: string // timestamptz ISO
}

// Normalized DB Types
export interface MediaMetadata {
  id: string
  title: string
  type: MediaType
  release_date: string | null
  poster_url: string | null
  overview: string | null
  ai_metadata: Record<string, unknown>
  metadata: Record<string, any> // New column
  created_at: string
  updated_at: string
}

export interface UserLog {
  id: string
  user_id: string
  media_id: string
  status: MediaStatus
  rating: number
  moods: string[]
  start_date: string | null
  end_date: string | null
  one_line_review: string | null
  detailed_review: string | null
  created_at: string
  updated_at: string
  // Join result
  media?: MediaMetadata
}

// UI shape used by current components (`components/nua/media-card.tsx`)
export interface MediaItem {
  id: string // primary key of user_logs
  mediaId: string // primary key of media_items
  title: string
  type: MediaType
  posterUrl: string
  rating: number
  status: MediaStatus
  moods: string[]
  startDate?: string
  endDate?: string
  oneLineReview?: string
  detailedReview?: string
  overview?: string
  // Extended Metadata
  director?: string // Movie
  cast?: string[]   // Movie
  runtime?: number  // Movie

  developer?: string // Game
  publisher?: string // Game/Book
  platforms?: string[] // Game
  stores?: string[] // Game

  author?: string    // Book
  genres?: string[] // All

  metadata?: Record<string, any> // Raw storage
}

export function userLogToMediaItem(log: UserLog): MediaItem {
  if (!log.media) {
    throw new Error("Media join missing for user log")
  }

  const meta = log.media.metadata || {}

  return {
    id: log.id,
    mediaId: log.media.id,
    title: log.media.title,
    type: log.media.type,
    posterUrl: log.media.poster_url ?? "",
    rating: Number(log.rating ?? 0),
    status: log.status,
    moods: Array.isArray(log.moods) ? log.moods : [],
    startDate: log.start_date ?? undefined,
    endDate: log.end_date ?? undefined,
    oneLineReview: log.one_line_review ?? undefined,
    detailedReview: log.detailed_review ?? undefined,
    overview: log.media.overview ?? undefined,

    // Map Metadata
    director: meta.director,
    cast: meta.cast,
    developer: meta.developer,
    publisher: meta.publisher,
    author: meta.author,
    metadata: meta
  }
}


