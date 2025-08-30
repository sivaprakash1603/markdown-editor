"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, CheckCircle } from "lucide-react"
import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"

export default function SignUpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Sign Up Success Animation Component
  const SignUpSuccessAnimation = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-green-200/50 dark:border-green-700/50 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-success-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Account Created!
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Welcome to your markdown editor...
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animate-delay-02"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animate-delay-04"></div>
          </div>
        </div>
      </div>
    </div>
  )

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Send request to the API route
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "email", email, password, confirmPassword, name }),
      })

      if (response.ok) {
        const data = await response.json()
        login({
          userId: data.userId,
          email: data.email,
          name: data.name,
        })
        setIsLoading(false)
        setShowSuccess(true)
        setTimeout(() => {
          router.push("/editor")
        }, 2000)
      } else {
        const errorText = await response.text()
        alert(errorText) // Handle error response from API
        setIsLoading(false)
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("An error occurred: " + error.message)
      } else {
        alert("An unknown error occurred")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-bounce-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-bounce-delayed"></div>
      </div>

      {showSuccess ? (
        <SignUpSuccessAnimation />
      ) : (
        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-2xl hover-lift">
            <CardHeader className="space-y-1 text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Join us to start creating amazing notes with AI enhancement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800">
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="google" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800">
                    Google
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="google" className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200 hover-lift"
                    disabled={isLoading}
                    onClick={async () => {
                      try {
                        setIsLoading(true)
                        const result = await signInWithPopup(auth, provider)
                        const user = result.user

                        // Check if user exists in MongoDB or create them
                        const checkResponse = await fetch("/api/check-user", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            userId: user.uid,
                            email: user.email,
                            name: user.displayName,
                          }),
                        })

                        if (checkResponse.ok) {
                          const userData = await checkResponse.json()
                          login({
                            userId: userData.userId,
                            email: userData.email,
                            name: userData.name,
                          })
                          setIsLoading(false)
                          setShowSuccess(true)
                          setTimeout(() => {
                            router.push("/editor")
                          }, 2000)
                        } else {
                          alert("Failed to create account")
                        }
                      } catch (error: any) {
                        alert("Google sign-in failed: " + error.message)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </div>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col pt-2">
              <div className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                  onClick={() => router.push("/")}
                >
                  Log in
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
