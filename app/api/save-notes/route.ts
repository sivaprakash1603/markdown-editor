// /app/api/save-notes/route.ts (assuming App Router)
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  const body = await request.json()
  const { note, userId } = body

  try {
    if (!note || !userId) {
      return new Response("Missing required fields", { status: 400 })
    }

    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")
    console.log(userId)
    const user = await usersCollection.findOne({ userId })
    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    // Update or add the note to the notes array
    const existingNotes = user.notes || []
    const noteIndex = existingNotes.findIndex((n: any) => n.id === note.id)

    if (noteIndex !== -1) {
      // Update existing note
      existingNotes[noteIndex] = note
    } else {
      // Add new note
      existingNotes.push(note)
    }

    await usersCollection.updateOne(
      { userId },
      { $set: { notes: existingNotes } }
    )

    return new Response("Note saved successfully", { status: 200 })
  } catch (error: any) {
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
