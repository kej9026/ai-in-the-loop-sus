# NUA (Niche Universe Archive) 구현 로드맵
## Supabase SDK + Google OAuth 기반 실제 구현 계획

> **현재 상태**: Mock 인증/데이터 → **목표**: 실제 Supabase 연동 + Google OAuth

---

## 📋 현재 상태 분석

### ✅ 완료된 항목
- [x] UI 컴포넌트 (Dashboard, MediaCard, Modals 등)
- [x] Supabase 클라이언트 설정 (`src/lib/supabase.ts`)
- [x] 타입 정의 (`types/index.ts`)
- [x] DB 스키마 설계 (`database-policy.md`)
- [x] 시드 데이터 준비 (`docs/seed_data.sql`)
- [x] 환경 변수 설정 (`.env.local`)

### ❌ 미구현 항목
- [ ] 실제 Supabase Auth 연동
- [ ] Google OAuth 구현
- [ ] 프로필 자동 생성 로직
- [ ] Posts CRUD 작업 (Server Actions/API Routes)
- [ ] Mock 데이터 → 실제 DB 쿼리 교체
- [ ] 세션 관리 및 리다이렉트 로직

---

## 🎯 Phase 1: 인증 인프라 구축 (Day 1)

### Step 1.1: Supabase 프로젝트 설정 및 Google OAuth 활성화

**목표**: Supabase 대시보드에서 Google OAuth를 활성화하고 리다이렉트 URL 설정

**작업 내용**:
1. Supabase Dashboard → Authentication → Providers
2. Google Provider 활성화
   - Google OAuth Client ID/Secret 입력 (Google Cloud Console에서 발급)
   - Authorized redirect URLs 설정:
     - `http://localhost:3000/auth/callback` (개발)
     - `https://your-domain.com/auth/callback` (프로덕션)
3. Site URL 확인: `http://localhost:3000` (개발)

**체크리스트**:
- [ ] Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
- [ ] Supabase에 Google Provider 설정 완료
- [ ] 리다이렉트 URL 등록 완료

**참고 문서**:
- [Supabase Google OAuth 설정 가이드](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

### Step 1.2: `@supabase/ssr` 패키지 설치 (선택사항, 권장)

**목표**: Next.js App Router에서 서버/클라이언트 세션 동기화 최적화

**작업 내용**:
```bash
pnpm add @supabase/ssr
```

**이유**: 
- App Router에서 서버 컴포넌트와 클라이언트 컴포넌트 간 세션 공유 최적화
- 쿠키 기반 세션 관리로 SSR/CSR 일관성 보장

**체크리스트**:
- [ ] `@supabase/ssr` 설치 완료

---

### Step 1.3: Supabase 클라이언트 유틸리티 업데이트

**목표**: 서버/클라이언트 환경에 맞는 Supabase 클라이언트 생성 함수 구현

**파일**: `src/lib/supabase.ts` (기존 파일 업데이트)

**작업 내용**:
1. **서버 사이드 클라이언트** (Server Components, Server Actions용)
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'
   
   export async function createClient() {
     const cookieStore = await cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() { return cookieStore.getAll() },
           setAll(cookiesToSet) { /* ... */ }
         }
       }
     )
   }
   ```

2. **클라이언트 사이드 클라이언트** (기존 `createBrowserClient` 유지)
   - 브라우저에서 사용하는 클라이언트는 기존 코드 유지
   - 세션 자동 감지 및 리프레시 설정 확인

**체크리스트**:
- [ ] 서버 사이드 클라이언트 함수 구현
- [ ] 클라이언트 사이드 클라이언트 검증
- [ ] 환경 변수 로드 확인

---

### Step 1.4: OAuth 콜백 라우트 생성

**목표**: Google OAuth 인증 후 리다이렉트 처리

**파일**: `app/auth/callback/route.ts` (신규 생성)

**작업 내용**:
```typescript
import { createClient } from '@/src/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

