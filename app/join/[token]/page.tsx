"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Users, FileText } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"

export default function JoinWorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [workspace, setWorkspace] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const invitationToken = params.token as string

  useEffect(() => {
    console.log('Join page - received token:', invitationToken)

    const joinWorkspace = async () => {
      try {
        if (!user) {
          // Store the current URL to redirect back after login
          const currentUrl = window.location.href
          sessionStorage.setItem('redirectAfterLogin', currentUrl)
          router.push("/")
          return
        }

        console.log('Join page - userId from context:', user.userId)

        const response = await fetch("/api/workspaces/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitationToken,
            userId: user.userId
          }),
        })

        console.log('Join API call:', {
          invitationToken,
          userId: user.userId,
          responseStatus: response.status
        })

        const data = await response.json()
        console.log('Join API response:', data)

        if (response.ok) {
          setWorkspace(data.workspace)
          setStatus('success')
          // Clear the stored redirect URL since join was successful
          sessionStorage.removeItem('redirectAfterLogin')
          setTimeout(() => {
            router.push("/workspaces")
          }, 3000)
        } else {
          setError(data.error)
          setStatus('error')
        }
      } catch (error) {
        setError("Failed to join workspace")
        setStatus('error')
      }
    }

    if (invitationToken) {
      joinWorkspace()
    }
  }, [invitationToken, router, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join Workspace
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {status === 'loading' && "Processing your invitation..."}
            {status === 'success' && "Welcome to the workspace!"}
            {status === 'error' && "Unable to join workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Joining workspace...
              </p>
            </div>
          )}

          {status === 'success' && workspace && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {workspace.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {workspace.description || "A collaborative workspace for notes"}
                </p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Successfully joined! Redirecting...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
              <Button
                onClick={() => router.push("/workspaces")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Go to Workspaces
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
