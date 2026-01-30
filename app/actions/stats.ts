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

    let query = supabase
        .from("posts")
        .select("status, rating, created_at")
        .eq("user_id", user.id)

    if (type !== "all") {
        query = query.eq("media_type", type)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching stats:", error)
        throw new Error("Failed to fetch stats")
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const stats = data.reduce(
        (acc, item) => {
            // Total count
            acc.total++

            // This Month count
            const createdDate = new Date(item.created_at)
            if (
                createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear
            ) {
                acc.thisMonth++
            }

            // In Progress count
            if (item.status === "in-progress") {
                acc.inProgress++
            }

            // Rating sum (for avg calculation later)
            if (item.rating > 0) {
                acc.ratingSum += item.rating
                acc.ratingCount++
            }

            return acc
        },
        { total: 0, thisMonth: 0, inProgress: 0, ratingSum: 0, ratingCount: 0 }
    )

    const avgRating =
        stats.ratingCount > 0 ? Number((stats.ratingSum / stats.ratingCount).toFixed(1)) : 0

    return {
        total: stats.total,
        thisMonth: stats.thisMonth,
        inProgress: stats.inProgress,
        avgRating,
    }
}
