-- 프랜차이즈(직영점/가맹점) 데이터 삽입 스크립트
-- Supabase SQL Editor에서 실행하세요
-- franchises: 직영점, 가맹점 (브랜드/본부 레벨)

INSERT INTO franchises (
  id,
  code,
  name,
  contact_name,
  contact_phone,
  address,
  region
) VALUES
  -- 직영점
  (
    '20000000-0000-0000-0000-000000000001',
    'FR-001',
    '직영점',
    '본사 관리자',
    '010-1111-1111',
    '부산광역시 남구 용소로 45',
    '부산광역시'
  ),
  -- 가맹점
  (
    '20000000-0000-0000-0000-000000000002',
    'FR-002',
    '가맹점',
    '가맹본부 관리자',
    '010-2222-2222',
    '부산광역시 부산진구 중앙대로 692',
    '부산광역시'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  region = EXCLUDED.region;

