# NUA 기능별 데이터 흐름 구현 계획
## Fetching → Transformation → UI Binding 중심

> **현재 상태**: Mock 데이터/인증 → **목표**: 실제 Supabase 연동

---

## 📊 데이터 흐름 개요

```
[Supabase DB] 
  ↓ (RLS 정책 통과)
[Server Actions / API Routes]
  ↓ (타입 변환: Post → MediaItem)
[React State / Context]
  ↓ (UI 컴포넌트 렌더링)
[사용자 인터랙션]
  ↓ (폼 입력 → 타입 변환: MediaItem → Post)
[Server Actions]
  ↓ (Supabase Mutation)
[DB 업데이트]
  ↓ (revalidatePath / refetch)
[UI 자동 갱신]
```

---

## Phase 1: 인증 (Authentication)

### 1.1 Google OAuth 로그인 플로우

#### 최종 설정 검증 체크리스트 (Supabase Dashboard / Google Cloud Console)

> 아래 항목은 “코드가 맞아도 OAuth가 실패하는” 케이스를 거의 전부 커버합니다.

**A. Google Cloud Console**
- [ ] **OAuth 동의 화면(Consent Screen)** 설정 완료 (앱 이름, 지원 이메일 등)
- [ ] **OAuth Client (Web application)** 생성 완료
- [ ] **Authorized JavaScript origins**에 다음이 포함됨
  - [ ] `http://localhost:3000`
  - [ ] `https://<your-domain>` (배포 시)
- [ ] **Authorized redirect URIs**에 다음이 포함됨
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `https://<your-domain>/auth/callback` (배포 시)
- [ ] 테스트 단계라면 **테스트 사용자(Test users)**에 내 Google 계정 추가(동의 화면이 “테스트” 상태인 경우)

**B. Supabase Dashboard**
- [ ] Authentication → Providers → **Google 활성화**
- [ ] Google Provider에 **Client ID / Client Secret** 입력
- [ ] Authentication → URL Configuration
  - [ ] **Site URL** = `http://localhost:3000` (개발)
  - [ ] **Redirect URLs**에 포함
    - [ ] `http://localhost:3000/auth/callback`
    - [ ] `https://<your-domain>/auth/callback` (배포 시)
- [ ] (테스트) Authentication → Users 에서 로그인 후 유저가 생성되는지 확인

**C. 코드/환경 변수**
- [ ] `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [x] 클라이언트에서 OAuth 시작: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })`
- [x] 콜백에서 세션 교환: `/auth/callback` → `supabase.auth.exchangeCodeForSession(code)`
- [x] 로그인 에러 토스트 처리(사용자 피드백)

**데이터 흐름**:
```
사용자 클릭 (LoginPage)
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Google OAuth 리다이렉트
  → /auth/callback?code=xxx
  → supabase.auth.exchangeCodeForSession(code)
  → auth.users 테이블에 유저 생성
  → Session 생성 (쿠키 저장)
  → AuthProvider의 onAuthStateChange 트리거
  → user state 업데이트
  → app/page.tsx에서 user 확인
  → Dashboard 렌더링
```

**구현 위치**:
- `components/nua/auth-provider.tsx`: `login()` 함수
- `app/auth/callback/route.ts`: 콜백 처리
- `app/login/page.tsx`: 로그인 버튼 연결

**사용 기술**:
- **Supabase**: `supabase.auth.signInWithOAuth()`, `supabase.auth.exchangeCodeForSession()`
- **Next.js**: `route.ts` (API Route), `useRouter()`

**체크리스트**:
- [x] `signInWithOAuth` 호출 시 `redirectTo` 설정
- [x] 콜백 라우트에서 세션 교환 처리
- [x] 에러 처리 (OAuth 실패, 네트워크 에러)

---

### 1.2 세션 감지 및 상태 관리

**데이터 흐름**:
```
앱 마운트 (app/layout.tsx)
  → AuthProvider 초기화
  → supabase.auth.getSession() 호출
  → Session 존재 여부 확인
  → user state 설정 (있으면 User 객체, 없으면 null)
  → isLoading: false
  → onAuthStateChange 리스너 등록
  → 세션 변경 시 자동 업데이트
```

**구현 위치**:
- `components/nua/auth-provider.tsx`: `useEffect` 훅

**사용 기술**:
- **Supabase**: `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()`
- **React**: `useState`, `useEffect`, Context API

