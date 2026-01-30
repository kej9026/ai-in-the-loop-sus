import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { Dashboard } from "@/components/nua/dashboard"
import { LandingPage } from "@/components/nua/landing-page"
import { getPosts } from "@/app/actions/posts"

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Initial data fetch on server (Fetch only 5 recent items)
  const { items, total } = await getPosts(undefined, undefined, 1, 5)

  return <Dashboard initialItems={items} initialTotal={total} />
}
