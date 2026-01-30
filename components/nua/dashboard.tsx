"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { MediaCard, type MediaItem } from "./media-card"
import { MediaEntryModal } from "./media-entry-modal"
import { MediaDetailModal } from "./media-detail-modal"
import { Activity, TrendingUp, Clock, Star } from "lucide-react"
import { getPosts } from "@/app/actions/posts"

import { toast } from "sonner"
import { useAuth } from "./auth-provider"
import { getStats, type DashboardStats } from "@/app/actions/stats"

import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"

const statsConfig = [
  { id: "total", label: "Total Entries", icon: Activity, color: "text-neon-purple" },
  { id: "thisMonth", label: "This Month", icon: TrendingUp, color: "text-emerald-400" },
  { id: "inProgress", label: "In Progress", icon: Clock, color: "text-amber-400" },
  { id: "avgRating", label: "Avg Rating", icon: Star, color: "text-neon-purple" },
]

interface DashboardProps {
  initialItems?: MediaItem[]
  initialTotal?: number
}

export function Dashboard({ initialItems = [], initialTotal = 0 }: DashboardProps) {
  const { user } = useAuth()
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialItems)
  const [totalCount, setTotalCount] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialItems.length < initialTotal)
  const [limit, setLimit] = useState(initialItems.length > 5 ? 24 : 5)

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    thisMonth: 0,
    inProgress: 0,
    avgRating: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Realtime subscription (Phase 3.4)
  useEffect(() => {
    if (!user) return

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('realtime-user-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_logs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadPosts(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, searchQuery, activeCategory])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadPosts(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeCategory, user])

  const loadPosts = async (reset = false, overrideLimit?: number) => {
    try {
      setIsLoading(true)

      const currentLimit = overrideLimit || limit
      const nextPage = reset ? 1 : page + 1
      const { items, total } = await getPosts(searchQuery, activeCategory, nextPage, currentLimit)

      if (reset) {
        setMediaItems(items)
      } else {
        setMediaItems(prev => [...prev, ...items])
      }

      setTotalCount(total)
      setPage(nextPage)
      setHasMore((reset ? items.length : mediaItems.length + items.length) < total)

      if (reset) {
        try {
          const statsData = await getStats(activeCategory)
          setStats(statsData)
        } catch (statsError) {
          console.error("Failed to load stats:", statsError)
        }
      }
    } catch (error) {
      console.error("Failed to load posts:", error)
      toast.error("데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAll = () => {
    setLimit(24)
    loadPosts(true, 24)
  }

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleUpdateItem = (updatedItem: MediaItem) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    )
    setSelectedItem(updatedItem)
  }

  const handleDeleteItem = async (deletedId: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== deletedId))
    setSelectedItem(null)

    // Refresh stats immediately (Phase 3.4 improvement)
    try {
      const newStats = await getStats(activeCategory)
      setStats(newStats)
    } catch (error) {
      console.error("Failed to refresh stats:", error)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onAddEntry={() => setIsModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Track your journey through movies, games, and books
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>
              {limit === 5 && hasMore && (
                <button
                  onClick={handleViewAll}
                  className="text-sm text-neon-purple hover:text-neon-purple-dim transition-colors"
                >
                  View All
                </button>
              )}
            </div>

            {/* Media Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <p>No items found. Add your first entry!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {mediaItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onClick={() => handleCardClick(item)}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8 pb-8">
                <button
                  onClick={() => loadPosts(false)}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-all disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <MediaEntryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={() => loadPosts(true)}
      />
      <MediaDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        item={selectedItem}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
      />
    </div>
  )
}
