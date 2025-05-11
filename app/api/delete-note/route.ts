import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, currentIndex } = body

  try {
    if (userId === undefined || currentIndex === undefined) {
      return new Response("Missing required fields", { status: 400 })
    }

    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")

    const user = await usersCollection.findOne({ userId })

    if (!user || !Array.isArray(user.history)) {
      return new Response("User not found or history is not an array", { status: 404 })
    }

    const updatedHistory = [...user.history]
    updatedHistory.splice(currentIndex, 1) // remove the element at currentIndex

    await usersCollection.updateOne(
      { userId },
      { $set: { history: updatedHistory } }
    )

    return new Response("Note deleted successfully", { status: 200 })
  } catch (error: any) {
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
