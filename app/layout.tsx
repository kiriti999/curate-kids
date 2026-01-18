import React from 'react'
import { ThemeProvider } from "@/components/ThemeProvider"
import './globals.css'

export const metadata = {
  title: 'CurateKids',
  description: 'Curated videos for young learners',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