**체크리스트**:
- [x] 초기 로딩 상태 관리
- [x] 리스너 cleanup 함수 구현
- [x] 세션 만료 시 자동 로그아웃 처리

---

### 1.3 프로필 자동 생성 (Database Trigger)

**데이터 흐름**:
```
Google OAuth 성공
  → auth.users 테이블에 INSERT
  → Database Trigger 실행 (handle_new_user())
  → profiles 테이블에 INSERT
    - id: auth.users.id
    - display_name: raw_user_meta_data.display_name
    - email: auth.users.email
    - avatar_url: raw_user_meta_data.avatar_url
  → profiles 테이블에 레코드 생성 완료
```

**구현 위치**:
- Supabase SQL Editor: Database Trigger 생성

**사용 기술**:
- **PostgreSQL**: `CREATE TRIGGER`, `CREATE FUNCTION`
- **Supabase**: Database Functions

**체크리스트**:
- [x] Trigger 함수 생성 (`handle_new_user`)
- [x] `ON CONFLICT DO UPDATE` 로직 (중복 방지)
- [x] `SECURITY DEFINER` 권한 설정

---

### 1.4 프로필 정보 조회 및 표시

**데이터 흐름**:
```
AuthProvider에서 user 확인
  → user.id 추출
  → supabase.from('profiles').select('*').eq('id', user.id).single()
  → Profile 타입 데이터 반환
  → TopBar 컴포넌트에 전달
  → display_name, avatar_url 표시
```

**구현 위치**:
- `components/nua/top-bar.tsx`: `useEffect`로 프로필 로드
- `components/nua/auth-provider.tsx`: 프로필 Context 추가 (선택)

**사용 기술**:
- **Supabase**: `supabase.from('profiles').select().eq().single()`
- **React**: `useState`, `useEffect`

**체크리스트**:
- [x] 프로필 없을 때 폴백 처리 (user.email 사용)
- [x] 로딩 상태 표시
- [x] 에러 처리 (프로필 조회 실패)

---

### 1.5 로그아웃 플로우

**데이터 흐름**:
```
사용자 클릭 (TopBar 드롭다운)
  → logout() 함수 호출
  → supabase.auth.signOut()
  → Session 삭제 (쿠키 제거)
  → onAuthStateChange 이벤트 발생
  → user state: null로 업데이트
  → app/page.tsx에서 user === null 확인
  → LandingPage 렌더링
```

**구현 위치**:
- `components/nua/auth-provider.tsx`: `logout()` 함수
- `components/nua/top-bar.tsx`: 로그아웃 버튼 연결

**사용 기술**:
- **Supabase**: `supabase.auth.signOut()`
- **React**: Context 업데이트

**체크리스트**:
- [ ] 로그아웃 후 리다이렉트 처리
- [ ] 로컬 상태 초기화

---

## Phase 2: 코어 로직 (Core Features)

### 2.1 Posts 리스트 조회 (Dashboard)

**데이터 흐름**:
```
Dashboard 마운트
  → getPosts() Server Action 호출
  → Server: supabase.from('posts').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
  → RLS 정책 확인 (auth.uid() = user_id)
  → Post[] 타입 데이터 반환
  → postToMediaItem() 변환 함수로 MediaItem[] 변환
  → Dashboard state 업데이트 (setMediaItems)
  → MediaCard 컴포넌트들 렌더링
```

**구현 위치**:
- `app/actions/posts.ts`: `getPosts()` Server Action
- `components/nua/dashboard.tsx`: `useEffect`로 데이터 로드

**사용 기술**:
- **Supabase**: `supabase.from('posts').select().eq().order()`
- **Next.js**: Server Actions (`'use server'`)
- **타입 변환**: `postToMediaItem()` (types/index.ts)

**체크리스트**:
- [x] 인증 확인 (`getUser()`)
- [x] RLS 정책 테스트 (다른 유저 데이터 접근 불가)
- [x] 빈 배열 처리
- [x] 에러 처리 및 사용자 피드백

---

### 2.2 Post 생성 (MediaEntryModal)

**데이터 흐름**:
```
사용자 폼 입력 (MediaEntryModal)
  → title, type, status, rating, dates, reviews 입력
  → "Add to Archive" 버튼 클릭
  → MediaItem 형태로 데이터 수집
  → createPost(item) Server Action 호출
  → Server: mediaItemToPostInsert()로 Post 타입 변환
  → Server: supabase.from('posts').insert(postData)
  → RLS 정책 확인 (auth.uid() = user_id)
  → DB에 INSERT
  → 반환된 Post 데이터를 postToMediaItem()로 변환
  → revalidatePath('/') 호출
  → Dashboard 자동 리렌더링
  → 새로 생성된 post가 리스트 상단에 표시
```

