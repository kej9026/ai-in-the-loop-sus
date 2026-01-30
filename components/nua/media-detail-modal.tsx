"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { MediaItem } from "@/types"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MediaDetailContent } from "./media-detail-content"

interface MediaDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MediaItem | null
  onUpdate?: (updatedItem: MediaItem) => void
  onDelete?: (id: string) => void
}

export function MediaDetailModal({ open, onOpenChange, item, onUpdate, onDelete }: MediaDetailModalProps) {
  const isMobile = useIsMobile()

  if (!item) return null

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] p-0 overflow-hidden">
          <DrawerTitle className="sr-only">{item.title}</DrawerTitle>
          <div className="h-full overflow-hidden">
            <MediaDetailContent
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-neon-purple/30 shadow-2xl shadow-neon-purple/10 p-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <div className="h-full overflow-hidden">
          <MediaDetailContent
            item={item}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
