"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"

export type DashboardStats = {
    total: number
    thisMonth: number
    inProgress: number
    avgRating: number
}

export async function getStats(type: string = "all"): Promise<DashboardStats> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const baseQuery = supabase.from("user_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    if (type !== "all") {
        // We need joins for type filtering, but head:true + count is efficient if supported with inner join
        // For type filtering we need to switch query method
    }

    // Helper to build base query with optional type filter
    const buildQuery = () => {
        let q = supabase.from("user_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id)
        if (type !== "all") {
            // Note: head:true with inner join filter might not return count as expected in simple syntax
            // We'll use standard select with count but limit 0 for efficiency
            q = supabase.from("user_logs").select("*, media:media_items!inner(*)", { count: "exact", head: true }).eq("user_id", user.id).eq("media.type", type)
        }
        return q
    }

    // 1. Total Count
    const totalPromise = buildQuery()

    // 2. This Month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthPromise = buildQuery().gte("created_at", startOfMonth)

    // 3. In Progress
    const inProgressPromise = buildQuery().eq("status", "in-progress")

    // 4. Avg Rating
    // Sum and Count for Average Rating need a real select, but we can minimize fields
    // Standard Supabase client doesn't support .sum() easily without rpc
    // We will fetch only rating column for non-zero ratings
    let ratingQuery = supabase.from("user_logs").select("rating, media:media_items!inner(type)").eq("user_id", user.id).gt("rating", 0)
    if (type !== "all") {
        ratingQuery = ratingQuery.eq("media.type", type)
    }

    const [totalRes, thisMonthRes, inProgressRes, ratingRes] = await Promise.all([
        totalPromise,
        thisMonthPromise,
        inProgressPromise,
        ratingQuery
    ])

    if (totalRes.error) console.error("Stats Total Error", totalRes.error)
    if (thisMonthRes.error) console.error("Stats Month Error", thisMonthRes.error)

    const ratings = (ratingRes.data || []).map(r => r.rating)
    const ratingSum = ratings.reduce((a, b) => a + b, 0)
    const ratingCount = ratings.length
    const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0

    return {
        total: totalRes.count || 0,
        thisMonth: thisMonthRes.count || 0,
        inProgress: inProgressRes.count || 0,
        avgRating,
    }
}
