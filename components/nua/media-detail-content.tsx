"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Film,
    Gamepad2,
    BookOpen,
    Star,
    Bookmark,
    Clock,
    CheckCircle2,
    Sparkles,
    CalendarDays,
    Edit3,
    X,
    CalendarIcon,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react"
import { format } from "date-fns"
import type { MediaItem } from "@/types"
import { updatePost, deletePost } from "@/app/actions/posts"
import { toast } from "sonner"

interface MediaDetailContentProps {
    item: MediaItem
    onUpdate?: (updatedItem: MediaItem) => void
    onDelete?: (id: string) => void
    onClose: () => void
}

const typeIcons = {
    movie: Film,
    game: Gamepad2,
    book: BookOpen,
}

const typeLabels = {
    movie: "Movie",
    game: "Game",
    book: "Book",
}

const statusConfig = {
    wishlist: {
        icon: Bookmark,
        label: "Wishlist",
        className: "bg-muted text-muted-foreground",
    },
    "in-progress": {
        icon: Clock,
        label: "In Progress",
        className: "bg-neon-purple/20 text-neon-purple border border-neon-purple/30",
    },
    completed: {
        icon: CheckCircle2,
        label: "Completed",
        className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
}

const statusOptions = [
    { id: "wishlist", label: "Wishlist", icon: Bookmark },
    { id: "in-progress", label: "In Progress", icon: Clock },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
]

export function MediaDetailContent({ item, onUpdate, onDelete, onClose }: MediaDetailContentProps) {
    const [isEditMode, setIsEditMode] = useState(false)

    // Edit form state
    const [editTitle, setEditTitle] = useState("")
    const [editStatus, setEditStatus] = useState<"wishlist" | "in-progress" | "completed">("in-progress")
    const [editRating, setEditRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [editStartDate, setEditStartDate] = useState<Date | undefined>()
    const [editEndDate, setEditEndDate] = useState<Date | undefined>()
    const [editOneLineReview, setEditOneLineReview] = useState("")
    const [editDetailedReview, setEditDetailedReview] = useState("")

    // Tag editing state
    const [editTags, setEditTags] = useState<string[]>([])
    const [isAddingTag, setIsAddingTag] = useState(false)
    const [newTag, setNewTag] = useState("")
    const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null)
    const [editingTagValue, setEditingTagValue] = useState("")

    // Initialize edit form when item changes or edit mode is entered
    useEffect(() => {
        if (item && isEditMode) {
            setEditTitle(item.title)
            setEditStatus(item.status)
            setEditRating(item.rating)
            setEditStartDate(item.startDate ? new Date(item.startDate) : undefined)
            setEditEndDate(item.endDate ? new Date(item.endDate) : undefined)
            setEditOneLineReview(item.oneLineReview || "")
            setEditDetailedReview(item.detailedReview || "")
            setEditTags(item.moods || [])
        }
    }, [item, isEditMode])

    const TypeIcon = typeIcons[item.type]
    const status = statusConfig[item.status]
    const StatusIcon = status.icon

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Not set"
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    // Handle star click with 0.5 increment logic
    const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const isLeftHalf = clickX < rect.width / 2

        if (isLeftHalf) {
            const newRating = starIndex - 0.5
            setEditRating(newRating === editRating ? 0 : newRating)
        } else {
            setEditRating(starIndex === editRating ? 0 : starIndex)
        }
    }

    const handleStarHover = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const hoverX = event.clientX - rect.left
        const isLeftHalf = hoverX < rect.width / 2
        setHoveredRating(isLeftHalf ? starIndex - 0.5 : starIndex)
    }

    // Render editable star
    const renderEditableStar = (starIndex: number) => {
        const activeRating = hoveredRating || editRating
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

    // Render display-only star with half-star support
    const renderDisplayStar = (starIndex: number) => {
        const isFilled = starIndex <= item.rating
        const isHalfStar = !isFilled && starIndex - 0.5 === item.rating

        return (
            <div key={starIndex} className="relative">
                {isHalfStar ? (
                    <Star
                        className="w-6 h-6 text-transparent"
                        style={{
                            stroke: '#a855f7',
                            strokeWidth: 2.5,
                            filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 10px rgba(168, 85, 247, 0.4))',
                        }}
                    />
                ) : (
                    <Star
                        className={cn(
                            "w-6 h-6 transition-all",
                            isFilled
                                ? "fill-neon-purple text-neon-purple"
                                : "text-muted-foreground/40"
                        )}
                        style={isFilled ? {
                            filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
                        } : undefined}
                    />
                )}
            </div>
        )
    }

    const handleSave = async () => {
        if (onUpdate && item) {
            try {
                const updatedItem: MediaItem = {
                    ...item,
                    title: editTitle,
                    status: editStatus,
                    rating: editRating,
                    startDate: editStartDate ? format(editStartDate, "yyyy-MM-dd") : undefined,
                    endDate: editEndDate ? format(editEndDate, "yyyy-MM-dd") : undefined,
                    oneLineReview: editOneLineReview,
                    detailedReview: editDetailedReview,
                    moods: editTags,
                }

                const result = await updatePost(item.id, updatedItem)

                onUpdate(result)
                toast.success("변경사항이 저장되었습니다.")
                setIsEditMode(false)
            } catch (error) {
                console.error(error)
                toast.error("저장에 실패했습니다.")
            }
        }
    }

    const handleDelete = async () => {
        if (!item || !onDelete) return

        if (confirm("정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            try {
                await deletePost(item.id)
                onDelete(item.id)
                toast.success("삭제되었습니다.")
                onClose()
            } catch (error) {
                console.error(error)
                toast.error("삭제에 실패했습니다.")
            }
        }
    }

    const handleCancel = () => {
        setIsEditMode(false)
        setIsAddingTag(false)
        setNewTag("")
        setEditingTagIndex(null)
        setEditingTagValue("")
    }

    const handleEnterEditMode = () => {
        setEditTitle(item.title)
        setEditStatus(item.status)
        setEditRating(item.rating)
        setEditStartDate(item.startDate ? new Date(item.startDate) : undefined)
        setEditEndDate(item.endDate ? new Date(item.endDate) : undefined)
        setEditOneLineReview(item.oneLineReview || "")
        setEditDetailedReview(item.detailedReview || "")
        setEditTags(item.moods || [])
        setIsEditMode(true)
    }

    const handleAddTag = () => {
        if (newTag.trim()) {
            setEditTags([...editTags, newTag.trim()])
            setNewTag("")
            setIsAddingTag(false)
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setEditTags(editTags.filter(tag => tag !== tagToRemove))
    }

    const handleStartEditingTag = (index: number, tag: string) => {
        setEditingTagIndex(index)
        setEditingTagValue(tag)
    }

    const handleSaveEditedTag = () => {
        if (editingTagIndex !== null && editingTagValue.trim()) {
            const newTags = [...editTags]
            newTags[editingTagIndex] = editingTagValue.trim()
            setEditTags(newTags)
            setEditingTagIndex(null)
            setEditingTagValue("")
        }
    }

    const handleCancelEditTag = () => {
        setEditingTagIndex(null)
        setEditingTagValue("")
    }

    return (
        <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl">
            {/* Header with poster background */}
            <div className="relative h-48 overflow-hidden shrink-0">
                <img
                    src={item.posterUrl || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

                {/* Type and Status badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border">
                        <TypeIcon className="w-5 h-5 text-foreground" />
                    </div>
                    <Badge className="text-xs bg-card/80 backdrop-blur-sm border-border text-foreground">
                        {typeLabels[item.type]}
                    </Badge>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2">
                    {isEditMode && (
                        <Badge className="text-xs bg-neon-purple/80 text-white border-neon-purple">
                            Editing
                        </Badge>
                    )}
                    <Badge className={cn("text-sm font-medium", isEditMode ? statusConfig[editStatus].className : status.className)}>
                        {isEditMode ? (
                            <>
                                {(() => {
                                    const EditStatusIcon = statusConfig[editStatus].icon
                                    return <EditStatusIcon className="w-4 h-4 mr-1.5" />
                                })()}
                                {statusConfig[editStatus].label}
                            </>
                        ) : (
                            <>
                                <StatusIcon className="w-4 h-4 mr-1.5" />
                                {status.label}
                            </>
                        )}
                    </Badge>
                </div>

                {/* Title overlaid on gradient */}
                <div className="absolute bottom-4 left-6 right-6">
                    {isEditMode ? (
                        <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-xl font-bold bg-card/80 backdrop-blur-sm border-neon-purple/50 text-foreground"
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-foreground text-balance">
                            {item.title}
                        </h2>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {isEditMode ? (
                    // EDIT MODE
                    <>
                        {/* Status Selector */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Status</Label>
                            <div className="flex gap-2">
                                {statusOptions.map((option) => {
                                    const Icon = option.icon
                                    const isActive = editStatus === option.id
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setEditStatus(option.id as typeof editStatus)}
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

                        {/* Rating */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Rating</Label>
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => renderEditableStar(star))}
                                {editRating > 0 && (
                                    <span className="ml-3 text-sm font-medium text-neon-purple">
                                        {editRating % 1 === 0 ? `${editRating}.0` : editRating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Click left half for .5, right half for full star
                            </p>
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
                                                !editStartDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editStartDate ? format(editStartDate, "MMM d, yyyy") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editStartDate}
                                            onSelect={setEditStartDate}
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
                                                !editEndDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editEndDate ? format(editEndDate, "MMM d, yyyy") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editEndDate}
                                            onSelect={setEditEndDate}
                                            initialFocus
                                            className="bg-card"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* AI Tags (Editable in edit mode) */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-neon-purple" />
                                AI-Generated Tags
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {editTags.map((mood, index) => {
                                    const isEditing = editingTagIndex === index

                                    if (isEditing) {
                                        return (
                                            <div key={`editing-${index}`} className="flex items-center gap-2">
                                                <Input
                                                    autoFocus
                                                    type="text"
                                                    value={editingTagValue}
                                                    onChange={(e) => setEditingTagValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEditedTag()
                                                        if (e.key === 'Escape') handleCancelEditTag()
                                                    }}
                                                    onBlur={handleSaveEditedTag}
                                                    className="h-7 w-32 text-xs bg-muted border-neon-purple/50 focus:border-neon-purple px-2 py-0"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 hover:bg-neon-purple/20 hover:text-neon-purple"
                                                    onClick={handleSaveEditedTag}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    }

                                    return (
                                        <Badge
                                            key={mood}
                                            className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 text-sm flex items-center gap-1 pr-1.5"
                                        >
                                            {mood}
                                            <div className="flex items-center gap-0.5 ml-1">
                                                <button
                                                    onClick={() => handleStartEditingTag(index, mood)}
                                                    className="hover:bg-neon-purple/20 rounded-full p-0.5 transition-colors text-neon-purple/50 hover:text-neon-purple"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    <span className="sr-only">Edit {mood} tag</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveTag(mood)}
                                                    className="hover:bg-neon-purple/20 rounded-full p-0.5 transition-colors text-neon-purple/50 hover:text-neon-purple"
                                                >
                                                    <X className="w-3 h-3" />
                                                    <span className="sr-only">Remove {mood} tag</span>
                                                </button>
                                            </div>
                                        </Badge>
                                    )
                                })}

                                {isAddingTag ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            autoFocus
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddTag()
                                                if (e.key === 'Escape') {
                                                    setIsAddingTag(false)
                                                    setNewTag("")
                                                }
                                            }}
                                            onBlur={() => {
                                                if (!newTag.trim()) setIsAddingTag(false)
                                            }}
                                            className="h-7 w-32 text-xs bg-muted border-neon-purple/50 focus:border-neon-purple px-2 py-0"
                                            placeholder="New tag..."
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 hover:bg-neon-purple/20 hover:text-neon-purple"
                                            onClick={handleAddTag}
                                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="h-7 w-7 flex items-center justify-center rounded-full bg-muted hover:bg-neon-purple/20 border border-transparent hover:border-neon-purple/30 transition-all text-muted-foreground hover:text-neon-purple"
                                        title="Add Tag"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Reviews</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            {/* One-line Review */}
                            <div className="space-y-2">
                                <Label className="text-foreground font-medium">
                                    한줄평 <span className="text-muted-foreground font-normal text-xs ml-1">One-line Review</span>
                                </Label>
                                <Input
                                    type="text"
                                    value={editOneLineReview}
                                    onChange={(e) => setEditOneLineReview(e.target.value)}
                                    placeholder="이 작품을 한 문장으로 정의한다면?"
                                    className="bg-[#121212] border-border text-foreground placeholder:text-muted-foreground/60 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/30 transition-all"
                                />
                            </div>

                            {/* Detailed Review */}
                            <div className="space-y-2">
                                <Label className="text-foreground font-medium">
                                    상세 후기 <span className="text-muted-foreground font-normal text-xs ml-1">Detailed Review</span>
                                </Label>
                                <textarea
                                    value={editDetailedReview}
                                    onChange={(e) => setEditDetailedReview(e.target.value)}
                                    placeholder="작품에 대한 심도 깊은 분석이나 개인적인 감상을 자유롭게 기록하세요."
                                    rows={4}
                                    className="w-full min-h-[120px] max-h-[300px] resize-y rounded-md bg-[#121212] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* Edit Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 border-border hover:bg-muted bg-transparent"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="flex-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 bg-neon-purple hover:bg-neon-purple-dim text-primary-foreground"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </>
                ) : (
                    // VIEW MODE
                    <>
                        {/* Rating Section */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Rating</Label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => renderDisplayStar(star))}
                                <span className="ml-3 text-lg font-bold text-neon-purple">
                                    {item.rating % 1 === 0 ? `${item.rating}.0` : item.rating.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4" />
                                    Start Date
                                </Label>
                                <p className="text-foreground font-medium">
                                    {formatDate(item.startDate)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4" />
                                    End Date
                                </Label>
                                <p className="text-foreground font-medium">
                                    {formatDate(item.endDate)}
                                </p>
                            </div>
                        </div>

                        {/* Mood Tags */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-neon-purple" />
                                AI-Generated Tags
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {item.moods.map((mood) => (
                                    <Badge
                                        key={mood}
                                        className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 text-sm"
                                    >
                                        {mood}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Reviews</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            {/* One-line Review */}
                            <div className="space-y-2">
                                <Label className="text-foreground font-medium">
                                    한줄평 <span className="text-muted-foreground font-normal text-xs ml-1">One-line Review</span>
                                </Label>
                                <p className="text-foreground bg-[#121212] rounded-lg px-4 py-3 border border-border">
                                    {item.oneLineReview || "현실과 환상의 경계를 허무는 걸작"}
                                </p>
                            </div>

                            {/* Detailed Review */}
                            <div className="space-y-2">
                                <Label className="text-foreground font-medium">
                                    상세 후기 <span className="text-muted-foreground font-normal text-xs ml-1">Detailed Review</span>
                                </Label>
                                <p className="text-foreground/90 bg-[#121212] rounded-lg px-4 py-3 border border-border leading-relaxed">
                                    {item.detailedReview || "비주얼과 사운드 디자인이 압도적이며, 철학적 질문을 던지는 스토리가 인상적이었다. 특히 주인공의 정체성에 대한 탐구가 깊이 있게 다뤄졌다."}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-border hover:bg-muted"
                            >
                                Close
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="flex-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Button
                                onClick={handleEnterEditMode}
                                className="flex-1 bg-neon-purple hover:bg-neon-purple-dim text-primary-foreground"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Entry
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
