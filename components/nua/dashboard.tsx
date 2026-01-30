"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { MediaEntryModal } from "./media-entry-modal"
import { MediaDetailModal } from "./media-detail-modal"
import { DashboardView } from "./dashboard-view"
import { LibraryView } from "./library-view"
import { type MediaItem } from "@/types"
import { getPosts, deletePost } from "@/app/actions/posts"
import { getStats, type DashboardStats } from "@/app/actions/stats"
import { useAuth } from "./auth-provider"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"

interface DashboardProps {
  initialItems?: MediaItem[] // For Dashboard Recent Activity
  initialTotal?: number
}

export function Dashboard({ initialItems = [] }: DashboardProps) {
  const { user } = useAuth()
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  // Dashboard Specific State
  const [dashboardItems, setDashboardItems] = useState<MediaItem[]>(initialItems)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    thisMonth: 0,
    inProgress: 0,
    avgRating: 0,
  })
  const [isDashboardLoading, setDashboardLoading] = useState(false)

  // Shared State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0) // Used to trigger re-fetches

  // Realtime subscription
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
          handleDataChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Fetch Dashboard Data (Recent + Stats)
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    try {
      setDashboardLoading(true)
      // Fetch Recent 5
      const { items } = await getPosts(undefined, undefined, 1, 5) // Recent activity ignores global search usually? Or should it respect it? 
      // Usually Dashboard Recent is just "Recents". Search is for Library.
      // Let's assume Dashboard ignores TopBar search/filter for now, or maybe TopBar search redirects to Library?
      // If user types in search while on Dashboard, we should probably switch to Library to show results?
      // For now, let's keep Dashboard static "Recent" and Stats.
      setDashboardItems(items)

      const statsData = await getStats("all")
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load dashboard data", error)
    } finally {
      setDashboardLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (activeNav === 'dashboard') {
      fetchDashboardData()
    }
  }, [fetchDashboardData, activeNav, refreshKey])

  // If user searches/filters while on Dashboard, switch to Library automatically?
  // Or just let them navigate. The user prompt implied Library is the place for this.
  // "Library... allows you to search and filter".
  // So if I am on Dashboard and I type in search, it might be intuitive to go to Library.
  useEffect(() => {
    if (searchQuery && activeNav === 'dashboard') {
      setActiveNav('library')
    }
  }, [searchQuery, activeNav])


  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleDeleteItem = async (deletedId: string) => {
    // Optimistic update or just refresh
    setDashboardItems(prev => prev.filter(i => i.id !== deletedId))
    setSelectedItem(null)
    handleDataChange()
  }

  const handleUpdateItem = (updatedItem: MediaItem) => {
    setDashboardItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
    setSelectedItem(updatedItem)
    handleDataChange()
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
          activeNav={activeNav}
          onNavChange={setActiveNav}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {activeNav === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentItems={dashboardItems}
              isLoading={isDashboardLoading}
              onLoadMore={() => setActiveNav('library')}
              onViewAll={() => setActiveNav('library')}
              onCardClick={handleCardClick}
              hasMore={dashboardItems.length >= 5} // Approximate check
            />
          )}

          {activeNav === 'library' && (
            <LibraryView
              key={refreshKey} // Remount to refresh on data change
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              onCardClick={handleCardClick}
            />
          )}

          {/* Fallback for other tabs not implemented yet */}
          {(activeNav !== 'dashboard' && activeNav !== 'library') && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Coming Soon
            </div>
          )}
        </main>
      </div>

      <MediaEntryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={handleDataChange}
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