**체크리스트**:
- [ ] `/auth/callback` 라우트 생성
- [ ] 코드 교환 로직 구현
- [ ] 리다이렉트 로직 테스트

---

### Step 1.5: AuthProvider 실제 구현으로 교체

**목표**: Mock 인증 시스템을 실제 Supabase Auth로 교체

**파일**: `components/nua/auth-provider.tsx` (기존 파일 수정)

**작업 내용**:
1. **Supabase 세션 감지 및 관리**
   ```typescript
   'use client'
   
   import { createBrowserClient } from '@/src/lib/supabase'
   import { useEffect, useState } from 'react'
   import type { User } from '@supabase/supabase-js'
   
   export function AuthProvider({ children }) {
     const [user, setUser] = useState<User | null>(null)
     const [isLoading, setIsLoading] = useState(true)
     const supabase = createBrowserClient()
     
     useEffect(() => {
       // 초기 세션 확인
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user ?? null)
         setIsLoading(false)
       })
       
       // 인증 상태 변경 리스너
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (_event, session) => {
           setUser(session?.user ?? null)
         }
       )
       
       return () => subscription.unsubscribe()
     }, [])
     
     // Google 로그인 함수
     const login = async () => {
       const { error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: `${window.location.origin}/auth/callback`,
         },
       })
       if (error) console.error('Login error:', error)
     }
     
     // 로그아웃 함수
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
   ```

2. **User 타입 매핑**
   - Supabase `User` 타입을 UI에서 사용하는 `User` 인터페이스로 변환
   - `user_metadata`에서 `display_name`, `avatar_url` 추출

**체크리스트**:
- [ ] Supabase 세션 감지 로직 구현
- [ ] `onAuthStateChange` 리스너 등록
- [ ] Google OAuth 로그인 함수 구현
- [ ] 로그아웃 함수 구현
- [ ] 타입 매핑 완료

---

### Step 1.6: 프로필 자동 생성 로직 (Database Trigger 또는 Server Action)

**목표**: Google OAuth 로그인 시 `profiles` 테이블에 자동으로 프로필 생성

**옵션 A: Database Trigger 사용 (권장)**
- **파일**: Supabase SQL Editor에서 실행
- **작업 내용**:
  ```sql
  -- auth.users 생성 시 profiles 자동 생성 트리거
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, display_name, email, avatar_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'display_name',
      NEW.email,
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

**옵션 B: Server Action 사용**
- **파일**: `app/actions/profile.ts` (신규 생성)
- **작업 내용**: 로그인 후 클라이언트에서 프로필 upsert 호출

**체크리스트**:
- [ ] Database Trigger 생성 또는 Server Action 구현
- [ ] 프로필 자동 생성 테스트
- [ ] 중복 생성 방지 로직 확인

---

### Step 1.7: 로그인 페이지 실제 연동

**목표**: `app/login/page.tsx`의 Google 로그인 버튼을 실제 OAuth로 연결

**파일**: `app/login/page.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
'use client'

import { useAuth } from '@/components/nua/auth-provider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    await login() // AuthProvider의 login 함수 호출
    // OAuth 리다이렉트가 발생하므로 여기서는 로딩만 표시
  }

  // ... 기존 UI 코드 유지
}
```

**체크리스트**:
- [ ] Google 로그인 버튼 클릭 시 실제 OAuth 플로우 시작
- [ ] 로딩 상태 표시
- [ ] 에러 처리 추가

---

## 🎯 Phase 2: 데이터 CRUD 구현 (Day 1-2)

### Step 2.1: Server Actions 생성 (Posts CRUD)

**목표**: Posts 테이블에 대한 Create, Read, Update, Delete 작업 구현

**파일**: `app/actions/posts.ts` (신규 생성)

**작업 내용**:
```typescript
'use server'

import { createClient } from '@/src/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { Post } from '@/types'
import { mediaItemToPostInsert, postToMediaItem } from '@/types'

