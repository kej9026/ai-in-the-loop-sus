# Database Policy (Supabase) — NUA (Niche Universe Archive)

이 문서는 **현재 코드(UI 컴포넌트)**와 `prd.md`를 기반으로, Supabase(Postgres)에서 **실제 UI 렌더링에 필요한 최소/최적 스키마**와 **RLS(Row Level Security) 정책**, 그리고 **Supabase 설정 절차**를 정리한 가이드입니다.

> 우선순위: **PRD보다 현재 UI 컴포넌트가 요구하는 데이터 형식**을 최우선으로 반영합니다.

---

## 1) 코드 기반 데이터 요구사항 (UI가 실제로 사용하는 필드)

현재 `components/nua/*` UI는 `MediaItem` 형태의 데이터를 렌더링합니다.

### 1.1 엔트리(아카이브 아이템) — 카드/리스트/상세모달 공통

- **식별자**: `id`
- **제목**: `title`
- **매체 타입**: `type = "movie" | "game" | "book"`
- **포스터/이미지 URL**: `posterUrl`
- **평점**: `rating` (0.5 단위 지원)
- **상태**: `status = "wishlist" | "in-progress" | "completed"`
  - 중요: UI는 `in-progress`(하이픈)를 사용합니다. DB enum/체크도 **동일 문자열**로 맞춥니다.
- **태그/칩**: `moods: string[]`
  - 카드에서는 최대 3개 노출, 상세에서는 전체 노출
- **기간 바**: `startDate`, `endDate` (문자열 날짜)
  - 카드에서 진행률/기간 바 렌더링에 사용
- **리뷰**: `oneLineReview`, `detailedReview`

관련 파일:
- `components/nua/media-card.tsx`
- `components/nua/media-detail-modal.tsx`
- `components/nua/dashboard.tsx`

### 1.2 유저 정보 — TopBar/드롭다운 표시

- `id`, `name`, `email`, `avatar?`

관련 파일:
- `components/nua/auth-provider.tsx`
- `components/nua/top-bar.tsx`

---

## 2) PRD 병합 시 요구사항 (추가/보완)

`prd.md`에서 DB/로직으로 요구되는 요소:

- **정렬 우선순위**: 최근 활동 리스트는 `updated_at DESC`
- **필수 항목(권장)**: `title`, `media_type`, `external_id`, `start_date`
  - 현재 UI 폼에는 `external_id` 입력/검색 연동이 아직 없으므로 DB에서는 **nullable로 시작**하고 추후 강화합니다.
- **AI 메타데이터 저장**: `ai_metadata JSONB`
  - 태그, 요약, 분위기/테마 등 확장 가능
- **이미지 관리**: Phase 2에서 Supabase Storage 언급(향후 `poster_url`이 Storage URL이 될 수 있음)

---

## 3) 최종 테이블 설계 (Supabase / Postgres)

이번 프로젝트에서는 PRD의 `media_items`를 UI 관점에서 `posts`(아카이브 엔트리)로 정의합니다.

### 3.1 `public.profiles`

Supabase Auth의 `auth.users`와 1:1로 매핑되는 프로필 테이블입니다.

- **PK/FK**: `id uuid` → `auth.users(id)` 참조 (on delete cascade)
- **UI 표시용**: `display_name`, `email`, `avatar_url`
- **운영 확장**: `role` (PRD에는 없지만 코드/운영에서 자주 필요)
- **타임스탬프**: `created_at`, `updated_at`

### 3.2 `public.posts` (아카이브 엔트리)

현재 UI 카드/상세모달이 바로 렌더링 가능하도록 필요한 필드를 모두 포함합니다.

- **소유자 FK**: `user_id uuid` → `auth.users(id)` (on delete cascade)
- **콘텐츠/분류**: `title`, `media_type`, `status`
- **이미지**: `poster_url`
- **평점**: `rating numeric(2,1)` (0~5)
- **태그**: `moods text[]`
- **기간**: `start_date`, `end_date` (+ `end_date >= start_date` 체크)
- **리뷰**: `one_line_review`, `detailed_review`
- **외부 연동 대비**: `external_id` (nullable)
- **AI 확장**: `ai_metadata jsonb`
- **정렬/활동**: `created_at`, `updated_at`

권장 인덱스:
- `(user_id, updated_at desc)` — “Recent Activity” 최적화
- `(user_id, start_date asc)` — 달력/타임라인 정렬 대비

---

## 4) RLS (Row Level Security) 정책 요약

### 4.1 `profiles` 정책

