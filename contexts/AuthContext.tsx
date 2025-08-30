"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  userId: string
  email?: string
  name?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Remove initial loading state

  const login = (userData: User) => {
    setUser(userData)
    // Removed localStorage calls for better security
  }

  const logout = () => {
    setUser(null)
    // Removed localStorage calls for better security
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
