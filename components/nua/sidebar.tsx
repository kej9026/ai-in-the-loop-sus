"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Search,
  Library,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  activeNav: string
  onNavChange: (nav: string) => void
}

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "calendar", icon: Calendar, label: "Calendar" },
  { id: "search", icon: Search, label: "Search" },
  { id: "library", icon: Library, label: "Library" },
]

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-purple flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            {!collapsed && (
              <span className="font-semibold text-foreground tracking-tight">
                NUA
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id

              return (
                <li key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNavChange(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          "hover:bg-sidebar-accent group",
                          isActive
                            ? "bg-surface-overlay text-neon-purple"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-colors",
                            isActive
                              ? "text-neon-purple"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {!collapsed && (
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors",
                              isActive
                                ? "text-neon-purple"
                                : "group-hover:text-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                        {isActive && (
                          <div className="ml-auto w-1 h-4 rounded-full bg-neon-purple" />
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="bg-card border-border">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Settings className="w-5 h-5" />
                {!collapsed && <span className="text-sm font-medium">Settings</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-card border-border">
                Settings
              </TooltipContent>
            )}
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full mt-2 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
