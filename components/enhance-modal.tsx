"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EnhanceModalProps {
  originalText: string
  enhancedText: string
  onKeep: () => void
  onDiscard: () => void
}

export function EnhanceModal({ originalText, enhancedText, onKeep, onDiscard }: EnhanceModalProps) {
  return (
    <Dialog open={true} onOpenChange={onDiscard}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enhanced Text</DialogTitle>
          <DialogDescription>Review the AI-enhanced version of your text.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Original</h3>
              <div className="p-3 border rounded-md bg-muted/50 text-sm overflow-auto max-h-[200px]">
                {originalText}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Enhanced</h3>
              <div className="p-3 border rounded-md bg-muted/50 text-sm overflow-auto max-h-[200px]">
                {enhancedText}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button type="button" onClick={onKeep}>
            Keep Enhancement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
