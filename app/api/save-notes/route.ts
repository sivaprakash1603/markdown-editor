// /app/api/save-note/route.ts (assuming App Router)
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  const body = await request.json()
  const { content, userId,currentIndex } = body

  try {
    if (!content || !userId) {
      return new Response("Missing required fields", { status: 400 })
    }

    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")
    console.log(userId)
    const user = await usersCollection.findOne({ userId })
    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    // Push content as a string to the history array
    await usersCollection.updateOne(
      { userId },
      { $set: { [`history.${currentIndex}`]: content } }
    )

    return new Response("Note saved to history successfully", { status: 200 })
  } catch (error: any) {
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
