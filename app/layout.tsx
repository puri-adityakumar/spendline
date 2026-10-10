import type { Metadata } from "next"
import { Geist_Mono, Manrope, MuseoModerno } from "next/font/google"
import type { ReactNode } from "react"

import { Providers } from "@/components/providers"
import { SiteHeader } from "@/components/site-header"

import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const museo = MuseoModerno({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-museo-moderno",
})

export const metadata: Metadata = {
  title: "Spendline",
  description: "Team token ledger for a five-person fixture.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${geistMono.variable} ${museo.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>
          <div className="flex min-h-dvh flex-col bg-background">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <footer className="border-t px-4 py-4 text-xs text-muted-foreground sm:px-6">
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <span>Team token ledger</span>
                <span>Fixture screens</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