// Read: 사용자의 모든 posts 조회 (최신순)
export async function getPosts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data?.map(postToMediaItem) ?? []
}

// Create: 새 post 생성
export async function createPost(item: Omit<MediaItem, 'id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const postData = mediaItemToPostInsert(user.id, {
    ...item,
    externalId: undefined,
    aiMetadata: {},
  })
  
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return postToMediaItem(data)
}

// Update: post 수정
export async function updatePost(id: string, updates: Partial<MediaItem>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // RLS로 인해 본인 post만 수정 가능
  const updateData: Partial<Post> = {}
  if (updates.title) updateData.title = updates.title
  if (updates.status) updateData.status = updates.status
  if (updates.rating !== undefined) updateData.rating = updates.rating
  // ... 기타 필드 매핑
  
  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/')
  return postToMediaItem(data)
}

// Delete: post 삭제
export async function deletePost(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
  revalidatePath('/')
}
```

**체크리스트**:
- [ ] `getPosts` 함수 구현 및 테스트
- [ ] `createPost` 함수 구현 및 테스트
- [ ] `updatePost` 함수 구현 및 테스트
- [ ] `deletePost` 함수 구현 및 테스트
- [ ] 에러 처리 추가
- [ ] 타입 안정성 확인

---

### Step 2.2: Dashboard Mock 데이터 교체

**목표**: `components/nua/dashboard.tsx`의 `mockMediaItems`를 실제 DB 쿼리로 교체

**파일**: `components/nua/dashboard.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getPosts } from '@/app/actions/posts'
import type { MediaItem } from '@/types'

export function Dashboard() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const posts = await getPosts()
      setMediaItems(posts)
    } catch (error) {
      console.error('Failed to load posts:', error)
      // 에러 토스트 표시
    } finally {
      setIsLoading(false)
    }
  }

  // ... 기존 UI 코드 유지
}
```

**체크리스트**:
- [ ] `useEffect`로 초기 데이터 로드
- [ ] 로딩 상태 표시
- [ ] 에러 처리 및 사용자 피드백
- [ ] 데이터 새로고침 로직 추가

---

### Step 2.3: MediaEntryModal 실제 저장 연동

**목표**: 새 미디어 엔트리 추가 시 실제 DB에 저장

**파일**: `components/nua/media-entry-modal.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
import { createPost } from '@/app/actions/posts'

export function MediaEntryModal({ open, onOpenChange }) {
  // ... 기존 상태 관리 코드

  const handleSubmit = async () => {
    if (!selectedMedia && !searchQuery) return

    try {
      setIsLoading(true)
      const newItem: Omit<MediaItem, 'id'> = {
        title: selectedMedia?.title || searchQuery,
        type: selectedMedia?.type || 'movie',
        posterUrl: '', // TODO: 외부 API에서 가져오기
        rating: rating,
        status: status as MediaStatus,
        moods: [], // TODO: AI 태깅 연동
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        oneLineReview: oneLineReview || undefined,
        detailedReview: detailedReview || undefined,
      }

      await createPost(newItem)
      onOpenChange(false)
      handleReset()
      // 성공 토스트 표시
    } catch (error) {
      console.error('Failed to create post:', error)
      // 에러 토스트 표시
    } finally {
      setIsLoading(false)
    }
  }

  // ... 기존 UI 코드
}
```

**체크리스트**:
- [ ] `createPost` Server Action 호출
- [ ] 폼 검증 로직 추가
- [ ] 성공/실패 피드백
- [ ] 모달 닫기 및 폼 리셋

---

### Step 2.4: MediaDetailModal 실제 업데이트 연동

**목표**: 미디어 엔트리 수정 시 실제 DB 업데이트

**파일**: `components/nua/media-detail-modal.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
import { updatePost, deletePost } from '@/app/actions/posts'

