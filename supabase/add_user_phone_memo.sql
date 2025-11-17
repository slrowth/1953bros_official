-- users 테이블에 phone과 memo 필드 추가

-- 전화번호 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 메모 필드 추가 (관리자가 승인 시 메모할 수 있는 필드)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS memo TEXT;

