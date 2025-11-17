-- 기존 사용자들의 store_name을 기반으로 franchise_id 업데이트
-- Supabase SQL Editor에서 실행하세요

-- store_name이 있지만 franchise_id가 없는 사용자들의 franchise_id 업데이트
UPDATE users
SET franchise_id = (
  SELECT id 
  FROM franchises 
  WHERE franchises.name = users.store_name
  LIMIT 1
)
WHERE store_name IS NOT NULL 
  AND franchise_id IS NULL
  AND EXISTS (
    SELECT 1 
    FROM franchises 
    WHERE franchises.name = users.store_name
  );

