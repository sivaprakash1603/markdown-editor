// /app/api/workspaces/[workspaceId]/notes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const workspaceId = params.workspaceId

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user is a member of the workspace
    const member = await db.collection("workspace_members").findOne({
      workspaceId,
      userId
    })

    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Get workspace notes
    const notes = await db.collection("workspace_notes")
      .find({ workspaceId })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({ notes }, { status: 200 })

  } catch (error) {
    console.error("Error fetching workspace notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { content, title, userId } = await request.json()
    const workspaceId = params.workspaceId

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user is a member and has write permissions
    const member = await db.collection("workspace_members").findOne({
      workspaceId,
      userId
    })

    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    if (member.role === "read-only") {
      return NextResponse.json({ error: "Read-only access" }, { status: 403 })
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const note = {
      noteId,
      workspaceId,
      title: title || "Untitled Note",
      content,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEditedBy: userId
    }

    await db.collection("workspace_notes").insertOne(note)

    return NextResponse.json({ note, message: "Note created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Error creating workspace note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
