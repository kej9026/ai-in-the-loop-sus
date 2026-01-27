"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { MediaCard, type MediaItem } from "./media-card"
import { MediaEntryModal } from "./media-entry-modal"
import { MediaDetailModal } from "./media-detail-modal"
import { Activity, TrendingUp, Clock, Star } from "lucide-react"

const mockMediaItems: MediaItem[] = [
  {
    id: "1",
    title: "Blade Runner 2049",
    type: "movie",
    posterUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop",
    rating: 4.5,
    status: "completed",
    moods: ["Sci-Fi", "Philosophical", "Neo-Noir"],
    startDate: "2024-01-10",
    endDate: "2024-01-10",
  },
  {
    id: "2",
    title: "Cyberpunk 2077",
    type: "game",
    posterUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop",
    rating: 4,
    status: "in-progress",
    moods: ["RPG", "Cyberpunk", "Open World"],
    startDate: "2024-01-15",
  },
  {
    id: "3",
    title: "Neuromancer",
    type: "book",
    posterUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
    rating: 5,
    status: "completed",
    moods: ["Cyberpunk", "Classic", "Influential"],
    startDate: "2024-01-01",
    endDate: "2024-01-20",
  },
  {
    id: "4",
    title: "The Matrix",
    type: "movie",
    posterUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop",
    rating: 5,
    status: "completed",
    moods: ["Action", "Philosophical", "Iconic"],
    startDate: "2024-01-05",
    endDate: "2024-01-05",
  },
  {
    id: "5",
    title: "Deus Ex: Human Revolution",
    type: "game",
    posterUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
    rating: 4,
    status: "wishlist",
    moods: ["Stealth", "RPG", "Dystopian"],
  },
  {
    id: "6",
    title: "Snow Crash",
    type: "book",
    posterUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    rating: 4.5,
    status: "in-progress",
    moods: ["Cyberpunk", "Satire", "Visionary"],
    startDate: "2024-01-22",
  },
]

const stats = [
  { label: "Total Entries", value: "127", icon: Activity, color: "text-neon-purple" },
  { label: "This Month", value: "12", icon: TrendingUp, color: "text-emerald-400" },
  { label: "In Progress", value: "5", icon: Clock, color: "text-amber-400" },
  { label: "Avg Rating", value: "4.2", icon: Star, color: "text-neon-purple" },
]

export function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(mockMediaItems)

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onAddEntry={() => setIsModalOpen(true)} />
        
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
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-4 hover:border-neon-purple/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
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
              <button className="text-sm text-neon-purple hover:text-neon-purple-dim transition-colors">
                View All
              </button>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {mediaItems.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
              ))}
            </div>
          </div>
        </main>
      </div>

      <MediaEntryModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <MediaDetailModal 
        open={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen} 
        item={selectedItem}
        onUpdate={handleUpdateItem}
      />
    </div>
  )
}
