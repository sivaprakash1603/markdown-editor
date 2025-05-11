import { connectToDatabase } from "@/lib/mongodb"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { method, email, password, confirmPassword, userId } = body

  try {
    let uid = userId // May be undefined if method is email

    if (method === "email") {
      if (!email || !password || !confirmPassword) {
        return new Response("Missing required fields", { status: 400 })
      }

      if (password !== confirmPassword) {
        return new Response("Passwords do not match", { status: 400 })
      }

      // Create user with Firebase Authentication (email/password)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      uid = userCredential.user.uid
    }

    if (!uid || !email) {
      return new Response("Missing user ID or email", { status: 400 })
    }

    // Connect to MongoDB
    const db = await connectToDatabase()
    const usersCollection = db.db.collection("user")

    // Avoid duplicate entries
    const existingUser = await usersCollection.findOne({ userId: uid })
    if (!existingUser) {
      await usersCollection.insertOne({
        userId: uid,
        email: email,
        history: [],
      })
    }

    return new Response("User registered successfully", { status: 200 })
  } catch (error: any) {
    return new Response(error.message || "Internal server error", { status: 500 })
  }
}
