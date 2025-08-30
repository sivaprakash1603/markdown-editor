// /app/api/workspaces/[workspaceId]/members/route.ts
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
    const userMember = await db.collection("workspace_members").findOne({
      workspaceId,
      userId
    })

    if (!userMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Get all members with user details
    const members = await db.collection("workspace_members")
      .aggregate([
        { $match: { workspaceId } },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "userId",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            userId: 1,
            role: 1,
            joinedAt: 1,
            invitedBy: 1,
            name: "$userDetails.name",
            email: "$userDetails.email"
          }
        }
      ])
      .toArray()

    return NextResponse.json({ members }, { status: 200 })

  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId, targetUserId, newRole } = await request.json()
    const workspaceId = params.workspaceId

    if (!userId || !targetUserId || !newRole) {
      return NextResponse.json({ error: "userId, targetUserId, and newRole are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user is admin
    const adminMember = await db.collection("workspace_members").findOne({
      workspaceId,
      userId,
      role: "admin"
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update member role
    await db.collection("workspace_members").updateOne(
      { workspaceId, userId: targetUserId },
      { $set: { role: newRole } }
    )

    return NextResponse.json({ message: "Member role updated successfully" }, { status: 200 })

  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const targetUserId = searchParams.get("targetUserId")
    const workspaceId = params.workspaceId

    if (!userId || !targetUserId) {
      return NextResponse.json({ error: "userId and targetUserId are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user is admin
    const adminMember = await db.collection("workspace_members").findOne({
      workspaceId,
      userId,
      role: "admin"
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Remove member
    await db.collection("workspace_members").deleteOne({
      workspaceId,
      userId: targetUserId
    })

    return NextResponse.json({ message: "Member removed successfully" }, { status: 200 })

  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
