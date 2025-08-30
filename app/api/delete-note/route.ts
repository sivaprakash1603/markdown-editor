import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, noteId } = body

  try {
    if (!userId || !noteId) {
      return new Response("Missing required fields", { status: 400 })
    }

    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")

    const user = await usersCollection.findOne({ userId })

    if (!user || !Array.isArray(user.notes)) {
      return new Response("User not found or notes is not an array", { status: 404 })
    }

    const updatedNotes = user.notes.filter((note: any) => note.id !== noteId)

    await usersCollection.updateOne(
      { userId },
      { $set: { notes: updatedNotes } }
    )

    return new Response("Note deleted successfully", { status: 200 })
  } catch (error: any) {
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
