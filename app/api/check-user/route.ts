import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, email, name } = body

  try {
    if (!userId || !email) {
      return new Response("Missing required fields", { status: 400 })
    }

    // Connect to MongoDB
    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ userId: userId })

    if (!existingUser) {
      // Create new user record
      await usersCollection.insertOne({
        userId: userId,
        email: email,
        name: name || null,
        notes: [],
        createdAt: new Date(),
      })

      return new Response(JSON.stringify({
        userId: userId,
        email: email,
        name: name || null,
        isNewUser: true
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      // User exists, return their data
      return new Response(JSON.stringify({
        userId: existingUser.userId,
        email: existingUser.email,
        name: existingUser.name,
        isNewUser: false
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error: any) {
    console.error("Error in check-user API:", error)
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
