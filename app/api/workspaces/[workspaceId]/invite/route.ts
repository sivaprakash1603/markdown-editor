// /app/api/workspaces/[workspaceId]/invite/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = await request.json()
    const workspaceId = params.workspaceId

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if workspace exists and user is admin
    const workspace = await db.collection("workspaces").findOne({ workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const member = await db.collection("workspace_members").findOne({
      workspaceId,
      userId,
      role: "admin"
    })

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Generate invitation link
    const invitationToken = `${workspaceId}-${workspace.invitationCode}-${Date.now()}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      invitationLink: `${baseUrl}/join/${invitationToken}`,
      invitationCode: workspace.invitationCode
    }, { status: 200 })

  } catch (error) {
    console.error("Error generating invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
