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
import { Wand2, CheckCircle, XCircle } from "lucide-react"

interface EnhanceModalProps {
  originalText: string
  enhancedText: string
  onKeep: () => void
  onDiscard: () => void
}

export function EnhanceModal({ originalText, enhancedText, onKeep, onDiscard }: EnhanceModalProps) {
  return (
    <Dialog open={true} onOpenChange={onDiscard}>
      <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            AI Text Enhancement
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Review the AI-enhanced version of your selected text
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Original</h3>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm overflow-auto max-h-[200px] shadow-inner">
                {originalText}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Enhanced</h3>
              </div>
              <div className="p-4 border border-purple-200 dark:border-purple-700 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm text-sm overflow-auto max-h-[200px] shadow-inner">
                {enhancedText}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            className="flex-1 sm:flex-none bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Discard
          </Button>
          <Button
            type="button"
            onClick={onKeep}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Keep Enhancement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
