-- 관리자 계정 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
--
-- 사용 방법:
-- 1. 먼저 회원가입 페이지에서 일반 계정으로 회원가입
-- 2. 이 SQL 스크립트에서 이메일 주소를 실제 이메일로 변경
-- 3. Supabase SQL Editor에서 실행

-- 방법 1: 기존 사용자를 ADMIN으로 변경 (권장)
-- ⚠️ 이메일 주소를 실제 이메일로 변경하세요
UPDATE users 
SET 
  role = 'ADMIN', 
  status = 'APPROVED'
WHERE email = 'admin@example.com';  -- 여기에 실제 이메일 주소 입력

-- 변경 확인
SELECT id, email, role, status, name, created_at
FROM users 
WHERE email = 'admin@example.com';  -- 여기에 실제 이메일 주소 입력

-- 예상 결과:
-- role: ADMIN
-- status: APPROVED

