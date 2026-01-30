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

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { SidebarContent } from "./sidebar"

export function TopBar({
  onAddEntry,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  activeNav,
  onNavChange,
}: TopBarProps & {
  activeNav?: string
  onNavChange?: (nav: string) => void
}) {
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
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border px-4 md:px-6 flex items-center gap-4">
      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar">
            {activeNav && onNavChange && (
              <SidebarContent
                activeNav={activeNav}
                onNavChange={onNavChange}
                isMobile={true}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border focus:border-neon-purple focus:ring-neon-purple/20 h-9 md:h-10"
          />
        </div>
      </div>

      {/* Category Tabs - Desktop */}
      <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
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
        className="bg-neon-purple hover:bg-neon-purple-dim text-primary-foreground h-9 w-9 p-0 md:w-auto md:h-10 md:px-4"
      >
        <Plus className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Add Entry</span>
      </Button>

      {/* User Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full">
            <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border">
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

          {/* Mobile Categories in Dropdown */}
          <div className="md:hidden">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Categories</div>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "focus:bg-surface-overlay",
                  activeCategory === category.id && "text-neon-purple font-medium"
                )}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
          </div>

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
    </header >
  )
}
