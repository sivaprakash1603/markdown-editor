"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EnhanceModalProps {
  originalText: string
  enhancedText: string
  onKeep: () => void
  onDiscard: () => void
}

export function EnhanceModal({ originalText, enhancedText, onKeep, onDiscard }: EnhanceModalProps) {
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enhanced Text</DialogTitle>
          <DialogDescription>Review the AI-enhanced version of your text</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Original</h3>
            <div className="rounded-md bg-muted p-3 text-sm">{originalText}</div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Enhanced</h3>
            <div className="rounded-md bg-muted p-3 text-sm">{enhancedText}</div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onKeep}>Keep</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