export function MediaDetailModal({ item, onUpdate }) {
  // ... 기존 상태 관리 코드

  const handleSave = async () => {
    if (!item) return

    try {
      setIsLoading(true)
      const updatedItem = await updatePost(item.id, {
        title: editTitle,
        status: editStatus,
        rating: editRating,
        startDate: editStartDate ? format(editStartDate, 'yyyy-MM-dd') : undefined,
        endDate: editEndDate ? format(editEndDate, 'yyyy-MM-dd') : undefined,
        oneLineReview: editOneLineReview,
        detailedReview: editDetailedReview,
      })
      
      onUpdate(updatedItem)
      setIsEditMode(false)
      // 성공 토스트 표시
    } catch (error) {
      console.error('Failed to update post:', error)
      // 에러 토스트 표시
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deletePost(item.id)
      onOpenChange(false)
      // 성공 토스트 표시
    } catch (error) {
      console.error('Failed to delete post:', error)
      // 에러 토스트 표시
    }
  }

  // ... 기존 UI 코드
}
```

**체크리스트**:
- [ ] `updatePost` Server Action 호출
- [ ] `deletePost` Server Action 호출
- [ ] 삭제 확인 다이얼로그 추가
- [ ] 성공/실패 피드백

---

## 🎯 Phase 3: 인증 보호 및 리다이렉트 (Day 1-2)

### Step 3.1: 미들웨어로 인증 보호

**목표**: 인증되지 않은 사용자의 보호된 페이지 접근 차단

**파일**: `middleware.ts` (루트에 신규 생성)

**작업 내용**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    request.cookies,
    request.headers
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 경로 목록
  const protectedPaths = ['/dashboard', '/archive']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // 인증되지 않은 사용자가 보호된 경로 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**체크리스트**:
- [ ] 미들웨어 파일 생성
- [ ] 보호된 경로 정의
- [ ] 인증 체크 로직 구현
- [ ] 리다이렉트 로직 테스트

---

### Step 3.2: 프로필 정보 표시 (TopBar)

**목표**: TopBar에 실제 유저 프로필 정보 표시

**파일**: `components/nua/top-bar.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
import { useAuth } from './auth-provider'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/src/lib/supabase'
import type { Profile } from '@/types'

