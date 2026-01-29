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

export interface Post {
  id: string // uuid
  user_id: string // uuid

  title: string
  media_type: MediaType
  status: MediaStatus

  poster_url: string | null
  rating: number // numeric(2,1)

  moods: string[]

  start_date: string | null // date (YYYY-MM-DD)
  end_date: string | null // date (YYYY-MM-DD)

  one_line_review: string | null
  detailed_review: string | null

  external_id: string | null
  ai_metadata: Record<string, unknown>

  created_at: string // timestamptz ISO
  updated_at: string // timestamptz ISO
}

// UI shape used by current components (`components/nua/media-card.tsx`)
export interface MediaItem {
  id: string
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
}

export function postToMediaItem(post: Post): MediaItem {
  return {
    id: post.id,
    title: post.title,
    type: post.media_type,
    posterUrl: post.poster_url ?? "",
    rating: Number(post.rating ?? 0),
    status: post.status,
    moods: Array.isArray(post.moods) ? post.moods : [],
    startDate: post.start_date ?? undefined,
    endDate: post.end_date ?? undefined,
    oneLineReview: post.one_line_review ?? undefined,
    detailedReview: post.detailed_review ?? undefined,
  }
}

export function mediaItemToPostInsert(
  userId: string,
  item: MediaItem & { externalId?: string; aiMetadata?: Record<string, unknown> }
): Omit<
  Post,
  "id" | "created_at" | "updated_at" | "user_id" | "ai_metadata"
> & { user_id: string; ai_metadata: Record<string, unknown> } {
  return {
    user_id: userId,
    title: item.title,
    media_type: item.type,
    status: item.status,
    poster_url: item.posterUrl || null,
    rating: item.rating ?? 0,
    moods: item.moods ?? [],
    start_date: item.startDate ?? null,
    end_date: item.endDate ?? null,
    one_line_review: item.oneLineReview ?? null,
    detailed_review: item.detailedReview ?? null,
    external_id: item.externalId ?? null,
    ai_metadata: item.aiMetadata ?? {},
  }
}