**구현 위치**:
- `app/actions/posts.ts`: `createPost()` Server Action
- `components/nua/media-entry-modal.tsx`: 폼 제출 핸들러

**사용 기술**:
- **Supabase**: `supabase.from('posts').insert()`
- **Next.js**: Server Actions, `revalidatePath()`
- **타입 변환**: `mediaItemToPostInsert()`, `postToMediaItem()`

**체크리스트**:
- [x] 필수 필드 검증 (title, media_type, status)
- [x] 날짜 유효성 검사 (end_date >= start_date)
- [x] 에러 처리 (중복, 제약 조건 위반)
- [x] 성공 토스트 알림
- [x] 모달 닫기 및 폼 리셋

---

### 2.3 Post 수정 (MediaDetailModal)

**데이터 흐름**:
```
사용자 "Edit Entry" 클릭
  → MediaDetailModal의 edit 모드 활성화
  → 폼 필드에 기존 데이터 로드
  → 사용자 수정 (title, status, rating, dates, reviews)
  → "Save Changes" 클릭
  → updatePost(id, updates) Server Action 호출
  → Server: Partial<Post> 형태로 업데이트 데이터 구성
  → Server: supabase.from('posts').update(updateData).eq('id', id).eq('user_id', user.id)
  → RLS 정책 확인 (본인 post만 수정 가능)
  → DB에 UPDATE
  → 반환된 Post를 postToMediaItem()로 변환
  → revalidatePath('/') 호출
  → Dashboard의 handleUpdateItem() 호출
  → mediaItems state 업데이트
  → MediaCard 리렌더링 (수정된 데이터 반영)
```

**구현 위치**:
- `app/actions/posts.ts`: `updatePost()` Server Action
- `components/nua/media-detail-modal.tsx`: `handleSave()` 함수

**사용 기술**:
- **Supabase**: `supabase.from('posts').update().eq()`
- **Next.js**: Server Actions, `revalidatePath()`
- **타입 변환**: `postToMediaItem()`

**체크리스트**:
- [x] 부분 업데이트 지원 (Partial<Post>)
- [x] 이중 체크 (id + user_id)로 보안 강화
- [x] 날짜 유효성 검사
- [x] 낙관적 업데이트 (선택사항)
- [x] 에러 처리 및 롤백

---

### 2.4 Post 삭제 (MediaDetailModal)

**데이터 흐름**:
```
사용자 "Delete" 클릭 (또는 삭제 버튼)
  → 확인 다이얼로그 표시
  → 확인 시 deletePost(id) Server Action 호출
  → Server: supabase.from('posts').delete().eq('id', id).eq('user_id', user.id)
  → RLS 정책 확인 (본인 post만 삭제 가능)
  → DB에서 DELETE
  → revalidatePath('/') 호출
  → Dashboard의 mediaItems에서 해당 항목 제거
  → MediaCard 제거 (UI에서 사라짐)
```

**구현 위치**:
- `app/actions/posts.ts`: `deletePost()` Server Action
- `components/nua/media-detail-modal.tsx`: 삭제 핸들러

**사용 기술**:
- **Supabase**: `supabase.from('posts').delete().eq()`
- **Next.js**: Server Actions, `revalidatePath()`

**체크리스트**:
- [x] 삭제 확인 다이얼로그
- [x] 이중 체크 (id + user_id)
- [x] 에러 처리 (삭제 실패 시)
- [x] 성공 피드백

---

### 2.5 통계 데이터 계산 (Dashboard Stats)

**데이터 흐름**:
```
Dashboard 마운트
  → getStats() Server Action 호출
  → Server: supabase.from('posts').select('status, rating, created_at').eq('user_id', user.id)
  → 모든 posts 데이터 가져오기
  → 클라이언트에서 집계:
    - total: posts.length
    - thisMonth: created_at이 이번 달인 것들 필터링
    - inProgress: status === 'in-progress' 필터링
    - avgRating: rating 평균 계산
  → Stats 객체 반환
  → Dashboard의 stats state 업데이트
  → Stats Grid 컴포넌트 렌더링
```

**구현 위치**:
- `app/actions/stats.ts`: `getStats()` Server Action (신규 생성)
- `components/nua/dashboard.tsx`: 통계 데이터 로드

