-- ============================================
-- NUA (Niche Universe Archive) Seed Data
-- ============================================
-- 이 SQL은 Supabase 초기 데이터 세팅을 위한 샘플 데이터입니다.
-- 
-- 주의사항:
-- 1. 이 SQL은 테스트/개발 환경 전용입니다. 프로덕션에서는 사용하지 마세요.
-- 2. auth.users에 직접 삽입하는 것은 Supabase의 권장 방식이 아닙니다.
--    실제 사용 시에는 Supabase Auth를 통해 유저를 생성한 후,
--    해당 유저의 id를 사용하여 profiles를 생성해야 합니다.
-- 3. ON CONFLICT DO NOTHING을 사용하여 중복 실행 시 안전하게 처리됩니다.
-- ============================================

-- ============================================
-- 0. Auth Users (테스트용 가짜 유저 생성)
-- ============================================
-- 주의: auth.users는 Supabase의 내부 테이블입니다.
-- 테스트 목적으로만 사용하고, 프로덕션에서는 Supabase Auth를 사용하세요.
-- 
-- 이 유저들은 비밀번호가 없으므로 실제 로그인은 불가능합니다.
-- 시드 데이터용으로만 사용됩니다.

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'hong@example.com',
    '', -- 빈 비밀번호 (테스트용)
    NOW(),
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "홍길동"}'::jsonb,
    false,
    '',
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'kim@example.com',
    '', -- 빈 비밀번호 (테스트용)
    NOW(),
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '2 hours',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "김철수"}'::jsonb,
    false,
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 1. Profiles (유저 프로필)
-- ============================================

