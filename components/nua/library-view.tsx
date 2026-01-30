"use client"

import { useState, useEffect } from "react"
import { MediaCard, type MediaItem } from "./media-card"
import { getPosts } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, ArrowUpDown } from "lucide-react"

interface LibraryViewProps {
    searchQuery: string
    activeCategory: string // This comes from TopBar, behaves as Media Type filter
    onCardClick: (item: MediaItem) => void
}

export function LibraryView({
    searchQuery,
    activeCategory,
    onCardClick,
}: LibraryViewProps) {
    const [items, setItems] = useState<MediaItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const limit = 24

    // Additional Layout Filters
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState<"updated" | "rating" | "title">("updated")

    const fetchLibraryItems = async (reset = false) => {
        try {
            setLoading(true)
            const nextPage = reset ? 1 : page + 1

            const { items: newItems, total: newTotal } = await getPosts(
                searchQuery,
                activeCategory, // This is Media Type
                nextPage,
                limit,
                statusFilter, // Status
                sortBy
            )

            if (reset) {
                setItems(newItems)
            } else {
                setItems(prev => [...prev, ...newItems])
            }

            setTotal(newTotal)
            setPage(nextPage)
            setHasMore((reset ? newItems.length : items.length + newItems.length) < newTotal)
        } catch (error) {
            console.error("Library fetch error:", error)
        } finally {
            setLoading(false)
        }
    }

    // Initial Fetch & Filter Changes
    useEffect(() => {
        fetchLibraryItems(true)
    }, [searchQuery, activeCategory, statusFilter, sortBy])

    const handleLoadMore = () => {
        fetchLibraryItems(false)
    }

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Library Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Library</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} items in your collection
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="w-4 h-4" />
                                {statusFilter === 'all' ? 'All Status' :
                                    statusFilter === 'wishlist' ? 'Wishlist' :
                                        statusFilter === 'in-progress' ? 'In Progress' : 'Completed'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="wishlist">Wishlist</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="in-progress">In Progress</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowUpDown className="w-4 h-4" />
                                {sortBy === 'updated' ? 'Recently Updated' :
                                    sortBy === 'rating' ? 'Highest Rated' : 'Title (A-Z)'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                                <DropdownMenuRadioItem value="updated">Recently Updated</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="rating">Highest Rated</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="title">Title (A-Z)</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
                {loading && items.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-xl">
                        <p className="mb-2">No items match your filters.</p>
                        <Button variant="link" onClick={() => {
                            setStatusFilter("all")
                            // activeCategory comes from parent, can't reset here easily unless we add callback prop
                        }}>Clear Filters</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {items.map((item) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                onClick={() => onCardClick(item)}
                            />
                        ))}
                    </div>
                )}

                {/* Load More Trigger */}
                {hasMore && (
                    <div className="flex justify-center py-8">
                        <Button
                            onClick={handleLoadMore}
                            disabled={loading}
                            variant="secondary"
                            className="min-w-[150px]"
                        >
                            {loading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
