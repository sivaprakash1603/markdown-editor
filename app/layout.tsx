import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTheme } from "next-themes"
import { useEffect } from "react";
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Markdown Editor",
  description: "A modern markdown editor with AI enhancement",
  author: "Sivaprakash Senthilnathan",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
