"use client"

import React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  CalendarIcon,
  Star,
  Sparkles,
  Film,
  Gamepad2,
  BookOpen,
  Bookmark,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react"
import { format } from "date-fns"

import { createPost } from "@/app/actions/posts"
import { searchExternalMedia, ExternalMediaItem } from "@/app/actions/external-search"
import { generateAITags } from "@/app/actions/ai"
import { MediaItem, MediaStatus, MediaType } from "@/types"
import { toast } from "sonner"

interface MediaEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const mockSearchResults = [
  { id: "1", title: "Blade Runner 2049", type: "movie" as const, year: 2017 },
  { id: "2", title: "Blade Runner", type: "movie" as const, year: 1982 },
  { id: "3", title: "Blade of Darkness", type: "game" as const, year: 2001 },
]

const statusOptions = [
  { id: "wishlist", label: "Wishlist", icon: Bookmark },
  { id: "in-progress", label: "In Progress", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
]

const typeIcons = {
  movie: Film,
  game: Gamepad2,
  book: BookOpen,
}

const mockAITags = ["Sci-Fi", "Dystopian", "Philosophical", "Neo-Noir", "Cyberpunk"]
const mockAISummary = "A visually stunning exploration of humanity and memory in a cyberpunk future."

export function MediaEntryModal({ open, onOpenChange }: MediaEntryModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ExternalMediaItem[]>([])
  const [selectedType, setSelectedType] = useState<"movie" | "game" | "book">("movie")
  const [isSearching, setIsSearching] = useState(false)

  const [selectedMedia, setSelectedMedia] = useState<ExternalMediaItem | null>(null)

  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date>()
  const [status, setStatus] = useState<string>("in-progress")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [oneLineReview, setOneLineReview] = useState("")
  const [detailedReview, setDetailedReview] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAIPreview, setShowAIPreview] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [aiThemeColor, setAiThemeColor] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && !selectedMedia) {
        setIsSearching(true)
        const results = await searchExternalMedia(searchQuery, selectedType)
        setSearchResults(results)
        setShowResults(true)
        setIsSearching(false)
      } else if (searchQuery.length === 0) {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedType, selectedMedia])

  // Reset search when modal closes
  useEffect(() => {
    if (!open) handleReset()
  }, [open])

  const handleSelectMedia = async (media: ExternalMediaItem) => {
    setSelectedMedia(media)
    setSearchQuery(media.title)
    setShowResults(false)

    // Trigger AI Analysis
    setIsAnalyzing(true)
    setShowAIPreview(true)

    try {
      const aiData = await generateAITags(media.title, media.overview)
      setGeneratedTags(aiData.moods)
      setAiThemeColor(aiData.themeColor)
    } catch (e) {
      console.error("AI Error", e)
      toast.error("AI 태그 생성에 실패했습니다.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleTypeChange = (type: "movie" | "game" | "book") => {
    setSelectedType(type)
    setSearchResults([])
    // Trigger search again if query exists
  }

  const handleReset = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedMedia(null)
    setStartDate(new Date())
    setEndDate(undefined)
    setStatus("in-progress")
    setRating(0)
    setOneLineReview("")
    setDetailedReview("")
    setShowAIPreview(false)
    setGeneratedTags([])
    setAiThemeColor("")
  }

  // Handle star click with 0.5 increment logic
  const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const isLeftHalf = clickX < rect.width / 2

    if (isLeftHalf) {
      // Clicked on left half - set to X.5 (half star before this one)
      const newRating = starIndex - 0.5
      setRating(newRating === rating ? 0 : newRating)
    } else {
      // Clicked on right half - set to X.0 (full star)
      setRating(starIndex === rating ? 0 : starIndex)
    }
  }

  const handleStarHover = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const hoverX = event.clientX - rect.left
    const isLeftHalf = hoverX < rect.width / 2

    setHoveredRating(isLeftHalf ? starIndex - 0.5 : starIndex)
  }

  // Render a single star with proper fill state
  const renderStar = (starIndex: number) => {
    const activeRating = hoveredRating || rating
    const isFilled = starIndex <= activeRating
    const isHalfStar = !isFilled && starIndex - 0.5 === activeRating

    return (
      <button
        key={starIndex}
        onClick={(e) => handleStarClick(starIndex, e)}
        onMouseMove={(e) => handleStarHover(starIndex, e)}
        onMouseLeave={() => setHoveredRating(0)}
        className="p-1 transition-transform hover:scale-110 relative"
      >
        {isHalfStar ? (
          // Half star: unfilled with thick neon purple border and glow
          <Star
            className="w-7 h-7 text-transparent transition-all"
            style={{
              stroke: '#a855f7',
              strokeWidth: 2.5,
              filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.4))',
            }}
          />
        ) : (
          <Star
            className={cn(
              "w-7 h-7 transition-all",
              isFilled
                ? "fill-neon-purple text-neon-purple"
                : "text-muted-foreground/50"
            )}
            style={isFilled ? {
              filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
            } : undefined}
          />
        )}
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-neon-purple/30 shadow-2xl shadow-neon-purple/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neon-purple" />
            </div>
            Add to Archive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Search Media</Label>
              <div className="flex gap-1">
                {(["movie", "game", "book"] as const).map((t) => {
                  const Icon = typeIcons[t]
                  return (
                    <button
                      key={t}
                      onClick={() => handleTypeChange(t)}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        selectedType === t ? "bg-neon-purple/20 text-neon-purple" : "text-muted-foreground hover:bg-muted"
                      )}
                      title={t}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search for ${selectedType}s...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value) setSelectedMedia(null)
                }}
                className="pl-10 bg-muted border-border focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {selectedMedia && !isSearching && (
                <button
                  onClick={handleReset}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-[calc(100%-3rem)] mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((result) => {
                  const Icon = typeIcons[result.type]
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelectMedia(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition-colors text-left border-b last:border-0 border-border/50"
                    >
                      {result.posterUrl ? (
                        <img src={result.posterUrl} alt={result.title} className="w-8 h-12 object-cover rounded shadow-sm" />
                      ) : (
                        <div className="w-8 h-12 bg-muted flex items-center justify-center rounded">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.year}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:border-neon-purple",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="bg-card"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:border-neon-purple",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="bg-card"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Status</Label>
            <div className="flex gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon
                const isActive = status === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setStatus(option.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all",
                      isActive
                        ? "bg-neon-purple/20 border-neon-purple text-neon-purple"
                        : "bg-muted border-border text-muted-foreground hover:border-foreground/30"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rating with 0.5 increments */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Rating</Label>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => renderStar(star))}
              {rating > 0 && (
                <span className="ml-3 text-sm font-medium text-neon-purple">
                  {rating % 1 === 0 ? `${rating}.0` : rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Click left half for .5, right half for full star
            </p>
          </div>

          {/* Dual Review Fields */}
          <div className="space-y-4">
            {/* Visual divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Reviews</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* One-line Review (한줄평) */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                한줄평 <span className="text-muted-foreground font-normal text-xs ml-1">One-line Review</span>
              </Label>
              <Input
                type="text"
                value={oneLineReview}
                onChange={(e) => setOneLineReview(e.target.value)}
                placeholder="이 작품을 한 문장으로 정의한다면?"
                className="bg-[#121212] border-border text-foreground placeholder:text-muted-foreground/60 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/30 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
              />
            </div>

            {/* Detailed Review (상세 후기) */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                상세 후기 <span className="text-muted-foreground font-normal text-xs ml-1">Detailed Review</span>
              </Label>
              <textarea
                value={detailedReview}
                onChange={(e) => setDetailedReview(e.target.value)}
                placeholder="작품에 대한 심도 깊은 분석이나 개인적인 감상을 자유롭게 기록하세요."
                rows={4}
                className="w-full min-h-[120px] max-h-[300px] resize-y rounded-md bg-[#121212] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple/30 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
              />
            </div>
          </div>

          {/* AI Analysis Preview */}
          {showAIPreview && (
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-purple" />
                Gemini AI Auto-Tags
              </Label>
              <div
                className={cn(
                  "rounded-lg border border-dashed p-4 transition-all",
                  generatedTags.length > 0
                    ? "border-neon-purple/50 bg-neon-purple/5"
                    : "border-border bg-muted/50"
                )}
                style={aiThemeColor ? { borderColor: aiThemeColor + '50', backgroundColor: aiThemeColor + '10' } : undefined}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Generating Vibe Tags...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {generatedTags.length > 0 ? generatedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-background/50 backdrop-blur-sm"
                          style={aiThemeColor ? { color: aiThemeColor, borderColor: aiThemeColor + '60' } : undefined}
                        >
                          #{tag}
                        </Badge>
                      )) : (
                        <span className="text-sm text-muted-foreground">No tags generated.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedMedia && !searchQuery) return

                try {
                  setIsSubmitting(true)

                  const newItem: MediaItem = {
                    id: "new", // Placeholder, will be generated by DB
                    title: selectedMedia ? selectedMedia.title : searchQuery,
                    type: selectedType, // Use selected type
                    posterUrl: selectedMedia?.posterUrl || "", // Use external poster URL
                    rating: rating,
                    status: status as MediaStatus,
                    moods: generatedTags, // Use AI generated tags
                    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
                    oneLineReview: oneLineReview || undefined,
                    detailedReview: detailedReview || undefined,
                  }

                  await createPost(newItem)

                  toast.success("아카이브에 추가되었습니다.")
                  onOpenChange(false)
                  handleReset()
                } catch (error) {
                  console.error(error)
                  toast.error("추가에 실패했습니다.")
                } finally {
                  setIsSubmitting(false)
                }
              }}
              className="flex-1 bg-neon-purple hover:bg-neon-purple-dim text-primary-foreground"
              disabled={(!selectedMedia && !searchQuery) || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add to Archive"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
