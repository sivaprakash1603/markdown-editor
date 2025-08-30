// /app/api/workspaces/join/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { invitationToken, userId } = await request.json()

    if (!invitationToken || !userId) {
      return NextResponse.json({ error: "invitationToken and userId are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Parse invitation token
    const tokenParts = invitationToken.split('-')
    const timestamp = tokenParts[tokenParts.length - 1]
    const invitationCode = tokenParts[tokenParts.length - 2]
    const workspaceId = tokenParts.slice(0, -2).join('-')

    console.log('Token parsing:', {
      originalToken: invitationToken,
      tokenParts,
      workspaceId,
      invitationCode,
      timestamp
    })

    // Check if invitation is not expired (7 days for easier testing)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const hoursDiff = (now - tokenTime) / (1000 * 60 * 60)

    console.log('Expiration check:', {
      tokenTime,
      now,
      hoursDiff,
      isExpired: hoursDiff > (24 * 7) // 7 days
    })

    if (hoursDiff > (24 * 7)) {
      return NextResponse.json({ error: "Invitation link has expired" }, { status: 400 })
    }

    // Verify workspace and invitation code
    const workspace = await db.collection("workspaces").findOne({
      workspaceId,
      invitationCode
    })

    console.log('Workspace validation:', {
      workspaceId,
      invitationCode,
      workspaceFound: !!workspace,
      workspace
    })

    if (!workspace) {
      return NextResponse.json({ error: "Invalid invitation link" }, { status: 400 })
    }

    // Check if user is already a member
    const existingMember = await db.collection("workspace_members").findOne({
      workspaceId,
      userId
    })

    console.log('Membership check:', {
      workspaceId,
      userId,
      isExistingMember: !!existingMember,
      memberDetails: existingMember
    })

    if (existingMember) {
      return NextResponse.json({ error: "Already a member of this workspace" }, { status: 400 })
    }

    // Add user as member with default role
    const member = {
      workspaceId,
      userId,
      role: "read-write", // Default role for invited members
      joinedAt: new Date(),
      invitedBy: workspace.createdBy
    }

    await db.collection("workspace_members").insertOne(member)

    return NextResponse.json({
      workspace,
      member,
      message: "Successfully joined workspace"
    }, { status: 200 })

  } catch (error) {
    console.error("Error joining workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
