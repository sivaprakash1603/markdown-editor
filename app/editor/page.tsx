"use client";
import { useState, useEffect,useRef } from "react";
import dynamic from "next/dynamic";
import { EnhanceModal } from "@/components/enhance-modal";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {ThemeToggle} from "@/components/theme-toggle";
import axios from "axios";
import { useTheme } from "next-themes";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false }
);

export default function EditorPage() {
  const editorRef = useRef<any>(null);
  const router = useRouter();
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [enhancedText, setEnhancedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme,resolvedTheme } = useTheme();
  const editorKey = `editor-${resolvedTheme}`;

  useEffect(() => {
    const fetchNotes = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return router.push("/");

      const res = await fetch(`/api/notes?userId=${userId}`);
      const data = await res.json();

      if (res.ok && data.notes?.history?.length) {
        setNotes(data.notes.history);
        setSelectedNote("");
        setContent("");
        setCurrentIndex(data.notes.history.length);
      }
    };
    fetchNotes();
  }, [router]);

  useEffect(() => {
    if (selectedNote) setContent(selectedNote);
  }, [selectedNote]);

  const handleNoteSelect = (note: string) => {
    setSelectedNote(note);
    setCurrentIndex(notes.indexOf(note));
  };

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
      });

      if (!res.ok) throw new Error("Failed to save note");
      setNotes((prev) => {
        const updatedNotes = [...prev];
        updatedNotes[currentIndex] = content; // Update the note at the current index
        return updatedNotes;
      });
      setSelectedNote(content); // Update selected note
      alert("Note saved to history successfully!");
    } catch (error) {
      console.error(error);
      alert("Error saving note");
    }
  };

  const getSelectedText = () => {
    if (editorRef.current) {
      const text = editorRef.current.selection.getContent({ format: 'text' });
      setSelectedText(text);  // Store in state if needed
      return text;
    }
    return '';
  };
  

  const handleEditorChange = (newContent: string) => setContent(newContent);

  const handleEnhance = async () => {
    const text = getSelectedText();
    if (!text) {
      alert("Please select some text to enhance");
      return;
    }

    try {
      const response = await axios.post("/api/enhance-text", { text: text });

      if (response.status === 200 && response.data.enhancedText) {
        setEnhancedText(response.data.enhancedText);
        setShowEnhanceModal(true);
      } else {
        alert("Error enhancing the text");
      }
    } catch (error) {
      console.error("Error enhancing text:", error);
      alert("Error enhancing the text");
    }
  };

  const handleKeepEnhancement = () => {
    if (editorRef.current) {
      editorRef.current.selection.setContent(enhancedText);
    }
    setShowEnhanceModal(false);
  };

  const handleDiscardEnhancement = () => setShowEnhanceModal(false);
  const handleNewNote = () => {
    setContent("");
    setSelectedNote(null);
    setCurrentIndex(notes.length);
  };
  const handleDelete = async () => {
    if (selectedNote) {
      const indexToDelete = notes.indexOf(selectedNote);
    if (indexToDelete !== -1) {
      const updatedNotes = [...notes];
      updatedNotes.splice(indexToDelete, 1); // remove the note at the index

      setNotes(updatedNotes);
      setSelectedNote(updatedNotes[0] || null);
      setContent(updatedNotes[0] || "");
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
        });
        alert("Note deleted successfully!");
      } catch (error) {
        console.error(error);
        alert("Error deleting note");
      }
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Markdown Editor</h1>
        <div className="flex items-end gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/5 border-r p-4 overflow-y-auto space-y-2">
          <h2 className="text-md font-semibold mb-2">Note History</h2>
          {notes.map((note, index) => (
            <div
              key={index}
              onClick={() => handleNoteSelect(note)}
              className={`p-2 rounded cursor-pointer border hover:bg-gray-100 dark:hover:bg-gray-700 ${
  selectedNote === note
    ? "bg-gray-500 text-white font-medium dark:bg-gray-600 hover:text-black"
    : "bg-white dark:bg-gray-800 dark:text-white"
}`}
              dangerouslySetInnerHTML={{ __html: note }}
            />
          ))}
        </aside>

        {/* Editor */}
        <main className="w-4/5 flex flex-col">
          <div className="flex gap-2 p-2 pl-4">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleEnhance}>Enhance Selection</Button>
            <Button onClick={handleNewNote}>New</Button>
            <Button onClick={() => setContent("")}>Clear</Button>
            <Button onClick={handleDelete}>Delete</Button>
          </div>

          <div className="flex-1 p-4">
            <Editor
  key={`editor-${theme}`} // Force re-render on theme change
  value={content}
  onInit={(evt, editor) => (editorRef.current = editor)}
  onEditorChange={handleEditorChange}
  tinymceScriptSrc="/tinymce/tinymce.min.js" // Your local TinyMCE path
  init={{
    height: "100%",
    menubar: false,
    skin: resolvedTheme === "dark" ? "tinymce-5-dark" : "tinymce-5",
    content_css: resolvedTheme === "dark" ? "dark" : "default",
    plugins:
      "lists link image charmap preview anchor searchreplace visualblocks fullscreen media table help wordcount",
    toolbar:
      "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | help",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
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
  );
}
