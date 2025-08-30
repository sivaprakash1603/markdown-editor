"use client"
import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { EnhanceModal } from "@/components/enhance-modal"
import { LogOut, Menu, Save, Wand2, Plus, Trash2 ,Brush,Download, FileText, CheckCircle, X, Users} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import axios from "axios"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/hooks/use-toast"

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), { ssr: false })

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function EditorPage() {
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [enhancedText, setEnhancedText] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const { theme, resolvedTheme } = useTheme()
  const isMobile = useIsMobile()
  const editorKey = `editor-${resolvedTheme}`
  const { user, logout, isLoading } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchNotes = async () => {
      const res = await fetch(`/api/notes?userId=${user.userId}`)
      const data = await res.json()

      if (res.ok && data.notes) {
        // Handle notes array directly from API
        if (Array.isArray(data.notes)) {
          // If notes are already in the correct format
          setNotes(data.notes)
        } else if (data.notes.history && Array.isArray(data.notes.history)) {
          // Fallback for old format - convert string array to Note objects
          const formattedNotes: Note[] = data.notes.history.map((content: string, index: number) => ({
            id: `note_${Date.now()}_${index}`,
            title: `Note ${index + 1}`,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
          setNotes(formattedNotes)
        }

        setSelectedNote(null)
        setContent("")
        setTitle("")
      }
    }
    fetchNotes()
  }, [router, user])

  useEffect(() => {
    if (selectedNote) {
      setContent(selectedNote.content)
      setTitle(selectedNote.title)
    }
  }, [selectedNote])

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleSave = async () => {
    if (!selectedNote) return

    setIsSaving(true)
    try {
      const updatedNote: Note = {
        ...selectedNote,
        title: title || "Untitled Note",
        content,
        updatedAt: new Date().toISOString()
      }

      const res = await fetch("/api/save-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: updatedNote,
          userId: user?.userId,
        }),
      })

      if (!res.ok) throw new Error("Failed to save note")

      setNotes((prev) => prev.map(note =>
        note.id === selectedNote.id ? updatedNote : note
      ))
      setSelectedNote(updatedNote)
      setShowSuccess("Note saved successfully!")
      setTimeout(() => setShowSuccess(null), 3000)
    } catch (error) {
      console.error(error)
      toast({
        title: "Save failed",
        description: "Failed to save the note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getSelectedText = () => {
    if (editorRef.current) {
      const text = editorRef.current.selection.getContent({ format: "text" })
      setSelectedText(text)
      return text
    }
    return ""
  }

  const handleEditorChange = (newContent: string) => setContent(newContent)

  const handleEnhance = async () => {
    const text = getSelectedText()
    if (!text) {
      toast({
        title: "No text selected",
        description: "Please select some text to enhance first.",
        variant: "destructive",
      })
      return
    }

    setIsEnhancing(true)

    try {
      const response = await axios.post("/api/enhance-text", { text: text })

      if (response.status === 200 && response.data.enhancedText) {
        setEnhancedText(response.data.enhancedText)
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
        description: "An error occurred while enhancing the text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleKeepEnhancement = () => {
    if (editorRef.current) {
      editorRef.current.selection.setContent(enhancedText)
    }
    setShowEnhanceModal(false)
  }

  const handleDiscardEnhancement = () => setShowEnhanceModal(false)

  const handleNewNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setNotes(prev => [...prev, newNote])
    setSelectedNote(newNote)
    setContent("")
    setTitle("Untitled Note")
    setShowSuccess("New note created!")
    setTimeout(() => setShowSuccess(null), 2000)
  }

  const handleDelete = async () => {
    if (!selectedNote) return

    setIsDeleting(true)
    try {
      const indexToDelete = notes.indexOf(selectedNote)
      if (indexToDelete !== -1) {
        const updatedNotes = [...notes]
        updatedNotes.splice(indexToDelete, 1)

        setNotes(updatedNotes)
        setSelectedNote(updatedNotes[0] || null)
        setContent(updatedNotes[0]?.content || "")
        setTitle(updatedNotes[0]?.title || "Untitled Note")
      }

      const res = await fetch("/api/delete-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: selectedNote.id,
          userId: user?.userId,
        }),
      })

      if (!res.ok) throw new Error("Failed to delete note")
      setShowSuccess("Note deleted successfully!")
      setTimeout(() => setShowSuccess(null), 3000)
    } catch (error) {
      console.error(error)
      toast({
        title: "Delete failed",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    setIsDownloading(true)

    // Simulate download process
    setTimeout(() => {
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "note.md"
      a.click()
      URL.revokeObjectURL(url)

      setIsDownloading(false)
      setShowSuccess("Note downloaded successfully!")
      setTimeout(() => setShowSuccess(null), 3000)
    }, 1500)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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
              } custom-particle-style`}
              data-top={Math.random() * 100}
              data-delay={Math.random() * 2}
              data-duration={2 + Math.random() * 2}
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
                  className={`absolute text-2xl animate-bounce-subtle emoji-particle ${
                    i === 0 ? 'left-20' :
                    i === 1 ? 'left-35' :
                    i === 2 ? 'left-50' :
                    i === 3 ? 'left-65' : 'left-80'
                  }`}
                  data-animation-delay={i * 0.3}
                  data-animation-duration={2 + i * 0.5}
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
  const NoteSidebar = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => handleNoteSelect(note)}
              className={`group p-3 rounded-lg cursor-pointer border transition-all duration-200 hover-lift ${
                selectedNote?.id === note.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-blue-300 dark:border-blue-500"
                  : "bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
              }`}
            >
              <div className={`font-medium text-sm mb-1 ${
                selectedNote?.id === note.id ? "text-white" : "text-gray-900 dark:text-gray-100"
              }`}>
                {note.title || "Untitled Note"}
              </div>
              <div
                className={`text-xs line-clamp-2 mb-2 ${
                  selectedNote?.id === note.id ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                }`}
                dangerouslySetInnerHTML={{
                  __html: note.content.length > 80 ? note.content.substring(0, 80) + "..." : note.content || "Empty note"
                }}
              />
              <div className={`text-xs ${
                selectedNote?.id === note.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
              }`}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
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

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm custom-scrollbar">
                <SheetTitle className="text-lg font-semibold mb-4">Note History</SheetTitle>
                <NoteSidebar />
              </SheetContent>
            </Sheet>
          )}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Markdown Editor
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workspaces")}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            title="Workspaces"
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Workspaces</span>
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block w-1/4 lg:w-1/5 border-r border-gray-200/50 dark:border-gray-700/50 p-4 overflow-y-auto custom-scrollbar bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Note History</h2>
          </div>
          <NoteSidebar />
        </aside>

        {/* Editor */}
        <main className="w-full md:w-3/4 lg:w-4/5 flex flex-col">
          <div className="flex flex-wrap gap-2 p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
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
            <Button
              onClick={handleNewNote}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button
              onClick={() => setContent("")}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
            >
              <Brush className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
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
          </div>

          {/* Title Input */}
          <div className="px-4 py-3 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0"
            />
            {selectedNote && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <div className="h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover-lift transition-all duration-300">
              <Editor
                key={`editor-${theme}`}
                value={content}
                onInit={(evt, editor) => (editorRef.current = editor)}
                onEditorChange={handleEditorChange}
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                init={{
                  height: "100%",
                  menubar: false,
                  skin: resolvedTheme === "dark" ? "oxide-dark" : "oxide",
                  content_css: false,
                  plugins:
                    "lists link image charmap preview anchor searchreplace visualblocks fullscreen media table help wordcount save link searchreplace table charmap",
                  toolbar:
                    "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent link searchreplace charmap |table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | fullscreen help",
                  content_style: `
                    body {
                      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      font-size: 16px;
                      line-height: 1.6;
                      color: ${resolvedTheme === "dark" ? "#e5e7eb" : "#374151"};
                      background: ${resolvedTheme === "dark" ? "#1f2937" : "#ffffff"};
                      margin: 20px;
                      padding: 20px;
                    }
                    .mce-content-body {
                      background: ${resolvedTheme === "dark" ? "#1f2937" : "#ffffff"} !important;
                      color: ${resolvedTheme === "dark" ? "#e5e7eb" : "#374151"} !important;
                    }
                    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                      color: ${resolvedTheme === "dark" ? "#6b7280" : "#9ca3af"};
                      font-style: italic;
                    }
                    p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code {
                      color: ${resolvedTheme === "dark" ? "#e5e7eb" : "#374151"} !important;
                    }
                    a {
                      color: ${resolvedTheme === "dark" ? "#60a5fa" : "#3b82f6"} !important;
                    }
                  `,
                  mobile: {
                    menubar: false,
                    toolbar: "undo redo | bold italic | bullist numlist",
                  },
                  placeholder: "Start writing your markdown...",
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Enhance Modal */}
      {showEnhanceModal && (
        <EnhanceModal
          originalText={selectedText}
          enhancedText={enhancedText}
          onKeep={handleKeepEnhancement}
          onDiscard={handleDiscardEnhancement}
        />
      )}

      {/* Enhancement Loading Overlay */}
      {isEnhancing && <EnhanceLoadingOverlay />}

      {/* Save Animation Overlay */}
      {isSaving && <SaveAnimation />}

      {/* Delete Animation Overlay */}
      {isDeleting && <DeleteAnimation />}

      {/* Download Animation Overlay */}
      {isDownloading && <DownloadAnimation />}

      {/* Success Notification */}
      {showSuccess && <SuccessNotification message={showSuccess} />}
    </div>
  )
}
