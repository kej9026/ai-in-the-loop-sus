"use client"

import { Activity, TrendingUp, Clock, Star } from "lucide-react"
import { MediaCard, type MediaItem } from "./media-card"
import { type DashboardStats } from "@/app/actions/stats"

const statsConfig = [
    { id: "total", label: "Total Entries", icon: Activity, color: "text-neon-purple" },
    { id: "thisMonth", label: "This Month", icon: TrendingUp, color: "text-emerald-400" },
    { id: "inProgress", label: "In Progress", icon: Clock, color: "text-amber-400" },
    { id: "avgRating", label: "Avg Rating", icon: Star, color: "text-neon-purple" },
]

interface DashboardViewProps {
    stats: DashboardStats
    recentItems: MediaItem[]
    isLoading: boolean
    onLoadMore: () => void
    onViewAll: () => void
    onCardClick: (item: MediaItem) => void
    hasMore: boolean
}

export function DashboardView({
    stats,
    recentItems,
    isLoading,
    onLoadMore,
    onViewAll,
    onCardClick,
    hasMore
}: DashboardViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                    Welcome back
                </h1>
                <p className="text-muted-foreground">
                    Track your journey through movies, games, and books
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsConfig.map((config) => {
                    const Icon = config.icon
                    const value = stats[config.id as keyof DashboardStats]
                    return (
                        <div
                            key={config.id}
                            className="bg-card border border-border rounded-xl p-4 hover:border-neon-purple/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {config.id === "avgRating" ? value.toFixed(1) : value}
                            </p>
                            <p className="text-sm text-muted-foreground">{config.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* Recent Activity Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Recent Activity
                    </h2>
                    <button
                        onClick={onViewAll}
                        className="text-sm text-neon-purple hover:text-neon-purple-dim transition-colors"
                    >
                        View All
                    </button>
                </div>

                {/* Media Grid */}
                {isLoading && recentItems.length === 0 ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recentItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                        <p>No items found. Add your first entry!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {recentItems.map((item) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                onClick={() => onCardClick(item)}
                            />
                        ))}
                    </div>
                )}

                {/* Load More / View All Hint */}
                {hasMore && (
                    <div className="flex justify-center mt-8 pb-8">
                        {/* In Dashboard view, mostly we want to push them to Library for more, but keeping Load More is fine */}
                    </div>
                )}
            </div>
        </div>
    )
}
