"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Crown, User, Eye, Edit, Trash2, Copy, CheckCircle, X, Users, ArrowLeft, Link as LinkIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

interface Member {
  userId: string
  name: string
  email: string
  role: string
  joinedAt: string
  invitedBy: string
}

interface Workspace {
  workspaceId: string
  name: string
  description: string
  role: string
}

export default function WorkspaceSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [invitationLink, setInvitationLink] = useState("")
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const workspaceId = params.workspaceId as string

  useEffect(() => {
    fetchWorkspaceData()
  }, [workspaceId])

  const fetchWorkspaceData = async () => {
    try {
      if (!user) {
        router.push("/")
        return
      }

      // Fetch workspace info
      const workspacesResponse = await fetch(`/api/workspaces?userId=${user.userId}`)
      const workspacesData = await workspacesResponse.json()

      if (workspacesResponse.ok) {
        const currentWorkspace = workspacesData.workspaces.find((w: any) => w.workspaceId === workspaceId)
        if (currentWorkspace) {
          setWorkspace(currentWorkspace)
        } else {
          router.push("/workspaces")
          return
        }
      }

      // Fetch members
      const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members?userId=${user.userId}`)
      const membersData = await membersResponse.json()

      if (membersResponse.ok) {
        setMembers(membersData.members)
      }
    } catch (error) {
      console.error("Error fetching workspace data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateInvitationLink = async () => {
    try {
      if (!user) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.userId }),
      })

      const data = await response.json()

      if (response.ok) {
        setInvitationLink(data.invitationLink)
        setShowInviteDialog(true)
      } else {
        toast({
          title: "Failed to generate invitation",
          description: data.error || "Unable to create invitation link. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating invitation link:", error)
      toast({
        title: "Failed to generate invitation",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const updateMemberRole = async (targetUserId: string, newRole: string) => {
    try {
      if (!user) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.userId, targetUserId, newRole }),
      })

      if (response.ok) {
        setMembers(prev => prev.map(member =>
          member.userId === targetUserId ? { ...member, role: newRole } : member
        ))
        toast({
          title: "Role updated",
          description: "Member role has been updated successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to update role",
          description: error.error || "Unable to update member role. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        title: "Failed to update role",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      if (!user) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/members?userId=${user.userId}&targetUserId=${targetUserId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.userId !== targetUserId))
        toast({
          title: "Member removed",
          description: "Member has been successfully removed from the workspace.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to remove member",
          description: error.error || "Unable to remove member. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Failed to remove member",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "read-write":
        return <Edit className="w-4 h-4 text-blue-500" />
      case "read-only":
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "read-write":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "read-only":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workspace || workspace.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need admin privileges to access workspace settings.</p>
          <Button onClick={() => router.push(`/workspace/${workspaceId}`)}>
            Back to Workspace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/workspace/${workspaceId}`)}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Workspace Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage {workspace.name} workspace members and permissions
            </p>
          </div>
        </div>

        {/* Invite Section */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Invite Members
            </CardTitle>
            <CardDescription>
              Generate an invitation link to add new members to your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateInvitationLink}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Generate Invitation Link
            </Button>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Workspace Members ({members.length})
            </CardTitle>
            <CardDescription>
              Manage member roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 gap-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {(member.name || member.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">
                        {member.name || member.email || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate whitespace-nowrap">
                        {member.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <Badge className={`${getRoleBadgeColor(member.role)} w-fit self-start sm:self-center truncate`}>
                      <div className="flex items-center gap-1 min-w-0">
                        {getRoleIcon(member.role)}
                        <span className="capitalize truncate">{member.role}</span>
                      </div>
                    </Badge>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateMemberRole(member.userId, value)}
                        disabled={member.userId === user?.userId}
                      >
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read-only">Read Only</SelectItem>
                          <SelectItem value="read-write">Read & Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      {member.userId !== user?.userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(member.userId)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invitation Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Invitation Link Generated</DialogTitle>
              <DialogDescription>
                Share this link with people you want to invite to the workspace. The link will expire in 24 hours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-link">Invitation Link</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="invite-link"
                    value={invitationLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowInviteDialog(false)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full sm:w-auto"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
