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

    const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_user_id: user.id,
        p_media_type: type
    })

    if (error) {
        console.error("Error fetching stats:", error)
        // Fallback or throw? Let's throw to be visible
        throw new Error("Failed to fetch stats")
    }

    // RPC returns JSON, so we cast it
    const stats = data as any

    return {
        total: stats.total || 0,
        thisMonth: stats.thisMonth || 0,
        inProgress: stats.inProgress || 0,
        avgRating: stats.avgRating || 0,
    }
}
