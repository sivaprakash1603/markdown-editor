"use client";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, FileText, Settings, Crown, User, Eye, Edit, Trash2, Copy, CheckCircle, ArrowLeft } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"

interface Workspace {
  workspaceId: string
  name: string
  description: string
  role: string
  createdAt: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  const fetchWorkspaces = async () => {
    try {
      if (!user) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/workspaces?userId=${user.userId}`)
      const data = await response.json()

      if (response.ok) {
        setWorkspaces(data.workspaces)
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkspace = async () => {
    if (!newWorkspace.name.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newWorkspace,
          userId: user?.userId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setWorkspaces(prev => [...prev, { ...data.workspace, role: "admin" }])
        setShowCreateDialog(false)
        setNewWorkspace({ name: "", description: "" })
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
      alert("Failed to create workspace")
    } finally {
      setIsCreating(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/editor")}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Editor</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Workspaces
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Collaborate on notes with your team
              </p>
            </div>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a shared workspace for collaborative note-taking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workspace name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your workspace"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createWorkspace}
                    disabled={isCreating || !newWorkspace.name.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first workspace to start collaborating on notes.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.workspaceId}
                className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl hover-lift cursor-pointer transition-all duration-200"
                onClick={() => router.push(`/workspace/${workspace.workspaceId}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workspace.name}</CardTitle>
                        <Badge className={`mt-1 ${getRoleBadgeColor(workspace.role)}`}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(workspace.role)}
                            <span className="capitalize">{workspace.role}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {workspace.description && (
                    <CardDescription className="mt-2">
                      {workspace.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/workspace/${workspace.workspaceId}/settings`)
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
