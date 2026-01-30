"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { MediaItem, UserLog, MediaMetadata, userLogToMediaItem } from "@/types"
import { revalidatePath } from "next/cache"

export async function getPosts(
    searchQuery?: string,
    mediaType?: string,
    page: number = 1,
    limit: number = 24
): Promise<{ items: MediaItem[], total: number }> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from("user_logs")
        .select(`
            id, user_id, media_id, status, rating, moods, start_date, end_date, one_line_review, detailed_review,
            media:media_items!inner(id, title, type, poster_url, overview)
        `, { count: 'exact' })
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(from, to)

    if (searchQuery) {
        query = query.ilike("media.title", `%${searchQuery}%`)
    }

    if (mediaType && mediaType !== "all") {
        query = query.eq("media.type", mediaType)
    }

    const { data, error, count } = await query

    if (error) {
        console.error("Error fetching posts:", error)
        throw new Error("Failed to fetch posts")
    }

    const items = (data as any[]).map(log => userLogToMediaItem(log as UserLog))

    return { items, total: count || 0 }
}

export async function createPost(item: MediaItem & { externalId?: string, aiMetadata?: Record<string, unknown> }): Promise<MediaItem> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // 1. Ensure Media Item Exists
    let mediaId = item.mediaId

    if (!mediaId) {
        // Search by title/type or external_id logic could go here
        // For now, always create new media item if no ID provided (or maybe check title exact match?)
        // Let's check title match to avoid complete duplicates
        const { data: existingMedia } = await supabase
            .from("media_items")
            .select("id")
            .eq("title", item.title)
            .eq("type", item.type)
            .maybeSingle()

        if (existingMedia) {
            mediaId = existingMedia.id
        } else {
            // Create new media item
            const { data: newMedia, error: mediaError } = await supabase
                .from("media_items")
                .insert({
                    title: item.title,
                    type: item.type,
                    poster_url: item.posterUrl,
                    // overview: ??
                    ai_metadata: item.aiMetadata || {}
                })
                .select()
                .single()

            if (mediaError || !newMedia) {
                console.error("Error creating media:", mediaError)
                throw new Error("Failed to create media item")
            }
            mediaId = newMedia.id
        }
    }

    // 2. Create User Log
    const logData = {
        user_id: user.id,
        media_id: mediaId,
        status: item.status,
        rating: item.rating,
        moods: item.moods,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        one_line_review: item.oneLineReview || null,
        detailed_review: item.detailedReview || null,
    }

    const { data: newLog, error: logError } = await supabase
        .from("user_logs")
        .insert(logData)
        .select(`
            *,
            media:media_items (*)
        `)
        .single()

    if (logError) {
        console.error("Error creating log:", logError)
        throw new Error("Failed to create user log")
    }

    revalidatePath("/")
    return userLogToMediaItem(newLog as UserLog)
}

export async function updatePost(id: string, item: MediaItem): Promise<MediaItem> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    if (item.status === 'completed') {
        item.endDate = new Date().toISOString().split('T')[0]
    }

    const logUpdates = {
        status: item.status,
        rating: item.rating,
        moods: item.moods,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        one_line_review: item.oneLineReview || null,
        detailed_review: item.detailedReview || null,
    }

    const { data: updatedLog, error } = await supabase
        .from("user_logs")
        .update(logUpdates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select(`
            *,
            media:media_items (*)
        `)
        .single()

    if (error) {
        console.error("Error updating post:", error)
        throw new Error("Failed to update post")
    }

    // Optional: Update MediaMetadata if title/poster changed?
    // For now we assume media metadata is shared and mostly static or updated separately
    // But if we wanted to allow user to update shared title... that's risky.
    // Let's assume title updates only if explicit admin flow. user only updates their log.

    revalidatePath("/")
    return userLogToMediaItem(updatedLog as UserLog)
}

export async function deletePost(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const { error } = await supabase
        .from("user_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error deleting post:", error)
        throw new Error("Failed to delete post")
    }

    revalidatePath("/")
}