**사용 기술**:
- **Supabase**: `supabase.from('posts').select()`
- **Next.js**: Server Actions
- **JavaScript**: 배열 메서드 (`filter`, `reduce`)

**체크리스트**:
- [x] 집계 로직 정확성 검증
- [x] 빈 데이터 처리 (0으로 표시)
- [x] 평점 소수점 처리 (toFixed)
- [x] 성능 최적화 (필요 시 DB 집계 함수 사용)

---

### 2.6 필터링 및 검색 (TopBar)

**데이터 흐름**:
```
사용자 카테고리 선택 (TopBar)
  → activeCategory state 업데이트 ('all' | 'movie' | 'game' | 'book')
  → 검색어 입력 (searchQuery state)
  → getPostsFiltered({ mediaType, searchQuery }) Server Action 호출
  → Server: supabase.from('posts').select('*').eq('user_id', user.id)
  → 조건부 필터링:
    - mediaType 있으면: .eq('media_type', mediaType)
    - searchQuery 있으면: .ilike('title', `%${searchQuery}%`)
  → .order('updated_at', { ascending: false })
  → Post[] 반환 → postToMediaItem() 변환
  → Dashboard의 mediaItems state 업데이트
  → 필터링된 MediaCard들만 렌더링
```

**구현 위치**:
- `app/actions/posts.ts`: `getPostsFiltered()` Server Action
- `components/nua/top-bar.tsx`: 필터 상태 관리
- `components/nua/dashboard.tsx`: 필터 적용

**사용 기술**:
- **Supabase**: `.eq()`, `.ilike()` (대소문자 무시 LIKE)
- **Next.js**: Server Actions
- **React**: 상태 관리 (`useState`)

**체크리스트**:
- [x] 실시간 검색 (debounce 적용 권장)
- [x] 빈 검색 결과 처리
- [x] 필터 조합 지원 (카테고리 + 검색어)
- [x] URL 쿼리 파라미터 동기화 (선택사항)

---

## Phase 3: 고급 기능 (Advanced Features)

### 3.1 외부 미디어 검색 (External Search Integration)

**데이터 흐름**:
```
MediaEntryModal 열기
  → 검색어 입력 ("인셉션")
  → searchExternalMedia(query, type) Server Action 호출
  → Server: 선택된 타입에 따라 외부 API 분기
    - Movie: TMDB API (/search/movie)
    - Game: RAWG API (/games)
    - Book: Google Books API (/volumes)
  → 결과 매핑: 공통 포맷 { id, title, poster, date, overview }으로 변환
  → 클라이언트: 검색 결과 리스트(카드 위젯) 표시
  → 사용자 클릭
  → 선택된 데이터로 폼(Title, Date, ImageUrl) 자동 채움
```

**구현 위치**:
- `app/actions/external-search.ts`: 통합 검색 핸들러 (신규 생성)
- `components/nua/media-entry-modal.tsx`: 검색 UI 연동

**사용 기술**:
- **Fetch API**: 외부 REST API 호출
- **API Keys**: `TMDB_API_KEY`, `RAWG_API_KEY`, `GOOGLE_BOOKS_API_KEY`

**체크리스트**:
- [x] TMDB 연동 (영화)
- [x] RAWG 연동 (게임)
- [x] Google Books 연동 (도서)
- [x] 공통 데이터 포맷 정의 및 매핑
- [x] 에러 처리 및 Fallback 이미지

---

### 3.2 AI 태깅 연동 (Gemini API)

**데이터 흐름**:
```
사용자가 미디어 선택 (External Search 후)
  → generateAITags(title, overview) Server Action 호출
  → Server: Gemini API 호출
    - 프롬프트: "이 작품의 분위기(Moods) 5개와 테마 컬러코드를 추천해줘."
    - 응답: JSON { moods: [], themeColor: '' }
  → 클라이언트: 응답 수신 후 Tags 필드 자동 채움
  → 사용자: 한줄평 및 상세 리뷰 직접 작성
```

**구현 위치**:
- `app/actions/ai.ts`: `generateAITags()` (신규 생성)
- `components/nua/media-entry-modal.tsx`: AI 트리거 및 태그 반영

**사용 기술**:
- **Gemini API**: `@google/generative-ai`
- **Next.js**: Server Actions

**체크리스트**:
- [x] Gemini API 연결 테스트
- [x] 프롬프트 최적화 (태그만 생성)
- [x] 에러 처리