export function TopBar({ onAddEntry }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!user) return

    // profiles 테이블에서 프로필 정보 가져오기
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data) setProfile(data)
      })
  }, [user])

  // ... 기존 UI 코드에서 profile 정보 사용
  // {profile?.display_name || user?.email}
  // {profile?.avatar_url || user?.user_metadata?.avatar_url}
}
```

**체크리스트**:
- [ ] 프로필 정보 로드 로직 추가
- [ ] 프로필 이미지 표시
- [ ] 폴백 처리 (프로필 없을 때)

---

## 🎯 Phase 4: 통계 및 필터링 (Day 2)

### Step 4.1: 통계 데이터 실제 계산

**목표**: Dashboard의 통계 카드에 실제 DB 데이터 기반 통계 표시

**파일**: `components/nua/dashboard.tsx` (기존 파일 수정)

**작업 내용**:
```typescript
// Server Action 추가: app/actions/stats.ts
export async function getStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { data, error } = await supabase
    .from('posts')
    .select('status, rating, created_at')
    .eq('user_id', user.id)
  
  if (error) throw error
  
  const total = data?.length ?? 0
  const thisMonth = data?.filter(post => {
    const created = new Date(post.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && 
           created.getFullYear() === now.getFullYear()
  }).length ?? 0
  const inProgress = data?.filter(p => p.status === 'in-progress').length ?? 0
  const avgRating = data?.length > 0
    ? data.reduce((sum, p) => sum + Number(p.rating), 0) / data.length
    : 0
  
  return { total, thisMonth, inProgress, avgRating }
}
```

**체크리스트**:
- [ ] 통계 계산 Server Action 생성
- [ ] Dashboard에서 통계 데이터 로드
- [ ] 로딩 상태 처리

---

### Step 4.2: 필터링 및 정렬 기능

**목표**: TopBar의 카테고리 필터와 검색 기능 실제 동작

**파일**: `components/nua/top-bar.tsx`, `components/nua/dashboard.tsx` (수정)

**작업 내용**:
```typescript
// Server Action: app/actions/posts.ts에 추가
export async function getPostsFiltered(filters: {
  mediaType?: MediaType
  status?: MediaStatus
  searchQuery?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  let query = supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
  
  if (filters.mediaType) {
    query = query.eq('media_type', filters.mediaType)
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters.searchQuery) {
    query = query.ilike('title', `%${filters.searchQuery}%`)
  }
  
  query = query.order('updated_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) throw error
  return data?.map(postToMediaItem) ?? []
}
```

**체크리스트**:
- [ ] 필터링 Server Action 구현
- [ ] TopBar 필터 상태 관리
- [ ] Dashboard에서 필터 적용
- [ ] 검색 기능 연동

---

## 🎯 Phase 5: 에러 처리 및 최적화 (Day 2-3)

### Step 5.1: 전역 에러 처리

**목표**: 인증 에러, 네트워크 에러 등 전역 처리

**작업 내용**:
- `app/error.tsx` 생성 (Next.js Error Boundary)
- Toast 알림 시스템 활용 (`sonner` 이미 설치됨)
- Server Action 에러 타입 정의

**체크리스트**:
- [ ] Error Boundary 구현
- [ ] Toast 알림 통합
- [ ] 에러 메시지 사용자 친화적으로 변환

---

### Step 5.2: 로딩 상태 및 최적화

**목표**: 사용자 경험 개선을 위한 로딩 상태 및 최적화

**작업 내용**:
- Suspense 경계 추가
- 낙관적 업데이트 (Optimistic Updates)
- 데이터 캐싱 전략

**체크리스트**:
- [ ] Suspense 경계 설정
- [ ] 로딩 스켈레톤 추가
- [ ] 낙관적 업데이트 구현

---

## 📝 구현 체크리스트 요약

### 인증 (Phase 1)
- [ ] Supabase Google OAuth 설정
- [ ] `@supabase/ssr` 설치 (선택)
- [ ] Supabase 클라이언트 유틸리티 업데이트
- [ ] OAuth 콜백 라우트 생성
- [ ] AuthProvider 실제 구현
- [ ] 프로필 자동 생성 로직
- [ ] 로그인 페이지 연동

### 데이터 CRUD (Phase 2)
- [ ] Posts Server Actions 생성
- [ ] Dashboard Mock 데이터 교체
- [ ] MediaEntryModal 저장 연동
- [ ] MediaDetailModal 업데이트 연동

### 보안 및 리다이렉트 (Phase 3)
- [ ] 미들웨어 인증 보호
- [ ] TopBar 프로필 정보 표시

### 통계 및 필터링 (Phase 4)
- [ ] 통계 데이터 실제 계산
- [ ] 필터링 및 정렬 기능

### 최적화 (Phase 5)
- [ ] 전역 에러 처리
- [ ] 로딩 상태 및 최적화

---

## 🔗 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [@supabase/ssr 문서](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## ⚠️ 주의사항

1. **환경 변수**: `.env.local`에 Supabase URL과 키가 올바르게 설정되어 있는지 확인
2. **RLS 정책**: 모든 테이블에 RLS가 활성화되어 있고 정책이 올바르게 설정되었는지 확인
3. **타입 안정성**: `types/index.ts`의 타입이 실제 DB 스키마와 일치하는지 확인
4. **에러 처리**: 모든 Server Action과 클라이언트 함수에 적절한 에러 처리가 있는지 확인
5. **보안**: 민감한 정보(서비스 롤 키 등)가 클라이언트에 노출되지 않도록 주의

---

**마지막 업데이트**: 2026-01-29
