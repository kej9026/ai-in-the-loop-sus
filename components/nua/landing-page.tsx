"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { toast } from "sonner"
import { 
  Archive, 
  Sparkles, 
  Film, 
  Gamepad2, 
  BookOpen, 
  Star,
  BarChart3,
  Brain,
  ArrowRight
} from "lucide-react"

export function LandingPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      toast.error("로그인 시작에 실패했어요", { description: message })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-neon-purple/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-neon-purple/15 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[200px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Floating icons */}
        <div className="absolute top-20 left-[10%] text-neon-purple/20 animate-float">
          <Film className="w-12 h-12" />
        </div>
        <div className="absolute top-32 right-[15%] text-neon-purple/15 animate-float-delayed">
          <Gamepad2 className="w-16 h-16" />
        </div>
        <div className="absolute bottom-40 left-[15%] text-neon-purple/15 animate-float">
          <BookOpen className="w-14 h-14" />
        </div>
        <div className="absolute bottom-32 right-[10%] text-neon-purple/10 animate-float-delayed">
          <Star className="w-10 h-10" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center">
            <Archive className="w-5 h-5 text-neon-purple" />
          </div>
          <span className="text-lg font-semibold text-foreground">NUA</span>
        </div>
        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
          className="border-border hover:border-neon-purple/50 hover:bg-neon-purple/5 text-foreground bg-transparent"
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-8">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-neon-purple font-medium">AI-Powered Media Curation</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-6 text-balance leading-tight">
            Your Personal
            <span className="block text-neon-purple">Media Universe</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            Track, rate, and curate your favorite movies, games, and books. 
            Let AI analyze your taste and discover hidden gems in your niche universe.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              size="lg"
              className="h-14 px-8 bg-neon-purple hover:bg-neon-purple-dim text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-neon-purple/25 hover:shadow-xl hover:shadow-neon-purple/30 group"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Google Icon */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Login with Google</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 text-left hover:border-neon-purple/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-neon-purple" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track Everything</h3>
              <p className="text-sm text-muted-foreground">
                Movies, games, books - all in one beautiful dashboard with ratings and progress.
              </p>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 text-left hover:border-neon-purple/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Gemini-powered insights generate mood tags and summaries automatically.
              </p>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 text-left hover:border-neon-purple/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-neon-purple" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Rich Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Half-star ratings, Korean one-liners, and detailed reviews for your archive.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Built for thriller and noir fans with a passion for curation
        </p>
      </footer>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        :global(.animate-float) {
          animation: float 6s ease-in-out infinite;
        }
        :global(.animate-float-delayed) {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