---

### 3.3 상태 변경 시 자동 날짜 업데이트

**데이터 흐름**:
```
사용자가 status를 'completed'로 변경
  → updatePost() Server Action 호출
  → Server: status === 'completed' 확인
  → end_date가 null이면 현재 날짜로 설정
  → supabase.from('posts').update({ status, end_date: today })
  → DB 업데이트
  → 반환된 Post에 end_date 포함
  → UI에 완료 날짜 표시
```

**구현 위치**:
- `app/actions/posts.ts`: `updatePost()` 함수 내부

**사용 기술**:
- **Supabase**: 조건부 업데이트
- **JavaScript**: 날짜 처리 (`new Date().toISOString().split('T')[0]`)

**체크리스트**:
- [x] 상태 변경 감지 로직
- [x] end_date 자동 설정
- [x] 기존 end_date 보존 (덮어쓰기 방지)

---

### 3.4 실시간 업데이트 (Supabase Realtime, 선택사항)

**데이터 흐름**:
```
다른 탭/기기에서 post 생성/수정/삭제
  → Supabase Realtime 이벤트 발생
  → 클라이언트: supabase.channel('posts').on('postgres_changes', ...)
  → 이벤트 리스너 트리거
  → Dashboard의 mediaItems state 업데이트
  → UI 자동 갱신 (Server Action 호출 없이)
```

**구현 위치**:
- `components/nua/dashboard.tsx`: Realtime 구독

**사용 기술**:
- **Supabase**: Realtime (`supabase.channel().on()`)
- **React**: `useEffect` cleanup

**체크리스트**:
- [x] Realtime 활성화 (Supabase Dashboard)
- [x] 채널 구독 및 cleanup
- [x] 이벤트 타입 처리 (INSERT, UPDATE, DELETE)

---


---

## 📋 구현 우선순위 요약

### Phase 1: 인증 (필수)
1. ✅ **1.1 Google OAuth 로그인** - 가장 먼저 구현
2. ✅ **1.2 세션 감지** - 앱 동작의 기반
3. ✅ **1.3 프로필 자동 생성** - 사용자 경험 개선
4. ✅ **1.4 프로필 정보 표시** - UI 완성도
5. ✅ **1.5 로그아웃** - 기본 기능

### Phase 2: 코어 로직 (필수)
6. ✅ **2.1 Posts 리스트 조회** - 핵심 기능
7. ✅ **2.2 Post 생성** - 핵심 기능
8. ✅ **2.3 Post 수정** - 핵심 기능
9. ✅ **2.4 Post 삭제** - 핵심 기능
10. ✅ **2.5 통계 데이터** - 대시보드 완성도
11. ✅ **2.6 필터링 및 검색** - 사용성 개선

### Phase 3: 고급 기능 (선택 -> 진행 중)
12. ⚪ **3.1 외부 미디어 검색** - 데이터 정확성 향상 (통합 구현 예정)
13. ⚪ **3.2 AI 태깅** - 사용자 편의성
14. ⚪ **3.3 상태 변경 시 자동 날짜 업데이트** - 고급 기능
15. ⚪ **3.4 실시간 업데이트** - 고급 기능

---

## 🔧 공통 구현 패턴

### Server Action 기본 구조
```typescript
'use server'

import { createClient } from '@/src/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function actionName(params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // Supabase 쿼리
  const { data, error } = await supabase.from('table')....
  
  if (error) throw error
  
  revalidatePath('/')
  return data
}
```

### 클라이언트 데이터 로드 패턴
```typescript
'use client'

import { useEffect, useState } from 'react'
import { actionName } from '@/app/actions/...'

export function Component() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const result = await actionName()
      setData(result)
    } catch (error) {
      console.error(error)
      // 에러 처리
    } finally {
      setIsLoading(false)
    }
  }

  // UI 렌더링
}
```

---

## ⚠️ 주의사항

1. **RLS 정책**: 모든 쿼리는 RLS를 통과해야 함. `auth.uid()` 확인 필수
2. **타입 변환**: DB의 `Post` 타입과 UI의 `MediaItem` 타입 변환 함수 활용
3. **에러 처리**: 모든 Server Action과 클라이언트 함수에 try-catch 추가
4. **로딩 상태**: 사용자 경험을 위해 로딩 상태 표시 필수
5. **revalidatePath**: 데이터 변경 후 관련 페이지 재검증 필요

---

**마지막 업데이트**: 2026-01-29
