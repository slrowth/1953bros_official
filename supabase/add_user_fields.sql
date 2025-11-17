-- users 테이블에 이름, 직책, 매장명 필드 추가
-- Supabase SQL Editor에서 실행

-- 이름 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- 직책 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- 매장명 필드 추가 (선택사항)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);