INSERT INTO public.profiles (id, display_name, email, avatar_url, role, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '홍길동',
    'hong@example.com',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    'user',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '김철수',
    'kim@example.com',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'user',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Posts (미디어 아카이브 엔트리)
-- ============================================

-- 홍길동의 게시글들
INSERT INTO public.posts (
  id,
  user_id,
  title,
  media_type,
  status,
  poster_url,
  rating,
  moods,
  start_date,
  end_date,
  one_line_review,
  detailed_review,
  external_id,
  ai_metadata,
  created_at,
  updated_at
)
VALUES
  -- 영화 1: 완료
  (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '기생충',
    'movie',
    'completed',
    'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop',
    4.5,
    ARRAY['사회비판', '서스펜스', '드라마', '한국영화']::text[],
    '2024-01-10'::date,
    '2024-01-10'::date,
    '계급의 벽을 넘어선 서스펜스의 걸작',
    '봉준호 감독의 작품답게 사회적 메시지와 서스펜스가 완벽하게 결합된 작품이다. 상류층과 하류층의 대비가 날카롭고, 예측 불가능한 전개가 몰입도를 높인다. 특히 반전의 연속이 인상적이었고, 마지막 장면의 여운이 오래 남는다.',
    'm_parasite_2019',
    '{"genre": ["드라마", "스릴러"], "director": "봉준호", "year": 2019}'::jsonb,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  -- 영화 2: 진행중
  (
    'a2222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '올드보이',
    'movie',
    'in-progress',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop',
    4.0,
    ARRAY['복수', '미스터리', '스릴러', '한국영화']::text[],
    '2024-01-20'::date,
    NULL,
    '복수의 서사가 압도적인 한국 누아르의 대표작',
    '박찬욱 감독의 시그니처 스타일이 돋보이는 작품. 15년간의 감금에서 벗어난 주인공의 복수극이 긴장감 넘치게 전개된다. 특히 복도 싸움 장면의 연출이 압권이다.',
    'm_oldboy_2003',
    '{"genre": ["액션", "드라마", "미스터리"], "director": "박찬욱", "year": 2003}'::jsonb,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '1 day'
  ),
  -- 게임 1: 완료
  (
    'a3333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '사이버펑크 2077',
    'game',
    'completed',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
    4.5,
    ARRAY['RPG', '사이버펑크', '오픈월드', '스토리중심']::text[],
    '2024-01-05'::date,
    '2024-01-18'::date,
    '미래 도시 나이트시티를 탐험하는 몰입감 넘치는 RPG',
    '처음 출시 당시 버그로 인해 비판을 받았지만, 지금은 안정화되어 훌륭한 경험을 제공한다. 스토리텔링이 뛰어나고, 사이버펑크 세계관의 디테일이 압도적이다. 특히 사이드 퀘스트의 깊이가 인상적이었다.',
    'g_cyberpunk2077',
    '{"genre": ["RPG", "액션", "오픈월드"], "developer": "CD Projekt RED", "year": 2020}'::jsonb,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '12 days'
  ),
  -- 게임 2: 위시리스트
  (
    'a4444444-4444-4444-4444-444444444444'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '데우스 엑스: 휴먼 레볼루션',
    'game',
    'wishlist',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop',
    0.0,
    ARRAY['스텔스', 'RPG', '디스토피아', '사이버펑크']::text[],
    NULL,
    NULL,
    NULL,
    NULL,
    'g_deusex_hr',
    '{}'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  -- 책 1: 완료
  (
    'a5555555-5555-5555-5555-555555555555'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '뉴로맨서',
    'book',
    'completed',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
    5.0,
    ARRAY['사이버펑크', 'SF', '클래식', '영향력있는작품']::text[],
    '2024-01-01'::date,
    '2024-01-15'::date,
    '사이버펑크 장르의 기원이 된 불멸의 고전',
    '윌리엄 깁슨의 데뷔작이자 사이버펑크 장르의 시초가 된 작품. "사이버스페이스"라는 용어를 처음 사용한 소설로, 현대 SF와 사이버펑크 문화 전반에 지대한 영향을 미쳤다. 문체가 독특하고 몽환적이어서 읽는 내내 몰입감이 높았다.',
    'b_neuromancer',
    '{"author": "윌리엄 깁슨", "year": 1984, "genre": ["SF", "사이버펑크"]}'::jsonb,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '15 days'
  ),
  -- 책 2: 진행중
  (
    'a6666666-6666-6666-6666-666666666666'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '스노우 크래시',
    'book',
    'in-progress',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    4.0,
    ARRAY['사이버펑크', '풍자', '비전있는작품']::text[],
    '2024-01-22'::date,
    NULL,
    '미래를 예측한 풍자적 사이버펑크 소설',
    '닐 스티븐슨의 작품답게 기술과 사회에 대한 날카로운 통찰이 돋보인다. 가상현실과 메타버스의 개념을 1990년대에 이미 예견한 선구적인 작품이다. 읽다 보면 현재 우리가 살고 있는 세상과 너무 닮아 있어서 놀랍다.',
    'b_snowcrash',
    '{"author": "닐 스티븐슨", "year": 1992, "genre": ["SF", "사이버펑크", "풍자"]}'::jsonb,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 hour'
  )
ON CONFLICT (id) DO NOTHING;

-- 김철수의 게시글들
INSERT INTO public.posts (
  id,
  user_id,
  title,
  media_type,
  status,
  poster_url,
  rating,
  moods,
  start_date,
  end_date,
  one_line_review,
  detailed_review,
  external_id,
  ai_metadata,
  created_at,
  updated_at
)
VALUES
  -- 영화 1: 완료
  (
    'b1111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '매트릭스',
    'movie',
    'completed',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop',
    5.0,
    ARRAY['액션', '철학적', '아이코닉', 'SF']::text[],
    '2024-01-08'::date,
    '2024-01-08'::date,
    '현실과 가상의 경계를 허무는 SF 액션의 걸작',
    '워쇼스키 형제의 데뷔작이자 SF 액션 장르의 새로운 지평을 연 작품. "레드필"과 "블루필"의 선택, 현실과 시뮬레이션의 경계에 대한 철학적 질문이 액션과 완벽하게 결합되어 있다. 특히 불릿타임 연출은 영화사에 길이 남을 명장면이다.',
    'm_matrix_1999',
    '{"genre": ["SF", "액션", "스릴러"], "director": "워쇼스키 형제", "year": 1999}'::jsonb,
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '22 days'
  ),
  -- 영화 2: 위시리스트
  (
    'b2222222-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '블레이드 러너 2049',
    'movie',
    'wishlist',
    'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop',
    0.0,
    ARRAY['SF', '철학적', '네오누아르', '사이버펑크']::text[],
    NULL,
    NULL,
    NULL,
    NULL,
    'm_bladerunner2049',
    '{}'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  -- 게임 1: 진행중
  (
    'b3333333-3333-3333-3333-333333333333'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '데우스 엑스: 휴먼 레볼루션',
    'game',
    'in-progress',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop',
    4.5,
    ARRAY['스텔스', 'RPG', '디스토피아', '선택과결과']::text[],
    '2024-01-15'::date,
    NULL,
    '인간과 기계의 경계를 탐구하는 몰입감 넘치는 스텔스 RPG',
    '플레이어의 선택이 스토리에 실질적인 영향을 미치는 구조가 인상적이다. 스텔스와 액션을 자유롭게 선택할 수 있어서 재플레이 가치가 높다. 특히 업그레이드 시스템과 스토리텔링의 밀도가 훌륭하다.',
    'g_deusex_hr',
    '{"genre": ["RPG", "액션", "스텔스"], "developer": "Eidos Montreal", "year": 2011}'::jsonb,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 hours'
  ),
  -- 게임 2: 완료
  (
    'b4444444-4444-4444-4444-444444444444'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '사이버펑크 2077',
    'game',
    'completed',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
    4.0,
    ARRAY['RPG', '사이버펑크', '오픈월드', '스토리중심']::text[],
    '2024-01-03'::date,
    '2024-01-12'::date,
    '나이트시티의 거리를 누비는 몰입감 있는 사이버펑크 RPG',
    '비록 출시 초기 버그 문제가 있었지만, 지금은 충분히 즐길 만한 작품이다. 메인 스토리는 물론 사이드 퀘스트까지 스토리텔링의 퀄리티가 높다. 특히 키아누 리브스의 연기가 인상적이었다.',
    'g_cyberpunk2077',
    '{"genre": ["RPG", "액션"], "developer": "CD Projekt RED", "year": 2020}'::jsonb,
    NOW() - INTERVAL '27 days',
    NOW() - INTERVAL '18 days'
  ),
  -- 책 1: 진행중
  (
    'b5555555-5555-5555-5555-555555555555'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '뉴로맨서',
    'book',
    'in-progress',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
    4.5,
    ARRAY['사이버펑크', 'SF', '클래식', '영향력있는작품']::text[],
    '2024-01-18'::date,
    NULL,
    '사이버펑크 장르의 원조가 된 불멸의 고전',
    '현대 사이버펑크 문화의 기원이 된 작품이라 읽어보고 싶었다. 문체가 독특하고 몽환적이라서 읽는 데 시간이 좀 걸리지만, 그만큼 몰입감이 높다. 특히 사이버스페이스에 대한 묘사가 인상적이다.',
    'b_neuromancer',
    '{"author": "윌리엄 깁슨", "year": 1984, "genre": ["SF", "사이버펑크"]}'::jsonb,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '30 minutes'
  ),
  -- 책 2: 완료
  (
    'b6666666-6666-6666-6666-666666666666'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '스노우 크래시',
    'book',
    'completed',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    4.5,
    ARRAY['사이버펑크', '풍자', '비전있는작품', '유머러스']::text[],
    '2024-01-01'::date,
    '2024-01-20'::date,
    '미래를 예견한 풍자적 사이버펑크 소설의 걸작',
    '닐 스티븐슨의 작품답게 기술과 사회에 대한 날카로운 통찰이 돋보인다. 가상현실과 메타버스의 개념을 1990년대에 이미 예견한 선구적인 작품이다. 읽다 보면 현재 우리가 살고 있는 세상과 너무 닮아 있어서 놀랍다. 특히 유머러스한 톤이 인상적이었다.',
    'b_snowcrash',
    '{"author": "닐 스티븐슨", "year": 1992, "genre": ["SF", "사이버펑크", "풍자"]}'::jsonb,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '9 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 데이터 검증 쿼리 (선택사항)
-- ============================================
-- 아래 쿼리로 데이터가 제대로 삽입되었는지 확인할 수 있습니다.

-- SELECT 
--   p.display_name,
--   COUNT(posts.id) as post_count,
--   COUNT(CASE WHEN posts.status = 'completed' THEN 1 END) as completed_count,
--   COUNT(CASE WHEN posts.status = 'in-progress' THEN 1 END) as in_progress_count,
--   COUNT(CASE WHEN posts.status = 'wishlist' THEN 1 END) as wishlist_count
-- FROM public.profiles p
-- LEFT JOIN public.posts ON posts.user_id = p.id
-- GROUP BY p.id, p.display_name;