- **Select(조회)**: 본인 프로필만 조회 가능
- **Update(수정)**: 본인 프로필만 수정 가능
- **Insert(생성)**: 본인 id로만 생성 가능 (클라이언트 upsert 패턴 대비)

### 4.2 `posts` 정책

`user_id = auth.uid()`인 행만 접근 가능하도록 제한합니다.

- **Select**: 본인 글만 조회
- **Insert**: 본인 `user_id`로만 삽입
- **Update**: 본인 글만 수정
- **Delete**: 본인 글만 삭제

> 참고: 공유 기능(공개 대시보드/공유 링크 등)이 필요해지면 `is_public` 같은 플래그와 별도 정책을 추가하는 방식이 안전합니다.

---

## 5) Supabase SQL Editor 적용용 SQL (CREATE TABLE + RLS)

아래 SQL은 Supabase SQL Editor에 **그대로 복사/실행**할 수 있습니다.

```sql
create extension if not exists "pgcrypto";

-- =========================
-- profiles
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =========================
-- posts (archive entries)
-- =========================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  media_type text not null check (media_type in ('movie','game','book')),
  status text not null check (status in ('wishlist','in-progress','completed')),

  poster_url text,
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),

  moods text[] not null default '{}',

  start_date date,
  end_date date,
  constraint posts_date_range_chk
    check (end_date is null or start_date is null or end_date >= start_date),

  one_line_review text,
  detailed_review text,

  external_id text,
  ai_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_updated_at_idx
on public.posts (user_id, updated_at desc);

create index if not exists posts_user_start_date_idx
on public.posts (user_id, start_date asc);

alter table public.posts enable row level security;

create policy "posts_select_own"
on public.posts
for select
using (auth.uid() = user_id);

create policy "posts_insert_own"
on public.posts
for insert
with check (auth.uid() = user_id);

create policy "posts_update_own"
on public.posts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "posts_delete_own"
on public.posts
for delete
using (auth.uid() = user_id);

drop trigger if exists trg_posts_set_updated_at on public.posts;
create trigger trg_posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();
```

---

## 6) Supabase 설정 단계별 가이드 (체크리스트)

### 6.1 Supabase 프로젝트 생성/연결

- Supabase에서 새 프로젝트 생성
- 프로젝트 Settings에서 **Database**와 **API 키** 확인
- (Next.js 연동 시) 환경 변수 준비
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (서버에서 관리 필요 시) `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경에서만 사용

### 6.2 SQL 적용 (권장 순서)

- Supabase → SQL Editor
- 본 문서의 **SQL 블록 전체**를 그대로 실행
  - `profiles`, `posts` 테이블 생성
  - `set_updated_at()` 트리거 함수 생성
  - RLS 활성화 및 정책 생성
  - 인덱스 생성

### 6.3 RLS 동작 점검

- Table Editor에서 `posts`에 테스트 데이터 삽입 시도
  - **로그인 상태(특정 유저)**로는 본인 row만 보이는지 확인
  - 다른 유저로 로그인하면 기존 row가 보이지 않는지 확인

### 6.4 (선택) `profiles` 자동 생성 전략

현재는 `profiles_insert_own` 정책만 제공하며, 아래 중 하나를 선택할 수 있습니다.

- **옵션 A: 클라이언트/서버에서 로그인 후 `profiles` upsert**
  - 장점: 단순, 디버깅 쉬움
- **옵션 B: DB 트리거로 `auth.users` 생성 시 `profiles` 자동 생성**
  - 장점: 누락 방지
  - 단점: 트리거/권한 설계가 추가로 필요

### 6.5 데이터 모델 사용 규칙(권장)

- `status`는 반드시 `wishlist | in-progress | completed` 중 하나로 저장 (UI와 1:1)
- `rating`은 \(0 \le rating \le 5\) 범위 유지 (0.5 단위는 애플리케이션에서 보장)
- `end_date`는 `start_date`보다 과거가 되지 않도록 유지 (DB CHECK + 프론트 검증 병행)
- `poster_url`은 초기에는 외부 URL(또는 placeholder)로 시작하고, Phase 2에서 Storage URL로 전환 가능

---

## 7) 타입/코드 동기화

- `types/index.ts`에 DB/UI 타입 및 매핑 유틸이 준비되어 있습니다.
  - `Profile`, `Post` (DB 스키마 기준)
  - `MediaItem` (현재 UI 기준)
  - `postToMediaItem()`, `mediaItemToPostInsert()`

> 현재 코드베이스에는 Supabase 연동 코드가 없으므로, 이후 단계에서 CRUD 연결 시 `mockMediaItems`를 `posts` 쿼리 결과로 교체하는 작업이 필요합니다.

