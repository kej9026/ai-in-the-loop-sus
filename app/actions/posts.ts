"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { Post, MediaItem, mediaItemToPostInsert, postToMediaItem } from "@/types"
import { revalidatePath } from "next/cache"

export async function getPosts(
    searchQuery?: string,
    mediaType?: string
): Promise<Post[]> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    let query = supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

    if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`)
    }

    if (mediaType && mediaType !== "all") {
        query = query.eq("media_type", mediaType)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching posts:", error)
        throw new Error("Failed to fetch posts")
    }

    return (data as Post[]) || []
}

export async function createPost(item: MediaItem): Promise<MediaItem> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const postData = mediaItemToPostInsert(user.id, item)

    const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single()

    if (error) {
        console.error("Error creating post:", error)
        throw new Error("Failed to create post")
    }

    revalidatePath("/")
    return postToMediaItem(data as Post)
}

export async function updatePost(id: string, item: MediaItem): Promise<MediaItem> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Auto-update end_date if status is completed and no end_date provided (Phase 3.3)
    // Auto-update end_date if status is completed (Phase 3.3 Improvement: Always update)
    if (item.status === 'completed') {
        item.endDate = new Date().toISOString().split('T')[0]
    }

    const postData = mediaItemToPostInsert(user.id, item)

    const { data, error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

    if (error) {
        console.error("Error updating post:", error)
        throw new Error("Failed to update post")
    }

    revalidatePath("/")
    return postToMediaItem(data as Post)
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
        .from("posts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error deleting post:", error)
        throw new Error("Failed to delete post")
    }

    revalidatePath("/")
}
