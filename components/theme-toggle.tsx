"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover-lift rounded-full"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-yellow-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 ${
            theme === "light" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Sun className="h-4 w-4 mr-2 text-yellow-500" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 ${
            theme === "dark" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Moon className="h-4 w-4 mr-2 text-blue-400" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 ${
            theme === "system" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <div className="h-4 w-4 mr-2 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
