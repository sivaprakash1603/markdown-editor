// /app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"

// Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const { name, description, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json({ error: "Name and userId are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user exists
    const user = await db.collection("user").findOne({ userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const workspaceId = uuidv4()
    const invitationCode = uuidv4().substring(0, 8).toUpperCase()

    // Create workspace
    const workspace = {
      workspaceId,
      name,
      description: description || "",
      createdBy: userId,
      createdAt: new Date(),
      invitationCode,
      settings: {
        allowPublicRead: false,
        requireApproval: true
      }
    }

    await db.collection("workspaces").insertOne(workspace)

    // Add creator as admin member
    const member = {
      workspaceId,
      userId,
      role: "admin",
      joinedAt: new Date(),
      invitedBy: userId
    }

    await db.collection("workspace_members").insertOne(member)

    return NextResponse.json({
      workspace,
      member,
      message: "Workspace created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get workspaces where user is a member
    const memberships = await db.collection("workspace_members")
      .find({ userId })
      .toArray()

    const workspaceIds = memberships.map((m: any) => m.workspaceId)

    const workspaces = await db.collection("workspaces")
      .find({ workspaceId: { $in: workspaceIds } })
      .toArray()

    // Combine workspace data with member role
    const workspacesWithRole = workspaces.map((workspace: any) => {
      const membership = memberships.find((m: any) => m.workspaceId === workspace.workspaceId)
      return {
        ...workspace,
        role: membership?.role || "read-write"
      }
    })

    return NextResponse.json({ workspaces: workspacesWithRole }, { status: 200 })

  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
