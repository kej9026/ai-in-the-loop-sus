import React from "react"
import { Sparkles } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MediaEntryForm } from "./media-entry-form"

interface MediaEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function MediaEntryModal({ open, onOpenChange, onCreated }: MediaEntryModalProps) {
  const isMobile = useIsMobile()

  const handleCreated = () => {
    onOpenChange(false)
    onCreated?.()
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-neon-purple" />
              </div>
              Add to Archive
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <MediaEntryForm
              onCancel={() => onOpenChange(false)}
              onSuccess={handleCreated}
            />
          </div>
        </DrawerContent>
      </Drawer>
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

        <MediaEntryForm
          onCancel={() => onOpenChange(false)}
          onSuccess={handleCreated}
        />
      </DialogContent>
    </Dialog>
  )
}
