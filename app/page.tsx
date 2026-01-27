"use client"

import { useAuth } from "@/components/nua/auth-provider"
import { Dashboard } from "@/components/nua/dashboard"
import { LandingPage } from "@/components/nua/landing-page"
import { Archive } from "lucide-react"

export default function Home() {
  const { user, isLoading } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center animate-pulse">
            <Archive className="w-8 h-8 text-neon-purple" />
          </div>
          <div className="w-6 h-6 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Show landing page if not logged in
  if (!user) {
    return <LandingPage />
  }

  // Show dashboard if logged in
  return <Dashboard />
}
