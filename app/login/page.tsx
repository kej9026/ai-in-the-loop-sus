"use client"

import { useState } from "react"
import { useAuth } from "@/components/nua/auth-provider"
import { Button } from "@/components/ui/button"
import { Archive, Sparkles, Film, Gamepad2, BookOpen } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      toast.error("로그인 시작에 실패했어요", { description: message })
    } finally {
      // 성공 케이스는 OAuth 리다이렉트가 발생하므로 보통 여기까지 오지 않습니다.
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-neon-purple/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-neon-purple/15 rounded-full blur-[128px] animate-pulse delay-1000" />
        
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
        <div className="absolute top-20 left-20 text-neon-purple/20 animate-float">
          <Film className="w-12 h-12" />
        </div>
        <div className="absolute top-32 right-32 text-neon-purple/15 animate-float-delayed">
          <Gamepad2 className="w-16 h-16" />
        </div>
        <div className="absolute bottom-32 left-32 text-neon-purple/15 animate-float">
          <BookOpen className="w-14 h-14" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-md px-6">
        {/* Logo and branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center shadow-lg shadow-neon-purple/20">
            <Archive className="w-8 h-8 text-neon-purple" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2 text-center text-balance">
          Niche Universe Archive
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12 text-balance leading-relaxed">
          Your personal media curation dashboard for movies, games, and books
        </p>

        {/* Login card */}
        <div className="w-full bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-neon-purple/5">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-4">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple font-medium">AI-Powered Curation</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your archive
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-14 bg-card hover:bg-card/80 border border-border hover:border-neon-purple/50 text-foreground font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10 group"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Google Icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Alternative actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 border-border hover:border-neon-purple/50 hover:bg-neon-purple/5 text-foreground rounded-xl transition-all bg-transparent"
            >
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-sm">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

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
