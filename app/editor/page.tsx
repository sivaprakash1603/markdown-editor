"use client"
import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { EnhanceModal } from "@/components/enhance-modal"
import { LogOut, Menu, Save, Wand2, Plus, Trash2 ,Brush} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import axios from "axios"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), { ssr: false })

export default function EditorPage() {
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const [notes, setNotes] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [enhancedText, setEnhancedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, resolvedTheme } = useTheme()
  const isMobile = useIsMobile()
  const editorKey = `editor-${resolvedTheme}`

  useEffect(() => {
    const fetchNotes = async () => {
      const userId = localStorage.getItem("userId")
      if (!userId) return router.push("/")

      const res = await fetch(`/api/notes?userId=${userId}`)
      const data = await res.json()

      if (res.ok && data.notes?.history?.length) {
        setNotes(data.notes.history)
        setSelectedNote("")
        setContent("")
        setCurrentIndex(data.notes.history.length)
      }
    }
    fetchNotes()
  }, [router])

  useEffect(() => {
    if (selectedNote) setContent(selectedNote)
  }, [selectedNote])

  const handleNoteSelect = (note: string) => {
    setSelectedNote(note)
    setCurrentIndex(notes.indexOf(note))
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch("/api/save-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          currentIndex,
          userId: localStorage.getItem("userId"),
        }),
      })

      if (!res.ok) throw new Error("Failed to save note")
      setNotes((prev) => {
        const updatedNotes = [...prev]
        updatedNotes[currentIndex] = content
        return updatedNotes
      })
      setSelectedNote(content)
      alert("Note saved to history successfully!")
    } catch (error) {
      console.error(error)
      alert("Error saving note")
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
      alert("Please select some text to enhance")
      return
    }

    try {
      const response = await axios.post("/api/enhance-text", { text: text })

      if (response.status === 200 && response.data.enhancedText) {
        setEnhancedText(response.data.enhancedText)
        setShowEnhanceModal(true)
      } else {
        alert("Error enhancing the text")
      }
    } catch (error) {
      console.error("Error enhancing text:", error)
      alert("Error enhancing the text")
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
    setContent("")
    setSelectedNote(null)
    setCurrentIndex(notes.length)
  }

  const handleDelete = async () => {
    if (selectedNote) {
      const indexToDelete = notes.indexOf(selectedNote)
      if (indexToDelete !== -1) {
        const updatedNotes = [...notes]
        updatedNotes.splice(indexToDelete, 1)

        setNotes(updatedNotes)
        setSelectedNote(updatedNotes[0] || null)
        setContent(updatedNotes[0] || "")
      }

      try {
        await fetch("/api/delete-note", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentIndex: currentIndex,
            userId: localStorage.getItem("userId"),
          }),
        })
        alert("Note deleted successfully!")
      } catch (error) {
        console.error(error)
        alert("Error deleting note")
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    router.push("/")
  }

  // Sidebar component for both mobile and desktop
  const NoteSidebar = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <h2 className="text-md font-semibold mb-2">Note History</h2>
      <div className="overflow-y-auto flex-1">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div
              key={index}
              onClick={() => handleNoteSelect(note)}
              className={`p-2 rounded cursor-pointer border mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                selectedNote === note
                  ? "bg-gray-500 text-white font-medium dark:bg-gray-600 hover:text-black"
                  : "bg-white dark:bg-gray-800 dark:text-white"
              }`}
              dangerouslySetInnerHTML={{ __html: note }}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No notes yet. Create one!</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-4">
                <SheetTitle>Note History</SheetTitle>
                <NoteSidebar />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-xl font-bold">Markdown Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block w-1/4 lg:w-1/5 border-r p-4 overflow-y-auto">
          <NoteSidebar />
        </aside>

        {/* Editor */}
        <main className="w-full md:w-3/4 lg:w-4/5 flex flex-col">
          <div className="flex flex-wrap gap-2 p-2 pl-4">
            <Button onClick={handleSave} className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button onClick={handleEnhance} className="flex items-center gap-1">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Enhance</span>
            </Button>
            <Button onClick={handleNewNote} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button onClick={() => setContent("")} className="flex items-center gap-1">
              <Brush className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <Button onClick={handleDelete} className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>

          <div className="flex-1 p-2 sm:p-4">
            <Editor
              key={`editor-${theme}`}
              value={content}
              onInit={(evt, editor) => (editorRef.current = editor)}
              onEditorChange={handleEditorChange}
              tinymceScriptSrc="/tinymce/tinymce.min.js"
              init={{
                height: "100%",
                menubar: false,
                skin: resolvedTheme === "dark" ? "tinymce-5-dark" : "tinymce-5",
                content_css: resolvedTheme === "dark" ? "dark" : "default",
                plugins:
                  "lists link image charmap preview anchor searchreplace visualblocks fullscreen media table help wordcount",
                toolbar:
                  "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | help",
                content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                mobile: {
                  menubar: false,
                  toolbar: "undo redo | bold italic | bullist numlist",
                },
              }}
            />
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
    </div>
  )
}
