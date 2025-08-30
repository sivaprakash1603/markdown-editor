// /app/api/workspaces/[workspaceId]/notes/[noteId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string; noteId: string } }
) {
  try {
    const { content, title, userId } = await request.json()
    const { workspaceId, noteId } = params

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

    // Update note
    const updateData: any = {
      updatedAt: new Date(),
      lastEditedBy: userId
    }

    if (content !== undefined) updateData.content = content
    if (title !== undefined) updateData.title = title

    const result = await db.collection("workspace_notes").updateOne(
      { noteId, workspaceId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note updated successfully" }, { status: 200 })

  } catch (error) {
    console.error("Error updating workspace note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; noteId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const { workspaceId, noteId } = params

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

    // Delete note
    const result = await db.collection("workspace_notes").deleteOne({
      noteId,
      workspaceId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 })

  } catch (error) {
    console.error("Error deleting workspace note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
