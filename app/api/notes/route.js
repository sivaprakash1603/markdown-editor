import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const user = await db.collection("user").findOne({ userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const notes = user.notes || user.history || []

    // ✅ Return notes array directly
    return NextResponse.json({ notes }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user notes" }, { status: 500 })
  }
}
