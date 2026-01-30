"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function sessionToUser(session: Session | null): User | null {
  const u = session?.user
  if (!u) return null

  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const name =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.display_name === "string" && meta.display_name) ||
    (u.email ? u.email.split("@")[0] : "User")

  const avatar =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    undefined

  return {
    id: u.id,
    name,
    email: u.email ?? "",
    avatar,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    let isMounted = true

    // Initial session check
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setUser(sessionToUser(data.session ?? null))
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setUser(null)
        setIsLoading(false)
      })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = sessionToUser(session)
      setUser(currentUser)

      if (event === "SIGNED_OUT") {
        toast.info("로그아웃되었습니다.")
      } else if (event === "SIGNED_IN" && session?.user) {
        const checkAndCreateProfile = async () => {
          try {
            // Check if profile exists
            const { data, error } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .maybeSingle()

            if (!data) {
              // Profile doesn't exist, create one
              const { error: insertError } = await supabase.from("profiles").insert({
                id: session.user.id,
                email: session.user.email,
                display_name:
                  currentUser?.name || session.user.email?.split("@")[0],
                avatar_url: currentUser?.avatar,
              })

              if (insertError) {
                console.error("Failed to create profile:", insertError)
                toast.error("프로필 생성 중 오류가 발생했습니다.")
              } else {
                toast.success("환영합니다! 프로필이 생성되었습니다.")
              }
            }
          } catch (err) {
            console.error("Error checking/creating profile:", err)
          }
        }
        checkAndCreateProfile()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setIsLoading(false)
      toast.error("로그인에 실패했어요", {
        description: error.message,
      })
      throw error
    }
    // 정상 케이스는 곧바로 OAuth 리다이렉트가 발생하므로 여기서 로딩을 풀지 않습니다.
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
