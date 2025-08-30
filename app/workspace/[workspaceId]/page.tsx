"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { LogOut, Menu, Save, Wand2, Plus, Trash2 ,Brush,Download, FileText, CheckCircle, X, Users, Crown, Edit, Eye, Settings, ArrowLeft} from "lucide-react"
import { useRouter as useNextRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { EnhanceModal } from "@/components/enhance-modal"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), { ssr: false })

interface Workspace {
  workspaceId: string
  name: string
  description: string
  role: string
}

interface Note {
  noteId: string
  title: string
  content: string
  createdBy: string
  createdAt: string
  updatedAt: string
  lastEditedBy: string
}

export default function WorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const nextRouter = useNextRouter()
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const editorRef = useRef<any>(null)
  const { user, logout } = useAuth()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [enhancedText, setEnhancedText] = useState("")
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  const workspaceId = params.workspaceId as string

  useEffect(() => {
    if (user) {
      fetchWorkspaceData()
    }
  }, [workspaceId, user])

  const fetchWorkspaceData = async () => {
    try {
      if (!user) {
        router.push("/")
        return
      }

      // Fetch workspace info
      const workspacesResponse = await fetch(`/api/workspaces?userId=${user.userId}`)
      const workspacesData = await workspacesResponse.json()

      if (workspacesResponse.ok) {
        const currentWorkspace = workspacesData.workspaces.find((w: any) => w.workspaceId === workspaceId)
        if (currentWorkspace) {
          setWorkspace(currentWorkspace)
        } else {
          router.push("/workspaces")
          return
        }
      }

      // Fetch workspace notes
      const notesResponse = await fetch(`/api/workspaces/${workspaceId}/notes?userId=${user.userId}`)
      const notesData = await notesResponse.json()

      if (notesResponse.ok) {
        setNotes(notesData.notes)
      }
    } catch (error) {
      console.error("Error fetching workspace data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
    setContent(note.content)
    setTitle(note.title)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleSave = async () => {
    if (!selectedNote || !workspace) return

    setIsSaving(true)
    try {
      const isNewNote = selectedNote.noteId.startsWith("temp_")

      let response
      if (isNewNote) {
        // Create new note
        response = await fetch(`/api/workspaces/${workspace.workspaceId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title,
            userId: user?.userId
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update local state with the real noteId from the server
          const newNote = data.note
          setNotes(prev => prev.map(note =>
            note.noteId === selectedNote.noteId ? newNote : note
          ))
          setSelectedNote(newNote)
          
          setShowSuccess("Note created successfully!")
          setTimeout(() => setShowSuccess(null), 3000)
        }
      } else {
        // Update existing note
        response = await fetch(`/api/workspaces/${workspace.workspaceId}/notes/${selectedNote.noteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title,
            userId: user?.userId
          }),
        })

        if (response.ok) {
          // Update local state
          setNotes(prev => prev.map(note =>
            note.noteId === selectedNote.noteId
              ? { ...note, content, title, updatedAt: new Date().toISOString(), lastEditedBy: user?.userId! }
              : note
          ))
          setSelectedNote(prev => prev ? { ...prev, content, title, updatedAt: new Date().toISOString(), lastEditedBy: user?.userId! } : null)
          
          setShowSuccess("Note saved successfully!")
          setTimeout(() => setShowSuccess(null), 3000)
        }
      }

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Save failed",
          description: error.error || "Failed to save the note. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving note:", error)
      toast({
        title: "Save failed",
        description: "An unexpected error occurred while saving. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const createNewNote = () => {
    const newNote: Note = {
      noteId: `temp_${Date.now()}`,
      title: "Untitled Note",
      content: "",
      createdBy: user?.userId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: user?.userId!
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setContent("")
    setTitle("Untitled Note")
  }

  const handleDelete = async () => {
    if (!selectedNote || !workspace) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.workspaceId}/notes/${selectedNote.noteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.userId
        }),
      })

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.noteId !== selectedNote.noteId))
        setSelectedNote(null)
        setContent("")
        setTitle("")
        
        toast({
          title: "Note deleted",
          description: "The note has been deleted successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Delete failed",
          description: error.error || "Failed to delete the note. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred while deleting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    if (!selectedNote) return

    setIsDownloading(true)
    setTimeout(() => {
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedNote.title || "note"}.md`
      a.click()
      URL.revokeObjectURL(url)

      setIsDownloading(false)
      setShowSuccess("Note downloaded successfully!")
      setTimeout(() => setShowSuccess(null), 3000)
    }, 1500)
  }

  const getSelectedText = () => {
    if (editorRef.current) {
      const text = editorRef.current.selection.getContent({ format: "text" })
      setSelectedText(text)
      return text
    }
    return ""
  }

  const handleEnhance = async () => {
    const text = getSelectedText()
    if (!text.trim()) {
      toast({
        title: "No text selected",
        description: "Please select some text to enhance.",
        variant: "destructive",
      })
      return
    }

    setIsEnhancing(true)
    try {
      const response = await fetch("/api/enhance-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          userId: user?.userId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnhancedText(data.enhancedText)
        setShowEnhanceModal(true)
      } else {
        toast({
          title: "Enhancement failed",
          description: "Failed to enhance the selected text. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error enhancing text:", error)
      toast({
        title: "Enhancement failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const applyEnhancedText = () => {
    if (editorRef.current && enhancedText) {
      editorRef.current.selection.setContent(enhancedText)
      setShowEnhanceModal(false)
      setEnhancedText("")
      setShowSuccess("Text enhanced successfully!")
      setTimeout(() => setShowSuccess(null), 3000)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "read-write":
        return <Edit className="w-4 h-4 text-blue-500" />
      case "read-only":
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  const canEdit = workspace?.role === "admin" || workspace?.role === "read-write"

  // Success Notification Component
  const SuccessNotification = ({ message }: { message: string }) => (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="bg-green-500/95 dark:bg-green-600/95 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg border border-green-400/50 flex items-center gap-3">
        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3" />
        </div>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => setShowSuccess(null)}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
          title="Close notification"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )

  // Save Animation Component
  const SaveAnimation = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-green-200/50 dark:border-green-700/50 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Save className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Saving Your Note
          </h3>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animate-delay-02"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animate-delay-04"></div>
          </div>
        </div>
      </div>
    </div>
  )

  // Delete Animation Component
  const DeleteAnimation = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-red-200/50 dark:border-red-700/50 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            Deleting Note
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            Removing from your collection...
          </div>
        </div>
      </div>
    </div>
  )

  // Download Animation Component
  const DownloadAnimation = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-blue-200/50 dark:border-blue-700/50 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Download className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-300 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Preparing Download
          </h3>
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  )

  // Enhance Loading Overlay Component
  const EnhanceLoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative">
        {/* Animated background particles */}
        <div className="absolute inset-0 -z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce-subtle opacity-60 ${
                i % 5 === 0 ? 'left-20' :
                i % 5 === 1 ? 'left-35' :
                i % 5 === 2 ? 'left-50' :
                i % 5 === 3 ? 'left-65' : 'left-80'
              }`}
              style={{
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Main loading card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-purple-200/50 dark:border-purple-700/50 animate-fade-in">
          {/* Spinning AI brain icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Wand2 className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '1.5s' }} />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0">
                <div className="w-2 h-2 bg-purple-400 rounded-full absolute animate-ping top-10 right-10"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full absolute animate-ping bottom-10 left-10 animate-delay-02"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full absolute animate-ping top-10 left-10 animate-delay-08"></div>
              </div>
            </div>
          </div>

          {/* Animated text */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Enhancement in Progress
            </h3>
            <div className="flex justify-center space-x-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Analyzing</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse animate-delay-02">your</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse animate-delay-04">text</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse animate-delay-06">with</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse animate-delay-08">AI</span>
            </div>

            {/* Progress bar */}
            <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse width-70"></div>
            </div>

            {/* Floating text particles */}
            <div className="relative h-16 overflow-hidden">
              {['✨', '🚀', '💡', '🎯', '🔥'].map((emoji, i) => (
                <div
                  key={i}
                  className={`absolute text-2xl animate-bounce-subtle ${
                    i === 0 ? 'left-20' :
                    i === 1 ? 'left-35' :
                    i === 2 ? 'left-50' :
                    i === 3 ? 'left-65' : 'left-80'
                  }`}
                  style={{
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: `${2 + i * 0.5}s`,
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Workspace not found</h2>
          <Button onClick={() => router.push("/workspaces")}>
            Back to Workspaces
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workspaces")}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <SheetTitle className="text-lg font-semibold mb-4">Workspace Notes</SheetTitle>
                <WorkspaceNotesSidebar
                  notes={notes}
                  selectedNote={selectedNote}
                  onNoteSelect={handleNoteSelect}
                  onCreateNote={createNewNote}
                  canEdit={canEdit}
                />
              </SheetContent>
            </Sheet>
          )}

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className="text-xs">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(workspace.role)}
                    <span className="capitalize">{workspace.role}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {workspace.role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/workspace/${workspaceId}/settings`)}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Workspace settings</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        {!isMobile && (
          <aside className="w-1/4 lg:w-1/5 border-r border-gray-200/50 dark:border-gray-700/50 p-4 overflow-y-auto custom-scrollbar bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <WorkspaceNotesSidebar
              notes={notes}
              selectedNote={selectedNote}
              onNoteSelect={handleNoteSelect}
              onCreateNote={createNewNote}
              canEdit={canEdit}
            />
          </aside>
        )}

        {/* Editor */}
        <main className="w-full md:w-3/4 lg:w-4/5 flex flex-col">
          <div className="flex flex-wrap gap-2 p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
            {canEdit && selectedNote && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            )}

            {canEdit && selectedNote && (
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnhancing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Enhance</span>
                  </>
                )}
              </Button>
            )}

            {canEdit && (
              <Button
                onClick={createNewNote}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Note</span>
              </Button>
            )}

            {canEdit && selectedNote && (
              <Button
                onClick={() => setContent("")}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
              >
                <Brush className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}

            {canEdit && selectedNote && (
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </>
                )}
              </Button>
            )}

            {selectedNote && (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex-1 p-4">
            {selectedNote ? (
              <div className="h-full flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover-lift transition-all duration-300">
                {/* Title Input */}
                {canEdit ? (
                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title..."
                      className="text-lg font-semibold border-none bg-transparent focus:ring-2 focus:ring-blue-500/50 focus:border-transparent px-0"
                      disabled={!canEdit}
                    />
                  </div>
                ) : (
                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                  </div>
                )}

                {/* Editor */}
                <div className="flex-1">
                  <Editor
                  key={`editor-${theme}-${selectedNote.noteId}`}
                  value={content}
                  onInit={(evt, editor) => (editorRef.current = editor)}
                  onEditorChange={setContent}
                  disabled={!canEdit}
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  init={{
                    height: "100%",
                    menubar: false,
                    skin: theme === "dark" ? "oxide-dark" : "oxide",
                    content_css: false,
                    plugins: "lists link image charmap preview anchor searchreplace visualblocks fullscreen media table help wordcount save link searchreplace table charmap",
                    toolbar: canEdit ? "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent link searchreplace charmap |table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | fullscreen help" : false,
                    content_style: `
                      body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                        font-size: 16px;
                        line-height: 1.6;
                        color: ${theme === "dark" ? "#e5e7eb" : "#374151"};
                        background: ${theme === "dark" ? "#1f2937" : "#ffffff"};
                        margin: 20px;
                        padding: 20px;
                      }
                      .mce-content-body {
                        background: ${theme === "dark" ? "#1f2937" : "#ffffff"} !important;
                        color: ${theme === "dark" ? "#e5e7eb" : "#374151"} !important;
                      }
                      .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                        color: ${theme === "dark" ? "#6b7280" : "#9ca3af"};
                        font-style: italic;
                      }
                      p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code {
                        color: ${theme === "dark" ? "#e5e7eb" : "#374151"} !important;
                      }
                      a {
                        color: ${theme === "dark" ? "#60a5fa" : "#3b82f6"} !important;
                      }
                    `,
                  }}
                />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Select a note to view
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a note from the sidebar or create a new one.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enhance Modal */}
      {showEnhanceModal && (
        <EnhanceModal
          originalText={selectedText}
          enhancedText={enhancedText}
          onKeep={applyEnhancedText}
          onDiscard={() => setShowEnhanceModal(false)}
        />
      )}

      {/* Loading Animation Overlays */}
      {isSaving && <SaveAnimation />}
      {isDeleting && <DeleteAnimation />}
      {isDownloading && <DownloadAnimation />}
      {isEnhancing && <EnhanceLoadingOverlay />}

      {/* Success Notification */}
      {showSuccess && <SuccessNotification message={showSuccess} />}
    </div>
  )
}

function WorkspaceNotesSidebar({
  notes,
  selectedNote,
  onNoteSelect,
  onCreateNote,
  canEdit
}: {
  notes: Note[]
  selectedNote: Note | null
  onNoteSelect: (note: Note) => void
  onCreateNote: () => void
  canEdit: boolean
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Workspace Notes</h2>
        {canEdit && (
          <Button
            onClick={onCreateNote}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {notes.length > 0 ? (
          notes.map((note) => (
            <Card
              key={note.noteId}
              className={`cursor-pointer transition-all duration-200 hover-lift ${
                selectedNote?.noteId === note.noteId
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-blue-300 dark:border-blue-500"
                  : "bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
              }`}
              onClick={() => onNoteSelect(note)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      selectedNote?.noteId === note.noteId ? "text-white" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {note.title}
                    </h3>
                    <p className={`text-sm mt-1 line-clamp-2 ${
                      selectedNote?.noteId === note.noteId ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  </div>
                </div>
                <div className={`text-xs mt-2 ${
                  selectedNote?.noteId === note.noteId ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                }`}>
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notes yet. Create one!</p>
          </div>
        )}
      </div>
    </div>
  )
}
