"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Search, User, Film, Gamepad2, BookOpen, Plus, LogOut } from "lucide-react"
import { useAuth } from "./auth-provider"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopBarProps {
  onAddEntry: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeCategory: string
  setActiveCategory: (category: string) => void
}

const categories = [
  { id: "all", label: "All", icon: null },
  { id: "movie", label: "Movie", icon: Film },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "book", label: "Book", icon: BookOpen },
]

export function TopBar({
  onAddEntry,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
}: TopBarProps) {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<{
    display_name?: string | null
    avatar_url?: string | null
  } | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const supabase = createSupabaseBrowserClient()

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [user?.id])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border px-6 flex items-center gap-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border focus:border-neon-purple focus:ring-neon-purple/20"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = activeCategory === category.id

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-neon-purple text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{category.label}</span>
            </button>
          )
        })}
      </div>

      {/* Add Entry Button */}
      <Button
        onClick={onAddEntry}
        className="bg-neon-purple hover:bg-neon-purple-dim text-primary-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Entry
      </Button>

      {/* User Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage
                src={
                  profile?.avatar_url || user?.avatar || "/placeholder-avatar.jpg"
                }
                alt="User"
              />
              <AvatarFallback className="bg-muted text-foreground">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border" align="end">
          <div className="px-2 py-1.5 text-sm font-medium text-foreground">
            {profile?.display_name || user?.name || "NUA User"}
          </div>
          <div className="px-2 pb-2 text-xs text-muted-foreground">
            {user?.email || "user@example.com"}
          </div>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem className="focus:bg-surface-overlay">
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-surface-overlay">
            My Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="focus:bg-surface-overlay text-destructive cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
